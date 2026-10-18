import type { Token } from '../../analysis/fillers';
import { demoChecklist } from '../../analysis/scenarios';
import { IDEAL_WPM, fillerStatus, intonationStatus, paceStatus, volumeStatus } from '../../analysis/metrics';
import { fmt } from '../../i18n';
import type { CoachFeedback, CoachId, Lang } from '../../types';
import type { CoachRequest } from './coachAI';

type Band = 'great' | 'good' | 'work';

const SUMMARIES: Record<Lang, Record<CoachId, Record<Band, string>>> = {
  fr: {
    lea: {
      great: 'Quelle belle prise de parole, {name} ! Tu peux être fier·e de toi.',
      good: 'C’est un très bon début, {name}. On va peaufiner deux ou trois choses ensemble, en douceur.',
      work: 'Merci d’avoir osé, {name}, c’est déjà une victoire. Voici par où commencer, pas à pas.',
    },
    malik: {
      great: 'Énorme, {name} ! Tu as assuré du début à la fin.',
      good: 'Bien joué {name} ! Tu tiens le bon bout, on passe la seconde ?',
      work: 'Allez {name}, chaque champion a commencé quelque part. On attaque les points clés !',
    },
    sofia: {
      great: 'Excellent travail, {name}. Peu de choses à corriger.',
      good: 'Correct, {name}, mais tu peux faire mieux. Concentre-toi sur les points ci-dessous.',
      work: 'Soyons francs, {name} : il y a du travail. Voici les priorités, dans l’ordre.',
    },
  },
  en: {
    lea: {
      great: 'What a lovely talk, {name}! You can be proud of yourself.',
      good: 'That’s a great start, {name}. Let’s gently polish two or three things together.',
      work: 'Thank you for daring, {name} — that’s already a win. Here’s where to start, step by step.',
    },
    malik: {
      great: 'Huge, {name}! You nailed it from start to finish.',
      good: 'Nice one {name}! You’re on the right track — ready to shift up a gear?',
      work: 'Come on {name}, every champion started somewhere. Let’s tackle the key points!',
    },
    sofia: {
      great: 'Excellent work, {name}. Very little to correct.',
      good: 'Decent, {name}, but you can do better. Focus on the points below.',
      work: 'Let’s be frank, {name}: there’s work to do. Here are the priorities, in order.',
    },
  },
};

const T = {
  fr: {
    sCleanSpeech: 'Très peu de mots parasites : ton discours est net.',
    sPace: 'Ton débit ({wpm} mots/min) est idéal : on te suit facilement.',
    sPauses: 'Tu utilises bien les pauses pour laisser respirer ton message.',
    sVolume: 'Ta voix porte bien, on t’entend clairement.',
    sIntonation: 'Ton intonation est vivante : tu captes l’attention.',
    sStructure: 'Ton propos est structuré : on suit facilement tes idées.',
    sVocabulary: 'Ton vocabulaire est varié et précis.',
    sDared: 'Tu as osé prendre la parole : c’est le plus important.',
    tFillers: 'Remplace tes « {top} » par un silence : une pause d’une seconde paraît bien plus assurée.',
    tFast: 'Tu parles un peu vite ({wpm} mots/min). Vise {min} à {max} et marque un temps après chaque idée.',
    tSlow: 'Ton débit est lent ({wpm} mots/min). Accélère légèrement pour garder l’énergie.',
    tFewPauses: 'Ose les pauses : après une idée importante, compte « un, deux » dans ta tête.',
    tLongPauses: 'Certains silences ont duré plus de 3 secondes. Prépare des mots-clés pour rebondir.',
    tVolume: 'Parle un peu plus fort, comme si tu t’adressais au fond de la salle.',
    tMonotone: 'Ta voix est assez monotone. Monte sur les mots importants et baisse en fin de phrase.',
    tRepeat: 'Tu as répété certains mots deux fois de suite. Ralentis pour bien poser tes phrases.',
    tOverused: 'Tu dis souvent « {word} » ({count} fois). Cherche des synonymes.',
    tStructure: 'Structure ton propos : « d’abord… ensuite… enfin… » aide ton public à suivre.',
    tDevelop: 'Développe davantage tes idées : ajoute un exemple concret ou une anecdote.',
    tKeepGoing: 'Refais l’exercice demain : la régularité fait toute la différence.',
  },
  en: {
    sCleanSpeech: 'Hardly any filler words: your speech is clean.',
    sPace: 'Your pace ({wpm} wpm) is ideal: easy to follow.',
    sPauses: 'You use pauses well to let your message breathe.',
    sVolume: 'Your voice carries well; you’re clearly heard.',
    sIntonation: 'Your intonation is lively: you hold attention.',
    sStructure: 'Your talk is structured: your ideas are easy to follow.',
    sVocabulary: 'Your vocabulary is varied and precise.',
    sDared: 'You dared to speak up: that’s what matters most.',
    tFillers: 'Replace your “{top}”s with silence: a one-second pause sounds far more confident.',
    tFast: 'You speak a little fast ({wpm} wpm). Aim for {min}–{max} and pause after each idea.',
    tSlow: 'Your pace is slow ({wpm} wpm). Speed up slightly to keep the energy.',
    tFewPauses: 'Dare to pause: after a key idea, count “one, two” in your head.',
    tLongPauses: 'Some silences lasted over 3 seconds. Prepare keywords to bounce back.',
    tVolume: 'Speak a bit louder, as if addressing the back of the room.',
    tMonotone: 'Your voice is fairly monotone. Rise on key words and drop at the end of sentences.',
    tRepeat: 'You repeated some words twice in a row. Slow down to land your sentences.',
    tOverused: 'You often say “{word}” ({count} times). Look for synonyms.',
    tStructure: 'Structure your talk: “first… then… finally…” helps your audience follow.',
    tDevelop: 'Develop your ideas further: add a concrete example or a story.',
    tKeepGoing: 'Do the exercise again tomorrow: consistency makes all the difference.',
  },
} satisfies Record<Lang, Record<string, string>>;

