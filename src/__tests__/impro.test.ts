import { describe, expect, it } from 'vitest';
import { normalizeReply, parsePayload, replySchemaFor, systemPrompt, userMessage } from '../../supabase/functions/_shared/coach.ts';
import { demoChecklist } from '../analysis/scenarios';
import { IMPRO_CATEGORIES, IMPRO_TOPICS, drawTopic, lightAt, timingOfLight } from '../data/impro';

describe('feux de l’improvisation', () => {
  it('passe du vert à l’orange puis au rouge, comme au Toastmasters', () => {
    expect(lightAt(45, 'classic')).toBe('none');
    expect(lightAt(60, 'classic')).toBe('green');
    expect(lightAt(95, 'classic')).toBe('orange');
    expect(lightAt(121, 'classic')).toBe('red');
    expect(lightAt(150, 'classic')).toBe('over');
    expect(lightAt(31, 'express')).toBe('green');
  });

  it('juge le temps : trop court avant le vert, trop long 30 s après le rouge', () => {
    expect(timingOfLight('none')).toBe('short');
    expect(timingOfLight('red')).toBe('ok');
    expect(timingOfLight('over')).toBe('long');
  });
});

describe('sujets surprises', () => {
  it('propose assez de sujets dans chaque thème et chaque langue', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const c of IMPRO_CATEGORIES) {
        expect(IMPRO_TOPICS[lang][c].length, `${lang} ${c}`).toBeGreaterThanOrEqual(10);
        expect(new Set(IMPRO_TOPICS[lang][c]).size).toBe(IMPRO_TOPICS[lang][c].length);
      }
    }
  });

  it('tire un sujet du thème choisi, différent de celui qu’on écarte', () => {
    const first = drawTopic('fr', 'work', undefined, () => 0);
    expect(IMPRO_TOPICS.fr.work).toContain(first);
    expect(drawTopic('fr', 'work', first, () => 0)).not.toBe(first);
    const any = drawTopic('en', 'all');
    expect(IMPRO_CATEGORIES.some((c) => IMPRO_TOPICS.en[c].includes(any))).toBe(true);
  });
});

describe('coach de l’improvisation', () => {
  const payload = {
    lang: 'fr',
    coachId: 'malik',
    name: 'Cléo',
    topic: 'Télétravail ou bureau ?',
    transcript: 'je pense que le télétravail est une chance parce que on gagne du temps par exemple',
    activeDuration: 70,
    metrics: { words: 15, wpm: 130, fillers: 0, fillersPerMin: 0, repetitions: 0, pauses: 3, longPauses: 0, volumeDb: -30, pitchVarSt: 2 },
    breakdown: [],
    overused: [],
    scenario: { id: 'impro', context: { subject: 'Télétravail ou bureau ?' }, targetSeconds: 120 },
  };

  it('accepte la situation et explique l’exercice au modèle', () => {
    const p = parsePayload(payload)!;
    expect(p.scenario?.id).toBe('impro');
    expect(systemPrompt('malik', 'fr', p.scenario)).toContain('Table Topics');
    expect(userMessage(p)).toContain('Target duration: 2 min');
    expect((replySchemaFor(p.scenario).properties as unknown as Record<string, { required?: string[] }>).checklist.required).toEqual(['opinion', 'reason', 'example', 'wrapup']);
    const reply = normalizeReply(
      { contentScore: 70, summary: 'Bravo', strengths: ['a'], tips: ['b'], rewrite: { before: '', after: '' }, checklist: { opinion: true, reason: true } },
      p.scenario,
    );
    expect(reply?.checklist).toEqual({ opinion: true, reason: true, example: false, wrapup: false });
  });

  it('coche avis, raison, exemple et conclusion en mode démo', () => {
    const fr = demoChecklist('impro', 'Je pense que oui, parce que c’est utile. Par exemple au travail. Voilà pourquoi je dis oui.', {}, 'fr');
    expect(fr).toEqual({ opinion: true, reason: true, example: true, wrapup: true });
    expect(demoChecklist('impro', 'well it depends', {}, 'en')).toEqual({ opinion: false, reason: false, example: false, wrapup: false });
  });
});
