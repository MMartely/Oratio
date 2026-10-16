import type { Dict } from '../i18n';

/** Retrouve la semaine et le titre d'un jour (1 à 30) du parcours. */
export function locateDay(d: Dict, day: number) {
  let remaining = day;
  for (let w = 0; w < d.path.weeks.length; w++) {
    const week = d.path.weeks[w];
    if (remaining <= week.days.length) return { week: w + 1, title: week.days[remaining - 1] };
    remaining -= week.days.length;
  }
  return { week: d.path.weeks.length, title: '' };
}

export const lessonTitle = (d: Dict, day: number) => locateDay(d, day).title;
