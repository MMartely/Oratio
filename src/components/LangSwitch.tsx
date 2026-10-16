import { useApp } from '../store/useApp';
import type { Lang } from '../types';

export function LangSwitch() {
  const lang = useApp((s) => s.settings.lang);
  const setLang = useApp((s) => s.setLang);
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1 text-sm font-bold" role="group" aria-label="Langue / Language">
      {(['fr', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1.5 uppercase transition ${lang === l ? 'bg-primary text-primary-ink' : 'text-muted'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
