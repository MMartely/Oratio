import type { InputHTMLAttributes } from 'react';

export function TextField({ label, hint, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; id: string }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <input
        id={id}
        {...props}
        className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-ink outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Rangée de choix exclusifs (boutons). */
export function ChoiceRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(v: T): void;
}) {
  return (
    <section>
      <h2 className="mb-2 font-sans text-sm font-extrabold uppercase tracking-wider text-muted">{label}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-11 flex-1 rounded-2xl border-2 px-3 text-sm font-bold transition ${value === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-line bg-surface'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
