import { useMemo, useState } from 'react';
import { Wind, X } from 'lucide-react';
import { getCoach } from '../data/coaches';
import { useI18n } from '../i18n';
import { useApp } from '../store/useApp';
import { BreathingGuide } from './BreathingGuide';
import { CoachBubble } from './CoachBubble';
import { Button } from './ui';

/** 4 cycles de 14 s : un peu moins d'une minute. */
const SOS_CYCLES = 4;

/** Séance « SOS trac » : une phrase du coach, une minute de respiration guidée, puis un mot d'encouragement. */
export function SosSession({ onDone, autoStart = false }: { onDone(): void; autoStart?: boolean }) {
  const { d } = useI18n();
  const coach = getCoach(useApp((s) => s.data?.onboarding.coachId));
  const [phase, setPhase] = useState<'intro' | 'breathe' | 'end'>(autoStart ? 'breathe' : 'intro');
  const [round, setRound] = useState(0);
  const phrase = useMemo(() => d.sos.phrases[Math.floor(Math.random() * d.sos.phrases.length)], [d, round]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col animate-rise">
      {phase === 'intro' && (
        <>
          <CoachBubble coach={coach} message={phrase} />
          <p className="mt-4 text-muted">{d.sos.intro}</p>
          <div className="flex-1" />
          <Button full onClick={() => setPhase('breathe')}>
            <Wind size={20} /> {d.sos.start}
          </Button>
        </>
      )}
      {phase === 'breathe' && (
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-2 text-center font-semibold">{phrase}</p>
          <BreathingGuide key={round} cycles={SOS_CYCLES} haptic onDone={() => setPhase('end')} />
        </div>
      )}
      {phase === 'end' && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="grid size-20 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
              <Wind size={36} />
            </span>
            <h2 className="mt-5 text-3xl font-semibold">{d.sos.endTitle}</h2>
            <p className="mt-2 text-lg">{d.sos.end}</p>
          </div>
          <div className="grid gap-3">
            <Button full onClick={onDone}>
              {d.sos.done}
            </Button>
            <Button
              full
              variant="secondary"
              onClick={() => {
                setRound((r) => r + 1);
                setPhase('breathe');
              }}
            >
              {d.sos.again}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** Bouton « SOS trac » à placer juste avant une prise de parole : ouvre la séance par-dessus l'écran. */
export function SosButton({ className = '' }: { className?: string }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full bg-sage/25 px-3 py-1.5 text-sm font-bold text-[#3F7350] transition active:scale-95 dark:text-sage ${className}`}
      >
        <Wind size={16} /> {d.sos.button}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={d.sos.button} className="fixed inset-0 z-50 overflow-y-auto bg-bg">
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">{d.sos.button}</h1>
              <button type="button" onClick={() => setOpen(false)} className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft" aria-label={d.common.close}>
                <X size={24} />
              </button>
            </div>
            <SosSession autoStart onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
