import { Award, BarChart3, Flame, Mic, Sparkles, Trophy, Zap, Briefcase, Shuffle, Map } from 'lucide-react';
import { Card } from '../components/ui';
import { useI18n } from '../i18n';
import { liveStreak, useApp } from '../store/useApp';

const badgeIcons = {
  first: Mic,
  streak7: Flame,
  noFiller: Zap,
  impro: Shuffle,
  interview: Briefcase,
  path: Map,
} as const;

export function ProgressScreen() {
  const { d, f } = useI18n();
  const p = useApp((s) => s.data!.progress);
  const stats = [
    { label: d.progress.streak, value: f(d.progress.days, { n: liveStreak(p) }), icon: Flame, tone: 'bg-peach/25 text-[#B5603F] dark:text-peach' },
    { label: d.progress.best, value: f(d.progress.days, { n: p.bestStreak }), icon: Trophy, tone: 'bg-sun/30 text-[#9A6B12] dark:text-sun' },
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

      <Card className="flex flex-col items-center py-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-soft text-primary">
          <BarChart3 size={28} />
        </span>
        <p className="mt-3 max-w-xs text-muted">{d.progress.chartEmpty}</p>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{d.progress.badges}</h2>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(badgeIcons) as (keyof typeof badgeIcons)[]).map((id) => {
            const Icon = badgeIcons[id];
            return (
              <div key={id} className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-surface p-3 text-center opacity-60">
                <span className="grid size-14 place-items-center rounded-full bg-soft text-muted">
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
