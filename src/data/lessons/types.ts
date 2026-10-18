export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index de la bonne réponse. */
  answer: number;
  /** Explication affichée après la réponse. */
  why: string;
}

/** Textes d'une leçon dans une langue. */
export interface LessonContent {
  intro: string;
  points: string[];
  quiz: QuizQuestion[];
  /** Démonstration lue à voix haute, phrase par phrase, avec un temps de pause entre chaque. */
  demo: string[];
  demoNote: string;
  prompt: string;
  /** Texte à lire pendant l'exercice (leçons de lecture). */
  read?: string;
  /** Question posée à voix haute par le coach avant l'exercice. */
  question?: string;
}
