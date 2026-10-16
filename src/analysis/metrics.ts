import type { AcousticSummary } from '../audio/voiceAnalyzer';
import type { FillerReport } from './fillers';
import type { Lang } from '../types';

export type Status = 'good' | 'ok' | 'work';

export interface Metrics {
  words: number;
  wpm: number | null;
  /** Vrai quand le débit est estimé à partir des syllabes (pas de transcription). */
  wpmEstimated: boolean;
  fillers: number;
  fillersPerMin: number;
  hesitations: number;
  repetitions: number;
  pauses: number;
  longPauses: number;
  volumeDb: number | null;
  pitchVarSt: number | null;
}

export interface Scores {
  global: number;
  clarity: number;
  pace: number;
  voice: number;
  content: number | null;
}

export const IDEAL_WPM = { min: 120, max: 165 } as const;
const SYLLABLES_PER_WORD: Record<Lang, number> = { fr: 1.5, en: 1.4 };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (v: number, x0: number, x1: number, y0: number, y1: number) => y0 + ((clamp(v, x0, x1) - x0) / (x1 - x0)) * (y1 - y0);

export function computeMetrics(acoustic: AcousticSummary, fillers: FillerReport | null, lang: Lang): Metrics {
  const minutes = Math.max(acoustic.activeDuration, 15) / 60;
  const hasWords = fillers !== null && fillers.words >= 5;
  // Un « euh » peut être à la fois transcrit et détecté dans le son : on garde le plus grand des deux.
  const lexical = fillers ? fillers.total - fillers.vocal : 0;
  const vocal = Math.max(fillers?.vocal ?? 0, acoustic.hesitations);
  const total = lexical + vocal;
  const wpm = hasWords
    ? fillers.words / (Math.max(acoustic.activeDuration, 5) / 60)
    : acoustic.syllableRate !== null
      ? (acoustic.syllableRate * 60 * (acoustic.speakingTime / Math.max(acoustic.activeDuration, 1))) / SYLLABLES_PER_WORD[lang]
      : null;
  return {
    words: fillers?.words ?? 0,
    wpm: wpm === null ? null : Math.round(wpm),
    wpmEstimated: !hasWords,
    fillers: total,
    fillersPerMin: Math.round((total / minutes) * 10) / 10,
    hesitations: acoustic.hesitations,
    repetitions: fillers?.repetitions ?? 0,
    pauses: acoustic.pauses,
    longPauses: acoustic.longPauses,
    volumeDb: acoustic.volumeDb,
    pitchVarSt: acoustic.pitchVarSt,
  };
}

export function clarityScore(m: Metrics, minutes: number) {
  return Math.round(clamp(100 - 10 * m.fillersPerMin - 3 * (m.repetitions / minutes), 10, 100));
}

export function paceScore(m: Metrics, minutes: number) {
  let score = 75;
  if (m.wpm !== null) {
    if (m.wpm < IDEAL_WPM.min) score = 100 - (IDEAL_WPM.min - m.wpm) * 1.2;
    else if (m.wpm > IDEAL_WPM.max) score = 100 - (m.wpm - IDEAL_WPM.max) * 1.4;
    else score = 100;
  }
  if (minutes >= 0.5 && m.pauses / minutes < 1) score -= 10;
  score -= Math.min(18, m.longPauses * 6);
  return Math.round(clamp(score, 20, 100));
}

export function voiceScore(m: Metrics) {
  const volume = m.volumeDb === null ? 70 : m.volumeDb >= -32 ? 100 : m.volumeDb <= -48 ? 35 : lerp(m.volumeDb, -48, -32, 35, 100);
  const v = m.pitchVarSt;
  const intonation = v === null ? 70 : v < 1.2 ? 40 : v < 2 ? lerp(v, 1.2, 2, 40, 85) : v <= 5.5 ? lerp(v, 2, 2.6, 85, 100) : 85;
  return Math.round(0.5 * volume + 0.5 * intonation);
}

export function computeScores(m: Metrics, activeDuration: number, content: number | null): Scores {
  const minutes = Math.max(activeDuration, 15) / 60;
  const parts: [number, number][] = [
    [clarityScore(m, minutes), 0.3],
    [paceScore(m, minutes), 0.25],
    [voiceScore(m), 0.2],
  ];
  if (content !== null) parts.push([content, 0.25]);
  const weight = parts.reduce((s, [, w]) => s + w, 0);
  return {
    global: Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / weight),
    clarity: parts[0][0],
    pace: parts[1][0],
    voice: parts[2][0],
    content,
  };
}

export const statusOf = (score: number): Status => (score >= 80 ? 'good' : score >= 60 ? 'ok' : 'work');

export function paceStatus(wpm: number | null): Status {
  if (wpm === null) return 'ok';
  if (wpm >= IDEAL_WPM.min && wpm <= IDEAL_WPM.max) return 'good';
  return wpm >= IDEAL_WPM.min - 20 && wpm <= IDEAL_WPM.max + 20 ? 'ok' : 'work';
}

export const volumeStatus = (db: number | null): Status => (db === null ? 'ok' : db >= -34 ? 'good' : db >= -44 ? 'ok' : 'work');
export const intonationStatus = (st: number | null): Status => (st === null ? 'ok' : st >= 2 ? 'good' : st >= 1.3 ? 'ok' : 'work');
export const fillerStatus = (perMin: number): Status => (perMin <= 1.5 ? 'good' : perMin <= 4 ? 'ok' : 'work');
