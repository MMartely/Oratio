import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { ReminderFailure, disableReminder, enableReminder, remindersSupported, type ReminderError } from '../services/reminders';
import { useApp } from '../store/useApp';
import { Button, Card } from './ui';

const ALL_DAYS = 127;

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${checked ? 'bg-primary' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </label>
  );
}

/** Réglage des rappels : heure, jours, alerte « série en danger » et « bravo » du lendemain. */
export function ReminderCard() {
  const { d, lang } = useI18n();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const updateOnboarding = useApp((s) => s.updateOnboarding);
  const o = data.onboarding;
  const reminder = o.reminder ?? null;
  const coachId = o.coachId ?? 'lea';
  const supported = remindersSupported();
  const [time, setTime] = useState(reminder ?? '19:00');
  const [days, setDays] = useState(o.reminderDays ?? ALL_DAYS);
  const [streakAlert, setStreakAlert] = useState(o.streakAlert ?? true);
  const [bravo, setBravo] = useState(o.bravo ?? true);
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | ReminderError>('idle');

  // Le message du rappel suit le coach et la langue choisis.
  useEffect(() => {
    if (!reminder || !supported || Notification.permission !== 'granted') return;
    enableReminder({
      userId: session.id,
      time: reminder,
      lang,
      coachId,
      days: o.reminderDays ?? ALL_DAYS,
      streakAlert: o.streakAlert ?? true,
      bravo: o.bravo ?? true,
    }).catch(() => undefined);
  }, [coachId, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setStatus('busy');
    try {
      await enableReminder({ userId: session.id, time, lang, coachId, days, streakAlert, bravo });
      updateOnboarding({ reminder: time, reminderDays: days, streakAlert, bravo });
      setStatus('saved');
    } catch (e) {
      setStatus(e instanceof ReminderFailure ? e.code : 'error');
    }
  };

  const turnOff = async () => {
    setStatus('busy');
    await disableReminder().catch(() => undefined);
    updateOnboarding({ reminder: null });
    setStatus('idle');
  };

  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    if (status === 'saved') setStatus('idle');
  };

  const message =
    status === 'saved' ? d.reminders.saved : status === 'denied' ? d.reminders.denied : status === 'error' ? d.reminders.error : null;

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky/30 text-[#336C99] dark:text-sky">
          {reminder ? <Bell size={20} /> : <BellOff size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {d.reminders.title}
            {reminder && <span className="ml-2 text-sm font-semibold text-[#3F7350] dark:text-sage">· {d.reminders.on} {reminder}</span>}
          </p>
          <p className="text-sm text-muted">{supported ? d.reminders.hint : d.reminders.unsupported}</p>
        </div>
      </div>
      {supported && (
        <>
          <label className="flex items-center justify-between gap-3" htmlFor="reminder-time">
            <span className="text-sm font-bold">{d.reminders.time}</span>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => change(setTime)(e.target.value)}
              className="h-11 rounded-2xl border border-line bg-surface px-3 font-bold text-ink"
            />
          </label>
          <div>
            <p className="text-sm font-bold">{d.reminders.days}</p>
            <div className="mt-2 flex justify-between gap-1" role="group" aria-label={d.reminders.days}>
              {d.reminders.dayShort.map((short, i) => {
                const on = Boolean(days & (1 << i));
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={on}
                    aria-label={d.reminders.dayNames[i]}
                    onClick={() => change(setDays)(days ^ (1 << i))}
                    className={`grid size-10 place-items-center rounded-full text-sm font-extrabold transition ${on ? 'bg-primary text-white' : 'bg-soft text-muted'}`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            {days === 0 && <p className="mt-2 text-xs font-semibold text-[#9A4B2E] dark:text-peach">{d.reminders.oneDayMin}</p>}
          </div>
          <Toggle id="reminder-streak" label={d.reminders.streakAlert} hint={d.reminders.streakAlertHint} checked={streakAlert} onChange={change(setStreakAlert)} />
          <Toggle id="reminder-bravo" label={d.reminders.bravo} hint={d.reminders.bravoHint} checked={bravo} onChange={change(setBravo)} />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={status === 'busy' || !time || days === 0} onClick={() => void save()}>
              {reminder ? d.reminders.save : d.reminders.enable}
            </Button>
            {reminder && (
              <Button variant="secondary" disabled={status === 'busy'} onClick={() => void turnOff()}>
                {d.reminders.disable}
              </Button>
            )}
          </div>
          {message && (
            <p role="status" className={`rounded-2xl px-3 py-2 text-sm font-semibold ${status === 'saved' ? 'bg-sage/20' : 'bg-peach/20'}`}>
              {message}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
