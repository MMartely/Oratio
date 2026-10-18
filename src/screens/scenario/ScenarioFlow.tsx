import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Camera, Crown, Info, Square, Users } from 'lucide-react';
import { buildResult } from '../../analysis/buildResult';
import { timingOf } from '../../analysis/scenarios';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { Audience, attentionMood } from '../../components/Audience';
import { CoachBubble } from '../../components/CoachBubble';
import { ChoiceRow, TextField } from '../../components/form';
import { CoachThinking, LiveStats, LiveTopBar, LiveTranscript, SignalPill } from '../../components/LiveParts';
import { BackButton, Button, Card, ProgressBar, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { FREE_AI_PER_DAY, scenarios } from '../../data/features';
import { useI18n } from '../../i18n';
import { aiRemaining, useApp } from '../../store/useApp';
import type { AudienceMode, ScenarioContext } from '../../types';
import { MIN_SPEECH_SECONDS, useSaveAudio } from '../../hooks/useSaveAudio';

type MonologueId = 'talk' | 'pitch' | 'event';
type Phase = 'setup' | 'countdown' | 'recording' | 'applause' | 'processing';

const DURATIONS: Record<MonologueId, number[]> = { talk: [120, 300, 600], pitch: [60, 120, 180], event: [60, 120, 180] };

export function ScenarioFlow({ id }: { id: MonologueId }) {
  const { d, f, lang } = useI18n();
  const navigate = useNavigate();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const addAnalysis = useApp((s) => s.addAnalysis);
  const saveAudio = useSaveAudio();
  const coach = getCoach(data.onboarding.coachId);
  const remaining = aiRemaining(data);
  const meta = scenarios.find((s) => s.id === id)!;
  const locked = meta.premium && data.plan !== 'premium';
  const live = useLiveRecorder(lang, {
    filler: (word) => f(d.analysis.signals.filler, { word }),
    fast: d.analysis.signals.fast,
    quiet: d.analysis.signals.quiet,
  });

  const [phase, setPhase] = useState<Phase>('setup');
  const [context, setContext] = useState<ScenarioContext>(
    id === 'pitch' ? { listeners: 'investors' } : id === 'event' ? { eventType: 'wedding', tone: 'moving' } : {},
  );
  const [target, setTarget] = useState(DURATIONS[id][id === 'talk' ? 0 : 1]);
  const [mode, setMode] = useState<AudienceMode>('audience');
  const [view, setView] = useState<AudienceMode>('audience');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [problem, setProblem] = useState<CaptureError | 'short' | 'required' | null>(null);
  const [count, setCount] = useState(3);
  const [attention, setAttention] = useState(0.75);
  const samples = useRef<number[]>([]);
  const finishing = useRef(false);
  const video = useRef<HTMLVideoElement>(null);

  const requiredField = id === 'talk' ? 'subject' : id === 'pitch' ? 'project' : null;
  const topic =
    id === 'talk'
      ? context.subject
      : id === 'pitch'
        ? context.project
        : `${d.scenario.fields.eventOptions[context.eventType ?? 'other']}${context.honoree ? ` · ${context.honoree}` : ''}`;
  const set = (patch: Partial<ScenarioContext>) => setContext((c) => ({ ...c, ...patch }));

  useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream;
  }, [stream, view, phase]);

  // Compte à rebours puis démarrage.
  const { begin } = live;
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      begin();
      samples.current = [];
      setAttention(0.75);
      setPhase('recording');
      return;
    }
    const timer = window.setTimeout(() => setCount((c) => c - 1), 800);
    return () => window.clearTimeout(timer);
  }, [phase, count, begin]);

  // Le public réagit à la voix : volume, intonation, hésitations, silences.
  useEffect(() => {
    if (phase !== 'recording') return;
    let last = 0.75;
    const timer = window.setInterval(() => {
      const st = live.analyzer.current?.recentStats(8);
      if (!st) return;
      let goal = 0.55;
      if (st.speakingRatio > 0.3) goal += 0.1;
      if (st.volumeDb !== null) goal += st.volumeDb > -40 ? 0.1 : st.volumeDb < -48 ? -0.15 : 0;
      if (st.pitchVarSt !== null) goal += st.pitchVarSt >= 2 ? 0.2 : st.pitchVarSt >= 1.3 ? 0.08 : -0.15;
      goal -= 0.08 * st.hesitationsSince(st.now - 10);
      if (st.silence > 4) goal -= 0.3;
      goal = Math.max(0.05, Math.min(1, goal));
      last += (goal - last) * 0.15;
      samples.current.push(last);
      setAttention(last);
    }, 500);
    return () => window.clearInterval(timer);
  }, [phase, live.analyzer]);

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const segment = await live.end();
    const blob = await live.close();
    setStream(null);
    finishing.current = false;
    if (segment.acoustic.speakingTime < MIN_SPEECH_SECONDS && segment.words.length < 10) {
      setProblem('short');
      setPhase('setup');
      return;
    }
    setPhase('applause');
    const avg = samples.current.length ? samples.current.reduce((a, b) => a + b, 0) / samples.current.length : null;
    const [result] = await Promise.all([
      buildResult({
        acoustic: segment.acoustic,
        text: segment.text,
        source: 'live',
        topic: topic || null,
        lang,
        coachId: coach.id,
        name: session.name,
        aiLocked: remaining <= 0,
        scenario: {
          id,
          context,
          targetSeconds: target,
          mode,
          attention: avg === null ? undefined : Math.round(avg * 100),
          timing: timingOf(segment.acoustic.activeDuration, target),
        },
      }),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    setPhase('processing');
    if (blob) saveAudio(result, blob);
    addAnalysis(result);
    navigate(`/analysis/result/${result.id}`, { replace: true });
  };

  // Alertes de temps, puis arrêt automatique bien après la durée visée.
  useEffect(() => {
    if (phase !== 'recording') return;
    const t = live.state.elapsed;
    if (t >= target - 30 && t < target) live.notify('time-left', d.scenario.timeLeft, 60000);
    if (t >= target && t < target + 2) live.notify('time-up', d.scenario.timeUp, 60000);
    if (t >= target * 1.5) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target, live.state.elapsed]);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setProblem(null);
    if (requiredField && !context[requiredField]?.trim()) return setProblem('required');
    try {
      setStream(await live.open({ video: mode === 'mirror' }));
      setView(mode);
    } catch (err) {
      const code = err instanceof CaptureFailure ? err.code : 'unknown';
      if (mode !== 'mirror') return setProblem(code);
      // Sans caméra, on garde le micro et le public virtuel.
      try {
        setStream(await live.open());
        setView('audience');
        live.notify('camera', d.scenario.camError, 60000);
      } catch (again) {
        return setProblem(again instanceof CaptureFailure ? again.code : 'unknown');
      }
    }
    setCount(3);
    setPhase('countdown');
  };

  const cancel = () => {
    live.cancel();
    setStream(null);
    setPhase('setup');
  };

  if (phase === 'processing') return <CoachThinking coach={coach} text={d.analysis.processing} />;

  if (phase !== 'setup') {
    const recording = phase === 'recording';
    const hasVideo = Boolean(stream?.getVideoTracks().length);
    const mood = attentionMood(attention);
    return (
      <Screen>
        <LiveTopBar elapsed={phase === 'countdown' ? 0 : live.state.elapsed} target={target} onCancel={cancel}>
          {hasVideo && (
            <button
              type="button"
              onClick={() => setView(view === 'mirror' ? 'audience' : 'mirror')}
              className="grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
              aria-label={d.scenario.switchView}
              title={d.scenario.switchView}
            >
              {view === 'mirror' ? <Users size={22} /> : <Camera size={22} />}
            </button>
          )}
        </LiveTopBar>
        <SignalPill signal={phase === 'applause' ? { id: 1, text: d.scenario.applause } : live.state.signal} />

        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
            {view === 'mirror' && hasVideo ? (
              <video ref={video} autoPlay playsInline muted className="aspect-[3/4] max-h-[50dvh] w-full -scale-x-100 object-cover" />
            ) : (
              <div className="px-2 pt-3">
                <Audience variant={id} attention={phase === 'countdown' ? 0.8 : attention} applause={phase === 'applause'} />
              </div>
            )}
            {phase === 'countdown' && (
              <div className="absolute inset-0 grid place-items-center bg-bg/60">
                <span className="font-display text-7xl font-semibold text-primary">{count || ''}</span>
              </div>
            )}
          </div>
          {recording && (
            <div className="flex items-center gap-3 px-1">
              <p className="flex-1 text-sm font-bold" aria-live="polite">
                {d.scenario.audience[mood]}
              </p>
              <ProgressBar value={attention} className="w-24" />
            </div>
          )}
        </div>

        {recording && (
          <>
            <LiveStats state={live.state} />
            <LiveTranscript state={live.state} canTranscribe={live.canTranscribe} className="mt-3 !h-20" />
            <Button full className="mt-4" onClick={() => void finish()}>
              <Square size={18} fill="currentColor" /> {d.analysis.stop}
            </Button>
          </>
        )}
      </Screen>
    );
  }

  const Icon = meta.icon;
  const problemText =
    problem === 'short'
      ? d.analysis.tooShort
      : problem === 'required'
        ? d.scenario.required
        : problem
            ? d.analysis.micErrors[problem]
            : null;

  return (
    <Screen>
      <div className="flex items-center gap-2">
        <BackButton label={d.common.back} />
        <span className="grid size-10 place-items-center rounded-xl bg-peach/25 text-[#B5603F] dark:text-peach">
          <Icon size={20} />
        </span>
        <h1 className="text-2xl font-semibold">{d.scenarios[id].label}</h1>
      </div>

      <form id="scenario-form" onSubmit={(e) => void start(e)} className="mt-4 flex-1 space-y-5 animate-rise" noValidate>
        <CoachBubble coach={coach} message={d.scenario.intro[id]} />

        {locked ? (
          <Card className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#B59BE8] text-white">
              <Crown size={26} />
            </span>
            <h2 className="mt-3 text-xl font-semibold">{d.scenario.premiumTitle}</h2>
            <p className="mt-1 text-muted">{d.scenario.premiumBody}</p>
            <Link to="/premium" className="mt-4 font-bold text-primary">
              {d.profile.upgrade} →
            </Link>
          </Card>
        ) : (
          <>
            {id === 'talk' && (
              <TextField
                id="subject"
                label={d.scenario.fields.subject}
                placeholder={d.scenario.fields.subjectPlaceholder}
                value={context.subject ?? ''}
                onChange={(e) => set({ subject: e.target.value })}
                maxLength={120}
              />
            )}
            {id === 'pitch' && (
              <>
                <TextField
                  id="project"
                  label={d.scenario.fields.project}
                  placeholder={d.scenario.fields.projectPlaceholder}
                  value={context.project ?? ''}
                  onChange={(e) => set({ project: e.target.value })}
                  maxLength={120}
                />
                <ChoiceRow
                  label={d.scenario.fields.listeners}
                  value={context.listeners ?? 'investors'}
                  onChange={(v) => set({ listeners: v })}
                  options={(['investors', 'jury', 'clients'] as const).map((v) => ({ value: v, label: d.scenario.fields.listenerOptions[v] }))}
                />
              </>
            )}
            {id === 'event' && (
              <>
                <ChoiceRow
                  label={d.scenario.fields.eventType}
                  value={context.eventType ?? 'wedding'}
                  onChange={(v) => set({ eventType: v })}
                  options={(['wedding', 'birthday', 'thanks', 'toast', 'other'] as const).map((v) => ({ value: v, label: d.scenario.fields.eventOptions[v] }))}
                />
                <TextField
                  id="honoree"
                  label={d.scenario.fields.honoree}
                  placeholder={d.scenario.fields.honoreePlaceholder}
                  value={context.honoree ?? ''}
                  onChange={(e) => set({ honoree: e.target.value })}
                  maxLength={80}
                />
                <ChoiceRow
                  label={d.scenario.fields.tone}
                  value={context.tone ?? 'moving'}
                  onChange={(v) => set({ tone: v })}
                  options={(['moving', 'funny', 'sober'] as const).map((v) => ({ value: v, label: d.scenario.fields.toneOptions[v] }))}
                />
              </>
            )}
            <ChoiceRow
              label={d.scenario.fields.duration}
              value={target}
              onChange={(v) => setTarget(v)}
              options={DURATIONS[id].map((s) => ({ value: s, label: f(d.common.minutes, { n: s / 60 }) }))}
            />
            <ChoiceRow
              label={d.scenario.fields.mode}
              value={mode}
              onChange={(v) => setMode(v)}
              options={(['audience', 'mirror'] as const).map((v) => ({ value: v, label: d.scenario.fields.modeOptions[v] }))}
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
          </>
        )}
      </form>

      {!locked && (
        <Button full type="submit" form="scenario-form" className="mt-6">
          {d.scenario.start}
        </Button>
      )}
    </Screen>
  );
}
