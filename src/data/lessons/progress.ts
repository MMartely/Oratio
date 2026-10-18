import { FREE_PATH_DAYS } from '../features';
import type { Progress, UserData } from '../../types';
import { TOTAL_DAYS } from './program';

export type LessonState = 'done' | 'available' | 'tomorrow' | 'later' | 'premium';

/** Nombre de jours entre deux dates AAAA-MM-JJ. */
export function daysBetween(from: string, to: string) {
  const ms = Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`);
  return Math.round(ms / 86_400_000);
}

/** Une leçon de plus chaque jour depuis la première leçon faite ; les jours manqués se rattrapent. */
export function unlockedUpTo(p: Progress, today: string) {
  return p.pathStart ? Math.max(1, Math.min(TOTAL_DAYS, daysBetween(p.pathStart, today) + 1)) : 1;
}

/** Première leçon pas encore faite (TOTAL_DAYS + 1 quand le parcours est terminé). */
export function nextLessonDay(p: Progress) {
  for (let day = 1; day <= TOTAL_DAYS; day++) if (!p.lessons[day]) return day;
  return TOTAL_DAYS + 1;
}

export function lessonState(day: number, data: UserData, today: string): LessonState {
  const p = data.progress;
  if (p.lessons[day]) return 'done';
  if (day > FREE_PATH_DAYS && data.plan !== 'premium') return 'premium';
  const next = nextLessonDay(p);
  if (day !== next) return 'later';
  const unlocked = unlockedUpTo(p, today);
  if (day <= unlocked) return 'available';
  return day === unlocked + 1 ? 'tomorrow' : 'later';
}

/** Vrai si une leçon a été terminée aujourd'hui. */
export const lessonDoneToday = (p: Progress, today: string) => Object.values(p.lessons).some((l) => l.at === today);
