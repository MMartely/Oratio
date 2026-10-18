import { normalize } from '../../analysis/fillers';
import type { Metrics } from '../../analysis/metrics';
import { demoChecklist } from '../../analysis/scenarios';
import type { AcousticSummary } from '../../audio/voiceAnalyzer';
import type { Lang } from '../../types';
import type { KeywordGroup, Objective } from './program';

export interface LessonScore {
  /** 0 : trop court pour compter ; 1 : exercice fait ; 2 : objectif atteint ; 3 : objectif dépassé. */
  stars: 0 | 1 | 2 | 3;
  /** Valeur mesurée pour l'objectif (nombre de pauses, débit, durée…), ou null si elle n'a pas pu l'être. */
  value: number | null;
  /** Pour la structure : éléments trouvés sur le total. */
  total?: number;
}

const KEYWORDS: Record<Lang, Record<KeywordGroup, string[]>> = {
  fr: {
    hook: ['imaginez', 'imagine', 'saviez vous', 'savez vous', 'est ce que', 'combien', 'pourquoi', 'et si', 'vous êtes vous déjà'],
    conclusion: ['pour conclure', 'en conclusion', 'pour finir', 'en résumé', 'retenez', 'souvenez vous'],
    story: ['je me souviens', 'un jour', 'il était une fois', 'la première fois', 'quand j étais', 'il y a'],
    analogy: ['c est comme', 'comme un', 'comme une', 'imaginez', 'par exemple', 'pareil que'],
    persuade: ['parce que', 'je vous propose', 'essayez', 'imaginez', 'vous voulez', 'ensemble'],
    future: ['mon objectif', 'je vais', 'prochain', 'prochaine', 'je veux', 'dans deux'],
  },
  en: {
    hook: ['imagine', 'did you know', 'do you know', 'have you ever', 'what if', 'how many', 'why'],
    conclusion: ['to conclude', 'in conclusion', 'to sum up', 'remember', 'finally'],
    story: ['i remember', 'one day', 'once upon', 'the first time', 'when i was', 'years ago'],
    analogy: ['it s like', 'like a', 'imagine', 'for example', 'just like'],
    persuade: ['because', 'i suggest', 'try', 'imagine', 'you want', 'together'],
    future: ['my goal', 'i will', 'i m going to', 'next', 'i want'],
  },
};

/** Marqueurs trouvés : dans les 25 premiers mots pour une accroche, partout ailleurs. */
export function keywordHits(group: KeywordGroup, text: string, lang: Lang) {
  const words = normalize(text).map((w) => w.replace(/'/g, ' '));
  const scope = ` ${(group === 'hook' ? words.slice(0, 25) : words).join(' ')} `;
  return KEYWORDS[lang][group].filter((k) => scope.includes(` ${k} `)).length;
}

/** Étoiles d'un exercice : 1 pour l'avoir fait, 2 si l'objectif est atteint, 3 s'il est dépassé. */
export function scoreLesson(objective: Objective, acoustic: AcousticSummary, metrics: Metrics, text: string | null, lang: Lang): LessonScore {
  if (acoustic.speakingTime < 4 && metrics.words < 5) return { stars: 0, value: null };
  const star = (two: boolean, three: boolean): 1 | 2 | 3 => (two ? (three ? 3 : 2) : 1);
  switch (objective.kind) {
    case 'speak': {
      const s = Math.round(acoustic.speakingTime);
      return { stars: star(s >= objective.seconds, s >= objective.seconds && metrics.fillersPerMin <= 3), value: s };
    }
    case 'pauses':
      return { stars: star(metrics.pauses >= objective.min, metrics.pauses >= objective.min + 2), value: metrics.pauses };
    case 'fillers':
      return { stars: star(metrics.fillers <= objective.max, metrics.fillers <= Math.floor(objective.max / 2)), value: metrics.fillers };
    case 'pace': {
      const w = metrics.wpm;
      const ok = w !== null && w >= objective.min && w <= objective.max;
      return { stars: star(ok, ok && metrics.fillersPerMin <= 2), value: w };
    }
    case 'intonation': {
      const v = metrics.pitchVarSt;
      return { stars: v === null ? 1 : star(v >= objective.min, v >= objective.min + 0.8), value: v === null ? null : Math.round(v * 10) / 10 };
    }
    case 'volume': {
      const db = metrics.volumeDb;
      return { stars: db === null ? 1 : star(db >= objective.min, db >= objective.min + 5), value: db === null ? null : Math.round(db) };
    }
    case 'duration': {
      const a = acoustic.activeDuration;
      const gap = Math.abs(a - objective.target) / objective.target;
      return { stars: star(gap <= 0.25, gap <= 0.12), value: Math.round(a) };
    }
    case 'structure': {
      if (!text) return { stars: 1, value: null, total: objective.keys.length };
      const found = demoChecklist('talk', text, {}, lang);
      const done = objective.keys.filter((k) => found[k]).length;
      return { stars: star(done >= Math.ceil(objective.keys.length / 2), done === objective.keys.length), value: done, total: objective.keys.length };
    }
    case 'keywords': {
      if (!text) return { stars: 1, value: null };
      const hits = keywordHits(objective.group, text, lang);
      const need = objective.group === 'persuade' ? 2 : 1;
      return { stars: star(hits >= need, hits >= need + 1 || (hits >= need && metrics.fillersPerMin <= 3)), value: hits };
    }
  }
}
