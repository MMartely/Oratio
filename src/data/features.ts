import type { ScenarioId } from '../types';
import { Briefcase, Mic, Presentation, Rocket, ScrollText, Shuffle, Users, Wind, PartyPopper, type LucideIcon } from 'lucide-react';

export type FeatureId = 'analysis' | 'scenarios' | 'impro' | 'breathing' | 'teleprompter';

/** Classes de couleur par fonctionnalité (fond doux + icône). */
export const features: { id: FeatureId; icon: LucideIcon; tone: string }[] = [
  { id: 'analysis', icon: Mic, tone: 'bg-primary/15 text-primary' },
  { id: 'scenarios', icon: Users, tone: 'bg-peach/25 text-[#B5603F] dark:text-peach' },
  { id: 'impro', icon: Shuffle, tone: 'bg-sun/30 text-[#9A6B12] dark:text-sun' },
  { id: 'breathing', icon: Wind, tone: 'bg-sage/25 text-[#3F7350] dark:text-sage' },
  { id: 'teleprompter', icon: ScrollText, tone: 'bg-sky/30 text-[#336C99] dark:text-sky' },
];

export const scenarios: { id: ScenarioId; icon: LucideIcon; premium: boolean }[] = [
  { id: 'interview', icon: Briefcase, premium: false },
  { id: 'talk', icon: Presentation, premium: false },
  { id: 'pitch', icon: Rocket, premium: true },
  { id: 'event', icon: PartyPopper, premium: true },
];

/** Jours du parcours accessibles en formule gratuite. */
export const FREE_PATH_DAYS = 7;

/** Analyses IA par jour en formule gratuite. */
export const FREE_AI_PER_DAY = 3;

/** Écran de chaque fonctionnalité ; celles pas encore construites mènent à « En construction ». */
export const featureRoute = (id: FeatureId) => (id === 'analysis' ? '/analysis' : id === 'scenarios' ? '/practice' : `/soon/${id}`);

export type { ScenarioId };
