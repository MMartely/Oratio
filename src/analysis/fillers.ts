import type { Lang } from '../types';

export interface Token {
  w: string;
  /** Mot parasite. */
  f?: 1;
  /** Répétition immédiate (« je je »). */
  r?: 1;
}

export interface FillerReport {
  tokens: Token[];
  words: number;
  /** Mots parasites lexicaux, hésitations vocales (« euh ») comprises. */
  total: number;
  /** Dont les sons d'hésitation transcrits (« euh », « um »). */
  vocal: number;
  breakdown: { label: string; count: number }[];
  repetitions: number;
  overused: { word: string; count: number }[];
}

const VOCAL: Record<Lang, string[]> = {
  fr: ['euh', 'heu', 'euhm', 'hum', 'hmm', 'mmh'],
  en: ['um', 'uh', 'uhm', 'er', 'erm', 'hmm', 'mmh'],
};

const PHRASES: Record<Lang, string[][]> = {
  fr: [['du', 'coup'], ['en', 'fait'], ['tu', 'vois'], ['tu', 'sais'], ['en', 'gros'], ['genre'], ['voilà'], ['voila'], ['bah'], ['ben']],
  en: [['you', 'know'], ['i', 'mean'], ['kind', 'of'], ['sort', 'of'], ['basically'], ['actually'], ['literally'], ['like']],
};

/** Contextes où « like » est un vrai verbe ou une comparaison, pas un tic. */
const LIKE_CONTEXT = new Set([
  'i', 'you', 'we', 'they', 'would', "i'd", "you'd", "we'd", 'to', "don't", "didn't", "doesn't", 'really', 'look',
  'looks', 'looked', 'feel', 'feels', 'felt', 'seem', 'seems', 'sound', 'sounds', 'something', 'anything',
  'nothing', 'more', 'much', 'just', 'not', 'he', 'she', 'it', 'people',
]);

/** Répétitions grammaticales qui ne sont pas des bégaiements (« nous nous levons »). */
const LEGIT_DOUBLES = new Set(['nous', 'vous', 'that', 'had', 'is']);

const STOPWORDS: Record<Lang, Set<string>> = {
  fr: new Set(
    'alors aussi autre avec avoir avait bien c\'est cela cette comme dans depuis donc elle elles encore être fait faire leur leurs mais même moins nous parce peut plus pour pourquoi quand quelque sans sont sous suis tout tous toute très vous votre était j\'ai qu\'il qu\'on ils avons vraiment chose choses'.split(' '),
  ),
  en: new Set(
    'about after also because been before being could does doing from have here into just know like make more most much only other over really some such than that their them then there these they thing things this those very want were what when where which while will with would your'.split(' '),
  ),
};

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeFillers(text: string, lang: Lang): FillerReport {
  const words = normalize(text);
  const tokens: Token[] = words.map((w) => ({ w }));
  const counts = new Map<string, number>();
  const bump = (label: string) => counts.set(label, (counts.get(label) ?? 0) + 1);
  let vocal = 0;

  for (let i = 0; i < words.length; i++) {
    if (VOCAL[lang].includes(words[i])) {
      tokens[i].f = 1;
      vocal++;
      bump(lang === 'fr' ? 'euh' : 'um');
      continue;
    }
    for (const phrase of PHRASES[lang]) {
      if (phrase.every((p, k) => words[i + k] === p)) {
        if (phrase[0] === 'like' && i > 0 && LIKE_CONTEXT.has(words[i - 1])) continue;
        phrase.forEach((_, k) => (tokens[i + k].f = 1));
        bump(phrase.join(' ').replace('voila', 'voilà'));
        i += phrase.length - 1;
        break;
      }
    }
  }

  let repetitions = 0;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1] && !tokens[i].f && !LEGIT_DOUBLES.has(words[i])) {
      tokens[i].r = 1;
      repetitions++;
    }
  }

  const usage = new Map<string, number>();
  for (const w of words) {
    if (w.length >= 4 && !STOPWORDS[lang].has(w)) usage.set(w, (usage.get(w) ?? 0) + 1);
  }
  const overused = [...usage]
    .filter(([, c]) => c >= 3 && c / Math.max(words.length, 1) >= 0.03)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));

  const breakdown = [...counts].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  return {
    tokens,
    words: words.length,
    total: breakdown.reduce((s, b) => s + b.count, 0),
    vocal,
    breakdown,
    repetitions,
    overused,
  };
}

/** Repère les tics dans les nouveaux mots reçus pendant l'enregistrement (signal en direct). */
export function findFillersIn(words: string[], lang: Lang): string[] {
  return analyzeFillers(words.join(' '), lang).breakdown.flatMap((b) => Array(b.count).fill(b.label));
}
