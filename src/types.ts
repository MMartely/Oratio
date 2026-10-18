export type Lang = 'fr' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type GoalId = 'confidence' | 'studies' | 'work' | 'pitch' | 'events';
export type Anxiety = '1' | '2' | '3' | '4';
export type DailyMinutes = '5' | '10' | '15' | '20';
export type CoachId = 'lea' | 'malik' | 'sofia';
export type Plan = 'free' | 'premium';

export interface Profile {
  id: string;
  name: string;
  email: string;
  provider: 'password' | 'google';
  createdAt: string;
}

export interface Onboarding {
  goals: GoalId[];
  anxiety: Anxiety | null;
  dailyMinutes: DailyMinutes;
  coachId: CoachId | null;
  done: boolean;
}

export interface Progress {
  xp: number;
  streak: number;
  bestStreak: number;
  /** Jour local au format AAAA-MM-JJ de la dernière activité. */
  lastActiveDay: string | null;
  /** Jour du parcours de 30 jours à faire (1 à 30). */
  currentDay: number;
  sessions: number;
  minutesToday: number;
  minutesDay: string | null;
  /** Analyses IA utilisées aujourd'hui (limite de la formule gratuite). */
  aiCount: number;
  aiDay: string | null;
}

/** Tout ce qui est synchronisé avec le compte de l'utilisateur. */
export interface UserData {
  onboarding: Onboarding;
  progress: Progress;
  plan: Plan;
  /** Analyses les plus récentes en premier. */
  sessions: AnalysisResult[];
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'weak_password'
  | 'missing_name'
  | 'email_taken'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'confirm_email'
  | 'rate_limited'
  | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

export interface CoachFeedback {
  source: 'demo' | 'claude';
  /** Note du contenu (structure, clarté, vocabulaire), absente sans transcription. */
  contentScore: number | null;
  summary: string;
  strengths: string[];
  tips: string[];
  rewrite: { before: string; after: string } | null;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  source: 'live' | 'upload';
  lang: Lang;
  coachId: CoachId;
  topic: string | null;
  duration: number;
  activeDuration: number;
  transcript: import('./analysis/fillers').Token[] | null;
  breakdown: { label: string; count: number }[];
  overused: { word: string; count: number }[];
  metrics: import('./analysis/metrics').Metrics;
  scores: import('./analysis/metrics').Scores;
  feedback: CoachFeedback;
  /** Quota d'analyses IA du jour atteint (formule gratuite). */
  aiLocked: boolean;
  timeline: number[];
  /** Positions des hésitations, de 0 à 1 sur la durée. */
  hesitationMarks: number[];
  xp: number;
  /** Audio conservé sur le serveur (formule Premium). */
  recorded?: boolean;
}