const MARKERS: Record<Lang, string[]> = {
  fr: ["d'abord", 'premièrement', 'ensuite', 'deuxièmement', 'puis', 'enfin', 'finalement', 'conclusion', 'conclure', 'exemple', 'parce', 'donc', 'cependant', 'pourtant'],
  en: ['first', 'firstly', 'then', 'next', 'second', 'secondly', 'finally', 'conclusion', 'conclude', 'example', 'because', 'therefore', 'however'],
};

function contentAnalysis(tokens: Token[] | null, lang: Lang) {
  if (!tokens || tokens.length < 15) return null;
  const words = tokens.filter((t) => !t.f).map((t) => t.w);
  const markers = MARKERS[lang].filter((m) => words.includes(m)).length;
  const diversity = new Set(words).size / Math.max(words.length, 1);
  let score = 50 + Math.min(24, markers * 6);
  if (words.length >= 80) score += 10;
  else if (words.length < 40) score -= 10;
  if (words.length >= 50) score += diversity > 0.65 ? 16 : diversity > 0.55 ? 10 : 0;
  return { score: Math.max(30, Math.min(95, score)), markers, diversity, words: words.length };
}

/** Exemple de phrase sans tics : on retire les mots parasites et les répétitions. */
function rewriteExample(tokens: Token[] | null) {
  if (!tokens) return null;
  const first = tokens.findIndex((t) => t.f || t.r);
  if (first < 0) return null;
  const slice = tokens.slice(Math.max(0, first - 8), first + 14);
  const join = (ts: Token[]) => {
    const text = ts.map((t) => t.w).join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '…';
  };
  const cleaned = slice.filter((t) => !t.f && !t.r);
  return cleaned.length >= 3 ? { before: join(slice), after: join(cleaned) } : null;
}

export function demoFeedback(req: CoachRequest): CoachFeedback {
  const { lang, coachId, name, metrics: m, transcript, breakdown, overused, aiLocked, globalWithoutContent } = req;
  const t = T[lang];
  const content = aiLocked ? null : contentAnalysis(transcript, lang);
  const minutes = Math.max(req.activeDuration, 15) / 60;

  const strengths: string[] = [];
  const tips: { text: string; weight: number }[] = [];
  const vars = { wpm: m.wpm ?? 0, min: IDEAL_WPM.min, max: IDEAL_WPM.max };

  if (fillerStatus(m.fillersPerMin) === 'good') strengths.push(t.sCleanSpeech);
  else tips.push({ text: fmt(t.tFillers, { top: breakdown[0]?.label ?? (lang === 'fr' ? 'euh' : 'um') }), weight: m.fillersPerMin * 10 });

  const pace = paceStatus(m.wpm);
  if (pace === 'good' && !m.wpmEstimated) strengths.push(fmt(t.sPace, vars));
  if (pace !== 'good' && m.wpm !== null) {
    tips.push({ text: fmt(m.wpm > IDEAL_WPM.max ? t.tFast : t.tSlow, vars), weight: pace === 'work' ? 40 : 20 });
  }

  if (m.pauses / minutes >= 2 && m.longPauses === 0) strengths.push(t.sPauses);
  else if (minutes >= 0.5 && m.pauses / minutes < 1) tips.push({ text: t.tFewPauses, weight: 18 });
  if (m.longPauses > 0) tips.push({ text: t.tLongPauses, weight: 12 + m.longPauses * 4 });

  if (volumeStatus(m.volumeDb) === 'good') strengths.push(t.sVolume);
  else if (volumeStatus(m.volumeDb) === 'work') tips.push({ text: t.tVolume, weight: 30 });

  const inton = intonationStatus(m.pitchVarSt);
  if (inton === 'good') strengths.push(t.sIntonation);
  else if (m.pitchVarSt !== null) tips.push({ text: t.tMonotone, weight: inton === 'work' ? 30 : 15 });

  if (m.repetitions >= 2) tips.push({ text: t.tRepeat, weight: 8 + m.repetitions * 2 });
  if (overused[0]) tips.push({ text: fmt(t.tOverused, overused[0]), weight: 10 });

  if (content) {
    if (content.markers >= 2) strengths.push(t.sStructure);
    else if (content.words >= 60) tips.push({ text: t.tStructure, weight: 16 });
    if (content.words >= 50 && content.diversity > 0.6) strengths.push(t.sVocabulary);
    if (content.words < 40) tips.push({ text: t.tDevelop, weight: 14 });
  }

  if (strengths.length === 0) strengths.push(t.sDared);
  const sortedTips = tips.sort((a, b) => b.weight - a.weight).map((x) => x.text);
  if (sortedTips.length === 0) sortedTips.push(t.tKeepGoing);

  const global = content ? Math.round(globalWithoutContent * 0.75 + content.score * 0.25) : globalWithoutContent;
  const band: Band = global >= 80 ? 'great' : global >= 60 ? 'good' : 'work';

  return {
    source: 'demo',
    contentScore: content?.score ?? null,
    summary: fmt(SUMMARIES[lang][coachId][band], { name }),
    strengths: strengths.slice(0, 3),
    tips: sortedTips.slice(0, 3),
    rewrite: aiLocked ? null : rewriteExample(transcript),
    checklist: req.scenario
      ? demoChecklist(req.scenario.id, transcript?.map((t) => t.w).join(' ') ?? null, req.scenario.context, lang)
      : undefined,
  };
}

