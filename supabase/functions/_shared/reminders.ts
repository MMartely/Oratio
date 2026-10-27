// Rappels : qui doit recevoir une notification maintenant, et avec quel message.
// Partagé entre la fonction serveur « reminders » (Deno) et les tests de l'application.
import { LESSON_TITLES } from './lessonTitles.ts';

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
  /** Jours du rappel : bit 0 = lundi … bit 6 = dimanche. */
  days: number;
  streak_alert: boolean;
  bravo: boolean;
  streak_sent_day: string | null;
  bravo_sent_day: string | null;
}

export interface ProfileInfo {
  data: unknown;
  plan?: string | null;
}

export type NotificationKind = 'daily' | 'streak' | 'bravo';

/** Colonne qui garde la date du dernier envoi, pour chaque type de notification. */
export const SENT_COLUMN = { daily: 'last_sent_day', streak: 'streak_sent_day', bravo: 'bravo_sent_day' } as const;

/** Les rappels sont déclenchés toutes les 30 minutes : une fenêtre un peu plus large évite d'en manquer. */
export const WINDOW_MINUTES = 45;
/** Alerte « série en danger » : 21 h 30, si le rappel du jour est réglé au plus tard à 20 h. */
export const STREAK_ALERT_MINUTES = 21 * 60 + 30;
export const STREAK_ALERT_LATEST_REMINDER = 20 * 60;
/** « Bravo » du lendemain : 9 h, si le rappel du jour est l'après-midi ou le soir ; sinon il ouvre le rappel du matin. */
export const BRAVO_MINUTES = 9 * 60;
export const MORNING_END = 12 * 60;
/** Leçons gratuites (au-delà, le Premium est nécessaire). */
const FREE_PATH_DAYS = 7;

/** Date (AAAA-MM-JJ), minutes depuis minuit et jour de la semaine (0 = lundi), dans le fuseau horaire donné. */
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
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  const weekday = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute), weekday };
}

/** Veille d'une date AAAA-MM-JJ. */
export function dayBefore(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Vrai si l'heure `target` vient de passer (dans la fenêtre d'envoi). */
const justPassed = (minutes: number, target: number) => minutes - target >= 0 && minutes - target < WINDOW_MINUTES;

/** Vrai si l'heure du rappel vient de passer et qu'aucun rappel n'a été envoyé aujourd'hui. */
export function isDue(sub: Pick<Subscription, 'reminder_minutes' | 'timezone' | 'last_sent_day'>, now: Date) {
  const { day, minutes } = localClock(now, sub.timezone);
  return { due: justPassed(minutes, sub.reminder_minutes) && sub.last_sent_day !== day, day };
}

interface StoredProgress {
  lastActiveDay?: string | null;
  streak?: number;
  lessons?: Record<string, { at?: string; stars?: number } | undefined>;
}

const progressOf = (profileData: unknown) => (profileData as { progress?: StoredProgress } | null)?.progress ?? null;

/** Vrai si l'utilisateur a déjà pratiqué ce jour-là (leçon ou autre exercice). */
export function practisedOn(profileData: unknown, day: string) {
  const progress = progressOf(profileData);
  if (!progress) return false;
  if (progress.lastActiveDay === day) return true;
  return Object.values(progress.lessons ?? {}).some((l) => l?.at === day);
}

/** Prochaine leçon à faire, ou null si le parcours est terminé ou réservé au Premium. */
export function nextLesson(profile: ProfileInfo | undefined) {
  const lessons = progressOf(profile?.data)?.lessons ?? {};
  let day = 1;
  while (day <= 30 && lessons[day]) day++;
  if (day > 30 || (day > FREE_PATH_DAYS && profile?.plan !== 'premium')) return null;
  return day;
}

/** Étoiles de la leçon terminée ce jour-là (la plus avancée s'il y en a plusieurs), ou null. */
export function lessonStarsOn(profileData: unknown, day: string) {
  const lessons = progressOf(profileData)?.lessons ?? {};
  const done = Object.entries(lessons)
    .filter(([, l]) => l?.at === day)
    .sort(([a], [b]) => Number(b) - Number(a));
  return done.length ? Math.max(1, Math.min(3, done[0][1]?.stars ?? 1)) : null;
}

/** Série toujours vivante mais perdue si rien n'est fait aujourd'hui. */
function streakAtRisk(profileData: unknown, day: string) {
  const p = progressOf(profileData);
  return p && (p.streak ?? 0) >= 1 && p.lastActiveDay === dayBefore(day) ? p.streak! : 0;
}

type Lang = 'fr' | 'en';
type CoachKey = 'lea' | 'malik' | 'sofia';

