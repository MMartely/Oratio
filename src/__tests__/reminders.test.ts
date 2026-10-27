import { describe, expect, it } from 'vitest';
import { LESSON_TITLES } from '../../supabase/functions/_shared/lessonTitles.ts';
import {
  dayBefore,
  isDue,
  lessonStarsOn,
  localClock,
  nextLesson,
  planNotification,
  practisedOn,
  reminderMessage,
  type Subscription,
} from '../../supabase/functions/_shared/reminders.ts';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

const sub = (patch: Partial<Subscription> = {}): Subscription => ({
  endpoint: 'https://push.example/1',
  user_id: 'u1',
  p256dh: 'k',
  auth: 'a',
  reminder_minutes: 19 * 60,
  timezone: 'Africa/Kinshasa',
  lang: 'fr',
  coach_id: 'lea',
  last_sent_day: null,
  days: 127,
  streak_alert: true,
  bravo: true,
  streak_sent_day: null,
  bravo_sent_day: null,
  ...patch,
});

// Kinshasa est en UTC+1 : 18 h 10 UTC = 19 h 10 locale. Le 18 octobre 2026 est un dimanche.
const at = (hhmm: string, day = '2026-10-18') => new Date(`${day}T${hhmm}:00+01:00`);
const profile = (progress: Record<string, unknown>, plan = 'free') => ({ data: { progress }, plan });

describe('rappels quotidiens', () => {
  const now = new Date('2026-10-18T18:10:00Z');

  it('lit l’heure locale dans le fuseau de l’utilisateur', () => {
    expect(localClock(now, 'Africa/Kinshasa')).toEqual({ day: '2026-10-18', minutes: 19 * 60 + 10, weekday: 6 });
    expect(localClock(now, 'America/New_York').minutes).toBe(14 * 60 + 10);
    expect(localClock(now, 'Pas/UnFuseau').minutes).toBe(18 * 60 + 10);
    expect(localClock(new Date('2026-10-19T08:00:00Z'), 'Europe/Paris').weekday).toBe(0);
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
  });

  it('envoie juste après l’heure choisie, une fois par jour', () => {
    expect(isDue({ reminder_minutes: 19 * 60, timezone: 'Africa/Kinshasa', last_sent_day: null }, now).due).toBe(true);
    expect(isDue({ reminder_minutes: 19 * 60, timezone: 'Africa/Kinshasa', last_sent_day: '2026-10-18' }, now).due).toBe(false);
    expect(isDue({ reminder_minutes: 20 * 60, timezone: 'Africa/Kinshasa', last_sent_day: null }, now).due).toBe(false);
    expect(isDue({ reminder_minutes: 17 * 60, timezone: 'Africa/Kinshasa', last_sent_day: null }, now).due).toBe(false);
  });

  it('ne dérange pas quelqu’un qui a déjà pratiqué', () => {
    expect(practisedOn({ progress: { lastActiveDay: '2026-10-18' } }, '2026-10-18')).toBe(true);
    expect(practisedOn({ progress: { lessons: { 3: { at: '2026-10-18' } } } }, '2026-10-18')).toBe(true);
    expect(practisedOn({ progress: { lastActiveDay: '2026-10-17' } }, '2026-10-18')).toBe(false);
    expect(practisedOn(null, '2026-10-18')).toBe(false);
    expect(planNotification(sub(), profile({ lastActiveDay: '2026-10-18' }), at('19:10'))).toBeNull();
  });

  it('écrit le message avec la voix du coach', () => {
    expect(reminderMessage('malik', 'fr').title).toBe('Malik · Oratio');
    expect(reminderMessage('sofia', 'en').body).toContain('right now');
    expect(reminderMessage('inconnu', 'xx').title).toBe('Léa · Oratio');
  });

  it('garde les titres des leçons identiques à ceux de l’application', () => {
    expect(LESSON_TITLES.fr).toEqual(fr.path.weeks.flatMap((w) => w.days));
    expect(LESSON_TITLES.en).toEqual(en.path.weeks.flatMap((w) => w.days));
  });
});

