import type { ReactNode, RefObject } from 'react';
import { X } from 'lucide-react';
import type { Coach } from '../data/coaches';
import type { LiveState, Signal } from '../audio/useLiveRecorder';
import { useI18n } from '../i18n';
import { CoachAvatar } from './CoachAvatar';

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Barre du haut de l'écran d'écoute : bouton d'annulation et minuteur. */
export function LiveTopBar({ elapsed, target, onCancel, children }: { elapsed: number; target: number; onCancel(): void; children?: ReactNode }) {
  const { d } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onCancel}
        className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
        aria-label={d.analysis.cancel}
      >
        <X size={24} />
      </button>
      <p className="font-display text-2xl font-semibold tabular-nums" aria-live="off">
        {formatTime(elapsed)}
        {target > 0 && <span className="text-base text-muted"> / {formatTime(target)}</span>}
      </p>
      <span className="flex size-11 items-center justify-end">{children}</span>
    </div>
  );
}

/** Signal discret en direct (« euh », trop vite, trop bas). */
export function SignalPill({ signal }: { signal: Signal | null }) {
  return (
    <div className="relative h-10">
      {signal && (
        <p
          key={signal.id}
          role="status"
          className="absolute inset-x-0 mx-auto w-fit animate-rise rounded-full bg-peach/30 px-4 py-2 text-sm font-bold text-[#9A4B2E] dark:text-peach"
        >
          {signal.text}
        </p>
      )}
    </div>
  );
}

/** Cercle qui respire avec la voix, avec le coach au centre et l'avancée du temps autour. */
export function ListeningOrb({
  orbRef,
  coach,
  ratio,
  center,
}: {
  orbRef: RefObject<HTMLDivElement>;
  coach: Coach;
  ratio: number | null;
  center?: ReactNode;
}) {
  const r = 118;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-64 place-items-center">
      <svg viewBox="0 0 256 256" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="128" cy="128" r={r} fill="none" strokeWidth="6" className="stroke-soft" />
        {ratio !== null && (
          <circle
            cx="128"
            cy="128"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-primary transition-all duration-300"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ratio)}
          />
        )}
      </svg>
      <div ref={orbRef} className="absolute size-48 rounded-full bg-primary/20 transition-transform duration-100" />
      <div className="absolute size-36 rounded-full bg-primary/25" />
      {center ?? <CoachAvatar coach={coach} size={96} className="relative" />}
    </div>
  );
}

/** Compteurs en direct : tics, débit, pauses. */
export function LiveStats({ state }: { state: LiveState }) {
  const { d } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { value: state.fillerCount, label: d.analysis.live.fillers },
        { value: state.wpm ?? '—', label: d.analysis.live.wpm },
        { value: state.pauses, label: d.analysis.live.pauses },
      ].map((x) => (
        <div key={x.label} className="rounded-2xl bg-surface py-2 shadow-soft">
          <p className="font-display text-xl font-semibold tabular-nums">{x.value}</p>
          <p className="text-xs font-bold text-muted">{x.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Transcription en direct (les derniers mots). */
export function LiveTranscript({ state, canTranscribe, className = '' }: { state: LiveState; canTranscribe: boolean; className?: string }) {
  const { d } = useI18n();
  const shown = `${state.finalText} ${state.interim}`.trim();
  return (
    <div className={`h-24 overflow-hidden rounded-2xl bg-soft px-4 py-3 text-sm leading-relaxed ${className}`}>
      {canTranscribe ? (
        shown ? (
          <p className="line-clamp-4">
            {state.finalText.slice(-220)} <span className="text-muted">{state.interim}</span>
          </p>
        ) : (
          <p className="text-muted">{d.analysis.speakNow}</p>
        )
      ) : (
        <p className="text-muted">{d.analysis.noSpeech}</p>
      )}
    </div>
  );
}

/** Écran d'attente pendant que le coach analyse. */
export function CoachThinking({ coach, text, progress }: { coach: Coach; text: string; progress?: { label: string; value: number } }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="relative grid size-48 place-items-center">
        <div className="absolute inset-0 animate-breathe rounded-full bg-primary/15" />
        <CoachAvatar coach={coach} size={104} />
      </div>
      <p className="mt-8 max-w-xs font-display text-2xl font-semibold">{text}</p>
      {progress && progress.value > 0 && progress.value < 1 && (
        <div className="mt-6 w-full max-w-xs">
          <p className="mb-2 text-sm text-muted">{progress.label}</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.value * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
