import { Link } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { featureRoute, features, scenarios } from '../data/features';
import { useI18n } from '../i18n';
import { useApp } from '../store/useApp';

export function Practice() {
  const { d } = useI18n();
  const plan = useApp((s) => s.data!.plan);
  const others = features.filter((x) => x.id !== 'scenarios');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.nav.practice}</h1>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{d.features.scenarios.label}</h2>
        <div className="grid grid-cols-2 gap-3">
          {scenarios.map(({ id, icon: Icon, premium }) => (
            <Link
              key={id}
              to={`/scenario/${id}`}
              className="relative rounded-3xl border border-line bg-surface p-4 shadow-soft transition active:scale-[.98]"
            >
              {premium && plan === 'free' && (
                <Crown size={16} className="absolute right-3 top-3 text-[#9A6B12] dark:text-sun" aria-label={d.common.premium} />
              )}
              <span className="grid size-12 place-items-center rounded-2xl bg-peach/25 text-[#B5603F] dark:text-peach">
                <Icon size={24} />
              </span>
              <span className="mt-3 block font-bold leading-tight">{d.scenarios[id].label}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{d.scenarios[id].hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {others.map(({ id, icon: Icon, tone }) => (
          <Link
            key={id}
            to={featureRoute(id)}
            className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft transition active:scale-[.99]"
          >
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
              <Icon size={24} />
            </span>
            <span className="flex-1">
              <span className="block font-bold">{d.features[id].label}</span>
              <span className="block text-sm text-muted">{d.features[id].hint}</span>
            </span>
            <ChevronRight className="text-muted" />
          </Link>
        ))}
      </section>
    </div>
  );
}
