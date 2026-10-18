import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Info, Mic, Shuffle, Square, Upload, X } from 'lucide-react';
import { buildResult } from '../../analysis/buildResult';
import { findFillersIn } from '../../analysis/fillers';
import { CaptureFailure, startCapture, type Capture, type CaptureError } from '../../audio/capture';
import { FileTooLong, analyzeFile } from '../../audio/fileAnalysis';
import { keepRecording } from '../../audio/recordings';
import { speechSupported, startSpeech, type SpeechHandle } from '../../audio/speech';
import { VoiceAnalyzer } from '../../audio/voiceAnalyzer';
import { CoachAvatar } from '../../components/CoachAvatar';
import { CoachBubble } from '../../components/CoachBubble';
import { BackButton, Button, ProgressBar, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { FREE_AI_PER_DAY } from '../../data/features';
import { useI18n } from '../../i18n';
import { backend } from '../../services/backend';
import { aiRemaining, useApp } from '../../store/useApp';
import type { AnalysisResult } from '../../types';

type Phase = 'setup' | 'countdown' | 'recording' | 'processing';
type Problem = { kind: 'mic'; code: CaptureError } | { kind: 'short' } | { kind: 'file' } | { kind: 'long' };
interface Signal {
  id: number;
  text: string;
}

const DURATIONS = [60, 120, 180, 0] as const;
const MIN_SPEECH_SECONDS = 5;

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function AnalysisFlow() {
  const { d, f, lang } = useI18n();
  const navigate = useNavigate();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const addAnalysis = useApp((s) => s.addAnalysis);
  const coach = getCoach(data.onboarding.coachId);
  const remaining = aiRemaining(data);
  const canTranscribe = speechSupported();

  const [phase, setPhase] = useState<Phase>('setup');
  const [target, setTarget] = useState<number>(60);
  const [topic, setTopic] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [fillerCount, setFillerCount] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [wpm, setWpm] = useState<number | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [progress, setProgress] = useState(0);

  const capture = useRef<Capture | null>(null);
  const analyzer = useRef<VoiceAnalyzer | null>(null);
  const speech = useRef<SpeechHandle | null>(null);
  const recording = useRef(false);
  const startedAt = useRef(0);
  const orb = useRef<HTMLDivElement>(null);
  const recentDb = useRef<{ db: number; speech: boolean }[]>([]);
  const lastSignal = useRef<Record<string, number>>({});
  const wakeLock = useRef<{ release(): Promise<void> } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = (key: string, text: string, cooldown: number) => {
    const now = performance.now();
    if (now - (lastSignal.current[key] ?? -Infinity) < cooldown) return;
    lastSignal.current[key] = now;
    const id = now;
    setSignal({ id, text });
    try {
      navigator.vibrate?.(25);
    } catch {
      /* vibration non disponible */
    }
    window.setTimeout(() => setSignal((s) => (s?.id === id ? null : s)), 1600);
  };

  // Nettoyage si l'utilisateur quitte l'écran en cours d'enregistrement.
  useEffect(
    () => () => {
      capture.current?.cancel();
      void speech.current?.stop();
      void wakeLock.current?.release().catch(() => undefined);
    },
    [],
  );

  // Compte à rebours puis démarrage de l'écoute.
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      beginRecording();
      return;
    }
    const timer = window.setTimeout(() => setCount((c) => c - 1), 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  // Horloge, débit glissant et signaux « trop vite » / « trop bas ».
  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = window.setInterval(() => {
      const t = (performance.now() - startedAt.current) / 1000;
      setElapsed(t);
      setPauses(analyzer.current?.pauseCount ?? 0);
      const words = speech.current?.words ?? [];
      if (t >= 8 && words.length >= 5) {
        const recent = words.filter((w) => w.t >= t - 20).length;
        const rolling = (recent / Math.min(20, t)) * 60;
        setWpm(Math.round((words.length / t) * 60));
        if (t >= 15 && rolling > 185) notify('fast', d.analysis.signals.fast, 15000);
      }
      const frames = recentDb.current;
      const speaking = frames.filter((x) => x.speech);
      if (frames.length > 60 && speaking.length > frames.length / 2) {
        const avg = speaking.reduce((s, x) => s + x.db, 0) / speaking.length;
        if (avg < -47) notify('quiet', d.analysis.signals.quiet, 20000);
      }
      if (target > 0 && t >= target) void finish();
    }, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target]);

  const start = async () => {
    setProblem(null);
    analyzer.current = new VoiceAnalyzer(() => notify('filler', f(d.analysis.signals.filler, { word: lang === 'fr' ? 'euh' : 'um' }), 1200));
    recentDb.current = [];
    try {
      capture.current = await startCapture((frame, sr, dt) => {
        if (!recording.current || !analyzer.current) return;
        const feat = analyzer.current.push(frame, sr, dt);
        recentDb.current.push({ db: feat.db, speech: feat.speech });
        if (recentDb.current.length > 100) recentDb.current.shift();
        if (orb.current) orb.current.style.transform = `scale(${0.82 + feat.level * 0.38})`;
      });
    } catch (e) {
      setProblem({ kind: 'mic', code: e instanceof CaptureFailure ? e.code : 'unknown' });
      return;
    }
    setCount(3);
    setPhase('countdown');
  };

  const beginRecording = () => {
    setFinalText('');
    setInterim('');
    setFillerCount(0);
    setPauses(0);
    setWpm(null);
    setElapsed(0);
    startedAt.current = performance.now();
    recording.current = true;
    capture.current?.begin();
    if (canTranscribe) {
      speech.current = startSpeech(lang, {
        onUpdate: (text, partial) => {
          setFinalText(text);
          setInterim(partial);
        },
        onWords: (words) => {
          const found = findFillersIn(
            words.map((w) => w.text),
            lang,
          );
          if (found.length) {
            setFillerCount((c) => c + found.length);
            notify('filler', f(d.analysis.signals.filler, { word: found[0] }), 1200);
          }
        },
      });
    }
    navigator.wakeLock
      ?.request('screen')
      .then((lock) => (wakeLock.current = lock))
      .catch(() => undefined);
    setPhase('recording');
  };

  const stopEverything = async () => {
    recording.current = false;
    const blob = (await capture.current?.stop()) ?? null;
    await speech.current?.stop();
    void wakeLock.current?.release().catch(() => undefined);
    capture.current = null;
    return blob;
  };

  const finishing = useRef(false);
  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const blob = await stopEverything();
    const acoustic = analyzer.current!.summary();
    const words = speech.current?.words ?? [];
    const transcriptOk = canTranscribe && !speech.current?.failed && words.length > 0;
    speech.current = null;
    finishing.current = false;
    if (acoustic.speakingTime < MIN_SPEECH_SECONDS && words.length < 10) {
      setProblem({ kind: 'short' });
      setPhase('setup');
      return;
    }
    setPhase('processing');
    const [result] = await Promise.all([
      buildResult({
        acoustic,
        text: transcriptOk ? words.map((w) => w.text).join(' ') : null,
        source: 'live',
        topic,
        lang,
        coachId: coach.id,
        name: session.name,
        aiLocked: remaining <= 0,
      }),
      new Promise((r) => setTimeout(r, 1400)),
    ]);
    if (blob) saveAudio(result, blob);
    addAnalysis(result);
    navigate(`/analysis/result/${result.id}`, { replace: true });
  };

  const cancel = async () => {
    await stopEverything();
    speech.current = null;
    setPhase('setup');
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProblem(null);
    setProgress(0);
    setPhase('processing');
    try {
      const acoustic = await analyzeFile(file, setProgress);
      if (acoustic.speakingTime < MIN_SPEECH_SECONDS) {
        setProblem({ kind: 'short' });
        setPhase('setup');
        return;
      }
      const result = await buildResult({
        acoustic,
        text: null,
        source: 'upload',
        topic,
        lang,
        coachId: coach.id,
        name: session.name,
        aiLocked: remaining <= 0,
      });
      saveAudio(result, file);
      addAnalysis(result);
      navigate(`/analysis/result/${result.id}`, { replace: true });
    } catch (err) {
      setProblem({ kind: err instanceof FileTooLong ? 'long' : 'file' });
      setPhase('setup');
    }
  };

  /** Garde l'audio pour la visite, et sur le serveur pour les abonnés Premium. */
  const saveAudio = (result: AnalysisResult, blob: Blob) => {
    keepRecording(result.id, blob);
    if (data.plan !== 'premium') return;
    result.recorded = true;
    void backend.saveRecording(session.id, result.id, blob).catch(() => undefined);
  };

  const shuffleTopic = () => {
    const topics = d.analysis.topics.filter((x) => x !== topic);
    setTopic(topics[Math.floor(Math.random() * topics.length)]);
  };

  const problemText = problem
    ? problem.kind === 'mic'
      ? d.analysis.micErrors[problem.code]
      : problem.kind === 'short'
        ? d.analysis.tooShort
        : problem.kind === 'long'
          ? d.analysis.fileTooLong
          : d.analysis.fileError
    : null;

  if (phase === 'processing') {
    return (
      <Screen className="items-center justify-center text-center">
        <div className="relative grid size-48 place-items-center">
          <div className="absolute inset-0 animate-breathe rounded-full bg-primary/15" />
          <CoachAvatar coach={coach} size={104} />
        </div>
        <p className="mt-8 max-w-xs font-display text-2xl font-semibold">{d.analysis.processing}</p>
        {progress > 0 && progress < 1 && (
          <div className="mt-6 w-full max-w-xs">
            <p className="mb-2 text-sm text-muted">{d.analysis.decoding}</p>
            <ProgressBar value={progress} />
          </div>
        )}
      </Screen>
    );
  }

  if (phase === 'countdown' || phase === 'recording') {
    const live = phase === 'recording';
    const ratio = target > 0 ? Math.min(1, elapsed / target) : 0;
    const r = 118;
    const c = 2 * Math.PI * r;
    const shownText = `${finalText} ${interim}`.trim();
    return (
      <Screen>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => void cancel()}
            className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
            aria-label={d.analysis.cancel}
          >
            <X size={24} />
          </button>
          <p className="font-display text-2xl font-semibold tabular-nums" aria-live="off">
            {formatTime(elapsed)}
            {target > 0 && <span className="text-base text-muted"> / {formatTime(target)}</span>}
          </p>
          <span className="size-11" />
        </div>

        <div className="relative h-10">
          {signal && (
            <p
              key={signal.id}
              role="status"
              className="absolute inset-x-0 mx-auto w-fit animate-rise rounded-full bg-peach/30 px-4 py-2 text-sm font-bold text-[#9A4B2E] dark:text-peach"
            >
              {signal.text}
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative grid size-64 place-items-center">
            <svg viewBox="0 0 256 256" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="128" cy="128" r={r} fill="none" strokeWidth="6" className="stroke-soft" />
              {target > 0 && (
                <circle
                  cx="128"
                  cy="128"
                  r={r}
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="stroke-primary transition-all duration-300"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - ratio)}
                />
              )}
            </svg>
            <div ref={orb} className="absolute size-48 rounded-full bg-primary/20 transition-transform duration-100" />
            <div className="absolute size-36 rounded-full bg-primary/25" />
            {live ? (
              <CoachAvatar coach={coach} size={96} className="relative" />
            ) : (
              <span className="relative font-display text-7xl font-semibold text-primary">{count || ''}</span>
            )}
          </div>
          <p className="mt-6 text-lg font-bold">{live ? d.analysis.listening : d.analysis.ready}</p>
          {topic && <p className="mt-1 max-w-xs text-center text-sm text-muted">{topic}</p>}
        </div>

        {live && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: fillerCount, label: d.analysis.live.fillers },
                { value: wpm ?? '—', label: d.analysis.live.wpm },
                { value: pauses, label: d.analysis.live.pauses },
              ].map((x) => (
                <div key={x.label} className="rounded-2xl bg-surface py-2 shadow-soft">
                  <p className="font-display text-xl font-semibold tabular-nums">{x.value}</p>
                  <p className="text-xs font-bold text-muted">{x.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-24 overflow-hidden rounded-2xl bg-soft px-4 py-3 text-sm leading-relaxed">
              {canTranscribe ? (
                shownText ? (
                  <p className="line-clamp-4">
                    {finalText.slice(-220)} <span className="text-muted">{interim}</span>
                  </p>
                ) : (
                  <p className="text-muted">{d.analysis.speakNow}</p>
                )
              ) : (
                <p className="text-muted">{d.analysis.noSpeech}</p>
              )}
            </div>
            <Button full className="mt-4" onClick={() => void finish()}>
              <Square size={18} fill="currentColor" /> {d.analysis.stop}
            </Button>
          </>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex items-center gap-2">
        <BackButton label={d.common.back} />
        <h1 className="text-2xl font-semibold">{d.analysis.title}</h1>
      </div>

      <div className="mt-4 flex-1 space-y-5 animate-rise">
        <CoachBubble coach={coach} message={d.analysis.intro[coach.id]} />

        <section>
          <h2 className="mb-2 font-sans text-sm font-extrabold uppercase tracking-wider text-muted">{d.analysis.duration}</h2>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label={d.analysis.duration}>
            {DURATIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={target === s}
                onClick={() => setTarget(s)}
                className={`min-h-12 rounded-2xl border-2 font-bold transition ${target === s ? 'border-primary bg-primary/10 text-primary' : 'border-line bg-surface'}`}
              >
                {s ? f(d.common.minutes, { n: s / 60 }) : d.analysis.free}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-sm font-extrabold uppercase tracking-wider text-muted">{d.analysis.topic}</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <p className="flex-1 font-semibold">{topic ?? d.analysis.topicFree}</p>
            <button
              type="button"
              onClick={shuffleTopic}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-sun/30 text-[#9A6B12] dark:text-sun"
              aria-label={d.analysis.shuffle}
              title={d.analysis.shuffle}
            >
              <Shuffle size={20} />
            </button>
          </div>
        </section>

        <div className="space-y-2 text-sm">
          {data.plan === 'free' && (
            <p className="flex items-start gap-2 text-muted">
              <Info size={16} className="mt-0.5 shrink-0" />
              {remaining > 0 ? f(d.analysis.aiLeft, { n: remaining, total: FREE_AI_PER_DAY }) : d.analysis.aiNone}
            </p>
          )}
          {!canTranscribe && (
            <p className="flex items-start gap-2 text-muted">
              <Info size={16} className="mt-0.5 shrink-0" />
              {d.analysis.noSpeech}
            </p>
          )}
          {problemText && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-peach/20 px-4 py-3 font-semibold">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {problemText}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Button full onClick={() => void start()}>
          <Mic size={20} /> {d.analysis.start}
        </Button>
        <Button full variant="secondary" onClick={() => fileInput.current?.click()}>
          <Upload size={18} /> {d.analysis.upload}
        </Button>
        <p className="text-center text-xs text-muted">{d.analysis.uploadHint}</p>
        <input ref={fileInput} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => void onFile(e)} />
      </div>
    </Screen>
  );
}
