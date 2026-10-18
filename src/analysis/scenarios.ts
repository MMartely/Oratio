import { CHECKLISTS, type MonologueId } from '../../supabase/functions/_shared/coach.ts';
import type { InterviewReport } from '../../supabase/functions/_shared/interview.ts';
import { fmt } from '../i18n';
import type { Lang, ScenarioContext } from '../types';
import { analyzeFillers, normalize } from './fillers';

// --- Liste de contrôle des exposés, pitchs et discours (mode démo) -----------

const has = (words: string, patterns: string[]) => patterns.some((p) => words.includes(p));

const SIGNALS: Record<Lang, Record<string, string[]>> = {
  fr: {
    intro: ['aujourd hui', 'je vais vous parler', 'je vais vous présenter', 'bonjour', 'je m appelle'],
    plan: ['d abord', 'premièrement', 'ensuite', 'deuxièmement', 'puis', 'enfin'],
    examples: ['par exemple', 'comme', 'notamment', 'imaginez', 'prenons'],
    conclusion: ['pour conclure', 'en conclusion', 'pour finir', 'merci', 'en résumé'],
    problem: ['problème', 'difficulté', 'besoin', 'aujourd hui les', 'perdent', 'souffrent'],
    solution: ['solution', 'nous proposons', 'notre application', 'notre produit', 'permet de'],
    audience: ['clients', 'utilisateurs', 'marché', 'cible', 'entreprises', 'étudiants'],
    proof: ['%', 'pour cent', 'millions', 'utilisateurs', 'chiffre', 'résultats', 'déjà'],
    ask: ['nous cherchons', 'nous recherchons', 'rejoignez', 'investir', 'partenaires', 'contactez'],
    anecdote: ['je me souviens', 'la première fois', 'un jour', 'quand nous', 'quand j étais', 'il y a'],
    emotion: ['je t aime', 'merci', 'fier', 'fière', 'heureux', 'heureuse', 'émotion', 'bonheur', 'souhaite'],
    toast: ['lever mon verre', 'levons nos verres', 'santé', 'je trinque', 'à vous', 'à toi'],
  },
  en: {
    intro: ['today', 'i m going to talk', 'i will present', 'good morning', 'hello', 'my name is'],
    plan: ['first', 'firstly', 'then', 'next', 'secondly', 'finally'],
    examples: ['for example', 'for instance', 'such as', 'imagine', 'take'],
    conclusion: ['to conclude', 'in conclusion', 'to sum up', 'thank you', 'finally'],
    problem: ['problem', 'struggle', 'need', 'pain', 'lose', 'waste'],
    solution: ['solution', 'we offer', 'our app', 'our product', 'allows', 'helps'],
    audience: ['customers', 'users', 'market', 'target', 'companies', 'students'],
    proof: ['%', 'percent', 'million', 'users', 'results', 'already', 'grew'],
    ask: ['we are looking for', 'we re raising', 'join us', 'invest', 'partners', 'contact'],
    anecdote: ['i remember', 'the first time', 'one day', 'when we', 'when i was', 'years ago'],
    emotion: ['love', 'thank', 'proud', 'happy', 'grateful', 'wish'],
    toast: ['raise a glass', 'raise your glasses', 'cheers', 'here s to', 'to you'],
  },
};

/** Coche les éléments attendus en cherchant leurs marqueurs dans la transcription. */
export function demoChecklist(id: MonologueId, text: string | null, context: ScenarioContext, lang: Lang): Record<string, boolean> {
  const words = ` ${normalize(text ?? '').join(' ').replace(/'/g, ' ')} `;
  return Object.fromEntries(
    CHECKLISTS[id].map((key) => {
      if (key === 'honoree') {
        const names = (context.honoree ?? '').toLowerCase().split(/[\s,&]+/).filter((n) => n.length > 1);
        return [key, names.some((n) => words.includes(` ${n} `))];
      }
      // Les chiffres comptent comme preuve (« 30 % », « 2 000 clients »).
      if (key === 'proof' && /\d/.test(words)) return [key, true];
      return [key, has(words, SIGNALS[lang][key] ?? [])];
    }),
  );
}

/** Respect de la durée prévue : à 25 % près. */
export function timingOf(activeSeconds: number, targetSeconds: number): 'short' | 'ok' | 'long' {
  if (activeSeconds < targetSeconds * 0.6) return 'short';
  return activeSeconds > targetSeconds * 1.25 ? 'long' : 'ok';
}

// --- Entretien d'embauche (mode démo) ---------------------------------------

const QUESTIONS: Record<Lang, { intro: string; motivation: string; behavioural: string[]; closing: string }> = {
  fr: {
    intro: 'Bonjour {name}, merci de votre venue. Pour commencer, pouvez-vous vous présenter en quelques mots ?',
    motivation: 'Qu’est-ce qui vous attire dans ce poste de {role}{company} ?',
    behavioural: [
      'Parlez-moi d’une réussite qui compte pour vous. Qu’avez-vous fait, concrètement ?',
      'Racontez-moi une situation difficile ou un échec, et ce que vous en avez appris.',
      'Quelles qualités vous rendent bon pour ce poste, et quel point cherchez-vous à améliorer ?',
      'Décrivez une fois où vous avez dû convaincre quelqu’un qui n’était pas d’accord avec vous.',
      'Où vous voyez-vous dans trois ans ?',
    ],
    closing: 'Merci pour vos réponses. Avez-vous des questions pour nous ?',
  },
  en: {
    intro: 'Hello {name}, thanks for coming in. To start, could you briefly introduce yourself?',
    motivation: 'What attracts you to this {role} position{company}?',
    behavioural: [
      'Tell me about an achievement you’re proud of. What did you actually do?',
      'Tell me about a difficult situation or a failure, and what you learned from it.',
      'What strengths make you right for this role, and what are you working to improve?',
      'Describe a time you had to convince someone who disagreed with you.',
      'Where do you see yourself in three years?',
    ],
    closing: 'Thank you for your answers. Do you have any questions for us?',
  },
};

