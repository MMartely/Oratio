import type { UserData } from '../types';

export const badgeIds = ['first', 'streak7', 'noFiller', 'impro', 'interview', 'path'] as const;
export type BadgeId = (typeof badgeIds)[number];

export function unlockedBadges(data: UserData): Set<BadgeId> {
  const unlocked = new Set<BadgeId>();
  if (data.sessions.length > 0) unlocked.add('first');
  if (data.progress.bestStreak >= 7) unlocked.add('streak7');
  if (data.sessions.some((s) => s.metrics.fillers === 0 && s.activeDuration >= 45)) unlocked.add('noFiller');
  if (data.progress.currentDay > 30) unlocked.add('path');
  return unlocked;
}
