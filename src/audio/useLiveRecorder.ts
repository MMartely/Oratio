import { useCallback, useEffect, useRef, useState } from 'react';
import { findFillersIn } from '../analysis/fillers';
import type { Lang } from '../types';
import { startCapture, type Capture } from './capture';
import { speechSupported, startSpeech, type SpeechHandle, type TimedWord } from './speech';
import { VoiceAnalyzer, type AcousticSummary } from './voiceAnalyzer';

export interface Signal {
  id: number;
  text: string;
}

export interface LiveState {
  elapsed: number;
  fillerCount: number;
  pauses: number;
  wpm: number | null;
  finalText: string;
  interim: string;
  signal: Signal | null;
}

export interface Segment {
  acoustic: AcousticSummary;
  /** Transcription du segment, ou null si la reconnaissance vocale n'a rien donné. */
  text: string | null;
  words: TimedWord[];
}

interface Labels {
  filler(word: string): string;
  fast: string;
  quiet: string;
}

const EMPTY: LiveState = { elapsed: 0, fillerCount: 0, pauses: 0, wpm: null, finalText: '', interim: '', signal: null };

/**
 * Micro (et caméra en mode miroir) ouverts pour toute une séance, découpée en segments :
 * un pour l'analyse libre ou un exposé, un par réponse pendant un entretien.
 * Chaque segment a sa propre analyse du son et sa propre transcription, avec signaux discrets en direct.
 */
export function useLiveRecorder(lang: Lang, labels: Labels) {
  const [state, setState] = useState<LiveState>(EMPTY);
  const [active, setActive] = useState(false);
  const canTranscribe = speechSupported();

  const capture = useRef<Capture | null>(null);
  const analyzer = useRef<VoiceAnalyzer | null>(null);
  const speech = useRef<SpeechHandle | null>(null);
  const recording = useRef(false);
  const startedAt = useRef(0);
  const recentDb = useRef<{ db: number; speech: boolean }[]>([]);
  const lastSignal = useRef<Record<string, number>>({});
  const wakeLock = useRef<{ release(): Promise<void> } | null>(null);
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  /** Élément qui grossit avec la voix (cercle de l'écran d'écoute). */
  const orb = useRef<HTMLDivElement | null>(null);

  const notify = useCallback((key: string, text: string, cooldown: number) => {
    const now = performance.now();
    if (now - (lastSignal.current[key] ?? -Infinity) < cooldown) return;
    lastSignal.current[key] = now;
    setState((s) => ({ ...s, signal: { id: now, text } }));
    try {
      navigator.vibrate?.(25);
    } catch {
      /* vibration non disponible */
    }
    window.setTimeout(() => setState((s) => (s.signal?.id === now ? { ...s, signal: null } : s)), 1600);
  }, []);

  const release = useCallback(() => {
    recording.current = false;
    void speech.current?.stop();
    speech.current = null;
    capture.current?.cancel();
    capture.current = null;
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  }, []);

  useEffect(() => release, [release]);

  // Horloge, débit glissant et signaux « trop vite » / « trop bas ».
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      const t = (performance.now() - startedAt.current) / 1000;
      const words = speech.current?.words ?? [];
      let wpm: number | null = null;
      if (t >= 8 && words.length >= 5) {
        const recent = words.filter((w) => w.t >= t - 20).length;
        wpm = Math.round((words.length / t) * 60);
        if (t >= 15 && (recent / Math.min(20, t)) * 60 > 185) notify('fast', labelsRef.current.fast, 15000);
      }
      const frames = recentDb.current;
      const speaking = frames.filter((x) => x.speech);
      if (frames.length > 60 && speaking.length > frames.length / 2) {
        const avg = speaking.reduce((s, x) => s + x.db, 0) / speaking.length;
        if (avg < -47) notify('quiet', labelsRef.current.quiet, 20000);
      }
      setState((s) => ({ ...s, elapsed: t, pauses: analyzer.current?.pauseCount ?? 0, wpm: wpm ?? s.wpm }));
    }, 250);
    return () => window.clearInterval(timer);
  }, [active, notify]);

  /** Ouvre le micro (et la caméra) : déclenche la demande d'autorisation. Lève CaptureFailure. */
  const open = useCallback(async (options: { video?: boolean } = {}) => {
    capture.current = await startCapture((frame, sr, dt) => {
      if (!recording.current || !analyzer.current) return;
      const feat = analyzer.current.push(frame, sr, dt);
      recentDb.current.push({ db: feat.db, speech: feat.speech });
      if (recentDb.current.length > 100) recentDb.current.shift();
      if (orb.current) orb.current.style.transform = `scale(${0.82 + feat.level * 0.38})`;
    }, options);
    navigator.wakeLock
      ?.request('screen')
      .then((lock) => (wakeLock.current = lock))
      .catch(() => undefined);
    return capture.current.stream;
  }, []);

  /** Commence un segment : nouvelle analyse, nouvelle transcription. */
  const begin = useCallback(() => {
    analyzer.current = new VoiceAnalyzer(() => notify('filler', labelsRef.current.filler(lang === 'fr' ? 'euh' : 'um'), 1200));
    recentDb.current = [];
    setState(EMPTY);
    startedAt.current = performance.now();
    recording.current = true;
    capture.current?.begin();
    if (canTranscribe) {
      speech.current = startSpeech(lang, {
        onUpdate: (finalText, interim) => setState((s) => ({ ...s, finalText, interim })),
        onWords: (words) => {
          const found = findFillersIn(
            words.map((w) => w.text),
            lang,
          );
          if (!found.length) return;
          setState((s) => ({ ...s, fillerCount: s.fillerCount + found.length }));
          notify('filler', labelsRef.current.filler(found[0]), 1200);
        },
      });
    }
    setActive(true);
  }, [canTranscribe, lang, notify]);

  /** Termine le segment en cours et renvoie son analyse. */
  const end = useCallback(async (): Promise<Segment> => {
    recording.current = false;
    setActive(false);
    const handle = speech.current;
    speech.current = null;
    await handle?.stop();
    const words = handle?.words ?? [];
    const ok = canTranscribe && !handle?.failed && words.length > 0;
    return { acoustic: analyzer.current!.summary(), text: ok ? words.map((w) => w.text).join(' ') : null, words };
  }, [canTranscribe]);

  /** Ferme le micro et renvoie l'enregistrement audio de toute la séance. */
  const close = useCallback(async () => {
    recording.current = false;
    setActive(false);
    const blob = (await capture.current?.stop()) ?? null;
    capture.current = null;
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
    return blob;
  }, []);

  return { state, active, canTranscribe, orb, analyzer, notify, open, begin, end, close, cancel: release };
}
