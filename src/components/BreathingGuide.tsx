import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

const PHASES = [
  { key: 'inhale', seconds: 4, scale: 1 },
  { key: 'hold', seconds: 4, scale: 1 },
  { key: 'exhale', seconds: 6, scale: 0.55 },
] as const;

/** Respiration guidée : inspirer 4 s, bloquer 4 s, expirer 6 s, sur plusieurs cycles. */
export function BreathingGuide({ cycles = 3, onDone, haptic = false }: { cycles?: number; onDone(): void; haptic?: boolean }) {
  const { d, f } = useI18n();
  const [step, setStep] = useState(0);
  const cycle = Math.floor(step / PHASES.length);
  const phase = PHASES[step % PHASES.length];

  useEffect(() => {
    if (cycle >= cycles) {
      onDone();
      return;
    }
    // Une petite vibration à chaque changement : on peut suivre les yeux fermés.
    if (haptic) {
      try {
        navigator.vibrate?.(phase.key === 'exhale' ? [40, 80, 40] : 40);
      } catch {
        /* vibration non disponible */
      }
    }
    const timer = window.setTimeout(() => setStep((s) => s + 1), phase.seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [step, cycle, cycles, phase.seconds, phase.key, onDone, haptic]);

  if (cycle >= cycles) return null;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-extrabold uppercase tracking-wider text-muted">{d.lesson.breathing.title}</p>
      <div className="relative my-8 grid size-56 place-items-center">
        <div className="absolute inset-0 rounded-full bg-sage/15" />
        <div
          className="absolute inset-0 rounded-full bg-sage/40"
          style={{ transform: `scale(${phase.scale})`, transition: `transform ${phase.seconds}s ease-in-out` }}
        />
        <p className="relative font-display text-3xl font-semibold" aria-live="polite">
          {d.lesson.breathing[phase.key]}
        </p>
      </div>
      <p className="text-sm text-muted">{f(d.lesson.breathing.cycle, { n: cycle + 1, total: cycles })}</p>
      <button type="button" onClick={onDone} className="mt-4 text-sm font-bold text-primary">
        {d.lesson.breathing.skip}
      </button>
    </div>
  );
}
