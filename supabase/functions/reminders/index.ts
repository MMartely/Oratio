// Fonction serveur « reminders » :
// - GET  : renvoie la clé publique des notifications (créée automatiquement au premier appel) ;
// - POST : envoie les rappels dus (appelée toutes les 30 minutes par GitHub Actions).
// Un rappel au plus par appareil et par jour, et seulement si l'utilisateur n'a pas encore pratiqué.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { isDue, practisedOn, reminderMessage, type Subscription } from '../_shared/reminders.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Clés VAPID stockées dans la base ; générées une seule fois. */
async function vapidKeys() {
  const read = async () => {
    const { data } = await admin.from('app_secrets').select('name, value').in('name', ['vapid_public', 'vapid_private']);
    const map = Object.fromEntries((data ?? []).map((r) => [r.name, r.value]));
    return map.vapid_public && map.vapid_private ? { publicKey: map.vapid_public, privateKey: map.vapid_private } : null;
  };
  const existing = await read();
  if (existing) return existing;
  const keys = webpush.generateVAPIDKeys();
  await admin.from('app_secrets').upsert(
    [
      { name: 'vapid_public', value: keys.publicKey },
      { name: 'vapid_private', value: keys.privateKey },
    ],
    { onConflict: 'name', ignoreDuplicates: true },
  );
  // Relecture : si deux appels simultanés ont généré des clés, une seule paire est gardée.
  return (await read()) ?? keys;
}

async function sendDue() {
  const keys = await vapidKeys();
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@oratio.app', keys.publicKey, keys.privateKey);
  const now = new Date();
  const { data: subs, error } = await admin.from('push_subscriptions').select('*');
  if (error) throw new Error(error.message);
  const due = (subs as Subscription[]).map((s) => ({ s, ...isDue(s, now) })).filter((x) => x.due);
  if (!due.length) return { checked: subs.length, sent: 0, removed: 0 };

  const ids = [...new Set(due.map((x) => x.s.user_id))];
  const { data: profiles } = await admin.from('profiles').select('id, data').in('id', ids);
  const dataById = new Map((profiles ?? []).map((p) => [p.id, p.data]));

  let sent = 0;
  let removed = 0;
  for (const { s, day } of due) {
    if (practisedOn(dataById.get(s.user_id), day)) continue;
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ ...reminderMessage(s.coach_id, s.lang), url: './#/' }),
        { TTL: 6 * 3600 },
      );
      sent++;
      await admin.from('push_subscriptions').update({ last_sent_day: day }).eq('endpoint', s.endpoint);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // Abonnement expiré ou révoqué : on le supprime.
      if (status === 404 || status === 410) {
        removed++;
        await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      } else {
        console.error('push failed', status, (e as Error).message);
      }
    }
  }
  return { checked: subs.length, sent, removed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (req.method === 'GET') return json(200, { publicKey: (await vapidKeys()).publicKey });
    if (req.method === 'POST') return json(200, await sendDue());
    return json(405, { error: 'method_not_allowed' });
  } catch (e) {
    console.error('reminders error', e);
    return json(500, { error: 'server_error' });
  }
});
