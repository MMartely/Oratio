// Fonction serveur « coach » : vérifie l'utilisateur et son quota, puis demande à Claude
// un retour sur la prise de parole, ou joue le recruteur d'un entretien simulé.
// La clé de l'API Claude ne quitte jamais le serveur.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { FREE_AI_PER_DAY, normalizeReply, parsePayload, replySchemaFor, systemPrompt, userMessage } from '../_shared/coach.ts';
import {
  MAX_INTERVIEW_CALLS,
  nextPrompt,
  nextSchema,
  normalizeFollowUp,
  normalizeQuestions,
  normalizeReport,
  parseNext,
  parseReport,
  parseStart,
  reportPrompt,
  reportSchema,
  startPrompt,
  startSchema,
} from '../_shared/interview.ts';

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
class BadRequest extends Error {}

/** Un appel à Claude avec réponse JSON imposée. */
async function ask(system: string, user: string, schema: Record<string, unknown>, effort: 'low' | 'medium'): Promise<unknown> {
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort, format: { type: 'json_schema', schema } },
    // En cas de refus par les filtres de sécurité, l'API relance la demande sur le modèle de repli recommandé.
    // Haiku n'a pas de repli côté serveur.
    ...(MODEL.includes('haiku') ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
  });
  if (response.stop_reason === 'refusal') throw new CoachFailure('refusal');
  if (response.stop_reason === 'max_tokens') throw new CoachFailure('truncated');
  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new CoachFailure('empty');
  return JSON.parse(block.text);
}

/** Réserve une analyse IA ; la rend si `work` échoue. */
async function withCredit(userId: string, work: () => Promise<Response>): Promise<Response> {
  const { data: granted, error } = await admin.rpc('consume_ai_credit', { p_user: userId, p_limit: FREE_AI_PER_DAY });
  if (error) {
    console.error('consume_ai_credit', error.message);
    return json(500, { error: 'server_error' });
  }
  if (!granted) return json(402, { error: 'quota' });
  try {
    return await work();
  } catch (e) {
    await admin.rpc('refund_ai_credit', { p_user: userId });
    throw e;
  }
}

async function useInterview(id: string, userId: string) {
  const { data } = await admin.rpc('use_interview', { p_id: id, p_user: userId, p_max: MAX_INTERVIEW_CALLS });
  return data === true;
}

const handlers: Record<string, (body: unknown, userId: string) => Promise<Response>> = {
  async feedback(body, userId) {
    const p = parsePayload(body);
    if (!p) throw new BadRequest();
    return withCredit(userId, async () => {
      const raw = await ask(systemPrompt(p.coachId, p.lang, p.scenario), userMessage(p), replySchemaFor(p.scenario), 'medium');
      const reply = normalizeReply(raw, p.scenario);
      if (!reply) throw new CoachFailure('invalid_reply');
      return json(200, reply);
    });
  },

  async interview_start(body, userId) {
    const p = parseStart(body);
    if (!p) throw new BadRequest();
    return withCredit(userId, async () => {
      const prompt = startPrompt(p);
      const questions = normalizeQuestions(await ask(prompt.system, prompt.user, startSchema, 'low'), p.count);
      if (!questions) throw new CoachFailure('invalid_reply');
      const { data, error } = await admin.from('ai_interviews').insert({ user_id: userId }).select('id').single();
      if (error || !data) throw new Error(error?.message ?? 'insert failed');
      return json(200, { interviewId: data.id, questions });
    });
  },

  async interview_next(body, userId) {
    const p = parseNext(body);
    if (!p) throw new BadRequest();
    if (!(await useInterview(p.interviewId, userId))) return json(403, { error: 'interview_closed' });
    const prompt = nextPrompt(p);
    return json(200, { followUp: normalizeFollowUp(await ask(prompt.system, prompt.user, nextSchema, 'low')) });
  },

  async interview_report(body, userId) {
    const p = parseReport(body);
    if (!p) throw new BadRequest();
    if (!(await useInterview(p.interviewId, userId))) return json(403, { error: 'interview_closed' });
    const prompt = reportPrompt(p);
    const report = normalizeReport(await ask(prompt.system, prompt.user, reportSchema, 'medium'), p.answers.length);
    if (!report) throw new CoachFailure('invalid_reply');
    await admin.rpc('finish_interview', { p_id: p.interviewId, p_user: userId });
    return json(200, report);
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { error: 'unauthorized' });
  const { data, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !data.user) return json(401, { error: 'unauthorized' });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_request' });
  }
  const task = typeof body === 'object' && body !== null && 'task' in body ? String((body as { task: unknown }).task) : 'feedback';
  const handler = handlers[task];
  if (!handler) return json(400, { error: 'invalid_request' });

  try {
    return await handler(body, data.user.id);
  } catch (e) {
    if (e instanceof BadRequest) return json(400, { error: 'invalid_request' });
    if (e instanceof CoachFailure) {
      console.error('coach failure', task, e.message);
      return json(502, { error: e.message === 'refusal' ? 'refusal' : 'coach_unavailable' });
    }
    if (e instanceof Anthropic.RateLimitError) return json(503, { error: 'busy' });
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', task, e.status, e.message);
      return json(502, { error: 'coach_unavailable' });
    }
    console.error('unexpected error', task, e);
    return json(500, { error: 'server_error' });
  }
});
