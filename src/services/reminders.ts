import { supabase } from './supabase';
import type { CoachId, Lang } from '../types';

export type ReminderError = 'unsupported' | 'denied' | 'error';

export class ReminderFailure extends Error {
  constructor(public code: ReminderError) {
    super(code);
  }
}

/** Notifications possibles : application en ligne (Supabase), service worker et API Push disponibles. */
export function remindersSupported() {
  return Boolean(supabase) && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function publicKey() {
  const { data, error } = await supabase!.functions.invoke('reminders', { method: 'GET' });
  if (error || typeof data?.publicKey !== 'string') throw new ReminderFailure('error');
  return data.publicKey as string;
}

/** Active (ou met à jour) le rappel quotidien sur cet appareil. */
export async function enableReminder(input: { userId: string; time: string; lang: Lang; coachId: CoachId }) {
  if (!remindersSupported()) throw new ReminderFailure('unsupported');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new ReminderFailure('denied');
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(await publicKey()) }));
    const json = subscription.toJSON();
    const [h, m] = input.time.split(':').map(Number);
    const { error } = await supabase!.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        user_id: input.userId,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        reminder_minutes: h * 60 + m,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        lang: input.lang,
        coach_id: input.coachId,
      },
      { onConflict: 'endpoint' },
    );
    if (error) throw error;
  } catch (e) {
    if (e instanceof ReminderFailure) throw e;
    throw new ReminderFailure('error');
  }
}

/** Désactive le rappel sur cet appareil. */
export async function disableReminder() {
  if (!remindersSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await supabase!.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}
