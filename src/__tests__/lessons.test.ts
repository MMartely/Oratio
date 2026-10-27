import { describe, expect, it } from 'vitest';
import type { Metrics } from '../analysis/metrics';
import type { AcousticSummary } from '../audio/voiceAnalyzer';
import { lessonsEn } from '../data/lessons/en';
import { scoreLesson } from '../data/lessons/evaluate';
import { lessonsFr } from '../data/lessons/fr';
import { PROGRAM } from '../data/lessons/program';
import { daysBetween, lessonState, nextLessonDay, unlockedUpTo } from '../data/lessons/progress';
import type { Progress, UserData } from '../types';

describe('contenu des leçons', () => {
  for (const [lang, lessons] of [['fr', lessonsFr], ['en', lessonsEn]] as const) {
    it(`est complet en ${lang}`, () => {
      expect(lessons).toHaveLength(PROGRAM.length);
      lessons.forEach((l, i) => {
        const plan = PROGRAM[i];
        expect(l.intro.length, `jour ${i + 1}`).toBeGreaterThan(40);
        expect(l.points).toHaveLength(3);
        // Une question pour tous, deux de plus dans « Aller plus loin ».
        expect(l.quiz).toHaveLength(3);
        l.quiz.forEach((q) => {
          expect(q.options).toHaveLength(3);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(3);
          expect(q.why.length).toBeGreaterThan(10);
        });
        // Démonstration brève.
        expect(l.demo.length).toBeGreaterThanOrEqual(2);
        expect(l.demo.length).toBeLessThanOrEqual(3);
        expect(l.example.title.length, `exemple jour ${i + 1}`).toBeGreaterThan(3);
        expect(l.example.text.length, `exemple jour ${i + 1}`).toBeGreaterThan(40);
        expect(l.bonus.length, `astuce jour ${i + 1}`).toBeGreaterThan(20);
        expect(Boolean(l.read), `lecture jour ${i + 1}`).toBe(Boolean(plan.reading));
        expect(Boolean(l.question), `question jour ${i + 1}`).toBe(Boolean(plan.asked));
      });
    });
  }
});

describe('difficulté progressive', () => {
  const thresholds = (kind: string) =>
    PROGRAM.flatMap((p) => {
      const o = p.objective;
      if (o.kind !== kind) return [];
      if (o.kind === 'pauses' || o.kind === 'intonation' || o.kind === 'volume') return [o.min];
      if (o.kind === 'speak') return [o.seconds];
      if (o.kind === 'fillers') return [-o.max];
      return [];
    });

  it('rend chaque objectif de plus en plus exigeant au fil des semaines', () => {
    for (const kind of ['pauses', 'intonation', 'volume', 'speak', 'fillers']) {
      const values = thresholds(kind);
      expect(values.length, kind).toBeGreaterThan(1);
      values.forEach((v, i) => i > 0 && expect(v, `${kind} n°${i + 1}`).toBeGreaterThanOrEqual(values[i - 1]));
      expect(values[values.length - 1], kind).toBeGreaterThan(values[0]);
    }
  });

  it('laisse toujours le temps d’atteindre l’objectif', () => {
    PROGRAM.forEach((p) => {
      if (p.objective.kind === 'speak') expect(p.seconds).toBeGreaterThan(p.objective.seconds);
      if (p.objective.kind === 'duration') expect(p.seconds).toBeGreaterThan(p.objective.target * 1.25);
    });
  });
});

const acoustic = (patch: Partial<AcousticSummary> = {}): AcousticSummary => ({
  duration: 40, activeDuration: 35, speakingTime: 30, pauses: 3, longPauses: 0, avgPause: 1, hesitations: 0, hesitationTimes: [],
  volumeDb: -30, volumeVarDb: 4, pitchHz: 120, pitchVarSt: 2, syllables: 100, syllableRate: 3.3, timeline: [], ...patch,
});
const metrics = (patch: Partial<Metrics> = {}): Metrics => ({
  words: 80, wpm: 140, wpmEstimated: false, fillers: 1, fillersPerMin: 1.7, hesitations: 0, repetitions: 0, pauses: 3, longPauses: 0,
  volumeDb: -30, pitchVarSt: 2, ...patch,
});

