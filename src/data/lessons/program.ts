// Programme des 30 leçons : objectif mesurable et déroulé de l'exercice, indépendants de la langue.
// Les textes (explications, quiz, démonstrations) sont dans fr.ts et en.ts.

export type KeywordGroup = 'hook' | 'conclusion' | 'story' | 'analogy' | 'persuade' | 'future';

export type Objective =
  /** Parler au moins `seconds` secondes. */
  | { kind: 'speak'; seconds: number }
  /** Faire au moins `min` pauses d'une demi-seconde ou plus. */
  | { kind: 'pauses'; min: number }
  /** Pas plus de `max` mots parasites et hésitations. */
  | { kind: 'fillers'; max: number }
  /** Débit entre `min` et `max` mots par minute. */
  | { kind: 'pace'; min: number; max: number }
  /** Variation de la hauteur de voix d'au moins `min` demi-tons. */
  | { kind: 'intonation'; min: number }
  /** Volume moyen d'au moins `min` dBFS. */
  | { kind: 'volume'; min: number }
  /** Durée de parole proche de `target` secondes. */
  | { kind: 'duration'; target: number }
  /** Éléments de structure d'un exposé (introduction, plan, exemples, conclusion). */
  | { kind: 'structure'; keys: ('intro' | 'plan' | 'examples' | 'conclusion')[] }
  /** Présence d'un procédé : accroche, conclusion, histoire, image, persuasion, projection. */
  | { kind: 'keywords'; group: KeywordGroup };

export interface LessonPlan {
  day: number;
  objective: Objective;
  /** Durée maximale de l'enregistrement, en secondes. */
  seconds: number;
  /** Exercice de respiration guidé avant de parler. */
  breathing?: boolean;
  /** Le coach pose une question à voix haute avant l'exercice. */
  asked?: boolean;
  /** Un sujet surprise est tiré au moment de l'exercice. */
  randomTopic?: boolean;
  /** Un texte est affiché pour être lu à voix haute. */
  reading?: boolean;
}

export const PROGRAM: LessonPlan[] = [
  // Semaine 1 — Apprivoiser le trac
  { day: 1, objective: { kind: 'speak', seconds: 10 }, seconds: 45, breathing: true },
  { day: 2, objective: { kind: 'duration', target: 30 }, seconds: 60 },
  { day: 3, objective: { kind: 'pauses', min: 3 }, seconds: 60 },
  { day: 4, objective: { kind: 'volume', min: -38 }, seconds: 45 },
  { day: 5, objective: { kind: 'speak', seconds: 45 }, seconds: 75 },
  { day: 6, objective: { kind: 'intonation', min: 1.8 }, seconds: 60 },
  { day: 7, objective: { kind: 'duration', target: 60 }, seconds: 90 },
  // Semaine 2 — Trouver ta voix
  { day: 8, objective: { kind: 'pace', min: 100, max: 150 }, seconds: 60, reading: true },
  { day: 9, objective: { kind: 'fillers', max: 2 }, seconds: 60 },
  { day: 10, objective: { kind: 'pace', min: 120, max: 165 }, seconds: 60 },
  { day: 11, objective: { kind: 'intonation', min: 2.2 }, seconds: 60, reading: true },
  { day: 12, objective: { kind: 'volume', min: -32 }, seconds: 45 },
  { day: 13, objective: { kind: 'pauses', min: 4 }, seconds: 75 },
  { day: 14, objective: { kind: 'pace', min: 120, max: 165 }, seconds: 90, reading: true },
  // Semaine 3 — Structurer ton message
  { day: 15, objective: { kind: 'duration', target: 30 }, seconds: 60 },
  { day: 16, objective: { kind: 'structure', keys: ['intro', 'plan', 'conclusion'] }, seconds: 120 },
  { day: 17, objective: { kind: 'keywords', group: 'hook' }, seconds: 60 },
  { day: 18, objective: { kind: 'keywords', group: 'conclusion' }, seconds: 60 },
  { day: 19, objective: { kind: 'keywords', group: 'story' }, seconds: 90 },
  { day: 20, objective: { kind: 'keywords', group: 'analogy' }, seconds: 75 },
  { day: 21, objective: { kind: 'structure', keys: ['intro', 'plan', 'examples', 'conclusion'] }, seconds: 150 },
  // Semaine 4 — Captiver ton public
  { day: 22, objective: { kind: 'speak', seconds: 45 }, seconds: 75 },
  { day: 23, objective: { kind: 'intonation', min: 2 }, seconds: 75 },
  { day: 24, objective: { kind: 'fillers', max: 3 }, seconds: 90, asked: true },
  { day: 25, objective: { kind: 'speak', seconds: 60 }, seconds: 90, randomTopic: true },
  { day: 26, objective: { kind: 'keywords', group: 'persuade' }, seconds: 90 },
  { day: 27, objective: { kind: 'pauses', min: 3 }, seconds: 90 },
  { day: 28, objective: { kind: 'structure', keys: ['intro', 'plan', 'examples', 'conclusion'] }, seconds: 180 },
  { day: 29, objective: { kind: 'speak', seconds: 60 }, seconds: 90 },
  { day: 30, objective: { kind: 'keywords', group: 'future' }, seconds: 90 },
];

export const TOTAL_DAYS = PROGRAM.length;
export const planFor = (day: number) => PROGRAM[Math.max(0, Math.min(TOTAL_DAYS - 1, day - 1))];
