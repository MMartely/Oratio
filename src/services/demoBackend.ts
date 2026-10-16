import { AuthError, type Profile, type UserData } from '../types';
import { readJSON, writeJSON } from './safeStorage';
import type { Backend } from './backend';

const ACCOUNTS_KEY = 'oratio.demo.accounts';
const dataKey = (id: string) => `oratio.demo.data.${id}`;

interface DemoAccount {
  profile: Profile;
  passwordHash: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hash(text: string): Promise<string> {
  try {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `plain:${text}`;
  }
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

const accounts = () => readJSON<Record<string, DemoAccount>>(ACCOUNTS_KEY, {});

export const demoBackend: Backend = {
  mode: 'demo',

  async signUp(name, email, password) {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) throw new AuthError('missing_name');
    if (!EMAIL_RE.test(cleanEmail)) throw new AuthError('invalid_email');
    if (password.length < 8) throw new AuthError('weak_password');
    const all = accounts();
    if (all[cleanEmail]) throw new AuthError('email_taken');
    const profile: Profile = {
      id: newId(),
      name: name.trim(),
      email: cleanEmail,
      provider: 'password',
      createdAt: new Date().toISOString(),
    };
    all[cleanEmail] = { profile, passwordHash: await hash(password) };
    writeJSON(ACCOUNTS_KEY, all);
    return profile;
  },

  async signIn(email, password) {
    const account = accounts()[email.trim().toLowerCase()];
    if (!account || account.passwordHash !== (await hash(password))) {
      throw new AuthError('invalid_credentials');
    }
    return account.profile;
  },

  // En mode démo, Google est simulé par un compte local unique.
  async signInWithGoogle(fallbackName) {
    const email = 'google-demo@oratio.app';
    const all = accounts();
    if (!all[email]) {
      all[email] = {
        profile: {
          id: newId(),
          name: fallbackName,
          email,
          provider: 'google',
          createdAt: new Date().toISOString(),
        },
        passwordHash: '',
      };
      writeJSON(ACCOUNTS_KEY, all);
    }
    return all[email].profile;
  },

  async signOut() {},

  async loadUserData(userId) {
    return readJSON<UserData | null>(dataKey(userId), null);
  },

  async saveUserData(userId, data) {
    writeJSON(dataKey(userId), data);
  },
};
