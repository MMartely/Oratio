import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Info, Mic, Shuffle, Square, Upload } from 'lucide-react';
import { buildResult } from '../../analysis/buildResult';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { FileTooLong, analyzeFile } from '../../audio/fileAnalysis';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { CoachBubble } from '../../components/CoachBubble';
import { SosButton } from '../../components/SosTrac';
import { CoachThinking, ListeningOrb, LiveStats, LiveTopBar, LiveTranscript, SignalPill } from '../../components/LiveParts';
import { BackButton, Button, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { FREE_AI_PER_DAY } from '../../data/features';
import { useI18n } from '../../i18n';
import { aiRemaining, useApp } from '../../store/useApp';
import { MIN_SPEECH_SECONDS, useSaveAudio } from '../../hooks/useSaveAudio';

type Phase = 'setup' | 'countdown' | 'recording' | 'processing';
type Problem = { kind: 'mic'; code: CaptureError } | { kind: 'short' } | { kind: 'file' } | { kind: 'long' };

const DURATIONS = [60, 120, 180, 0] as const;
export function AnalysisFlow() {
  const { d, f, lang } = useI18n();
  const navigate = useNavigate();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const addAnalysis = useApp((s) => s.addAnalysis);
  const saveAudio = useSaveAudio();
  const coach = getCoach(data.onboarding.coachId);
  const remaining = aiRemaining(data);
  const live = useLiveRecorder(lang, {
    filler: (word) => f(d.analysis.signals.filler, { word }),
    fast: d.analysis.signals.fast,
    quiet: d.analysis.signals.quiet,
  });

  const [phase, setPhase] = useState<Phase>('setup');
  const [target, setTarget] = useState<number>(60);
  const [topic, setTopic] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [count, setCount] = useState(3);
  const [progress, setProgress] = useState(0);
  const finishing = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Compte à rebours puis démarrage de l'écoute.
  const { begin } = live;
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      begin();
      setPhase('recording');
      return;
    }
    const timer = window.setTimeout(() => setCount((c) => c - 1), 800);
    return () => window.clearTimeout(timer);
  }, [phase, count, begin]);

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const segment = await live.end();
    const blob = await live.close();
    finishing.current = false;
    if (segment.acoustic.speakingTime < MIN_SPEECH_SECONDS && segment.words.length < 10) {
      setProblem({ kind: 'short' });
      setPhase('setup');
      return;
    }
    setPhase('processing');
    const [result] = await Promise.all([
      buildResult({
        acoustic: segment.acoustic,
        text: segment.text,
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

  // Arrêt automatique à la durée choisie.
  useEffect(() => {
    if (phase === 'recording' && target > 0 && live.state.elapsed >= target) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target, live.state.elapsed]);

  const start = async () => {
    setProblem(null);
    try {
      await live.open();
    } catch (e) {
      setProblem({ kind: 'mic', code: e instanceof CaptureFailure ? e.code : 'unknown' });
      return;
    }
    setCount(3);
    setPhase('countdown');
  };

  const cancel = () => {
    live.cancel();
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
    return <CoachThinking coach={coach} text={d.analysis.processing} progress={{ label: d.analysis.decoding, value: progress }} />;
  }

  if (phase === 'countdown' || phase === 'recording') {
    const recording = phase === 'recording';
    const elapsed = recording ? live.state.elapsed : 0;
    return (
      <Screen>
        <LiveTopBar elapsed={elapsed} target={target} onCancel={cancel} />
        <SignalPill signal={live.state.signal} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <ListeningOrb
            orbRef={live.orb}
            coach={coach}
            ratio={target > 0 ? Math.min(1, elapsed / target) : null}
            center={recording ? undefined : <span className="relative font-display text-7xl font-semibold text-primary">{count || ''}</span>}
          />
          <p className="mt-6 text-lg font-bold">{recording ? d.analysis.listening : d.analysis.ready}</p>
          {topic && <p className="mt-1 max-w-xs text-center text-sm text-muted">{topic}</p>}
        </div>
        {recording && (
          <>
            <LiveStats state={live.state} />
            <LiveTranscript state={live.state} canTranscribe={live.canTranscribe} className="mt-3" />
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
          {!live.canTranscribe && (
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
        <div className="flex justify-center pb-1">
          <SosButton />
        </div>
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
