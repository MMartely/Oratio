import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Mic, Play, Shuffle, Sparkles, Square, Target, Volume2, X } from 'lucide-react';
import { analyzeFillers } from '../../analysis/fillers';
import { computeMetrics, type Metrics } from '../../analysis/metrics';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { speak, stopSpeaking } from '../../audio/tts';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { BreathingGuide } from '../../components/BreathingGuide';
import { CoachBubble } from '../../components/CoachBubble';
import { ListeningOrb, LiveTranscript, SignalPill, formatTime } from '../../components/LiveParts';
import { Stars } from '../../components/Stars';
import { Button, Card, Pill, ProgressBar, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { locateDay } from '../../data/path';
import { lessonsEn } from '../../data/lessons/en';
import { scoreLesson, type LessonScore } from '../../data/lessons/evaluate';
import { lessonsFr } from '../../data/lessons/fr';
import { planFor, type Objective } from '../../data/lessons/program';
import { lessonState, nextLessonDay } from '../../data/lessons/progress';
import { fmt, useI18n, type Dict } from '../../i18n';
import { todayKey, useApp } from '../../store/useApp';

type Step = 'learn' | 'quiz' | 'demo' | 'practice' | 'result';
const STEPS: Step[] = ['learn', 'quiz', 'demo', 'practice', 'result'];

export function objectiveText(d: Dict, o: Objective) {
  const t = d.lesson.objectives;
  switch (o.kind) {
    case 'speak':
      return fmt(t.speak, { n: o.seconds });
    case 'pauses':
      return fmt(t.pauses, { n: o.min });
    case 'fillers':
      return fmt(t.fillers, { n: o.max });
    case 'pace':
      return fmt(t.pace, { min: o.min, max: o.max });
    case 'intonation':
      return fmt(t.intonation, { n: o.min });
    case 'volume':
      return fmt(t.volume, { n: o.min });
    case 'duration':
      return fmt(t.duration, { n: o.target });
    case 'structure':
      return fmt(t.structure, { items: o.keys.map((k) => d.lesson.structureItems[k]).join(', ') });
    case 'keywords':
      return t.keywords[o.group];
  }
}

function measuredText(d: Dict, o: Objective, s: LessonScore) {
  const m = d.lesson.measured;
  if (s.value === null) return m.unknown;
  if (o.kind === 'structure') return fmt(m.structure, { n: s.value, total: s.total ?? 0 });
  return fmt(m[o.kind], { n: s.value });
}

export function LessonFlow() {
  const { day: param } = useParams();
  const day = Number(param);
  const { d, f, lang } = useI18n();
  const navigate = useNavigate();
  const data = useApp((s) => s.data)!;
  const completeLesson = useApp((s) => s.completeLesson);
  const coach = getCoach(data.onboarding.coachId);
  const plan = planFor(day);
  const content = (lang === 'fr' ? lessonsFr : lessonsEn)[day - 1];
  const live = useLiveRecorder(lang, {
    filler: (word) => f(d.analysis.signals.filler, { word }),
    fast: d.analysis.signals.fast,
    quiet: d.analysis.signals.quiet,
  });

  const [step, setStep] = useState<Step>('learn');
  const [quizIndex, setQuizIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [demoLine, setDemoLine] = useState(-1);
  const [demoPlayed, setDemoPlayed] = useState(false);
  const [breathed, setBreathed] = useState(!plan.breathing);
  const [recording, setRecording] = useState(false);
  const [problem, setProblem] = useState<CaptureError | 'short' | null>(null);
  const [topic, setTopic] = useState(() => d.analysis.topics[Math.floor(Math.random() * d.analysis.topics.length)]);
  const [result, setResult] = useState<{ score: LessonScore; metrics: Metrics; xp: number } | null>(null);
  const finishing = useRef(false);
  const demoRun = useRef(0);
  const today = todayKey();

  // Arrêt de la voix et du micro en quittant l'écran.
  useEffect(() => () => stopSpeaking(), []);

  const finishExercise = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    const segment = await live.end();
    await live.close();
    finishing.current = false;
    setRecording(false);
    const metrics = computeMetrics(segment.acoustic, segment.text ? analyzeFillers(segment.text, lang) : null, lang);
    const score = scoreLesson(plan.objective, segment.acoustic, metrics, segment.text, lang);
    if (score.stars === 0) {
      setProblem('short');
      return;
    }
    const xp = completeLesson(day, score.stars, Math.max(1, Math.round(segment.acoustic.duration / 60)));
    setResult({ score, metrics, xp });
    setStep('result');
  }, [live, lang, plan.objective, completeLesson, day]);

  useEffect(() => {
    if (recording && live.state.elapsed >= plan.seconds) void finishExercise();
  }, [recording, live.state.elapsed, plan.seconds, finishExercise]);

  const state = Number.isInteger(day) && day >= 1 && day <= 30 ? lessonState(day, data, today) : 'later';
  if (!content || (state !== 'available' && state !== 'done' && step !== 'result')) return <Navigate to="/path" replace />;

  const { title } = locateDay(d, day);
  const progress = STEPS.indexOf(step) / (STEPS.length - 1);

  const playDemo = async () => {
    const run = ++demoRun.current;
    for (let i = 0; i < content.demo.length; i++) {
      if (demoRun.current !== run) return;
      setDemoLine(i);
      await speak(content.demo[i], lang);
      await new Promise((r) => setTimeout(r, 700));
    }
    if (demoRun.current === run) {
      setDemoLine(-1);
      setDemoPlayed(true);
    }
  };

  const startExercise = async () => {
    setProblem(null);
    stopSpeaking();
    try {
      await live.open();
    } catch (e) {
      setProblem(e instanceof CaptureFailure ? e.code : 'unknown');
      return;
    }
    live.begin();
    setRecording(true);
  };

  const close = () => {
    stopSpeaking();
    live.cancel();
    navigate('/path');
  };

  const quiz = content.quiz[quizIndex];
  const nextDay = nextLessonDay(data.progress);
  const nextState = nextDay <= 30 ? lessonState(nextDay, data, today) : null;

  return (
    <Screen>
      <div className="flex items-center gap-3">
        <button type="button" onClick={close} className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft" aria-label={d.common.close}>
          <X size={24} />
        </button>
        <ProgressBar value={progress} className="flex-1" />
      </div>

      {step === 'learn' && (
        <div className="mt-5 flex flex-1 flex-col gap-5 animate-rise">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{f(d.common.day, { n: day })} · {d.lesson.steps.learn}</p>
            <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
          </div>
          <CoachBubble coach={coach} message={content.intro} />
          <Card>
            <h2 className="font-sans text-base font-bold">{d.lesson.keyPoints}</h2>
            <ul className="mt-3 space-y-2.5">
              {content.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex-1" />
          <Button full onClick={() => setStep('quiz')}>
            {d.lesson.next}
          </Button>
        </div>
      )}

      {step === 'quiz' && (
        <div key={quizIndex} className="mt-5 flex flex-1 flex-col gap-4 animate-rise">
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">
            {d.lesson.steps.quiz} · {f(d.lesson.quizProgress, { n: quizIndex + 1, total: content.quiz.length })}
          </p>
          <h1 className="text-2xl font-semibold">{quiz.q}</h1>
          <div className="space-y-3" role="group" aria-label={quiz.q}>
            {quiz.options.map((opt, i) => {
              const answered = picked !== null;
              const right = i === quiz.answer;
              const tone = !answered
                ? 'border-line bg-surface hover:border-primary/40'
                : right
                  ? 'border-sage bg-sage/20'
                  : i === picked
                    ? 'border-peach bg-peach/20'
                    : 'border-line bg-surface opacity-60';
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`w-full rounded-2xl border-2 p-4 text-left font-semibold transition ${tone}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <p role="status" className={`rounded-2xl p-4 text-sm ${picked === quiz.answer ? 'bg-sage/20' : 'bg-peach/15'}`}>
              <span className="font-bold">{picked === quiz.answer ? d.lesson.correct : d.lesson.wrong}</span> {quiz.why}
            </p>
          )}
          <div className="flex-1" />
          <Button
            full
            disabled={picked === null}
            onClick={() => {
              setPicked(null);
              if (quizIndex + 1 < content.quiz.length) setQuizIndex(quizIndex + 1);
              else setStep('demo');
            }}
          >
            {d.lesson.next}
          </Button>
        </div>
      )}

      {step === 'demo' && (
        <div className="mt-5 flex flex-1 flex-col gap-4 animate-rise">
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{d.lesson.steps.demo}</p>
          <h1 className="text-2xl font-semibold">{d.lesson.demoTitle}</h1>
          <Card className="space-y-2">
            {content.demo.map((line, i) => (
              <p key={i} className={`rounded-xl px-2 py-1 text-lg leading-snug transition ${demoLine === i ? 'bg-primary/15 font-semibold' : ''}`}>
                {line}
              </p>
            ))}
          </Card>
          <p className="text-sm text-muted">{content.demoNote}</p>
          <Button variant="secondary" onClick={() => void playDemo()}>
            {demoLine >= 0 ? <Volume2 size={18} className="animate-pulse" /> : <Play size={18} />}
            {demoPlayed ? d.lesson.replay : d.lesson.play}
          </Button>
          <div className="flex-1" />
          <Button
            full
            onClick={() => {
              demoRun.current++;
              stopSpeaking();
              setDemoLine(-1);
              setStep('practice');
            }}
          >
            {d.lesson.next}
          </Button>
        </div>
      )}

      {step === 'practice' && !breathed && (
        <div className="mt-8 flex flex-1 flex-col justify-center">
          <BreathingGuide onDone={() => setBreathed(true)} />
        </div>
      )}

      {step === 'practice' && breathed && (
        <div className="mt-5 flex flex-1 flex-col gap-4 animate-rise">
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{d.lesson.steps.practice}</p>
          {!recording && <h1 className="text-2xl font-semibold">{d.lesson.practiceTitle}</h1>}
          {!recording && <p className="leading-snug">{content.prompt}</p>}

          {content.read && (
            <Card className="max-h-56 overflow-y-auto">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted">{d.lesson.readThis}</p>
              <p className="text-lg leading-relaxed">{content.read}</p>
            </Card>
          )}
          {plan.randomTopic && (
            <Card className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{d.lesson.topicLabel}</p>
                <p className="mt-1 font-semibold">{topic}</p>
              </div>
              {!recording && (
                <button
                  type="button"
                  onClick={() => setTopic(d.analysis.topics[Math.floor(Math.random() * d.analysis.topics.length)])}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-sun/30 text-[#9A6B12] dark:text-sun"
                  aria-label={d.lesson.otherTopic}
                  title={d.lesson.otherTopic}
                >
                  <Shuffle size={20} />
                </button>
              )}
            </Card>
          )}
          {content.question && (
            <Card>
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{d.lesson.questionLabel}</p>
              <p className="mt-1 font-semibold">{content.question}</p>
              {!recording && (
                <button type="button" onClick={() => void speak(content.question!, lang)} className="mt-2 flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Volume2 size={16} /> {d.lesson.listenQuestion}
                </button>
              )}
            </Card>
          )}

          <div className="flex items-start gap-3 rounded-2xl bg-primary/10 p-4">
            <Target size={20} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-sm">
              <span className="font-bold">{d.lesson.objective} : </span>
              {objectiveText(d, plan.objective)}
            </p>
          </div>

          {recording ? (
            <>
              <SignalPill signal={live.state.signal} />
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="origin-center scale-75">
                  <ListeningOrb
                    orbRef={live.orb}
                    coach={coach}
                    ratio={Math.min(1, live.state.elapsed / plan.seconds)}
                    center={<Mic size={44} className="relative text-primary" />}
                  />
                </div>
                <p className="-mt-4 font-display text-2xl font-semibold tabular-nums">
                  {formatTime(live.state.elapsed)} <span className="text-base text-muted">/ {formatTime(plan.seconds)}</span>
                </p>
              </div>
              {!content.read && <LiveTranscript state={live.state} canTranscribe={live.canTranscribe} className="!h-20" />}
              <Button full onClick={() => void finishExercise()}>
                <Square size={18} fill="currentColor" /> {d.lesson.stop}
              </Button>
            </>
          ) : (
            <>
              {problem && (
                <p role="alert" className="rounded-2xl bg-peach/20 px-4 py-3 text-sm font-semibold">
                  {problem === 'short' ? d.lesson.tooShort : d.analysis.micErrors[problem]}
                </p>
              )}
              <div className="flex-1" />
              <Button full onClick={() => void startExercise()}>
                <Mic size={20} /> {d.lesson.start}
              </Button>
            </>
          )}
        </div>
      )}

      {step === 'result' && result && (
        <div className="mt-6 flex flex-1 flex-col gap-5 text-center animate-rise">
          <div className="flex flex-col items-center">
            <Stars count={result.score.stars} size={44} animate />
            <h1 className="mt-4 text-3xl font-semibold">{d.lesson.starTitles[String(result.score.stars) as '1' | '2' | '3']}</h1>
            <Pill className="mt-3 bg-sun/30 text-[#8A5E0C] dark:text-sun">
              <Sparkles size={16} /> {f(d.results.xp, { n: result.xp })}
            </Pill>
          </div>
          <Card className="text-left">
            <p className="text-sm font-bold text-muted">{d.lesson.objective}</p>
            <p className="font-semibold">{objectiveText(d, plan.objective)}</p>
            <p className="mt-3 text-sm font-bold text-muted">{d.lesson.yourResult}</p>
            <p className="font-display text-xl font-semibold">{measuredText(d, plan.objective, result.score)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { v: result.metrics.fillers, l: d.analysis.live.fillers },
                { v: result.metrics.wpm ?? '—', l: d.analysis.live.wpm },
                { v: result.metrics.pauses, l: d.analysis.live.pauses },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl bg-soft py-2">
                  <p className="font-display text-lg font-semibold tabular-nums">{x.v}</p>
                  <p className="text-xs font-bold text-muted">{x.l}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="text-left">
            <CoachBubble coach={coach} message={d.lesson.starMessages[String(result.score.stars) as '1' | '2' | '3']} />
          </div>
          {nextState === 'tomorrow' && <p className="font-bold text-primary">{d.lesson.comeBack}</p>}
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setStep('practice');
              }}
            >
              {d.lesson.retry}
            </Button>
            <Button onClick={() => navigate('/path', { replace: true })}>{d.lesson.finish}</Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
