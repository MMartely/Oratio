import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Info, LogOut } from 'lucide-react';
import { coaches, getCoach } from '../data/coaches';
import { CoachAvatar } from '../components/CoachAvatar';
import { LangSwitch } from '../components/LangSwitch';
import { Button, Card } from '../components/ui';
import { useI18n } from '../i18n';
import { backend } from '../services/backend';
import { useApp } from '../store/useApp';
import type { DailyMinutes, Theme } from '../types';

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange(v: T): void;
  label: string;
}) {
  return (
    <div className="flex rounded-full border border-line bg-bg p-1 text-sm font-bold" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full px-3 py-1.5 transition ${value === o.value ? 'bg-primary text-primary-ink' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Profile() {
  const { d, f } = useI18n();
  const navigate = useNavigate();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const theme = useApp((s) => s.settings.theme);
  const setTheme = useApp((s) => s.setTheme);
  const updateOnboarding = useApp((s) => s.updateOnboarding);
  const signOut = useApp((s) => s.signOut);
  const [pickCoach, setPickCoach] = useState(false);
  const coach = getCoach(data.onboarding.coachId);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{d.profile.title}</h1>

      <Card className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-2xl font-semibold text-primary">
          {session.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{session.name}</p>
          <p className="truncate text-sm text-muted">{session.email}</p>
        </div>
      </Card>

      <Link to="/premium" className="block">
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-[#B59BE8] p-5 text-white shadow-soft">
          <Crown size={28} />
          <div className="flex-1">
            <p className="text-sm font-bold opacity-85">
              {d.profile.plan} : {data.plan === 'free' ? d.profile.free : d.profile.premium}
            </p>
            <p className="font-display text-lg font-semibold">{d.profile.upgrade}</p>
          </div>
        </div>
      </Link>

      <Card className="space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-bold">{d.profile.coach}</p>
            <button type="button" className="text-sm font-bold text-primary" onClick={() => setPickCoach(!pickCoach)}>
              {pickCoach ? d.common.close : d.profile.change}
            </button>
          </div>
          {!pickCoach ? (
            <div className="mt-3 flex items-center gap-3">
              <CoachAvatar coach={coach} size={48} />
              <div>
                <p className="font-bold">{coach.name}</p>
                <p className="text-sm text-muted">{d.coaches[coach.id].role}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {coaches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === coach.id}
                  onClick={() => {
                    updateOnboarding({ coachId: c.id });
                    setPickCoach(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left ${c.id === coach.id ? 'border-primary bg-primary/10' : 'border-line'}`}
                >
                  <CoachAvatar coach={c} size={44} />
                  <span>
                    <span className="block font-bold">{c.name}</span>
                    <span className="block text-sm text-muted">{d.coaches[c.id].role}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-bold">{d.profile.dailyGoal}</p>
          <Segmented<DailyMinutes>
            label={d.profile.dailyGoal}
            value={data.onboarding.dailyMinutes}
            onChange={(v) => updateOnboarding({ dailyMinutes: v })}
            options={(['5', '10', '15', '20'] as DailyMinutes[]).map((v) => ({ value: v, label: f(d.common.minutes, { n: v }) }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-bold">{d.profile.language}</p>
          <LangSwitch />
        </div>

        <div>
          <p className="mb-2 font-bold">{d.profile.theme}</p>
          <Segmented<Theme>
            label={d.profile.theme}
            value={theme}
            onChange={setTheme}
            options={(['system', 'light', 'dark'] as Theme[]).map((v) => ({ value: v, label: d.profile.themes[v] }))}
          />
        </div>
      </Card>

      <Button
        full
        variant="secondary"
        onClick={async () => {
          await signOut();
          navigate('/welcome', { replace: true });
        }}
      >
        <LogOut size={18} /> {d.profile.signOut}
      </Button>

      {backend.mode === 'demo' && (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
          <Info size={14} /> {d.common.demoMode}
        </p>
      )}
    </div>
  );
}
