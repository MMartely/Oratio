import type { Token } from '../../analysis/fillers';
import type { Metrics } from '../../analysis/metrics';
import type { CoachFeedback, CoachId, Lang } from '../../types';
import { demoFeedback } from './demoCoach';

export interface CoachRequest {
  lang: Lang;
  coachId: CoachId;
  name: string;
  topic: string | null;
  transcript: Token[] | null;
  metrics: Metrics;
  breakdown: { label: string; count: number }[];
  overused: { word: string; count: number }[];
  activeDuration: number;
  /** Note globale calculée sans le contenu, pour adapter le ton du bilan. */
  globalWithoutContent: number;
  /** Quota atteint : pas d'analyse du contenu par l'IA. */
  aiLocked: boolean;
}

/**
 * Le coach qui commente le discours. En mode démo, des règles locales imitent le ton
 * de chaque coach ; une fois le serveur branché, Claude analysera la transcription.
 */
export interface CoachAI {
  readonly mode: 'demo' | 'claude';
  feedback(req: CoachRequest): Promise<CoachFeedback>;
}

export const coachAI: CoachAI = {
  mode: 'demo',
  feedback: async (req) => demoFeedback(req),
};
