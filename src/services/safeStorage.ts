// Le stockage du navigateur peut être indisponible (navigation privée, aperçu, données bloquées) :
// chaque accès est protégé et l'application continue de fonctionner en mémoire.
const memory = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};

export function readJSON<T>(key: string, fallback: T): T {
  const raw = safeStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  safeStorage.setItem(key, JSON.stringify(value));
}
