import { describe, expect, it } from 'vitest';
import { detectPitch } from '../audio/pitch';
import { FRAME_SECONDS, HOP_SECONDS, VoiceAnalyzer } from '../audio/voiceAnalyzer';

const SR = 16000;

/** Son voisé : harmoniques d'une fondamentale qui suit `f0(t)`. */
function voiced(duration: number, f0: (t: number) => number, amp = 0.3) {
  const out = new Float32Array(Math.round(duration * SR));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    phase += (2 * Math.PI * f0(i / SR)) / SR;
    let v = 0;
    for (let h = 1; h <= 8; h++) v += Math.sin(h * phase) / h;
    out[i] = amp * v * 0.5;
  }
  return out;
}

const silence = (duration: number) => new Float32Array(Math.round(duration * SR));
const concat = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) out.set(p, (o += p.length) - p.length);
  for (let i = 0; i < out.length; i++) out[i] += (Math.random() - 0.5) * 0.002;
  return out;
};

/** Syllabes courtes à hauteur changeante, séparées par des micro-coupures. */
function speechLike(syllables: number) {
  const parts: Float32Array[] = [];
  for (let k = 0; k < syllables; k++) {
    const base = 110 + 25 * Math.sin(k * 1.3);
    parts.push(voiced(0.15, (t) => base + 120 * t), silence(0.06));
  }
  return concat(...parts);
}

function run(signal: Float32Array) {
  const hesitations: number[] = [];
  const a = new VoiceAnalyzer((t) => hesitations.push(t));
  const win = Math.round(SR * FRAME_SECONDS);
  const hop = Math.round(SR * HOP_SECONDS);
  for (let i = 0; i + win <= signal.length; i += hop) a.push(signal.subarray(i, i + win), SR, hop / SR);
  return { summary: a.summary(), hesitations };
}

describe('detectPitch', () => {
  it('retrouve la fondamentale d’une voix grave et d’une voix aiguë', () => {
    for (const f of [95, 210]) {
      const p = detectPitch(voiced(0.05, () => f), SR);
      expect(Math.abs(p.freq - f)).toBeLessThan(3);
      expect(p.clarity).toBeGreaterThan(0.9);
    }
  });
});

describe('VoiceAnalyzer', () => {
  it('détecte un « euh » tenu et pas la parole normale', () => {
    const { summary, hesitations } = run(concat(silence(0.6), speechLike(12), silence(0.3), voiced(0.6, () => 115), silence(0.4), speechLike(12), silence(0.5)));
    expect(hesitations).toHaveLength(1);
    expect(hesitations[0]).toBeGreaterThan(3);
    expect(summary.hesitations).toBe(1);
  });

  it('ne voit aucune hésitation dans une parole fluide', () => {
    expect(run(concat(silence(0.5), speechLike(30), silence(0.5))).hesitations).toHaveLength(0);
  });

  it('compte les pauses et les longs silences', () => {
    const { summary } = run(concat(silence(0.5), speechLike(10), silence(0.8), speechLike(10), silence(3.5), speechLike(10), silence(0.5)));
    expect(summary.pauses).toBe(2);
    expect(summary.longPauses).toBe(1);
    expect(summary.activeDuration).toBeGreaterThan(10);
  });
});
