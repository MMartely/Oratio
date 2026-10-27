import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Info, Mic, Square, Volume2 } from 'lucide-react';
import { buildResult } from '../../analysis/buildResult';
import { analyzeFillers } from '../../analysis/fillers';
import { computeMetrics } from '../../analysis/metrics';
import { demoInterviewReport } from '../../analysis/scenarios';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { speak, stopSpeaking } from '../../audio/tts';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { mergeSummaries, type AcousticSummary } from '../../audio/voiceAnalyzer';
import { CoachAvatar } from '../../components/CoachAvatar';
import { CoachBubble } from '../../components/CoachBubble';
import { SosButton } from '../../components/SosTrac';
import { ChoiceRow, TextField } from '../../components/form';
import { CoachThinking, ListeningOrb, LiveStats, LiveTopBar, LiveTranscript, SignalPill } from '../../components/LiveParts';
import { BackButton, Button, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { FREE_AI_PER_DAY } from '../../data/features';
import { MIN_SPEECH_SECONDS, useSaveAudio } from '../../hooks/useSaveAudio';
import { useI18n } from '../../i18n';
import { demoFeedback } from '../../services/coach/demoCoach';
import { interviewCoach, type InterviewSetup } from '../../services/coach/interviewCoach';
import { aiRemaining, useApp } from '../../store/useApp';
import type { InterviewAnswer } from '../../types';

type Phase = 'setup' | 'preparing' | 'asking' | 'answering' | 'thinking' | 'finishing';

/** Durée maximale d'une réponse, après quoi on passe à la suite. */
const MAX_ANSWER_SECONDS = 150;
/** Relances au plus par entretien (une par question au plus). */
const MAX_FOLLOW_UPS = 2;

export function InterviewFlow() {
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
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [count, setCount] = useState(5);
  const [problem, setProblem] = useState<CaptureError | 'required' | 'short' | null>(null);
  const [current, setCurrent] = useState<{ question: string; followUp: boolean; number: number } | null>(null);

  const plan = useRef<InterviewSetup | null>(null);
  const baseIndex = useRef(0);
  const followUps = useRef(0);
  const turns = useRef<InterviewAnswer[]>([]);
  const segments = useRef<AcousticSummary[]>([]);
  const cancelled = useRef(false);
  const busy = useRef(false);
  /** Vrai dès que la réponse a commencé (évite un double démarrage après « Répondre maintenant »). */
  const answering = useRef(false);

  const total = plan.current?.questions.length ?? count;

  const ask = async (question: string, followUp: boolean) => {
    answering.current = false;
    setCurrent({ question, followUp, number: baseIndex.current + 1 });
    setPhase('asking');
    await speak(question, lang);
    if (cancelled.current) return;
    startAnswer();
  };

  const startAnswer = () => {
    if (answering.current) return;
    answering.current = true;
    stopSpeaking();
    live.begin();
    setPhase('answering');
  };

  const nextBase = async () => {
    baseIndex.current += 1;
    const questions = plan.current!.questions;
    if (baseIndex.current < questions.length) return ask(questions[baseIndex.current], false);
    return finishInterview();
  };

  const answerDone = async () => {
    if (busy.current) return;
    busy.current = true;
    const segment = await live.end();
    busy.current = false;
    if (cancelled.current || !current) return;
    segments.current.push(segment.acoustic);
    turns.current.push({
      question: current.question,
      followUp: current.followUp,
      transcript: segment.text,
      seconds: Math.round(segment.acoustic.duration),
      score: null,
      feedback: null,
    });
    const questions = plan.current!.questions;
    const isClosing = baseIndex.current >= questions.length - 1;
    if (!current.followUp && !isClosing && followUps.current < MAX_FOLLOW_UPS) {
      setPhase('thinking');
      const followUp = await interviewCoach.followUp({
        interviewId: plan.current!.interviewId,
        lang,
        role,
        company: company || null,
        history: turns.current.map((t) => ({ question: t.question, answer: t.transcript ?? '' })),
      });
      if (cancelled.current) return;
      if (followUp) {
        followUps.current += 1;
        return ask(followUp, true);
      }
    }
    return nextBase();
  };

  const finishInterview = async () => {
    const blob = await live.close();
    if (cancelled.current) return;
    const acoustic = mergeSummaries(segments.current);
    if (acoustic.speakingTime < MIN_SPEECH_SECONDS) {
      setProblem('short');
      setPhase('setup');
      return;
    }
    setPhase('finishing');
    const answered = turns.current;
    const text = answered.map((t) => t.transcript).filter(Boolean).join(' ') || null;
    const metrics = computeMetrics(acoustic, text ? analyzeFillers(text, lang) : null, lang);
    const setup = plan.current!;
    const report = await interviewCoach.report({
      interviewId: setup.interviewId,
      lang,
      coachId: coach.id,
      name: session.name,
      role,
      company: company || null,
      answers: answered.map((t) => ({ question: t.question, transcript: t.transcript ?? '', seconds: t.seconds })),
      metrics,
    });
    const demo = demoInterviewReport(answered, lang);
    const reviewed = answered.map((t, i) => {
      const r = report?.answers[i] ?? demo.answers[i];
      return { ...t, score: t.transcript ? r.score : null, feedback: r.feedback || demo.answers[i].feedback };
    });
    const result = await buildResult({
      acoustic,
      text,
      source: 'live',
      topic: company ? `${role} · ${company}` : role,
      lang,
      coachId: coach.id,
      name: session.name,
      aiLocked: setup.aiLocked,
      scenario: { id: 'interview', context: { role, company: company || undefined }, targetSeconds: 0, answers: reviewed },
      coach: async (req) =>
        report
          ? {
              feedback: { source: 'claude', contentScore: report.contentScore, summary: report.summary, strengths: report.strengths, tips: report.tips, rewrite: null },
              aiLocked: false,
            }
          : { feedback: { ...demoFeedback(req), contentScore: demo.contentScore }, aiLocked: setup.aiLocked },
    });
    if (blob) saveAudio(result, blob);
    addAnalysis(result);
    navigate(`/analysis/result/${result.id}`, { replace: true });
  };

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setProblem(null);
    if (!role.trim()) return setProblem('required');
    try {
      await live.open();
    } catch (err) {
      return setProblem(err instanceof CaptureFailure ? err.code : 'unknown');
    }
    cancelled.current = false;
    baseIndex.current = 0;
    followUps.current = 0;
    turns.current = [];
    segments.current = [];
    setPhase('preparing');
    plan.current = await interviewCoach.start({
      lang,
      coachId: coach.id,
      name: session.name,
      role: role.trim(),
      company: company.trim() || null,
      count,
      aiLocked: remaining <= 0,
    });
    if (cancelled.current) return;
    if (plan.current.aiLocked) live.notify('ai-locked', d.scenario.interview.aiLocked, 60000);
    void ask(plan.current.questions[0], false);
  };

  const cancel = () => {
    cancelled.current = true;
    stopSpeaking();
    live.cancel();
    setPhase('setup');
  };

  // Arrêt automatique d'une réponse trop longue.
  useEffect(() => {
    if (phase === 'answering' && live.state.elapsed >= MAX_ANSWER_SECONDS) void answerDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, live.state.elapsed]);

  if (phase === 'preparing') return <CoachThinking coach={coach} text={d.scenario.interview.preparing} />;
  if (phase === 'finishing') return <CoachThinking coach={coach} text={d.scenario.interview.finishing} />;

  if (phase !== 'setup' && current) {
    const answering = phase === 'answering';
    return (
      <Screen>
        <LiveTopBar elapsed={answering ? live.state.elapsed : 0} target={0} onCancel={cancel} />
        <p className="text-center text-sm font-bold text-muted">
          {f(d.scenario.interview.question, { n: current.number, total })}
          {current.followUp && <span className="ml-2 rounded-full bg-sun/30 px-2 py-0.5 text-xs text-[#8A5E0C] dark:text-sun">{d.scenario.interview.followUp}</span>}
        </p>
        <SignalPill signal={live.state.signal} />

        <div className="flex items-start gap-3">
          <CoachAvatar coach={coach} size={56} />
          <div className="flex-1 rounded-3xl rounded-tl-md border border-line bg-surface px-4 py-3 shadow-soft" aria-live="polite">
            <p className="font-semibold leading-snug">{current.question}</p>
            {phase === 'asking' && (
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-primary">
                <Volume2 size={14} className="animate-pulse" /> {d.scenario.interview.speaking}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          {phase === 'thinking' ? (
            <div className="flex flex-col items-center gap-3 text-muted">
              <div className="flex gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2.5 animate-pulse rounded-full bg-primary/60" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
              <p className="font-bold">{d.scenario.interview.thinking}</p>
            </div>
          ) : (
            <>
              <div className="origin-center scale-75">
                <ListeningOrb orbRef={live.orb} coach={coach} ratio={null} center={<Mic size={44} className="relative text-primary" />} />
              </div>
              <p className="-mt-4 text-lg font-bold">{answering ? d.scenario.interview.yourTurn : d.scenario.interview.speaking}</p>
            </>
          )}
        </div>

        {phase === 'asking' && (
          <Button full variant="secondary" onClick={startAnswer}>
            <Mic size={18} /> {d.scenario.interview.answerNow}
          </Button>
        )}
        {answering && (
          <>
            <LiveStats state={live.state} />
            <LiveTranscript state={live.state} canTranscribe={live.canTranscribe} className="mt-3 !h-20" />
            <Button full className="mt-4" onClick={() => void answerDone()}>
              <Square size={18} fill="currentColor" /> {d.scenario.interview.done}
            </Button>
          </>
        )}
      </Screen>
    );
  }

  const problemText =
    problem === 'required' ? d.scenario.required : problem === 'short' ? d.analysis.tooShort : problem ? d.analysis.micErrors[problem] : null;

  return (
    <Screen>
      <div className="flex items-center gap-2">
        <BackButton label={d.common.back} />
        <span className="grid size-10 place-items-center rounded-xl bg-peach/25 text-[#B5603F] dark:text-peach">
          <Briefcase size={20} />
        </span>
        <h1 className="text-2xl font-semibold">{d.scenarios.interview.label}</h1>
      </div>

      <form id="interview-form" onSubmit={(e) => void start(e)} className="mt-4 flex-1 space-y-5 animate-rise" noValidate>
        <CoachBubble coach={coach} message={d.scenario.intro.interview} />
        <TextField
          id="role"
          label={d.scenario.fields.role}
          placeholder={d.scenario.fields.rolePlaceholder}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          maxLength={80}
          autoComplete="organization-title"
        />
        <TextField
          id="company"
          label={d.scenario.fields.company}
          placeholder={d.scenario.fields.companyPlaceholder}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          maxLength={80}
          autoComplete="organization"
        />
        <ChoiceRow
          label={d.scenario.fields.questions}
          value={count}
          onChange={(v) => setCount(v)}
          options={[3, 5, 7].map((n) => ({ value: n, label: String(n) }))}
        />
        <div className="space-y-2 text-sm">
          {data.plan === 'free' && (
            <p className="flex items-start gap-2 text-muted">
              <Info size={16} className="mt-0.5 shrink-0" />
              {remaining > 0 ? f(d.analysis.aiLeft, { n: remaining, total: FREE_AI_PER_DAY }) : d.analysis.aiNone}
            </p>
          )}
          {problemText && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-peach/20 px-4 py-3 font-semibold">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {problemText}
            </p>
          )}
        </div>
      </form>

      <div className="mt-6 flex justify-center">
        <SosButton />
      </div>
      <Button full type="submit" form="interview-form" className="mt-3">
        {d.scenario.start}
      </Button>
    </Screen>
  );
}
