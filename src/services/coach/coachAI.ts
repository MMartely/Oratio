import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Token } from '../../analysis/fillers';
import type { Metrics } from '../../analysis/metrics';
import { normalizeReply, type CoachPayload, type ScenarioBrief } from '../../../supabase/functions/_shared/coach.ts';
import type { CoachFeedback, CoachId, Lang } from '../../types';
import { supabase } from '../supabase';
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
  /** Situation jouée (exposé, pitch, discours), pour juger le contenu par rapport à elle. */
  scenario?: ScenarioBrief;
}

export interface CoachResult {
  feedback: CoachFeedback;
  /** Vrai si le serveur a refusé faute d'analyses IA restantes aujourd'hui. */
  aiLocked: boolean;
}

/**
 * Le coach qui commente le discours. En mode démo, des règles locales imitent le ton
 * de chaque coach ; une fois Supabase branché, Claude analyse la transcription côté serveur.
 */
export interface CoachAI {
  readonly mode: 'demo' | 'claude';
  feedback(req: CoachRequest): Promise<CoachResult>;
}

const demoCoach: CoachAI = {
  mode: 'demo',
  feedback: async (req) => ({ feedback: demoFeedback(req), aiLocked: req.aiLocked }),
};

function toPayload(req: CoachRequest): CoachPayload {
  const m = req.metrics;
  return {
    lang: req.lang,
    coachId: req.coachId,
    name: req.name,
    topic: req.topic,
    transcript: (req.transcript ?? []).map((t) => t.w).join(' '),
    activeDuration: req.activeDuration,
    metrics: {
      words: m.words,
      wpm: m.wpm,
      fillers: m.fillers,
      fillersPerMin: m.fillersPerMin,
      repetitions: m.repetitions,
      pauses: m.pauses,
      longPauses: m.longPauses,
      volumeDb: m.volumeDb,
      pitchVarSt: m.pitchVarSt,
    },
    breakdown: req.breakdown,
    overused: req.overused,
    scenario: req.scenario,
  };
}

const claudeCoach = (sb: NonNullable<typeof supabase>): CoachAI => ({
  mode: 'claude',
  async feedback(req) {
    // Sans transcription (fichier importé) ou quota atteint : conseils calculés sur l'appareil.
    if (req.aiLocked || !req.transcript || req.transcript.length < 5) return demoCoach.feedback(req);
    const { data, error } = await sb.functions.invoke('coach', { body: toPayload(req) });
    if (error) {
      const quota = error instanceof FunctionsHttpError && error.context instanceof Response && error.context.status === 402;
      return { feedback: demoFeedback({ ...req, aiLocked: quota }), aiLocked: quota };
    }
    const reply = normalizeReply(data, req.scenario);
    if (!reply) return demoCoach.feedback(req);
    return { feedback: { source: 'claude', ...reply }, aiLocked: false };
  },
});

export const coachAI: CoachAI = supabase ? claudeCoach(supabase) : demoCoach;
