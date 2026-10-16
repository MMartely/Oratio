import { Link } from 'react-router-dom';
import { Check, Crown, Lock, Play } from 'lucide-react';
import { FREE_PATH_DAYS } from '../data/features';
import { useI18n } from '../i18n';
import { useApp } from '../store/useApp';

export function Path() {
  const { d, f } = useI18n();
  const data = useApp((s) => s.data)!;
  const current = data.progress.currentDay;
  let dayNumber = 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.path.title}</h1>
        <p className="mt-1 text-muted">{d.path.subtitle}</p>
      </header>

      {d.path.weeks.map((week, w) => (
        <section key={week.theme} className="animate-rise" style={{ animationDelay: `${w * 80}ms` }}>
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{f(d.path.week, { n: w + 1 })}</p>
          <h2 className="text-xl font-semibold">{week.theme}</h2>
          <ol className="mt-3 space-y-2">
            {week.days.map((title) => {
              dayNumber += 1;
              const n = dayNumber;
              const done = n < current;
              const isCurrent = n === current;
              const premium = n > FREE_PATH_DAYS && data.plan === 'free';
              const row = (
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                    isCurrent ? 'border-primary bg-primary/10' : 'border-line bg-surface'
                  } ${!done && !isCurrent ? 'opacity-70' : ''}`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                      done ? 'bg-sage text-white' : isCurrent ? 'bg-primary text-primary-ink' : 'bg-soft text-muted'
                    }`}
                  >
                    {done ? <Check size={18} strokeWidth={3} /> : n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-muted">{f(d.common.day, { n })}</span>
                    <span className="block truncate font-bold">{title}</span>
                  </span>
                  {isCurrent && <Play size={18} className="text-primary" fill="currentColor" />}
                  {!isCurrent && !done && (premium ? <Crown size={18} className="text-[#9A6B12] dark:text-sun" /> : <Lock size={16} className="text-muted" />)}
                </div>
              );
              return (
                <li key={n}>
                  {isCurrent ? <Link to="/soon/lesson">{row}</Link> : row}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
