import { describe, expect, it } from 'vitest';
import { analyzeFillers } from '../analysis/fillers';

describe('analyzeFillers', () => {
  it('repère les tics français et les répétitions', () => {
    const r = analyzeFillers('Euh alors du coup je je pense que, en fait, c’est genre bien. Voilà.', 'fr');
    expect(r.breakdown.map((b) => b.label).sort()).toEqual(['du coup', 'en fait', 'euh', 'genre', 'voilà']);
    expect(r.total).toBe(5);
    expect(r.vocal).toBe(1);
    expect(r.repetitions).toBe(1);
  });

  it('ne compte pas les doublons grammaticaux', () => {
    expect(analyzeFillers('nous nous levons tôt et vous vous couchez tard', 'fr').repetitions).toBe(0);
  });

  it('distingue « like » verbe et « like » tic en anglais', () => {
    const r = analyzeFillers('I like pizza, um, like, you know, it is basically great', 'en');
    expect(r.breakdown).toEqual(
      expect.arrayContaining([
        { label: 'um', count: 1 },
        { label: 'like', count: 1 },
        { label: 'you know', count: 1 },
        { label: 'basically', count: 1 },
      ]),
    );
    expect(r.total).toBe(4);
  });

  it('signale les mots trop répétés', () => {
    const text = 'Le projet est important. Ce projet change tout. Mon projet aide les gens. Le projet avance.';
    expect(analyzeFillers(text, 'fr').overused[0]).toEqual({ word: 'projet', count: 4 });
  });
});
