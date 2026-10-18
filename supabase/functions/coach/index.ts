// Fonction serveur « coach » : vérifie l'utilisateur et son quota, puis demande à Claude
// un retour sur la prise de parole. La clé de l'API Claude ne quitte jamais le serveur.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import {
  FREE_AI_PER_DAY,
  normalizeReply,
  parsePayload,
  replySchema,
  systemPrompt,
  userMessage,
  type CoachPayload,
  type CoachReply,
} from '../_shared/coach.ts';

/** Modèle du coach, modifiable sans redéployer le code (secret COACH_MODEL). */
const MODEL = Deno.env.get('COACH_MODEL') ?? 'claude-opus-5-5';

const anthropic = new Anthropic();
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

class CoachFailure extends Error {}

async function askCoach(payload: CoachPayload): Promise<CoachReply> {
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt(payload.coachId, payload.lang),
    messages: [{ role: 'user', content: userMessage(payload) }],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: replySchema } },
    // En cas de refus par les filtres de sécurité, l'API relance la demande sur le modèle de repli recommandé.
    // Haiku n'a pas de repli côté serveur.
    ...(MODEL.includes('haiku') ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
  });
  if (response.stop_reason === 'refusal') throw new CoachFailure('refusal');
  if (response.stop_reason === 'max_tokens') throw new CoachFailure('truncated');
  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new CoachFailure('empty');
  const reply = normalizeReply(JSON.parse(block.text));
  if (!reply) throw new CoachFailure('invalid_reply');
  return reply;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { error: 'unauthorized' });
  const { data, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !data.user) return json(401, { error: 'unauthorized' });
  const userId = data.user.id;

  let payload: CoachPayload | null = null;
  try {
    payload = parsePayload(await req.json());
  } catch {
    payload = null;
  }
  if (!payload) return json(400, { error: 'invalid_request' });

  const { data: granted, error: creditError } = await admin.rpc('consume_ai_credit', {
    p_user: userId,
    p_limit: FREE_AI_PER_DAY,
  });
  if (creditError) {
    console.error('consume_ai_credit', creditError.message);
    return json(500, { error: 'server_error' });
  }
  if (!granted) return json(402, { error: 'quota' });

  try {
    return json(200, await askCoach(payload));
  } catch (e) {
    await admin.rpc('refund_ai_credit', { p_user: userId });
    if (e instanceof CoachFailure) {
      console.error('coach failure', e.message);
      return json(502, { error: e.message === 'refusal' ? 'refusal' : 'coach_unavailable' });
    }
    if (e instanceof Anthropic.RateLimitError) return json(503, { error: 'busy' });
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status, e.message);
      return json(502, { error: 'coach_unavailable' });
    }
    console.error('unexpected error', e);
    return json(500, { error: 'server_error' });
  }
});
