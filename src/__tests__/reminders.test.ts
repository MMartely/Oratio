import { describe, expect, it } from 'vitest';
import { isDue, localClock, practisedOn, reminderMessage } from '../../supabase/functions/_shared/reminders.ts';

describe('rappels quotidiens', () => {
  const now = new Date('2026-10-18T18:10:00Z'); // 19 h 10 à Kinshasa (UTC+1), 14 h 10 à New York

  it('lit l’heure locale dans le fuseau de l’utilisateur', () => {
    expect(localClock(now, 'Africa/Kinshasa')).toEqual({ day: '2026-10-18', minutes: 19 * 60 + 10 });
    expect(localClock(now, 'America/New_York').minutes).toBe(14 * 60 + 10);
    expect(localClock(now, 'Pas/UnFuseau').minutes).toBe(18 * 60 + 10);
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
  });

  it('écrit le message avec la voix du coach', () => {
    expect(reminderMessage('malik', 'fr').title).toBe('Malik · Oratio');
    expect(reminderMessage('sofia', 'en').body).toContain('Five minutes');
    expect(reminderMessage('inconnu', 'xx').title).toBe('Léa · Oratio');
  });
});
