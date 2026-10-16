import { useCallback } from 'react';
import { useApp } from '../store/useApp';
import { fr } from './fr';
import { en } from './en';

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

/** Forme du dictionnaire : le français fait référence, l'anglais doit avoir les mêmes clés. */
export type Dict = Widen<typeof fr>;

const dicts: Record<'fr' | 'en', Dict> = { fr, en };

export function fmt(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function useI18n() {
  const lang = useApp((s) => s.settings.lang);
  const d = dicts[lang];
  const f = useCallback(fmt, []);
  return { d, f, lang };
}
