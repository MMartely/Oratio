import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { safeStorage } from './safeStorage';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Client Supabase, ou null tant que le projet n'est pas configuré (mode démo). */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // PKCE : le retour de Google et des liens e-mail passe par ?code=…, compatible avec le routeur à #.
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          storage: safeStorage,
        },
      })
    : null;

/** Adresse de retour après Google ou le lien de confirmation : la page d'accueil de l'application. */
export const appUrl = () => `${window.location.origin}${window.location.pathname}`;
