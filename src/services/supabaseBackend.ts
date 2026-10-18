import { AuthError as SupabaseAuthError, type SupabaseClient, type User } from '@supabase/supabase-js';
import { AuthError, type AuthErrorCode, type Plan, type Profile, type UserData } from '../types';
import type { Backend } from './backend';
import { appUrl } from './supabase';

const SESSION_LIMIT = 50;
const SAVE_DELAY = 800;

function toProfile(user: User): Profile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: String(meta.name || meta.full_name || user.email?.split('@')[0] || ''),
    email: user.email ?? '',
    provider: user.app_metadata?.provider === 'google' ? 'google' : 'password',
    createdAt: user.created_at,
  };
}

/** Traduit les erreurs de Supabase Auth en codes affichables. */
export function authErrorCode(error: unknown): AuthErrorCode {
  const code = error instanceof SupabaseAuthError ? error.code : undefined;
  switch (code) {
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'email_taken';
    case 'weak_password':
      return 'weak_password';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'invalid_email';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate_limited';
    default:
      return 'unknown';
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createSupabaseBackend(sb: SupabaseClient): Backend {
  // Séances déjà enregistrées côté serveur, pour n'insérer que les nouvelles.
  const saved = new Set<string>();
  let pending: { userId: string; data: UserData } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flushProfile = async () => {
    if (!pending) return;
    const { userId, data } = pending;
    pending = null;
    // La formule (plan) n'est jamais écrite par l'application : seule `data` l'est.
    await sb
      .from('profiles')
      .update({ data: { onboarding: data.onboarding, progress: data.progress }, updated_at: new Date().toISOString() })
      .eq('id', userId);
  };

  const fail = (error: unknown): never => {
    throw new AuthError(authErrorCode(error));
  };

  return {
    mode: 'cloud',

    async signUp(name, email, password) {
      if (!name.trim()) throw new AuthError('missing_name');
      if (!EMAIL_RE.test(email.trim())) throw new AuthError('invalid_email');
      if (password.length < 8) throw new AuthError('weak_password');
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: appUrl() },
      });
      if (error) fail(error);
      // Adresse à confirmer : pas encore de session.
      if (!data.session || !data.user) throw new AuthError('confirm_email');
      return toProfile(data.user);
    },

    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) fail(error);
      return toProfile(data.user!);
    },

    async signInWithGoogle() {
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } });
      if (error) fail(error);
      return null; // la page part chez Google puis revient avec ?code=…
    },

    async signOut() {
      await flushProfile();
      saved.clear();
      await sb.auth.signOut();
    },

    async currentProfile() {
      const { data } = await sb.auth.getSession();
      if (new URLSearchParams(window.location.search).has('code')) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
      }
      return data.session?.user ? toProfile(data.session.user) : null;
    },

    async loadUserData(userId) {
      const [profile, sessions] = await Promise.all([
        sb.from('profiles').select('plan, data').eq('id', userId).maybeSingle(),
        sb.from('sessions').select('result').eq('user_id', userId).order('created_at', { ascending: false }).limit(SESSION_LIMIT),
      ]);
      if (profile.error || !profile.data) return null;
      const rows = (sessions.data ?? []).map((r) => r.result as UserData['sessions'][number]);
      rows.forEach((r) => saved.add(r.id));
      const stored = (profile.data.data ?? {}) as Partial<Pick<UserData, 'onboarding' | 'progress'>>;
      return { ...stored, plan: profile.data.plan as Plan, sessions: rows };
    },

    async saveUserData(userId, data) {
      const fresh = data.sessions.filter((s) => !saved.has(s.id));
      fresh.forEach((s) => saved.add(s.id));
      if (fresh.length) {
        const { error } = await sb.from('sessions').insert(
          fresh.map((s) => ({ id: s.id, user_id: userId, created_at: s.createdAt, score: s.scores.global, result: s })),
        );
        if (error) fresh.forEach((s) => saved.delete(s.id));
      }
      pending = { userId, data };
      clearTimeout(timer);
      timer = setTimeout(() => void flushProfile(), SAVE_DELAY);
    },

    async saveRecording(userId, sessionId, blob) {
      await sb.storage.from('recordings').upload(`${userId}/${sessionId}`, blob, { contentType: blob.type || 'audio/webm', upsert: true });
    },

    async recordingUrl(userId, sessionId) {
      const { data } = await sb.storage.from('recordings').createSignedUrl(`${userId}/${sessionId}`, 3600);
      return data?.signedUrl ?? null;
    },
  };
}
