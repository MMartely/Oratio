import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Crown, Info, Lock, RotateCcw, Sparkles, Target } from 'lucide-react';
import {
  IDEAL_WPM,
  fillerStatus,
  intonationStatus,
  paceStatus,
  statusOf,
  volumeStatus,
  type Status,
} from '../../analysis/metrics';
import { recordingUrl } from '../../audio/recordings';
import { CoachBubble } from '../../components/CoachBubble';
import { BackButton, Button, Card, Pill, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { ScenarioSection } from './ScenarioSection';
import { backend } from '../../services/backend';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/useApp';
import type { AnalysisResult } from '../../types';

const statusTone: Record<Status, string> = {
  good: 'bg-sage/25 text-[#3F7350] dark:text-sage',
  ok: 'bg-sun/30 text-[#8A5E0C] dark:text-sun',
  work: 'bg-peach/25 text-[#9A4B2E] dark:text-peach',
};
const statusBar: Record<Status, string> = { good: 'bg-sage', ok: 'bg-sun', work: 'bg-peach' };

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function ScoreRing({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-44 place-items-center">
      <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="12" className="stroke-soft" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <p className="font-display text-6xl font-semibold tabular-nums">{score}</p>
    </div>
  );
}

function MetricCard({ title, value, detail, status, children }: { title: string; value: string; detail?: string; status: Status; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-muted">{title}</p>
        <span className={`size-2.5 shrink-0 rounded-full ${statusBar[status]}`} aria-hidden />
      </div>
      <p className="mt-1 font-display text-xl font-semibold leading-tight">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
      {children}
    </div>
  );
}

function PaceGauge({ wpm }: { wpm: number }) {
  const lo = 60;
  const hi = 220;
  const pos = (v: number) => `${((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="relative mt-3 h-2 rounded-full bg-soft" aria-hidden>
      <div className="absolute inset-y-0 rounded-full bg-sage/60" style={{ left: pos(IDEAL_WPM.min), right: `calc(100% - ${pos(IDEAL_WPM.max)})` }} />
      <div className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-surface bg-primary" style={{ left: pos(wpm) }} />
    </div>
  );
}

function Timeline({ result }: { result: AnalysisResult }) {
  const { d } = useI18n();
  const bars = result.timeline;
  if (bars.length < 4) return null;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-bold">{d.results.energy}</h3>
        {result.hesitationMarks.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-2.5 rounded-full bg-peach" /> {d.results.hesitation}
          </span>
        )}
      </div>
      <div className="relative mt-4 flex h-20 items-center gap-[2px]">
        {bars.map((v, i) => (
          <span key={i} className="flex-1 rounded-full bg-primary/50" style={{ height: `${Math.max(6, v * 100)}%` }} />
        ))}
        {result.hesitationMarks.map((m, i) => (
          <span key={i} className="absolute -bottom-2 size-2.5 -translate-x-1/2 rounded-full bg-peach" style={{ left: `${m * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs tabular-nums text-muted">
        <span>0:00</span>
        <span>{formatTime(result.duration)}</span>
      </div>
    </Card>
  );
}

/** Réécoute : en mémoire pendant la visite, ou depuis le serveur pour les abonnés Premium. */
function Replay({ result }: { result: AnalysisResult }) {
  const { d } = useI18n();
  const session = useApp((s) => s.session);
  const plan = useApp((s) => s.data?.plan);
  const [url, setUrl] = useState(() => recordingUrl(result.id));
  useEffect(() => {
    if (url || !result.recorded || !session) return;
    let alive = true;
    backend.recordingUrl(session.id, result.id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [url, result.recorded, result.id, session]);

  if (url) {
    return (
      <Card>
        <h3 className="mb-3 font-sans font-bold">{d.results.replay}</h3>
        <audio controls src={url} className="w-full" />
      </Card>
    );
  }
  if (plan === 'free' && result.source === 'live') {
    return (
      <Link to="/premium" className="flex items-start gap-3 rounded-3xl bg-primary/10 p-4 text-sm font-semibold">
        <Crown size={20} className="shrink-0 text-primary" />
        {d.results.replayPremium}
      </Link>
    );
  }
  return null;
}

/** « Recommencer » ramène au même exercice. */
const againRoute = (r: AnalysisResult) => (r.scenario?.id === 'impro' ? '/impro' : r.scenario ? `/scenario/${r.scenario.id}` : '/analysis');

export function Results() {
  const { id } = useParams();
  const { d, f, p, lang } = useI18n();
  const navigate = useNavigate();
  const result = useApp((s) => s.data?.sessions.find((x) => x.id === id));

  if (!result) {
    return (
      <Screen className="items-center justify-center text-center">
        <p className="text-muted">{d.results.notFound}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          {d.results.done}
        </Button>
      </Screen>
    );
  }

  const coach = getCoach(result.coachId);
  const { metrics: m, scores } = result;
  const level = scores.global >= 85 ? 'great' : scores.global >= 70 ? 'good' : scores.global >= 55 ? 'ok' : 'work';
  const date = new Date(result.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const subs = [
    { key: 'clarity', value: scores.clarity },
    { key: 'pace', value: scores.pace },
    { key: 'voice', value: scores.voice },
    { key: 'content', value: scores.content },
  ] as const;
  const fs = fillerStatus(m.fillersPerMin);
  const vs = volumeStatus(m.volumeDb);
  const is = intonationStatus(m.pitchVarSt);

  return (
    <Screen className="gap-5">
      <div className="flex items-center gap-2">
        <BackButton to="/" label={d.common.back} />
        <div>
          <h1 className="text-2xl font-semibold">{d.results.title}</h1>
          <p className="text-xs text-muted">
            {result.scenario ? `${d.scenarios[result.scenario.id].label}${result.topic ? ` · ${result.topic}` : ''} · ` : ''}
            {date}
          </p>
        </div>
      </div>

      <section className="flex flex-col items-center text-center animate-rise">
        <ScoreRing score={scores.global} />
        <p className="mt-2 font-display text-2xl font-semibold">{d.results.levels[level]}</p>
        <Pill className="mt-2 bg-sun/30 text-[#8A5E0C] dark:text-sun">
          <Sparkles size={16} /> {f(d.results.xp, { n: result.xp })}
        </Pill>
      </section>

      <CoachBubble coach={coach} message={result.feedback.summary} />

      <Card className="space-y-3">
        {subs.map(({ key, value }) => (
          <div key={key} className="flex items-center gap-3">
            <p className="w-20 shrink-0 text-sm font-bold">{d.results.sub[key]}</p>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-soft">
              {value !== null && <div className={`h-full rounded-full ${statusBar[statusOf(value)]}`} style={{ width: `${value}%` }} />}
            </div>
            <p className="w-8 text-right text-sm font-bold tabular-nums">
              {value ?? (result.aiLocked ? <Lock size={14} className="ml-auto text-muted" /> : '—')}
            </p>
          </div>
        ))}
      </Card>

      <ScenarioSection result={result} />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title={d.results.fillers}
          status={fs}
          value={m.fillers === 0 ? d.results.noFillers : String(m.fillers)}
          detail={m.fillers ? f(d.results.perMin, { n: m.fillersPerMin.toLocaleString(lang) }) : undefined}
        >
          {result.breakdown.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.breakdown.slice(0, 4).map((b) => (
                <span key={b.label} className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusTone[fs]}`}>
                  {b.label} ×{b.count}
                </span>
              ))}
            </div>
          )}
        </MetricCard>
        <MetricCard
          title={d.results.pace}
          status={paceStatus(m.wpm)}
          value={m.wpm === null ? '—' : f(d.results.wpmValue, { n: m.wpm })}
          detail={`${m.wpmEstimated && m.wpm !== null ? `${d.results.estimated} · ` : ''}${f(d.results.idealRange, IDEAL_WPM)}`}
        >
          {m.wpm !== null && <PaceGauge wpm={m.wpm} />}
        </MetricCard>
        <MetricCard
          title={d.results.pauses}
          status={m.longPauses > 0 ? 'ok' : 'good'}
          value={p(d.results.pausesValue, m.pauses)}
          detail={m.longPauses ? f(d.results.longPauses, { n: m.longPauses }) : undefined}
        />
        <MetricCard
          title={d.results.volume}
          status={vs}
          value={d.results.volumeLevels[vs]}
          detail={m.volumeDb !== null ? `${Math.round(m.volumeDb)} dBFS` : undefined}
        />
        <MetricCard
          title={d.results.intonation}
          status={is}
          value={d.results.intonationLevels[is]}
          detail={m.pitchVarSt !== null ? `± ${m.pitchVarSt.toFixed(1)} ${lang === 'fr' ? 'demi-tons' : 'semitones'}` : undefined}
        />
        <MetricCard title={d.results.duration} status="good" value={formatTime(result.duration)} />
      </div>

      <Timeline result={result} />

      <Card className="space-y-4">
        <div>
          <h3 className="font-sans font-bold">{d.results.strengths}</h3>
          <ul className="mt-2 space-y-2">
            {result.feedback.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
                  <Check size={14} strokeWidth={3} />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-sans font-bold">{d.results.tips}</h3>
          <ul className="mt-2 space-y-2">
            {result.feedback.tips.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Target size={14} strokeWidth={2.5} />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        {result.feedback.rewrite && (
          <div>
            <h3 className="font-sans font-bold">{d.results.rewrite}</h3>
            <div className="mt-2 space-y-2 text-sm">
              <p className="rounded-2xl bg-peach/15 p-3">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-muted">{d.results.before}</span>
                {result.feedback.rewrite.before}
              </p>
              <p className="rounded-2xl bg-sage/20 p-3">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-muted">{d.results.after}</span>
                {result.feedback.rewrite.after}
              </p>
            </div>
          </div>
        )}
        {result.overused.length > 0 && (
          <div>
            <h3 className="font-sans font-bold">{d.results.repeated}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.overused.map((o) => (
                <span key={o.word} className="rounded-full bg-soft px-3 py-1 text-sm font-semibold">
                  {o.word} ×{o.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {result.aiLocked && (
        <Link to="/premium" className="flex items-start gap-3 rounded-3xl bg-primary/10 p-4 text-sm font-semibold">
          <Crown size={20} className="shrink-0 text-primary" />
          {d.results.aiLocked}
        </Link>
      )}

      <Card>
        <h3 className="font-sans font-bold">{d.results.transcript}</h3>
        {result.transcript ? (
          <>
            <p className="mt-2 leading-relaxed">
              {result.transcript.map((t, i) => (
                <span key={i}>
                  {i > 0 && ' '}
                  <span
                    className={
                      t.f
                        ? 'rounded bg-peach/35 px-0.5 font-semibold'
                        : t.r
                          ? 'underline decoration-sun decoration-2 underline-offset-4'
                          : undefined
                    }
                  >
                    {t.w}
                  </span>
                </span>
              ))}
            </p>
            <div className="mt-3 flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-4 rounded bg-peach/35" /> {d.results.legendFiller}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-sun" /> {d.results.legendRepeat}
              </span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">{result.source === 'upload' ? d.results.noTranscriptUpload : d.analysis.noSpeech}</p>
        )}
      </Card>

      <Replay result={result} />

      {result.feedback.source === 'demo' && (
        <p className="flex items-start justify-center gap-2 text-center text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0" />
          {backend.mode === 'demo' ? d.results.demoCoach : result.transcript && !result.aiLocked ? d.results.coachOffline : d.results.localCoach}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => navigate(againRoute(result), { replace: true })}>
          <RotateCcw size={18} /> {d.results.again}
        </Button>
        <Button onClick={() => navigate('/', { replace: true })}>{d.results.done}</Button>
      </div>
    </Screen>
  );
}
