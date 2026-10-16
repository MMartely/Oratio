import type { Profile, UserData } from '../types';
import { demoBackend } from './demoBackend';

/**
 * Tout accès aux comptes et aux données passe par cette interface.
 * Aujourd'hui : implémentation démo (stockage local). Plus tard : Supabase,
 * sans toucher aux écrans.
 */
export interface Backend {
  readonly mode: 'demo' | 'cloud';
  signUp(name: string, email: string, password: string): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signInWithGoogle(fallbackName: string): Promise<Profile>;
  signOut(): Promise<void>;
  loadUserData(userId: string): Promise<UserData | null>;
  saveUserData(userId: string, data: UserData): Promise<void>;
}

export const backend: Backend = demoBackend;
