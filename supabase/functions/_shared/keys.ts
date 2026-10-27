// Clés du projet Supabase, côté serveur. Les nouveaux projets ont des clés « sb_secret_… » et « sb_publishable_… »
// (variables SUPABASE_SECRET_KEYS et SUPABASE_PUBLISHABLE_KEYS) ; les anciens, des clés service_role et anon.
// On prend les nouvelles si elles existent, sinon les anciennes : les deux fonctionnent.

type Env = (name: string) => string | undefined;

function named(raw: string | undefined): Record<string, unknown> {
  try {
    const value = JSON.parse(raw ?? '');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

const strings = (values: unknown[]) => values.filter((v): v is string => typeof v === 'string' && v.length > 0);

/** Clé d'administration (contourne les règles d'accès) : la clé secrète « default », sinon l'ancienne service_role. */
export function adminKey(env: Env) {
  const secrets = named(env('SUPABASE_SECRET_KEYS'));
  const preferred = typeof secrets.default === 'string' && secrets.default ? secrets.default : strings(Object.values(secrets))[0];
  return preferred ?? env('SUPABASE_SECRET_KEY') ?? env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

/** Clés publiques du projet (publishable et ancienne anon) : celles que l'application et la tâche planifiée envoient. */
export function publicKeys(env: Env) {
  return strings([...Object.values(named(env('SUPABASE_PUBLISHABLE_KEYS'))), env('SUPABASE_PUBLISHABLE_KEY'), env('SUPABASE_ANON_KEY')]);
}

/** Clé présentée par l'appelant : en-tête apikey, ou Authorization: Bearer. */
export const callerKey = (headers: Headers) =>
  headers.get('apikey') ?? headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;

/** Vrai si l'appel porte une clé de ce projet. */
export function fromThisProject(headers: Headers, env: Env) {
  const key = callerKey(headers);
  return Boolean(key) && (publicKeys(env).includes(key!) || key === adminKey(env));
}
