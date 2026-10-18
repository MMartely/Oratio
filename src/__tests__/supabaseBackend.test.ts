import { describe, expect, it, vi } from 'vitest';
import { AuthApiError, type SupabaseClient } from '@supabase/supabase-js';
import { authErrorCode, createSupabaseBackend } from '../services/supabaseBackend';
import type { AnalysisResult, UserData } from '../types';

/** Faux client Supabase qui enregistre les écritures. */
function fakeClient(rows: { result: Partial<AnalysisResult> }[] = []) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  const chain = (table: string, result: unknown) => {
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'order', 'limit']) q[m] = () => q;
    q.maybeSingle = async () => result;
    q.then = (resolve: (v: unknown) => void) => resolve(result);
    q.update = (payload: unknown) => {
      calls.push({ table, op: 'update', payload });
      return q;
    };
    q.insert = async (payload: unknown) => {
      calls.push({ table, op: 'insert', payload });
      return { error: null };
    };
    return q;
  };
  const client = {
    from: (table: string) =>
      chain(table, table === 'profiles' ? { data: { plan: 'premium', data: { progress: { xp: 42 } } }, error: null } : { data: rows, error: null }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

const session = (id: string) => ({ id, createdAt: '2026-10-18T10:00:00Z', scores: { global: 70 } }) as AnalysisResult;

describe('authErrorCode', () => {
  it('traduit les codes de Supabase Auth', () => {
    expect(authErrorCode(new AuthApiError('x', 400, 'invalid_credentials'))).toBe('invalid_credentials');
    expect(authErrorCode(new AuthApiError('x', 400, 'email_not_confirmed'))).toBe('email_not_confirmed');
    expect(authErrorCode(new AuthApiError('x', 422, 'user_already_exists'))).toBe('email_taken');
    expect(authErrorCode(new Error('réseau'))).toBe('unknown');
  });
});

describe('createSupabaseBackend', () => {
  it('charge la formule depuis le serveur et complète les données', async () => {
    const { client } = fakeClient([{ result: session('s1') }]);
    const data = await createSupabaseBackend(client).loadUserData('u1');
    expect(data?.plan).toBe('premium');
    expect(data?.progress).toEqual({ xp: 42 });
    expect(data?.sessions?.map((s) => s.id)).toEqual(['s1']);
  });

  it('n’insère que les nouvelles séances et n’écrit jamais la formule', async () => {
    vi.useFakeTimers();
    const { client, calls } = fakeClient([{ result: session('s1') }]);
    const backend = createSupabaseBackend(client);
    await backend.loadUserData('u1');
    const data = { onboarding: {}, progress: { xp: 1 }, plan: 'premium', sessions: [session('s2'), session('s1')] } as unknown as UserData;
    await backend.saveUserData('u1', data);
    await backend.saveUserData('u1', data);
    await vi.runAllTimersAsync();
    const inserts = calls.filter((c) => c.op === 'insert');
    expect(inserts).toHaveLength(1);
    expect((inserts[0].payload as { id: string }[]).map((r) => r.id)).toEqual(['s2']);
    const updates = calls.filter((c) => c.op === 'update');
    expect(updates).toHaveLength(1);
    expect(Object.keys(updates[0].payload as object).sort()).toEqual(['data', 'updated_at']);
    vi.useRealTimers();
  });
});
