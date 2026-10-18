// Rappels quotidiens : qui doit recevoir une notification maintenant, et avec quel message.
// Partagé entre la fonction serveur « reminders » (Deno) et les tests de l'application.

export interface Subscription {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  reminder_minutes: number;
  timezone: string;
  lang: string;
  coach_id: string;
  last_sent_day: string | null;
}

/** Les rappels sont déclenchés toutes les 30 minutes : une fenêtre un peu plus large évite d'en manquer. */
export const WINDOW_MINUTES = 45;

/** Date (AAAA-MM-JJ) et minutes depuis minuit, dans le fuseau horaire donné. */
export function localClock(now: Date, timeZone: string) {
  let zone = timeZone;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone });
  } catch {
    zone = 'UTC';
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Vrai si l'heure du rappel vient de passer et qu'aucun rappel n'a été envoyé aujourd'hui. */
export function isDue(sub: Pick<Subscription, 'reminder_minutes' | 'timezone' | 'last_sent_day'>, now: Date) {
  const { day, minutes } = localClock(now, sub.timezone);
  const late = minutes - sub.reminder_minutes;
  return { due: late >= 0 && late < WINDOW_MINUTES && sub.last_sent_day !== day, day };
}

/** Vrai si l'utilisateur a déjà pratiqué ce jour-là (leçon ou autre exercice). */
export function practisedOn(profileData: unknown, day: string) {
  const progress = (profileData as { progress?: { lastActiveDay?: string; lessons?: Record<string, { at?: string }> } } | null)?.progress;
  if (!progress) return false;
  if (progress.lastActiveDay === day) return true;
  return Object.values(progress.lessons ?? {}).some((l) => l?.at === day);
}

const MESSAGES: Record<string, Record<string, string>> = {
  fr: {
    lea: 'Ta leçon du jour t’attend : cinq minutes rien que pour toi.',
    malik: 'Ta série compte sur toi ! On fait la leçon du jour ?',
    sofia: 'Ta leçon du jour n’est pas faite. Cinq minutes, maintenant.',
  },
  en: {
    lea: 'Today’s lesson is waiting: five minutes just for you.',
    malik: 'Your streak is counting on you! Shall we do today’s lesson?',
    sofia: 'Today’s lesson isn’t done yet. Five minutes, right now.',
  },
};

const NAMES: Record<string, string> = { lea: 'Léa', malik: 'Malik', sofia: 'Sofia' };

export function reminderMessage(coachId: string, lang: string) {
  const l = MESSAGES[lang] ? lang : 'fr';
  const c = MESSAGES[l][coachId] ? coachId : 'lea';
  return { title: `${NAMES[c]} · Oratio`, body: MESSAGES[l][c] };
}