const DAILY: Record<Lang, Record<CoachKey, { lesson: string; free: string }>> = {
  fr: {
    lea: { lesson: 'Jour {day} : « {title} ». Quatre minutes rien que pour toi.', free: 'Ton entraînement du jour t’attend : quelques minutes rien que pour toi.' },
    malik: { lesson: 'Jour {day} : « {title} » ! On y va ? Quatre minutes, c’est parti.', free: 'Ta série compte sur toi ! Un petit entraînement aujourd’hui ?' },
    sofia: { lesson: 'Jour {day} : « {title} ». Quatre minutes, maintenant.', free: 'Pas encore d’entraînement aujourd’hui. Quelques minutes, maintenant.' },
  },
  en: {
    lea: { lesson: 'Day {day}: “{title}”. Four minutes just for you.', free: 'Today’s practice is waiting: a few minutes just for you.' },
    malik: { lesson: 'Day {day}: “{title}”! Ready? Four minutes, let’s go.', free: 'Your streak is counting on you! A quick practice today?' },
    sofia: { lesson: 'Day {day}: “{title}”. Four minutes, right now.', free: 'No practice yet today. A few minutes, right now.' },
  },
};

const TEXTS: Record<Lang, { bravoPrefix: string; streak: (n: number) => string; bravo: string; bravoNext: string; bravoEnd: string }> = {
  fr: {
    bravoPrefix: 'Bravo pour hier ! ',
    streak: (n) => `Ta série de ${n} ${n > 1 ? 'jours' : 'jour'} est en danger ! Une leçon de quatre minutes suffit pour la garder.`,
    bravo: 'Bravo pour ta leçon d’hier ({stars}) !',
    bravoNext: ' Aujourd’hui : « {title} ».',
    bravoEnd: ' À très vite pour la suite.',
  },
  en: {
    bravoPrefix: 'Well done yesterday! ',
    streak: (n) => `Your ${n}-day streak is at risk! A four-minute lesson is enough to keep it.`,
    bravo: 'Well done on yesterday’s lesson ({stars})!',
    bravoNext: ' Today: “{title}”.',
    bravoEnd: ' See you soon for what’s next.',
  },
};

const NAMES: Record<CoachKey, string> = { lea: 'Léa', malik: 'Malik', sofia: 'Sofia' };

const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
const starsText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

function voice(sub: Pick<Subscription, 'lang' | 'coach_id'>) {
  const lang: Lang = sub.lang === 'en' ? 'en' : 'fr';
  const coach: CoachKey = sub.coach_id in NAMES ? (sub.coach_id as CoachKey) : 'lea';
  return { lang, coach, title: `${NAMES[coach]} · Oratio` };
}

/** Message du rappel quotidien : la leçon du jour, avec un « bravo » si la veille a été réussie. */
export function reminderMessage(coachId: string, lang: string, lesson: number | null = null, bravo = false) {
  const v = voice({ coach_id: coachId, lang });
  const t = DAILY[v.lang][v.coach];
  const body = lesson ? fill(t.lesson, { day: lesson, title: LESSON_TITLES[v.lang][lesson - 1] }) : t.free;
  return { title: v.title, body: (bravo ? TEXTS[v.lang].bravoPrefix : '') + body };
}

export interface PlannedNotification {
  kind: NotificationKind;
  day: string;
  title: string;
  body: string;
}

/**
 * Notification à envoyer maintenant à cet appareil, ou null. Une seule par passage, par ordre de priorité :
 * rappel du jour, puis alerte « série en danger », puis « bravo ». Rien les jours non choisis.
 */
export function planNotification(sub: Subscription, profile: ProfileInfo | undefined, now: Date): PlannedNotification | null {
  const { day, minutes, weekday } = localClock(now, sub.timezone);
  if (!((sub.days ?? 127) & (1 << weekday))) return null;
  const v = voice(sub);
  const data = profile?.data;
  const practised = practisedOn(data, day);
  const yesterday = dayBefore(day);
  const streak = streakAtRisk(data, day);
  const starsYesterday = sub.bravo ? lessonStarsOn(data, yesterday) : null;

  if (justPassed(minutes, sub.reminder_minutes) && sub.last_sent_day !== day && !practised) {
    // Rappel tardif et série en danger : on le dit directement.
    if (sub.streak_alert && streak && sub.reminder_minutes > STREAK_ALERT_LATEST_REMINDER) {
      return { kind: 'daily', day, title: v.title, body: TEXTS[v.lang].streak(streak) };
    }
    const morningBravo = starsYesterday !== null && sub.reminder_minutes < MORNING_END;
    return { kind: 'daily', day, ...reminderMessage(sub.coach_id, sub.lang, nextLesson(profile), morningBravo) };
  }

  if (
    sub.streak_alert &&
    streak &&
    !practised &&
    sub.reminder_minutes <= STREAK_ALERT_LATEST_REMINDER &&
    justPassed(minutes, STREAK_ALERT_MINUTES) &&
    sub.streak_sent_day !== day
  ) {
    return { kind: 'streak', day, title: v.title, body: TEXTS[v.lang].streak(streak) };
  }

  if (
    starsYesterday !== null &&
    !practised &&
    sub.reminder_minutes >= MORNING_END &&
    justPassed(minutes, BRAVO_MINUTES) &&
    sub.bravo_sent_day !== day
  ) {
    const t = TEXTS[v.lang];
    const next = nextLesson(profile);
    const body = fill(t.bravo, { stars: starsText(starsYesterday) }) + (next ? fill(t.bravoNext, { title: LESSON_TITLES[v.lang][next - 1] }) : t.bravoEnd);
    return { kind: 'bravo', day, title: v.title, body };
  }
  return null;
}
