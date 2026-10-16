import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Play, Sparkles } from 'lucide-react';
import { getCoach } from '../data/coaches';
import { featureRoute, features } from '../data/features';
import { CoachBubble } from '../components/CoachBubble';
import { Card, Pill, ProgressBar } from '../components/ui';
import { useI18n } from '../i18n';
import { liveStreak, minutesToday, useApp } from '../store/useApp';
import { lessonTitle } from '../data/path';

function GoalRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value);
  return (
    <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-soft" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        className="stroke-sage transition-all duration-700"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

export function Home() {
  const { d, f } = useI18n();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const coach = getCoach(data.onboarding.coachId);
  const hour = new Date().getHours();
  const moment = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const day = data.progress.currentDay;
  const goal = Number(data.onboarding.dailyMinutes);
  const done = minutesToday(data.progress);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-semibold">{f(d.home.hello, { name: session.name })}</h1>
        <div className="flex shrink-0 gap-2">
          <Pill className="bg-peach/25 text-[#B5603F] dark:text-peach">
            <Flame size={16} /> {f(d.home.streak, { n: liveStreak(data.progress) })}
          </Pill>
          <Pill className="bg-sun/30 text-[#9A6B12] dark:text-sun">
            <Sparkles size={16} /> {f(d.home.xp, { n: data.progress.xp })}
          </Pill>
        </div>
      </header>

      <div className="animate-rise">
        <CoachBubble coach={coach} message={f(d.coaches[coach.id].greetings[moment], { name: session.name })} />
      </div>

      <Link to="/path" className="block animate-rise">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-ink shadow-soft">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-10 size-32 rounded-full bg-white/10" />
          <p className="text-sm font-bold opacity-80">{d.home.todayLesson} · {f(d.home.dayOf, { n: day })}</p>
          <p className="mt-1 max-w-[80%] font-display text-2xl font-semibold">{lessonTitle(d, day)}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">{f(d.common.minutes, { n: 5 })}</span>
            <span className="grid size-12 place-items-center rounded-full bg-primary-ink text-primary">
              <Play size={20} fill="currentColor" />
            </span>
          </div>
        </div>
      </Link>

      <Card className="flex animate-rise items-center gap-4">
        <GoalRing value={done / goal} />
        <div className="flex-1">
          <p className="font-bold">{d.home.dailyGoal}</p>
          <p className="text-sm text-muted">{f(d.home.goalDone, { done, goal })}</p>
          <ProgressBar value={done / goal} className="mt-2" />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{d.home.quickPractice}</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ id, icon: Icon, tone }, i) => (
            <Link
              key={id}
              to={featureRoute(id)}
              className={`animate-rise rounded-3xl border border-line bg-surface p-4 shadow-soft transition active:scale-[.98] ${i === 0 ? 'col-span-2 flex items-center gap-4' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
                <Icon size={24} />
              </span>
              <span className={`block ${i === 0 ? 'flex-1' : 'mt-3'}`}>
                <span className="block font-bold">{d.features[id].label}</span>
                <span className="block text-sm leading-snug text-muted">{d.features[id].hint}</span>
              </span>
              {i === 0 && <ChevronRight className="text-muted" />}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
