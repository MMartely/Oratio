import { Link } from 'react-router-dom';
import { Award, BarChart3, Briefcase, ChevronRight, Flame, Map, Mic, Shuffle, Sparkles, Trophy, Upload, Zap } from 'lucide-react';
import { statusOf } from '../analysis/metrics';
import { ScoreChart } from '../components/ScoreChart';
import { Card } from '../components/ui';
import { badgeIds, unlockedBadges } from '../data/badges';
import { useI18n } from '../i18n';
import { liveStreak, useApp } from '../store/useApp';

const badgeIcons = { first: Mic, streak7: Flame, noFiller: Zap, impro: Shuffle, interview: Briefcase, path: Map } as const;
const scoreTone = {
  good: 'bg-sage/25 text-[#3F7350] dark:text-sage',
  ok: 'bg-sun/30 text-[#8A5E0C] dark:text-sun',
  work: 'bg-peach/25 text-[#9A4B2E] dark:text-peach',
} as const;

export function ProgressScreen() {
  const { d, f, p: pl, lang } = useI18n();
  const data = useApp((s) => s.data)!;
  const p = data.progress;
  const sessions = data.sessions;
  const unlocked = unlockedBadges(data);
  const recent = sessions.slice(0, 10);
  const withWpm = recent.filter((s) => s.metrics.wpm !== null);
  const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);

  const stats = [
    { label: d.progress.streak, value: pl(d.progress.days, liveStreak(p)), icon: Flame, tone: 'bg-peach/25 text-[#B5603F] dark:text-peach' },
    { label: d.progress.best, value: pl(d.progress.days, p.bestStreak), icon: Trophy, tone: 'bg-sun/30 text-[#9A6B12] dark:text-sun' },
    { label: d.progress.xp, value: String(p.xp), icon: Sparkles, tone: 'bg-primary/15 text-primary' },
    { label: d.progress.sessions, value: String(p.sessions), icon: Award, tone: 'bg-sage/25 text-[#3F7350] dark:text-sage' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.progress.title}</h1>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-4">
            <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Card>
        ))}
      </div>

      {recent.length === 0 ? (
        <Card className="flex flex-col items-center py-8 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-soft text-primary">
            <BarChart3 size={28} />
          </span>
          <p className="mt-3 max-w-xs text-muted">{d.progress.chartEmpty}</p>
          <Link to="/analysis" className="mt-4 font-bold text-primary">
            {d.features.analysis.label} →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="font-sans text-base font-bold">{d.progress.chartTitle}</h2>
            <div className="mt-3">
              <ScoreChart sessions={recent} lang={lang} label={d.progress.chartTitle} />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-sm font-bold text-muted">{d.progress.avgFillers}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {avg(recent.map((s) => s.metrics.fillersPerMin)).toLocaleString(lang, { maximumFractionDigits: 1 })}
              </p>
              <p className="text-xs text-muted">{pl(d.progress.average, recent.length)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-bold text-muted">{d.progress.avgWpm}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {withWpm.length ? f(d.results.wpmValue, { n: Math.round(avg(withWpm.map((s) => s.metrics.wpm!))) }) : '—'}
              </p>
              <p className="text-xs text-muted">{pl(d.progress.average, withWpm.length)}</p>
            </Card>
          </div>

          <section>
            <h2 className="mb-3 text-xl font-semibold">{d.progress.recent}</h2>
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link to={`/analysis/result/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      {s.source === 'upload' ? <Upload size={18} /> : <Mic size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{s.topic ?? (s.source === 'upload' ? d.progress.uploaded : d.features.analysis.label)}</span>
                      <span className="block text-xs text-muted">
                        {new Date(s.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold tabular-nums ${scoreTone[statusOf(s.scores.global)]}`}>
                      {s.scores.global}
                    </span>
                    <ChevronRight size={18} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">{d.progress.badges}</h2>
        <div className="grid grid-cols-3 gap-3">
          {badgeIds.map((id) => {
            const Icon = badgeIcons[id];
            const on = unlocked.has(id);
            return (
              <div
                key={id}
                className={`flex flex-col items-center gap-2 rounded-3xl border p-3 text-center ${on ? 'border-sun bg-sun/15' : 'border-line bg-surface opacity-60'}`}
              >
                <span className={`grid size-14 place-items-center rounded-full ${on ? 'bg-sun text-[#5C3D05]' : 'bg-soft text-muted'}`}>
                  <Icon size={24} />
                </span>
                <span className="text-xs font-bold leading-tight">{d.progress.badgeList[id]}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
