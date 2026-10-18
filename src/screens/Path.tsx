import { Link } from 'react-router-dom';
import { Check, Clock, Crown, Lock, Play } from 'lucide-react';
import { Stars } from '../components/Stars';
import { lessonState, nextLessonDay, unlockedUpTo, type LessonState } from '../data/lessons/progress';
import { useI18n } from '../i18n';
import { todayKey, useApp } from '../store/useApp';

export function Path() {
  const { d, f } = useI18n();
  const data = useApp((s) => s.data)!;
  const today = todayKey();
  const next = nextLessonDay(data.progress);
  const behind = Math.max(0, unlockedUpTo(data.progress, today) - next);
  let dayNumber = 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.path.title}</h1>
        <p className="mt-1 text-muted">{d.path.subtitle}</p>
        {behind > 0 && (
          <p className="mt-3 inline-flex rounded-full bg-sun/30 px-3 py-1 text-sm font-bold text-[#8A5E0C] dark:text-sun">
            {f(d.lesson.catchUp, { n: behind + 1 })}
          </p>
        )}
      </header>

      {d.path.weeks.map((week, w) => (
        <section key={week.theme} className="animate-rise" style={{ animationDelay: `${w * 80}ms` }}>
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{f(d.path.week, { n: w + 1 })}</p>
          <h2 className="text-xl font-semibold">{week.theme}</h2>
          <ol className="mt-3 space-y-2">
            {week.days.map((title) => {
              dayNumber += 1;
              const n = dayNumber;
              const state: LessonState = lessonState(n, data, today);
              const stars = data.progress.lessons[n]?.stars ?? 0;
              const open = state === 'available' || state === 'done';
              const row = (
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                    state === 'available' ? 'border-primary bg-primary/10' : 'border-line bg-surface'
                  } ${open ? '' : 'opacity-70'}`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                      state === 'done' ? 'bg-sage text-white' : state === 'available' ? 'bg-primary text-primary-ink' : 'bg-soft text-muted'
                    }`}
                  >
                    {state === 'done' ? <Check size={18} strokeWidth={3} /> : n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-muted">{f(d.common.day, { n })}</span>
                    <span className="block truncate font-bold">{title}</span>
                  </span>
                  {state === 'done' && <Stars count={stars} size={16} />}
                  {state === 'available' && <Play size={18} className="text-primary" fill="currentColor" />}
                  {state === 'tomorrow' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-muted">
                      <Clock size={14} /> {d.lesson.tomorrow}
                    </span>
                  )}
                  {state === 'premium' && <Crown size={18} className="text-[#9A6B12] dark:text-sun" aria-label={d.common.premium} />}
                  {state === 'later' && <Lock size={16} className="text-muted" />}
                </div>
              );
              return (
                <li key={n}>
                  {open ? (
                    <Link to={`/lesson/${n}`}>{row}</Link>
                  ) : state === 'premium' ? (
                    <Link to="/premium">{row}</Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {next > 30 && <p className="text-center font-display text-xl font-semibold text-primary">{d.lesson.allDone}</p>}
    </div>
  );
}
