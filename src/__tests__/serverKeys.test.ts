import { describe, expect, it } from 'vitest';
import { adminKey, callerKey, fromThisProject, publicKeys } from '../../supabase/functions/_shared/keys.ts';

const env = (vars: Record<string, string>) => (name: string) => vars[name];

describe('clés du projet côté serveur', () => {
  it('préfère les nouvelles clés et garde les anciennes en secours', () => {
    expect(adminKey(env({ SUPABASE_SECRET_KEYS: '{"default":"sb_secret_a","other":"sb_secret_b"}', SUPABASE_SERVICE_ROLE_KEY: 'eyJold' }))).toBe('sb_secret_a');
    expect(adminKey(env({ SUPABASE_SECRET_KEYS: '{"automations":"sb_secret_b"}' }))).toBe('sb_secret_b');
    expect(adminKey(env({ SUPABASE_SECRET_KEYS: 'pas du json', SUPABASE_SERVICE_ROLE_KEY: 'eyJold' }))).toBe('eyJold');
    expect(publicKeys(env({ SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}', SUPABASE_ANON_KEY: 'eyJanon' }))).toEqual(['sb_publishable_x', 'eyJanon']);
  });

  it('reconnaît la clé envoyée par la tâche planifiée, sur l’un ou l’autre en-tête', () => {
    const vars = env({ SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}', SUPABASE_ANON_KEY: 'eyJanon' });
    expect(callerKey(new Headers({ apikey: 'sb_publishable_x' }))).toBe('sb_publishable_x');
    expect(fromThisProject(new Headers({ apikey: 'sb_publishable_x' }), vars)).toBe(true);
    expect(fromThisProject(new Headers({ authorization: 'Bearer eyJanon' }), vars)).toBe(true);
    expect(fromThisProject(new Headers({ apikey: 'sb_publishable_autre' }), vars)).toBe(false);
    expect(fromThisProject(new Headers(), vars)).toBe(false);
  });
});
