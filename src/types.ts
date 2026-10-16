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
}

/** Tout ce qui est synchronisé avec le compte de l'utilisateur. */
export interface UserData {
  onboarding: Onboarding;
  progress: Progress;
  plan: Plan;
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'weak_password'
  | 'missing_name'
  | 'email_taken'
  | 'invalid_credentials'
  | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}