describe('contenu des notifications', () => {
  const lessons = (n: number, at: string, stars = 2) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { stars, at }]));

  it('annonce la leçon du jour par son titre', () => {
    const note = planNotification(sub(), profile({ lessons: lessons(2, '2026-10-16') }), at('19:10'));
    expect(note).toMatchObject({ kind: 'daily', day: '2026-10-18' });
    expect(note!.body).toBe('Jour 3 : « Le pouvoir de la pause ». Quatre minutes rien que pour toi.');
    const english = planNotification(sub({ lang: 'en', coach_id: 'malik' }), profile({}), at('19:10'));
    expect(english!.body).toBe('Day 1: “Breathe before you speak”! Ready? Four minutes, let’s go.');
  });

  it('ne pousse pas une leçon réservée au Premium ni un parcours terminé', () => {
    expect(nextLesson(profile({ lessons: lessons(7, '2026-10-10') }))).toBeNull();
    expect(nextLesson(profile({ lessons: lessons(7, '2026-10-10') }, 'premium'))).toBe(8);
    expect(nextLesson(profile({ lessons: lessons(30, '2026-10-10') }, 'premium'))).toBeNull();
    const note = planNotification(sub(), profile({ lessons: lessons(7, '2026-10-10') }), at('19:10'));
    expect(note!.body).toContain('entraînement du jour');
  });

  it('respecte les jours choisis', () => {
    const weekdays = 0b0011111; // du lundi au vendredi
    expect(planNotification(sub({ days: weekdays }), profile({}), at('19:10'))).toBeNull(); // dimanche
    expect(planNotification(sub({ days: weekdays }), profile({}), at('19:10', '2026-10-19'))).not.toBeNull(); // lundi
  });

  it('dit bravo dans le rappel du matin après une leçon la veille', () => {
    const p = profile({ lessons: lessons(3, '2026-10-17', 3), lastActiveDay: '2026-10-17', streak: 3 });
    expect(lessonStarsOn(p.data, '2026-10-17')).toBe(3);
    const morning = planNotification(sub({ reminder_minutes: 8 * 60 }), p, at('08:05'));
    expect(morning!.body).toBe('Bravo pour hier ! Jour 4 : « Ancrer ta posture ». Quatre minutes rien que pour toi.');
    expect(planNotification(sub({ reminder_minutes: 8 * 60, bravo: false }), p, at('08:05'))!.body).not.toContain('Bravo');
  });

  it('envoie un bravo à 9 h quand le rappel est l’après-midi', () => {
    const p = profile({ lessons: lessons(3, '2026-10-17', 2), lastActiveDay: '2026-10-17', streak: 3 });
    const note = planNotification(sub({ reminder_minutes: 18 * 60 }), p, at('09:05'));
    expect(note).toMatchObject({ kind: 'bravo' });
    expect(note!.body).toBe('Bravo pour ta leçon d’hier (★★☆) ! Aujourd’hui : « Ancrer ta posture ».');
    expect(planNotification(sub({ reminder_minutes: 18 * 60, bravo_sent_day: '2026-10-18' }), p, at('09:05'))).toBeNull();
    expect(planNotification(sub({ reminder_minutes: 18 * 60, bravo: false }), p, at('09:05'))).toBeNull();
    // Pas de bravo sans leçon la veille.
    expect(planNotification(sub({ reminder_minutes: 18 * 60 }), profile({ lessons: lessons(3, '2026-10-15') }), at('09:05'))).toBeNull();
  });

  it('prévient le soir quand la série est en danger', () => {
    const p = profile({ lessons: lessons(3, '2026-10-17'), lastActiveDay: '2026-10-17', streak: 5 });
    const note = planNotification(sub({ last_sent_day: '2026-10-18' }), p, at('21:40'));
    expect(note).toMatchObject({ kind: 'streak' });
    expect(note!.body).toBe('Ta série de 5 jours est en danger ! Une leçon de quatre minutes suffit pour la garder.');
    expect(planNotification(sub({ streak_alert: false }), p, at('21:40'))).toBeNull();
    expect(planNotification(sub({ streak_sent_day: '2026-10-18' }), p, at('21:40'))).toBeNull();
    // Série déjà perdue (rien fait hier) : pas d'alerte.
    expect(planNotification(sub(), profile({ lastActiveDay: '2026-10-15', streak: 2 }), at('21:40'))).toBeNull();
    // Rappel tardif : le rappel lui-même parle de la série.
    const late = planNotification(sub({ reminder_minutes: 21 * 60, lang: 'en' }), profile({ lastActiveDay: '2026-10-17', streak: 1 }), at('21:10'));
    expect(late).toMatchObject({ kind: 'daily', body: 'Your 1-day streak is at risk! A four-minute lesson is enough to keep it.' });
  });
});
