import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink shadow-soft hover:brightness-105 active:scale-[.98]',
  secondary: 'bg-surface text-ink border border-line hover:bg-soft active:scale-[.98]',
  ghost: 'text-primary hover:bg-primary/10',
};

export function Button({
  variant = 'primary',
  full,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; full?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-bold transition disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface p-5 shadow-soft ${className}`}>{children}</div>;
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-soft ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Option sélectionnable de l'onboarding. */
export function ChoiceCard({
  selected,
  onClick,
  icon,
  label,
  hint,
}: {
  selected: boolean;
  onClick(): void;
  icon?: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[.99] ${
        selected ? 'border-primary bg-primary/10' : 'border-line bg-surface hover:border-primary/40'
      }`}
    >
      {icon && (
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? 'bg-primary text-primary-ink' : 'bg-soft text-primary'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </button>
  );
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
}

export function BackButton({ to, label }: { to?: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
      aria-label={label}
    >
      <ChevronLeft size={24} />
    </button>
  );
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${className}`}>{children}</span>
  );
}
