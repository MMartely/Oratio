import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { ReminderFailure, disableReminder, enableReminder, remindersSupported, type ReminderError } from '../services/reminders';
import { useApp } from '../store/useApp';
import { Button, Card } from './ui';

/** Réglage du rappel quotidien (notification du coach si la leçon du jour n'est pas faite). */
export function ReminderCard() {
  const { d, lang } = useI18n();
  const session = useApp((s) => s.session)!;
  const data = useApp((s) => s.data)!;
  const updateOnboarding = useApp((s) => s.updateOnboarding);
  const reminder = data.onboarding.reminder ?? null;
  const coachId = data.onboarding.coachId ?? 'lea';
  const supported = remindersSupported();
  const [time, setTime] = useState(reminder ?? '19:00');
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | ReminderError>('idle');

  // Le message du rappel suit le coach et la langue choisis.
  useEffect(() => {
    if (!reminder || !supported || Notification.permission !== 'granted') return;
    enableReminder({ userId: session.id, time: reminder, lang, coachId }).catch(() => undefined);
  }, [coachId, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setStatus('busy');
    try {
      await enableReminder({ userId: session.id, time, lang, coachId });
      updateOnboarding({ reminder: time });
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

  const message =
    status === 'saved' ? d.reminders.saved : status === 'denied' ? d.reminders.denied : status === 'error' ? d.reminders.error : null;

  return (
    <Card className="space-y-3">
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
              onChange={(e) => setTime(e.target.value)}
              className="h-11 rounded-2xl border border-line bg-surface px-3 font-bold text-ink"
            />
          </label>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={status === 'busy' || !time} onClick={() => void save()}>
              {d.reminders.enable}
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