/** Questions d'un entretien classique, adaptées au poste. */
export function demoQuestions(role: string, company: string | null, name: string, count: number, lang: Lang, random = Math.random) {
  const q = QUESTIONS[lang];
  // « Développeuse web » devient « développeuse web » en milieu de phrase, mais « DRH » reste intact.
  const midSentence = /^\p{Lu}\p{Ll}/u.test(role) ? role.charAt(0).toLowerCase() + role.slice(1) : role;
  const vars = { name, role: midSentence, company: company ? (lang === 'fr' ? ` chez ${company}` : ` at ${company}`) : '' };
  const pool = [...q.behavioural].sort(() => random() - 0.5);
  const middle = pool.slice(0, Math.max(0, count - 3));
  return [q.intro, q.motivation, ...middle, q.closing].slice(0, count).map((t) => fmt(t, vars));
}

const EXAMPLE_MARKERS: Record<Lang, string[]> = {
  fr: ['par exemple', 'une fois', 'quand j', 'j ai mis en place', 'j ai géré', 'résultat', 'concrètement', 'nous avons', 'j ai réussi'],
  en: ['for example', 'for instance', 'once', 'when i', 'i led', 'i managed', 'result', 'we achieved', 'i built'],
};

const FOLLOW_UPS: Record<Lang, { develop: string; result: string }> = {
  fr: {
    develop: 'Pouvez-vous développer un peu, avec un exemple concret ?',
    result: 'Et concrètement, quel a été le résultat ?',
  },
  en: {
    develop: 'Could you expand on that a little, with a concrete example?',
    result: 'And concretely, what was the outcome?',
  },
};

/** Relance si la réponse est trop courte ou sans exemple (une par question au plus). */
export function demoFollowUp(question: string, answer: string, lang: Lang): string | null {
  const words = normalize(answer).length;
  if (words < 30) return FOLLOW_UPS[lang].develop;
  const text = ` ${normalize(answer).join(' ').replace(/'/g, ' ')} `;
  const behavioural = QUESTIONS[lang].behavioural.slice(0, 4).some((b) => b.slice(0, 25) === question.slice(0, 25));
  return behavioural && !has(text, EXAMPLE_MARKERS[lang]) ? FOLLOW_UPS[lang].result : null;
}

const REPORT_TEXT: Record<Lang, Record<string, string>> = {
  fr: {
    good: 'Réponse claire et illustrée par du concret.',
    short: 'Réponse trop courte : développe en trois ou quatre phrases.',
    example: 'Ajoute un exemple concret avec la méthode STAR : situation, tâche, action, résultat.',
    long: 'Va plus droit au but : vise une à deux minutes par réponse.',
    fillers: 'Le fond est là, mais les hésitations affaiblissent ta réponse : prends une seconde avant de commencer.',
    none: 'Pas de réponse enregistrée pour cette question.',
  },
  en: {
    good: 'A clear answer backed by concrete detail.',
    short: 'Too short: develop it in three or four sentences.',
    example: 'Add a concrete example using the STAR method: situation, task, action, result.',
    long: 'Get to the point faster: aim for one to two minutes per answer.',
    fillers: 'The substance is there, but hesitations weaken it: take a second before you start.',
    none: 'No answer was recorded for this question.',
  },
};

/** Évalue chaque réponse avec des règles simples (longueur, exemples, hésitations). */
export function demoAnswerReview(transcript: string | null, seconds: number, lang: Lang) {
  const t = REPORT_TEXT[lang];
  if (!transcript) return { score: null, feedback: t.none };
  const words = normalize(transcript).length;
  const text = ` ${normalize(transcript).join(' ').replace(/'/g, ' ')} `;
  const fillers = analyzeFillers(transcript, lang).total;
  const example = has(text, EXAMPLE_MARKERS[lang]);
  let score = 55;
  if (words >= 50 && words <= 220) score += 15;
  if (example) score += 15;
  if (words < 25) score -= 20;
  if (seconds > 150 || words > 300) score -= 10;
  score -= Math.min(15, fillers * 3);
  const feedback = words < 25 ? t.short : seconds > 150 || words > 300 ? t.long : !example ? t.example : fillers >= 4 ? t.fillers : t.good;
  return { score: Math.max(10, Math.min(95, score)), feedback };
}

export type DemoInterviewReport = Pick<InterviewReport, 'answers'> & { contentScore: number | null };

export function demoInterviewReport(answers: { transcript: string | null; seconds: number }[], lang: Lang): DemoInterviewReport {
  const reviews = answers.map((a) => demoAnswerReview(a.transcript, a.seconds, lang));
  const scored = reviews.filter((r) => r.score !== null).map((r) => r.score!);
  return {
    contentScore: scored.length ? Math.round(scored.reduce((s, v) => s + v, 0) / scored.length) : null,
    answers: reviews.map((r) => ({ score: r.score ?? 0, feedback: r.feedback })),
  };
}
