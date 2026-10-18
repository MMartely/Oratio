import type { AcousticSummary } from '../audio/voiceAnalyzer';
import { coachAI, type CoachRequest, type CoachResult } from '../services/coach/coachAI';
import type { AnalysisResult, CoachId, Lang } from '../types';
import { newId } from '../utils/id';
import { analyzeFillers } from './fillers';
import { computeMetrics, computeScores } from './metrics';

interface Input {
  acoustic: AcousticSummary;
  /** Transcription complète, ou null si elle n'est pas disponible. */
  text: string | null;
  source: AnalysisResult['source'];
  topic: string | null;
  lang: Lang;
  coachId: CoachId;
  name: string;
  aiLocked: boolean;
  /** Situation jouée : complétée ici par la liste de contrôle du coach. */
  scenario?: AnalysisResult['scenario'];
  /** Coach à utiliser à la place de l'analyse habituelle (bilan d'entretien). */
  coach?: (req: CoachRequest) => Promise<CoachResult>;
}

const TIMELINE_BARS = 80;

function downsample(values: number[], size: number) {
  if (values.length <= size) return values.map((v) => Math.round(v * 100) / 100);
  return Array.from({ length: size }, (_, i) => {
    const from = Math.floor((i * values.length) / size);
    const to = Math.max(from + 1, Math.floor(((i + 1) * values.length) / size));
    return Math.round(Math.max(...values.slice(from, to)) * 100) / 100;
  });
}

/** Assemble mesures, note et retours du coach en un bilan complet. */
export async function buildResult(input: Input): Promise<AnalysisResult> {
  const { acoustic, lang } = input;
  const fillers = input.text ? analyzeFillers(input.text, lang) : null;
  const metrics = computeMetrics(acoustic, fillers, lang);
  const base = computeScores(metrics, acoustic.activeDuration, null);
  const transcript = fillers && fillers.words > 0 ? fillers.tokens : null;
  const scenario = input.scenario;
  const brief =
    scenario && scenario.id !== 'interview'
      ? {
          id: scenario.id,
          context: Object.fromEntries(Object.entries(scenario.context).filter(([, v]) => typeof v === 'string' && v)) as Record<string, string>,
          targetSeconds: scenario.targetSeconds,
        }
      : undefined;
  const { feedback, aiLocked } = await (input.coach ?? coachAI.feedback)({
    lang,
    coachId: input.coachId,
    name: input.name,
    topic: input.topic,
    transcript,
    metrics,
    breakdown: fillers?.breakdown ?? [],
    overused: fillers?.overused ?? [],
    activeDuration: acoustic.activeDuration,
    globalWithoutContent: base.global,
    aiLocked: input.aiLocked,
    scenario: brief,
  });
  const scores = computeScores(metrics, acoustic.activeDuration, feedback.contentScore);
  const minutes = Math.max(1, Math.round(acoustic.duration / 60));

  // Les hésitations détectées dans le son s'ajoutent au décompte des mots parasites.
  const breakdown = [...(fillers?.breakdown ?? [])];
  const vocalLabel = lang === 'fr' ? 'euh' : 'um';
  const extraVocal = metrics.hesitations - (fillers?.vocal ?? 0);
  if (extraVocal > 0) {
    const entry = breakdown.find((b) => b.label === vocalLabel);
    if (entry) entry.count += extraVocal;
    else breakdown.push({ label: vocalLabel, count: extraVocal });
    breakdown.sort((a, b) => b.count - a.count);
  }

  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    source: input.source,
    lang,
    coachId: input.coachId,
    topic: input.topic,
    duration: acoustic.duration,
    activeDuration: acoustic.activeDuration,
    transcript,
    breakdown,
    overused: fillers?.overused ?? [],
    metrics,
    scores,
    feedback,
    aiLocked,
    timeline: downsample(acoustic.timeline, TIMELINE_BARS),
    hesitationMarks: acoustic.hesitationTimes.map((t) => Math.round((t / Math.max(acoustic.duration, 1)) * 1000) / 1000),
    xp: 10 + Math.round(scores.global / 10) + 2 * minutes + (scenario ? 5 : 0),
    scenario: scenario && {
      ...scenario,
      checklist: feedback.checklist ? Object.entries(feedback.checklist).map(([key, done]) => ({ key, done })) : scenario.checklist,
    },
  };
}
