import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Crown, Info, Shuffle, Square } from 'lucide-react';
import { buildResult } from '../../analysis/buildResult';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { CoachBubble } from '../../components/CoachBubble';
import { ChoiceRow } from '../../components/form';
import { CoachThinking, LiveStats, LiveTopBar, LiveTranscript, SignalPill } from '../../components/LiveParts';
import { SosButton } from '../../components/SosTrac';
import { BackButton, Button, Card, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { FREE_AI_PER_DAY, FREE_IMPRO_PER_DAY } from '../../data/features';
import {
  IMPRO_CATEGORIES,
  IMPRO_LEVELS,
  OVERTIME_SECONDS,
  THINK_SECONDS,
  drawTopic,
  lightAt,
  timingOfLight,
  type ImproCategory,
  type ImproLevel,
  type ImproLight,
} from '../../data/impro';
import { MIN_SPEECH_SECONDS, useSaveAudio } from '../../hooks/useSaveAudio';
import { useI18n } from '../../i18n';
import { aiRemaining, improRemaining, useApp } from '../../store/useApp';

type Phase = 'setup' | 'draw' | 'think' | 'recording' | 'processing';

/** Couleur de chaque feu : fond, texte, et pastille. */
const LIGHT_STYLE: Record<ImproLight, { box: string; dot: string }> = {
  none: { box: 'bg-soft text-ink', dot: 'bg-line' },
  green: { box: 'bg-[#3F8F5A] text-white', dot: 'bg-[#3F8F5A]' },
  orange: { box: 'bg-[#E39B2D] text-white', dot: 'bg-[#E39B2D]' },
  red: { box: 'bg-[#C9483B] text-white', dot: 'bg-[#C9483B]' },
  over: { box: 'bg-[#7E2B22] text-white', dot: 'bg-[#7E2B22]' },
};

const formatSeconds = (s: number) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`);

/** Improvisation : sujet surprise, 10 s de réflexion, puis prise de parole guidée par des feux (vert, orange, rouge). */
export function ImproFlow() {
  const { d, f, lang } = useI18n();
  const navigate = useNavigate();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const addAnalysis = useApp((s) => s.addAnalysis);
  const saveAudio = useSaveAudio();
  const coach = getCoach(data.onboarding.coachId);
  const left = improRemaining(data);
  const live = useLiveRecorder(lang, {
    filler: (word) => f(d.analysis.signals.filler, { word }),
    fast: d.analysis.signals.fast,
    quiet: d.analysis.signals.quiet,
  });

  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState<ImproCategory | 'all'>('all');
  const [level, setLevel] = useState<ImproLevel>('classic');
  const [topic, setTopic] = useState('');
  const [redrawn, setRedrawn] = useState(false);
  const [thinkLeft, setThinkLeft] = useState(THINK_SECONDS);
  const [problem, setProblem] = useState<CaptureError | 'short' | null>(null);
  const finishing = useRef(false);
  const lastLight = useRef<ImproLight>('none');
  const times = IMPRO_LEVELS[level];

  const draw = () => {
    setTopic(drawTopic(lang, category));
    setRedrawn(false);
    setProblem(null);
    setPhase('draw');
  };

  // Le micro s'ouvre dès la réflexion : la parole démarre sans attendre l'autorisation.
  const think = async () => {
    try {
      await live.open();
    } catch (e) {
      setProblem(e instanceof CaptureFailure ? e.code : 'unknown');
      setPhase('setup');
      return;
    }
    setThinkLeft(THINK_SECONDS);
    setPhase('think');
  };

  const { begin } = live;
  const speak = useCallback(() => {
    lastLight.current = 'none';
    begin();
    setPhase('recording');
  }, [begin]);

  useEffect(() => {
    if (phase !== 'think') return;
    if (thinkLeft <= 0) {
      speak();
      return;
    }
    const timer = window.setTimeout(() => setThinkLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, thinkLeft, speak]);

  const elapsed = phase === 'recording' ? live.state.elapsed : 0;
  const light = lightAt(elapsed, level);

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const reached = lightAt(live.state.elapsed, level);
    const segment = await live.end();
    const blob = await live.close();
    finishing.current = false;
    if (segment.acoustic.speakingTime < MIN_SPEECH_SECONDS && segment.words.length < 10) {
      setProblem('short');
      setPhase('setup');
      return;
    }
    setPhase('processing');
    const result = await buildResult({
      acoustic: segment.acoustic,
      text: segment.text,
      source: 'live',
      topic,
      lang,
      coachId: coach.id,
      name: session.name,
      aiLocked: aiRemaining(data) <= 0,
      scenario: {
        id: 'impro',
        context: { subject: topic },
        targetSeconds: times.red,
        timing: timingOfLight(reached),
        lights: reached,
        lightTimes: times,
      },
    });
    if (blob) saveAudio(result, blob);
    addAnalysis(result);
    navigate(`/analysis/result/${result.id}`, { replace: true });
  };

  // Vibration à chaque nouveau feu, arrêt automatique 30 s après le rouge.
  useEffect(() => {
    if (phase !== 'recording') return;
    if (light !== lastLight.current) {
      lastLight.current = light;
      try {
        navigator.vibrate?.(light === 'red' || light === 'over' ? [80, 60, 80] : 60);
      } catch {
        /* vibration non disponible */
      }
    }
    if (live.state.elapsed >= times.red + OVERTIME_SECONDS + 5) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, light, live.state.elapsed]);

  const cancel = () => {
    live.cancel();
    setPhase('setup');
  };

  if (phase === 'processing') return <CoachThinking coach={coach} text={d.analysis.processing} />;

  if (phase === 'think' || phase === 'recording') {
    const recording = phase === 'recording';
    const style = LIGHT_STYLE[recording ? light : 'none'];
    return (
      <Screen>
        <LiveTopBar elapsed={elapsed} target={times.red} onCancel={cancel} />
        <SignalPill signal={recording ? live.state.signal : null} />
        <Card className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{d.impro.yourTopic}</p>
          <p className="mt-1 font-display text-xl font-semibold leading-snug">{topic}</p>
        </Card>

        <div
          className={`mt-4 flex flex-1 flex-col items-center justify-center rounded-3xl px-4 py-6 text-center transition-colors duration-700 ${style.box}`}
          role="status"
          aria-live="polite"
        >
          {recording ? (
            <>
              <div className="flex gap-3" aria-hidden>
                {(['green', 'orange', 'red'] as const).map((l) => (
                  <span
                    key={l}
                    className={`size-6 rounded-full border-2 transition ${
                      light === l || (light === 'over' && l === 'red')
                        ? 'scale-125 border-white bg-white shadow-[0_0_16px_rgba(255,255,255,.8)]'
                        : light === 'none'
                          ? 'border-line bg-surface'
                          : 'border-white/70 bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-4 font-display text-2xl font-semibold">{d.impro.lightNow[light]}</p>
            </>
          ) : (
            <>
              <p className="font-display text-7xl font-semibold tabular-nums text-primary">{thinkLeft}</p>
              <p className="mt-2 font-display text-xl font-semibold">{d.impro.think}</p>
              <p className="mt-4 rounded-full bg-surface px-4 py-1.5 text-sm font-extrabold text-primary">{d.impro.method}</p>
              <p className="mt-2 max-w-xs text-sm text-muted">{d.impro.methodHint}</p>
            </>
          )}
        </div>

        {recording ? (
          <>
            <div className="mt-4">
              <LiveStats state={live.state} />
            </div>
            <LiveTranscript state={live.state} canTranscribe={live.canTranscribe} className="mt-3 !h-16" />
            <Button full className="mt-4" onClick={() => void finish()}>
              <Square size={18} fill="currentColor" /> {d.analysis.stop}
            </Button>
          </>
        ) : (
          <Button full className="mt-4" onClick={speak}>
            {d.impro.startNow}
          </Button>
        )}
      </Screen>
    );
  }

  if (phase === 'draw') {
    return (
      <Screen>
        <div className="flex items-center justify-between">
          <BackButton label={d.common.back} />
          <SosButton />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-5">
          <Card key={topic} className="animate-rise py-10 text-center">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{d.impro.yourTopic}</p>
            <p className="mt-3 font-display text-2xl font-semibold leading-snug">{topic}</p>
            <p className="mt-4 text-sm font-bold text-muted">{d.impro.levels[level]}</p>
          </Card>
          {!redrawn && (
            <button
              type="button"
              onClick={() => {
                setTopic(drawTopic(lang, category, topic));
                setRedrawn(true);
              }}
              className="mx-auto flex items-center gap-2 font-bold text-primary"
            >
              <Shuffle size={18} /> {d.impro.another}
              <span className="text-sm font-semibold text-muted">· {d.impro.anotherHint}</span>
            </button>
          )}
        </div>
        <Button full onClick={() => void think()}>
          {d.impro.ready}
        </Button>
      </Screen>
    );
  }

  const problemText = problem === 'short' ? d.analysis.tooShort : problem ? d.analysis.micErrors[problem] : null;
  return (
    <Screen>
      <div className="flex items-center gap-2">
        <BackButton label={d.common.back} />
        <h1 className="flex-1 text-2xl font-semibold">{d.features.impro.label}</h1>
        <SosButton />
      </div>

      <div className="mt-4 flex-1 space-y-5 animate-rise">
        <CoachBubble coach={coach} message={d.impro.intro} />
        {left <= 0 ? (
          <Card className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#B59BE8] text-white">
              <Crown size={26} />
            </span>
            <p className="mt-3">{f(d.impro.noneLeft, { total: FREE_IMPRO_PER_DAY })}</p>
            <Link to="/premium" className="mt-4 font-bold text-primary">
              {d.profile.upgrade} →
            </Link>
          </Card>
        ) : (
          <>
            <ChoiceRow
              label={d.impro.category}
              value={category}
              onChange={(v) => setCategory(v)}
              options={(['all', ...IMPRO_CATEGORIES] as const).map((v) => ({ value: v, label: d.impro.categories[v] }))}
            />
            <ChoiceRow
              label={d.impro.level}
              value={level}
              onChange={(v) => setLevel(v)}
              options={(['express', 'classic', 'long'] as const).map((v) => ({ value: v, label: d.impro.levels[v] }))}
            />
            <Card>
              <h2 className="font-sans font-bold">{d.impro.lightsTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(['green', 'orange', 'red'] as const).map((l) => (
                  <li key={l} className="flex items-center gap-3">
                    <span className={`size-4 shrink-0 rounded-full ${LIGHT_STYLE[l].dot}`} />
                    <span className="w-14 shrink-0 font-bold tabular-nums">{formatSeconds(times[l])}</span>
                    <span>{d.impro.lightsHelp[l]}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-2 text-sm">
              {data.plan === 'free' && (
                <p className="flex items-start gap-2 text-muted">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {f(d.impro.left, { n: left, total: FREE_IMPRO_PER_DAY })}
                    {' · '}
                    {aiRemaining(data) > 0 ? f(d.analysis.aiLeft, { n: aiRemaining(data), total: FREE_AI_PER_DAY }) : d.analysis.aiNone}
                  </span>
                </p>
              )}
              {problemText && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-peach/20 px-4 py-3 font-semibold">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {problemText}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {left > 0 && (
        <Button full className="mt-6" onClick={draw}>
          <Shuffle size={20} /> {d.impro.draw}
        </Button>
      )}
    </Screen>
  );
}
