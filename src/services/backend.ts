import type { Profile, UserData } from '../types';
import { demoBackend } from './demoBackend';
import { supabase } from './supabase';
import { createSupabaseBackend } from './supabaseBackend';

/**
 * Tout accès aux comptes et aux données passe par cette interface.
 * Aujourd'hui : implémentation démo (stockage local). Plus tard : Supabase,
 * sans toucher aux écrans.
 */
export interface Backend {
  readonly mode: 'demo' | 'cloud';
  /** Lève AuthError('confirm_email') quand l'adresse doit d'abord être confirmée. */
  signUp(name: string, email: string, password: string): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  /** Renvoie null quand la page part chez Google (le retour ouvre la session). */
  signInWithGoogle(fallbackName: string): Promise<Profile | null>;
  signOut(): Promise<void>;
  /** Session déjà ouverte au chargement (retour de Google, lien de confirmation). */
  currentProfile(): Promise<Profile | null>;
  /** Données du compte ; les champs absents sont complétés par l'application. */
  loadUserData(userId: string): Promise<Partial<UserData> | null>;
  saveUserData(userId: string, data: UserData): Promise<void>;
  /** Enregistrements audio conservés (formule Premium). */
  saveRecording(userId: string, sessionId: string, blob: Blob): Promise<void>;
  recordingUrl(userId: string, sessionId: string): Promise<string | null>;
}

export const backend: Backend = supabase ? createSupabaseBackend(supabase) : demoBackend;
