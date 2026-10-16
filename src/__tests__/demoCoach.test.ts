import { describe, expect, it } from 'vitest';
import { analyzeFillers } from '../analysis/fillers';
import type { Metrics } from '../analysis/metrics';
import { demoFeedback } from '../services/coach/demoCoach';

const metrics: Metrics = {
  words: 40,
  wpm: 190,
  wpmEstimated: false,
  fillers: 5,
  fillersPerMin: 5,
  hesitations: 1,
  repetitions: 1,
  pauses: 0,
  longPauses: 0,
  volumeDb: -26,
  pitchVarSt: 2.8,
};

describe('demoFeedback', () => {
  const report = analyzeFillers('Bonjour euh je je vais du coup vous parler de mon projet en fait il aide les gens à parler en public', 'fr');
  const req = {
    lang: 'fr' as const,
    coachId: 'malik' as const,
    name: 'Cléo',
    topic: null,
    transcript: report.tokens,
    metrics,
    breakdown: report.breakdown,
    overused: report.overused,
    activeDuration: 60,
    globalWithoutContent: 55,
    aiLocked: false,
  };

  it('parle avec le ton du coach et cite le prénom', () => {
    const fb = demoFeedback(req);
    expect(fb.summary).toContain('Cléo');
    expect(fb.strengths.length).toBeGreaterThan(0);
    expect(fb.tips.length).toBeLessThanOrEqual(3);
    expect(fb.tips[0]).toMatch(/euh|vite/);
  });

  it('propose une reformulation sans tics', () => {
    const fb = demoFeedback(req);
    expect(fb.rewrite?.after).not.toMatch(/\beuh\b|du coup|en fait/);
    expect(fb.rewrite?.after).not.toMatch(/je je/);
  });

  it('retire le contenu IA quand le quota est atteint', () => {
    const fb = demoFeedback({ ...req, aiLocked: true });
    expect(fb.contentScore).toBeNull();
    expect(fb.rewrite).toBeNull();
  });
});
