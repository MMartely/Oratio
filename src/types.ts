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
  /** Rappel quotidien : heure locale « HH:MM », ou null s'il est désactivé. */
  reminder?: string | null;
  /** Jours du rappel : bit 0 = lundi … bit 6 = dimanche (127 par défaut). */
  reminderDays?: number;
  /** Alerte le soir si la série est en danger (activée par défaut). */
  streakAlert?: boolean;
  /** « Bravo » le lendemain d'une leçon (activé par défaut). */
  bravo?: boolean;
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
  /** Leçons du parcours terminées : meilleur nombre d'étoiles et jour de la dernière réussite. */
  lessons: Record<number, { stars: number; at: string }>;
  /** Jour de la première leçon : une nouvelle leçon se débloque chaque jour à partir de là. */
  pathStart: string | null;
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
  /** Éléments attendus dans la situation (accroche, plan, toast…) : présents ou non. */
  checklist?: Record<string, boolean>;
  /** Note du contenu (structure, clarté, vocabulaire), absente sans transcription. */
  contentScore: number | null;
  summary: string;
  strengths: string[];
  tips: string[];
  rewrite: { before: string; after: string } | null;
}

export type ScenarioId = 'interview' | 'talk' | 'pitch' | 'event';
export type AudienceMode = 'audience' | 'mirror';

/** Ce que l'utilisateur précise avant une situation. */
export interface ScenarioContext {
  role?: string;
  company?: string;
  subject?: string;
  project?: string;
  listeners?: 'investors' | 'jury' | 'clients';
  eventType?: 'wedding' | 'birthday' | 'thanks' | 'toast' | 'other';
  honoree?: string;
  tone?: 'moving' | 'funny' | 'sober';
}

export interface InterviewAnswer {
  question: string;
  /** Vrai pour une question de relance posée après la réponse précédente. */
  followUp: boolean;
  transcript: string | null;
  seconds: number;
  score: number | null;
  feedback: string | null;
}

export interface ScenarioInfo {
  id: ScenarioId;
  context: ScenarioContext;
  targetSeconds: number;
  mode?: AudienceMode;
  /** Attention moyenne du public virtuel, de 0 à 100. */
  attention?: number;
  timing?: 'short' | 'ok' | 'long';
  checklist?: { key: string; done: boolean }[];
  answers?: InterviewAnswer[];
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
  /** Présent quand l'analyse vient d'une situation (entretien, exposé, pitch, discours). */
  scenario?: ScenarioInfo;
}
