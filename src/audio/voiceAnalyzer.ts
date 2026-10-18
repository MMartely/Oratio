import { detectPitch, toSemitones } from './pitch';

export interface FrameFeatures {
  t: number;
  db: number;
  /** Niveau visuel de 0 à 1. */
  level: number;
  speech: boolean;
  voiced: boolean;
  pitch: number;
}

export interface AcousticSummary {
  duration: number;
  /** Du premier au dernier son de parole, sans les silences de début et de fin. */
  activeDuration: number;
  speakingTime: number;
  pauses: number;
  longPauses: number;
  avgPause: number | null;
  hesitations: number;
  hesitationTimes: number[];
  volumeDb: number | null;
  volumeVarDb: number | null;
  pitchHz: number | null;
  pitchVarSt: number | null;
  syllables: number;
  syllableRate: number | null;
  /** Niveau maximal par tranche de 0,5 s, pour dessiner la forme d'onde. */
  timeline: number[];
}

const SHORT_GAP = 0.25; // en dessous : simple respiration entre deux mots
const PAUSE_MIN = 0.5;
const LONG_PAUSE = 3;
const HESITATION_MIN = 0.4;
/** Durée d'une trame d'analyse : ~3 périodes de la voix la plus grave. */
export const FRAME_SECONDS = 0.043;
export const HOP_SECONDS = 0.03;
const NOISE_WINDOW = 330; // ~10 s de trames

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const std = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
};
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
/** Écart type robuste (écart interquartile), insensible aux erreurs d'octave isolées. */
const robustStd = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return (q(0.75) - q(0.25)) / 1.349;
};

interface Run {
  start: number;
  length: number;
  sts: number[];
  dbs: number[];
  tilt: number[];
  emitted: boolean;
}

/**
 * Analyse la voix trame par trame (en direct depuis le micro ou depuis un fichier) :
 * volume, pauses, intonation, rythme syllabique et hésitations vocales (« euh », sons allongés).
 * Une hésitation se reconnaît à un son voisé tenu au moins 0,4 s, de hauteur, de volume
 * et de timbre presque constants, ce qui n'arrive pas dans la parole normale.
 */
export class VoiceAnalyzer {
  private t = 0;
  private recentDb: number[] = [];
  private threshold = -50;
  private silenceRun = 0;
  private hadSpeech = false;
  private firstSpeech: number | null = null;
  private lastSpeech = 0;
  private speakingTime = 0;
  private pauseList: number[] = [];
  private speechDb: number[] = [];
  private sts: number[] = [];
  private recentSts: number[] = [];
  private run: Run | null = null;
  private hesitationTimes: number[] = [];
  private envelope = -90;
  private valley = -90;
  private rising = false;
  private syllables = 0;
  private buckets: number[] = [];
  /** Dernières secondes de trames, pour les réactions du public en direct. */
  private recent: { t: number; db: number; speech: boolean; st: number | null }[] = [];

  constructor(private onHesitation?: (t: number) => void) {}

  push(frame: Float32Array, sampleRate: number, dt: number): FrameFeatures {
    this.t += dt;
    let energy = 0;
    let diff = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
      if (i > 0) diff += (frame[i] - frame[i - 1]) ** 2;
    }
    const rms = Math.sqrt(energy / frame.length);
    const db = 20 * Math.log10(rms + 1e-9);
    const tilt = energy > 0 ? diff / energy : 0;
    const level = Math.max(0, Math.min(1, (db + 60) / 45));

    this.updateThreshold(db);
    const speech = db > this.threshold;

    const bucket = Math.floor(this.t / 0.5);
    this.buckets[bucket] = Math.max(this.buckets[bucket] ?? 0, level);

    let pitch = 0;
    let voiced = false;
    if (speech) {
      if (this.hadSpeech && this.silenceRun >= SHORT_GAP) this.pauseList.push(this.silenceRun);
      if (this.firstSpeech === null) this.firstSpeech = this.t - dt;
      this.hadSpeech = true;
      this.lastSpeech = this.t;
      this.speakingTime += dt + (this.silenceRun > 0 && this.silenceRun < SHORT_GAP ? this.silenceRun : 0);
      this.silenceRun = 0;
      if (db > this.threshold + 3) this.speechDb.push(db);

      const p = detectPitch(frame, sampleRate);
      if (p.clarity >= 0.8 && p.freq > 70 && p.freq < 450) {
        const st = toSemitones(p.freq);
        const ref = this.recentSts.length >= 5 ? median(this.recentSts) : st;
        if (Math.abs(st - ref) < 9) {
          voiced = true;
          pitch = p.freq;
          this.sts.push(st);
          this.recentSts.push(st);
          if (this.recentSts.length > 15) this.recentSts.shift();
        }
      }
    } else {
      this.silenceRun += dt;
    }

