import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Metrics } from '../../analysis/metrics';
import { demoFollowUp, demoQuestions } from '../../analysis/scenarios';
import { normalizeFollowUp, normalizeQuestions, normalizeReport, type InterviewReport, type InterviewTurn } from '../../../supabase/functions/_shared/interview.ts';
import type { CoachId, Lang } from '../../types';
import { supabase } from '../supabase';

export interface InterviewSetup {
  /** Identifiant côté serveur ; null en mode démo ou si le coach IA n'a pas répondu. */
  interviewId: string | null;
  questions: string[];
  /** Quota d'analyses IA atteint : entretien mené avec les questions classiques. */
  aiLocked: boolean;
}

export interface StartInput {
  lang: Lang;
  coachId: CoachId;
  name: string;
  role: string;
  company: string | null;
  count: number;
  aiLocked: boolean;
}

export interface FollowUpInput {
  interviewId: string | null;
  lang: Lang;
  role: string;
  company: string | null;
  history: InterviewTurn[];
}

export interface ReportInput {
  interviewId: string | null;
  lang: Lang;
  coachId: CoachId;
  name: string;
  role: string;
  company: string | null;
  answers: { question: string; transcript: string; seconds: number }[];
  metrics: Metrics;
}

/** Le recruteur : prépare les questions, relance, puis fait évaluer l'entretien. */
export interface InterviewCoach {
  start(input: StartInput): Promise<InterviewSetup>;
  followUp(input: FollowUpInput): Promise<string | null>;
  /** Bilan du coach IA, ou null (mode démo, quota atteint, coach indisponible). */
  report(input: ReportInput): Promise<InterviewReport | null>;
}

const lastTurn = (history: InterviewTurn[]) => history[history.length - 1];

const demo: InterviewCoach = {
  async start(i) {
    return { interviewId: null, questions: demoQuestions(i.role, i.company, i.name, i.count, i.lang), aiLocked: i.aiLocked };
  },
  async followUp(i) {
    const turn = lastTurn(i.history);
    return demoFollowUp(turn.question, turn.answer, i.lang);
  },
  async report() {
    return null;
  },
};

const cloud = (sb: NonNullable<typeof supabase>): InterviewCoach => ({
  async start(i) {
    if (i.aiLocked) return demo.start(i);
    const { data, error } = await sb.functions.invoke('coach', {
      body: { task: 'interview_start', lang: i.lang, coachId: i.coachId, name: i.name, context: { role: i.role, company: i.company }, count: i.count },
    });
    const questions = error ? null : normalizeQuestions(data, i.count);
    if (!questions || typeof data?.interviewId !== 'string') {
      const quota = error instanceof FunctionsHttpError && error.context instanceof Response && error.context.status === 402;
      return demo.start({ ...i, aiLocked: quota });
    }
    return { interviewId: data.interviewId, questions, aiLocked: false };
  },
  async followUp(i) {
    if (!i.interviewId) return demo.followUp(i);
    const { data, error } = await sb.functions.invoke('coach', {
      body: { task: 'interview_next', interviewId: i.interviewId, lang: i.lang, context: { role: i.role, company: i.company }, history: i.history },
    });
    return error ? demo.followUp(i) : normalizeFollowUp(data);
  },
  async report(i) {
    if (!i.interviewId) return null;
    const { data, error } = await sb.functions.invoke('coach', {
      body: {
        task: 'interview_report',
        interviewId: i.interviewId,
        lang: i.lang,
        coachId: i.coachId,
        name: i.name,
        context: { role: i.role, company: i.company },
        answers: i.answers,
        metrics: i.metrics,
      },
    });
    return error ? null : normalizeReport(data, i.answers.length);
  },
});

export const interviewCoach: InterviewCoach = supabase ? cloud(supabase) : demo;

