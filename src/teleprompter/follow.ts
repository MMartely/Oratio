// Prompteur qui suit la voix : on retrouve dans le texte les derniers mots reconnus pour savoir où en est la lecture.

export interface Script {
  /** Mots tels qu'ils s'affichent, ponctuation comprise. */
  display: string[];
  /** Mêmes mots, sans majuscules, accents ni ponctuation, pour la comparaison. */
  keys: string[];
}

/** Clé de comparaison d'un mot : « L’école, » → « lecole ». */
export const wordKey = (word: string) =>
  word
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

export function prepareScript(text: string): Script {
  const display = text.split(/\s+/).filter((w) => wordKey(w));
  return { display, keys: display.map(wordKey) };
}

/** Mots reconnus (transcription définitive puis provisoire), en clés de comparaison. */
export const heardKeys = (text: string) => text.split(/\s+/).map(wordKey).filter(Boolean);

function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** Deux mots se ressemblent assez : la reconnaissance vocale fait de petites erreurs sur les mots longs. */
export function similar(a: string, b: string) {
  if (a === b) return true;
  const len = Math.min(a.length, b.length);
  if (len < 4) return false;
  return distance(a, b, len >= 8 ? 2 : 1) <= (len >= 8 ? 2 : 1);
}

/** Nombre de mots qui se suivent à l'identique en remontant depuis `index` (texte) et la fin de `tail` (voix). */
function runLength(keys: string[], index: number, tail: string[]) {
  let score = 0;
  for (let k = 0; k < tail.length; k++) {
    const j = index - k;
    if (j < 0 || !similar(keys[j], tail[tail.length - 1 - k])) break;
    score++;
  }
  return score;
}

const NEAR_BEFORE = 3;
const NEAR_AFTER = 14;
const FAR_AFTER = 80;

/**
 * Nouvelle position de lecture (index du prochain mot à lire) d'après les derniers mots entendus.
 * Juste devant la position, deux mots qui se suivent suffisent (un seul s'il est long) ;
 * plus loin (passage sauté), il en faut trois. La position n'avance jamais à reculons.
 */
export function follow(keys: string[], pos: number, heard: string[]): number {
  const tail = heard.slice(-4);
  if (!tail.length || !keys.length) return pos;
  const last = tail[tail.length - 1];
  let best = -1;
  let bestScore = 0;
  const consider = (from: number, to: number, minScore: number) => {
    for (let i = Math.max(0, from); i < Math.min(keys.length, to); i++) {
      const score = runLength(keys, i, tail);
      if (score < minScore) continue;
      if (score > bestScore || (score === bestScore && Math.abs(i - pos) < Math.abs(best - pos))) {
        best = i;
        bestScore = score;
      }
    }
  };
  consider(pos - NEAR_BEFORE, pos + NEAR_AFTER, last.length >= 5 || tail.length === 1 ? 1 : 2);
  if (bestScore < 2) consider(pos + NEAR_AFTER, pos + FAR_AFTER, 3);
  // Un mot isolé ne fait avancer que de quelques mots, pour éviter les sauts sur un mot répété.
  if (best < 0 || (bestScore === 1 && best - pos > 3)) return pos;
  return Math.max(pos, best + 1);
}