    this.recent.push({ t: this.t, db, speech, st: voiced ? toSemitones(pitch) : null });
    while (this.recent.length && this.recent[0].t < this.t - 12) this.recent.shift();
    this.trackHesitation(voiced ? toSemitones(pitch) : null, db, tilt, dt);
    this.trackSyllables(db, dt, speech);
    return { t: this.t, db, level, speech, voiced, pitch };
  }

  private updateThreshold(db: number) {
    this.recentDb.push(db);
    if (this.recentDb.length > NOISE_WINDOW) this.recentDb.shift();
    if (this.recentDb.length % 10 === 0 || this.recentDb.length < 20) {
      const sorted = [...this.recentDb].sort((a, b) => a - b);
      const floor = sorted[Math.floor(sorted.length * 0.1)];
      this.threshold = Math.min(Math.max(floor + 12, -62), -38);
    }
  }

  private trackHesitation(st: number | null, db: number, tilt: number, dt: number) {
    const run = this.run;
    if (st !== null && run && Math.abs(st - mean(run.sts)) < 1.5) {
      run.length += dt;
      run.sts.push(st);
      run.dbs.push(db);
      run.tilt.push(tilt);
      if (!run.emitted && run.length >= HESITATION_MIN && this.isFlat(run)) {
        run.emitted = true;
        this.hesitationTimes.push(run.start);
        this.onHesitation?.(run.start);
      }
      return;
    }
    this.run = st !== null ? { start: this.t - dt, length: dt, sts: [st], dbs: [db], tilt: [tilt], emitted: false } : null;
  }

  private isFlat(run: Run) {
    const tiltMean = mean(run.tilt);
    const slope = (run.sts[run.sts.length - 1] - run.sts[0]) / run.length;
    return (
      std(run.sts) <= 0.7 &&
      std(run.dbs) <= 3.5 &&
      Math.abs(slope) <= 5 &&
      tiltMean > 0 &&
      std(run.tilt) / tiltMean <= 0.2
    );
  }

  private trackSyllables(db: number, dt: number, speech: boolean) {
    const alpha = 1 - Math.exp(-dt / 0.02);
    const prev = this.envelope;
    this.envelope += alpha * (db - this.envelope);
    if (this.envelope > prev) {
      if (!this.rising && this.envelope - this.valley >= 3) this.rising = true;
    } else if (this.rising && prev - this.envelope > 0.5) {
      if (speech && prev - this.valley >= 4) this.syllables++;
      this.rising = false;
      this.valley = this.envelope;
    }
    if (!this.rising) this.valley = Math.min(this.valley, this.envelope);
  }

  /** Volume, variété de l'intonation et silence sur les dernières secondes. */
  recentStats(seconds = 8) {
    const frames = this.recent.filter((f) => f.t >= this.t - seconds);
    const speaking = frames.filter((f) => f.speech);
    const sts = frames.map((f) => f.st).filter((v): v is number => v !== null);
    let silence = 0;
    for (let i = this.recent.length - 1; i >= 0 && !this.recent[i].speech; i--) silence = this.t - this.recent[i].t;
    return {
      speakingRatio: frames.length ? speaking.length / frames.length : 0,
      volumeDb: speaking.length ? mean(speaking.map((f) => f.db)) : null,
      pitchVarSt: sts.length >= 15 ? robustStd(sts) : null,
      silence,
      hesitationsSince: (t: number) => this.hesitationTimes.filter((h) => h >= t).length,
      now: this.t,
    };
  }

  /** Pauses d'au moins 0,5 s depuis le début (affichage en direct). */
  get pauseCount() {
    return this.pauseList.filter((p) => p >= PAUSE_MIN).length;
  }

  summary(): AcousticSummary {
    const pauses = this.pauseList.filter((p) => p >= PAUSE_MIN);
    const active = this.firstSpeech === null ? 0 : this.lastSpeech - this.firstSpeech;
    const timeline = Array.from({ length: this.buckets.length }, (_, i) => this.buckets[i] ?? 0);
    return {
      duration: this.t,
      activeDuration: active,
      speakingTime: this.speakingTime,
      pauses: pauses.length,
      longPauses: pauses.filter((p) => p >= LONG_PAUSE).length,
      avgPause: pauses.length ? mean(pauses) : null,
      hesitations: this.hesitationTimes.length,
      hesitationTimes: [...this.hesitationTimes],
      volumeDb: this.speechDb.length >= 10 ? mean(this.speechDb) : null,
      volumeVarDb: this.speechDb.length >= 10 ? std(this.speechDb) : null,
      pitchHz: this.sts.length >= 20 ? 100 * 2 ** (median(this.sts) / 12) : null,
      pitchVarSt: this.sts.length >= 20 ? robustStd(this.sts) : null,
      syllables: this.syllables,
      syllableRate: this.speakingTime >= 3 ? this.syllables / this.speakingTime : null,
      timeline,
    };
  }
}

/** Réunit les mesures de plusieurs segments (les réponses d'un entretien) en une seule. */
export function mergeSummaries(parts: AcousticSummary[]): AcousticSummary {
  const sum = (f: (p: AcousticSummary) => number) => parts.reduce((s, p) => s + f(p), 0);
  const weighted = (f: (p: AcousticSummary) => number | null) => {
    const ok = parts.filter((p) => f(p) !== null && p.speakingTime > 0);
    const w = ok.reduce((s, p) => s + p.speakingTime, 0);
    return w ? ok.reduce((s, p) => s + f(p)! * p.speakingTime, 0) / w : null;
  };
  let offset = 0;
  const hesitationTimes: number[] = [];
  for (const p of parts) {
    hesitationTimes.push(...p.hesitationTimes.map((t) => t + offset));
    offset += p.duration;
  }
  const pauses = sum((p) => p.pauses);
  const speakingTime = sum((p) => p.speakingTime);
  const syllables = sum((p) => p.syllables);
  return {
    duration: sum((p) => p.duration),
    activeDuration: sum((p) => p.activeDuration),
    speakingTime,
    pauses,
    longPauses: sum((p) => p.longPauses),
    avgPause: pauses ? sum((p) => (p.avgPause ?? 0) * p.pauses) / pauses : null,
    hesitations: sum((p) => p.hesitations),
    hesitationTimes,
    volumeDb: weighted((p) => p.volumeDb),
    volumeVarDb: weighted((p) => p.volumeVarDb),
    pitchHz: weighted((p) => p.pitchHz),
    pitchVarSt: weighted((p) => p.pitchVarSt),
    syllables,
    syllableRate: speakingTime >= 3 ? syllables / speakingTime : null,
    timeline: parts.flatMap((p) => p.timeline),
  };
}