describe('scoreLesson', () => {
  it('ne compte pas un exercice trop court', () => {
    expect(scoreLesson({ kind: 'pauses', min: 3 }, acoustic({ speakingTime: 2 }), metrics({ words: 2 }), null, 'fr').stars).toBe(0);
  });

  it('donne 1, 2 ou 3 étoiles selon les pauses', () => {
    expect(scoreLesson({ kind: 'pauses', min: 3 }, acoustic(), metrics({ pauses: 1 }), null, 'fr').stars).toBe(1);
    expect(scoreLesson({ kind: 'pauses', min: 3 }, acoustic(), metrics({ pauses: 3 }), null, 'fr').stars).toBe(2);
    expect(scoreLesson({ kind: 'pauses', min: 3 }, acoustic(), metrics({ pauses: 5 }), null, 'fr')).toEqual({ stars: 3, value: 5 });
  });

  it('juge la durée à 25 % près', () => {
    expect(scoreLesson({ kind: 'duration', target: 30 }, acoustic({ activeDuration: 31 }), metrics(), null, 'fr').stars).toBe(3);
    expect(scoreLesson({ kind: 'duration', target: 30 }, acoustic({ activeDuration: 36 }), metrics(), null, 'fr').stars).toBe(2);
    expect(scoreLesson({ kind: 'duration', target: 30 }, acoustic({ activeDuration: 60 }), metrics(), null, 'fr').stars).toBe(1);
  });

  it('repère la structure et les procédés dans la transcription', () => {
    const talk = 'Bonjour, aujourd’hui je vais vous parler du sommeil. D’abord pourquoi il compte, ensuite comment l’améliorer. Pour conclure, dormez bien.';
    expect(scoreLesson({ kind: 'structure', keys: ['intro', 'plan', 'conclusion'] }, acoustic(), metrics(), talk, 'fr')).toEqual({ stars: 3, value: 3, total: 3 });
    expect(scoreLesson({ kind: 'keywords', group: 'hook' }, acoustic(), metrics(), 'Imaginez un monde sans voitures.', 'fr').stars).toBeGreaterThanOrEqual(2);
    expect(scoreLesson({ kind: 'keywords', group: 'story' }, acoustic(), metrics(), 'I remember the first time I spoke on stage.', 'en').stars).toBe(3);
    expect(scoreLesson({ kind: 'keywords', group: 'story' }, acoustic(), metrics(), null, 'fr').stars).toBe(1);
  });
});

const progress = (patch: Partial<Progress> = {}): Progress => ({
  xp: 0, streak: 0, bestStreak: 0, lastActiveDay: null, currentDay: 1, sessions: 0, minutesToday: 0, minutesDay: null,
  aiCount: 0, aiDay: null, lessons: {}, pathStart: null, ...patch,
});
const data = (p: Progress, plan: 'free' | 'premium' = 'free') => ({ progress: p, plan }) as UserData;

describe('déblocage des leçons', () => {
  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-10-18', '2026-10-21')).toBe(3);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('ouvre la leçon 1 tout de suite, puis une leçon par jour', () => {
    expect(lessonState(1, data(progress()), '2026-10-18')).toBe('available');
    const afterDay1 = progress({ pathStart: '2026-10-18', lessons: { 1: { stars: 2, at: '2026-10-18' } } });
    expect(lessonState(1, data(afterDay1), '2026-10-18')).toBe('done');
    expect(lessonState(2, data(afterDay1), '2026-10-18')).toBe('tomorrow');
    expect(lessonState(2, data(afterDay1), '2026-10-19')).toBe('available');
  });

  it('permet de rattraper les jours manqués, dans l’ordre', () => {
    const p = progress({ pathStart: '2026-10-18', lessons: { 1: { stars: 1, at: '2026-10-18' } } });
    expect(unlockedUpTo(p, '2026-10-22')).toBe(5);
    expect(lessonState(2, data(p), '2026-10-22')).toBe('available');
    expect(lessonState(3, data(p), '2026-10-22')).toBe('later');
    expect(nextLessonDay(p)).toBe(2);
  });

  it('réserve les leçons après le jour 7 au Premium', () => {
    const lessons = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, { stars: 2, at: '2026-10-18' }]));
    const p = progress({ pathStart: '2026-10-01', lessons });
    expect(lessonState(8, data(p), '2026-10-18')).toBe('premium');
    expect(lessonState(8, data(p, 'premium'), '2026-10-18')).toBe('available');
  });
});
