import { describe, expect, it } from 'vitest';
import { computeScores, type Metrics } from '../analysis/metrics';

const base: Metrics = {
  words: 150,
  wpm: 140,
  wpmEstimated: false,
  fillers: 0,
  fillersPerMin: 0,
  hesitations: 0,
  repetitions: 0,
  pauses: 4,
  longPauses: 0,
  volumeDb: -25,
  pitchVarSt: 3,
};

describe('computeScores', () => {
  it('donne 100 à une prise de parole idéale', () => {
    expect(computeScores(base, 60, 100).global).toBe(100);
  });

  it('pénalise les mots parasites et un débit trop rapide', () => {
    const s = computeScores({ ...base, fillers: 6, fillersPerMin: 6, wpm: 200 }, 60, null);
    expect(s.clarity).toBe(40);
    expect(s.pace).toBe(51);
    expect(s.global).toBeLessThan(70);
  });

  it('repondère la note sans le contenu', () => {
    const s = computeScores(base, 60, null);
    expect(s.content).toBeNull();
    expect(s.global).toBe(100);
  });

  it('signale une voix monotone et faible', () => {
    expect(computeScores({ ...base, volumeDb: -50, pitchVarSt: 0.8 }, 60, null).voice).toBeLessThan(40);
  });
});
