import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { backend } from '../services/backend';
import { safeStorage } from '../services/safeStorage';
import { FREE_AI_PER_DAY } from '../data/features';
import type { AnalysisResult, Lang, Onboarding, Plan, Profile, Progress, Theme, UserData } from '../types';

export const todayKey = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
};

export const emptyOnboarding = (): Onboarding => ({
  goals: [],
  anxiety: null,
  dailyMinutes: '10',
  coachId: null,
  done: false,
});

const emptyProgress = (): Progress => ({
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  currentDay: 1,
  sessions: 0,
  minutesToday: 0,
  minutesDay: null,
  aiCount: 0,
  aiDay: null,
});

const MAX_SESSIONS = 50;

/** Complète les données enregistrées par une version précédente de l'application. */
export function normalizeData(data: UserData): UserData {
  return { ...data, progress: { ...emptyProgress(), ...data.progress }, sessions: data.sessions ?? [] };
}

/** Analyses IA encore disponibles aujourd'hui (Infinity en Premium). */
export function aiRemaining(data: UserData) {
  if (data.plan === 'premium') return Infinity;
  const used = data.progress.aiDay === todayKey() ? data.progress.aiCount : 0;
  return Math.max(0, FREE_AI_PER_DAY - used);
}

/** La série ne compte que si la dernière activité date d'aujourd'hui ou d'hier. */
export function liveStreak(p: Progress) {
  return p.lastActiveDay === todayKey() || p.lastActiveDay === yesterdayKey() ? p.streak : 0;
}

export function minutesToday(p: Progress) {
  return p.minutesDay === todayKey() ? p.minutesToday : 0;
}

const detectLang = (): Lang => {
  try {
    return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
};

interface AppState {
  settings: { lang: Lang; theme: Theme };
  /** Réponses de l'onboarding, avant que le compte existe. */
  draft: Onboarding;
  session: Profile | null;
  data: UserData | null;

  setLang(lang: Lang): void;
  setTheme(theme: Theme): void;
  updateDraft(patch: Partial<Onboarding>): void;
  updateOnboarding(patch: Partial<Onboarding>): void;
  /** Ouvre la session et charge (ou crée) les données du compte. */
  startSession(profile: Profile): Promise<void>;
  /** Au chargement : reprend la session ouverte côté serveur (retour de Google, lien e-mail). */
  restore(): Promise<void>;
  /** Faux tant que la session n'a pas été vérifiée auprès du serveur. */
  ready: boolean;
  signOut(): Promise<void>;
  /** Enregistre une activité : minutes, XP et mise à jour de la série. */
  recordActivity(minutes: number, xp: number): void;
  /** Sauvegarde une analyse vocale et met à jour la progression. */
  addAnalysis(result: AnalysisResult): void;
  /** Mode démo uniquement : essayer Premium sans paiement. */
  setDemoPlan(plan: Plan): void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const commit = (data: UserData) => {
        set({ data });
        const session = get().session;
        if (session) void backend.saveUserData(session.id, data);
      };

      return {
        settings: { lang: detectLang(), theme: 'system' },
        draft: emptyOnboarding(),
        session: null,
        data: null,
        ready: backend.mode === 'demo',

        setLang: (lang) => set((s) => ({ settings: { ...s.settings, lang } })),
        setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
        updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

        updateOnboarding: (patch) => {
          const data = get().data;
          if (data) commit({ ...data, onboarding: { ...data.onboarding, ...patch } });
        },

        startSession: async (profile) => {
          const stored = await backend.loadUserData(profile.id);
          const draft = get().draft;
          // Un compte neuf reprend les réponses de l'onboarding faites avant l'inscription.
          const data = normalizeData({
            onboarding: stored?.onboarding ?? (draft.done ? draft : { ...draft, coachId: draft.coachId ?? 'lea', done: true }),
            progress: stored?.progress ?? emptyProgress(),
            plan: stored?.plan ?? 'free',
            sessions: stored?.sessions ?? [],
          });
          set({ session: profile, draft: emptyOnboarding() });
          commit(data);
        },

        restore: async () => {
          if (backend.mode === 'demo') return set({ ready: true });
          try {
            const profile = await backend.currentProfile();
            if (!profile) set({ session: null, data: null });
            else await get().startSession(profile);
          } finally {
            set({ ready: true });
          }
        },

        signOut: async () => {
          await backend.signOut();
          set({ session: null, data: null });
        },

        recordActivity: (minutes, xp) => {
          const data = get().data;
          if (!data) return;
          const p = data.progress;
          const today = todayKey();
          let streak = p.streak;
          if (p.lastActiveDay !== today) streak = p.lastActiveDay === yesterdayKey() ? p.streak + 1 : 1;
          commit({
            ...data,
            progress: {
              ...p,
              xp: p.xp + xp,
              streak,
              bestStreak: Math.max(p.bestStreak, streak),
              lastActiveDay: today,
              sessions: p.sessions + 1,
              minutesToday: minutesToday(p) + minutes,
              minutesDay: today,
            },
          });
        },

        setDemoPlan: (plan) => {
          const data = get().data;
          if (data && backend.mode === 'demo') commit({ ...data, plan });
        },

        addAnalysis: (result) => {
          get().recordActivity(Math.max(1, Math.round(result.duration / 60)), result.xp);
          const data = get().data;
          if (!data) return;
          const p = data.progress;
          const today = todayKey();
          commit({
            ...data,
            sessions: [result, ...data.sessions].slice(0, MAX_SESSIONS),
            progress: result.aiLocked
              ? p
              : { ...p, aiCount: (p.aiDay === today ? p.aiCount : 0) + 1, aiDay: today },
          });
        },
      };
    },
    {
      name: 'oratio.app',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ settings: s.settings, draft: s.draft, session: s.session, data: s.data }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>;
        return { ...current, ...p, data: p.data ? normalizeData(p.data) : null };
      },
    },
  ),
);
