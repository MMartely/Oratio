import { describe, expect, it } from 'vitest';
import { demoChecklist, demoFollowUp, demoInterviewReport, demoQuestions, timingOf } from '../analysis/scenarios';
import { mergeSummaries, type AcousticSummary } from '../audio/voiceAnalyzer';
import { normalizeReply, parsePayload, replySchemaFor } from '../../supabase/functions/_shared/coach.ts';
import { normalizeReport, parseNext, parseStart } from '../../supabase/functions/_shared/interview.ts';

describe('demoChecklist', () => {
  it('repère les étapes d’un pitch', () => {
    const c = demoChecklist(
      'pitch',
      'Aujourd’hui les étudiants perdent du temps. Notre application permet de réviser. Nous avons déjà 2000 utilisateurs. Nous cherchons 50 000 euros.',
      {},
      'fr',
    );
    expect(c).toEqual({ problem: true, solution: true, audience: true, proof: true, ask: true });
  });

  it('vérifie que les personnes à l’honneur sont nommées et qu’il y a un toast', () => {
    const c = demoChecklist('event', 'Je me souviens du jour où Aïcha a rencontré Paul. Levons nos verres !', { honoree: 'Aïcha et Paul' }, 'fr');
    expect(c.honoree).toBe(true);
    expect(c.anecdote).toBe(true);
    expect(c.toast).toBe(true);
  });
});

describe('timingOf', () => {
  it('compare la durée à la cible', () => {
    expect(timingOf(50, 120)).toBe('short');
    expect(timingOf(110, 120)).toBe('ok');
    expect(timingOf(200, 120)).toBe('long');
  });
});

describe('entretien en mode démo', () => {
  it('commence par la présentation et finit par les questions du candidat', () => {
    const q = demoQuestions('développeuse', 'Wave', 'Cléo', 5, 'fr', () => 0.3);
    expect(q).toHaveLength(5);
    expect(q[0]).toContain('Cléo');
    expect(q[1]).toContain('développeuse chez Wave');
    expect(q[4]).toContain('Avez-vous des questions');
  });

  it('relance une réponse trop courte, pas une réponse développée avec un exemple', () => {
    expect(demoFollowUp('Pouvez-vous vous présenter ?', 'Je suis Cléo, voilà.', 'fr')).toContain('développer');
    const long = 'Je suis chargée de projet depuis trois ans. Par exemple, j’ai mis en place un nouvel outil de suivi pour toute l’équipe, ce qui nous a fait gagner beaucoup de temps chaque semaine et a amélioré la satisfaction de nos clients de façon nette.';
    expect(demoFollowUp('Pouvez-vous vous présenter ?', long, 'fr')).toBeNull();
  });

  it('note chaque réponse et calcule la moyenne', () => {
    const r = demoInterviewReport([{ transcript: 'Oui.', seconds: 3 }, { transcript: null, seconds: 0 }], 'fr');
    expect(r.answers[0].score).toBeLessThan(50);
    expect(r.answers[1].feedback).toContain('Pas de réponse');
    expect(r.contentScore).toBe(r.answers[0].score);
  });
});

describe('mergeSummaries', () => {
  const part = (duration: number, volumeDb: number, speakingTime: number): AcousticSummary => ({
    duration,
    activeDuration: duration - 1,
    speakingTime,
    pauses: 2,
    longPauses: 0,
    avgPause: 1,
    hesitations: 1,
    hesitationTimes: [2],
    volumeDb,
    volumeVarDb: 4,
    pitchHz: 120,
    pitchVarSt: 2,
    syllables: 20,
    syllableRate: 20 / speakingTime,
    timeline: [0.5, 0.6],
  });

  it('additionne les durées et pondère le volume par le temps de parole', () => {
    const m = mergeSummaries([part(10, -20, 8), part(20, -30, 2)]);
    expect(m.duration).toBe(30);
    expect(m.hesitations).toBe(2);
    expect(m.hesitationTimes).toEqual([2, 12]);
    expect(m.volumeDb).toBeCloseTo(-22);
    expect(m.timeline).toHaveLength(4);
  });
});

describe('validation côté serveur', () => {
  it('ajoute la liste de contrôle de la situation au format de réponse', () => {
    const schema = replySchemaFor({ id: 'pitch', context: {}, targetSeconds: 120 }) as unknown as { required: string[]; properties: Record<string, { required?: string[] }> };
    expect(schema.required).toContain('checklist');
    expect(schema.properties.checklist.required).toEqual(['problem', 'solution', 'audience', 'proof', 'ask']);
    const reply = normalizeReply(
      { contentScore: 70, summary: 'ok', strengths: [], tips: ['x'], rewrite: { before: '', after: '' }, checklist: { problem: true, ask: 'oui' } },
      { id: 'pitch', context: {}, targetSeconds: 120 },
    );
    expect(reply?.checklist).toEqual({ problem: true, solution: false, audience: false, proof: false, ask: false });
  });

  it('lit la situation de la requête en bornant le contexte', () => {
    const p = parsePayload({
      lang: 'fr',
      coachId: 'lea',
      transcript: 'bonjour',
      metrics: {},
      scenario: { id: 'event', context: { honoree: 'Aïcha', eventType: 'wedding', vide: '' }, targetSeconds: 99999 },
    });
    expect(p?.scenario).toEqual({ id: 'event', context: { honoree: 'Aïcha', eventType: 'wedding' }, targetSeconds: 1800 });
  });

  it('valide les requêtes d’entretien', () => {
    expect(parseStart({ lang: 'fr', context: { role: 'Comptable' }, count: 99 })?.count).toBe(7);
    expect(parseStart({ lang: 'fr', context: {} })).toBeNull();
    expect(parseNext({ lang: 'fr', interviewId: 'pas-un-uuid', context: { role: 'x' }, history: [{ question: 'q', answer: 'a' }] })).toBeNull();
    const report = normalizeReport({ contentScore: 300, summary: 's', strengths: ['a'], tips: ['t'], answers: [{ score: 80, feedback: 'bien' }] }, 3);
    expect(report?.contentScore).toBe(100);
    expect(report?.answers).toHaveLength(3);
  });
});
