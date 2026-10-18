import { describe, expect, it } from 'vitest';
import { normalizeReply, parsePayload, systemPrompt, userMessage } from '../../supabase/functions/_shared/coach.ts';

const payload = {
  lang: 'fr',
  coachId: 'sofia',
  name: 'Cléo',
  topic: null,
  transcript: 'bonjour euh je vais vous parler de mon projet',
  activeDuration: 75,
  metrics: { words: 9, wpm: 172, fillers: 1, fillersPerMin: 0.8, repetitions: 0, pauses: 2, longPauses: 0, volumeDb: -28, pitchVarSt: 1.1 },
  breakdown: [{ label: 'euh', count: 1 }],
  overused: [],
};

describe('parsePayload', () => {
  it('accepte une requête valide et borne les champs', () => {
    const p = parsePayload({ ...payload, name: 'x'.repeat(500), extra: 'ignoré' });
    expect(p?.coachId).toBe('sofia');
    expect(p?.name).toHaveLength(60);
  });

  it('refuse une langue, un coach ou une transcription invalides', () => {
    expect(parsePayload({ ...payload, lang: 'de' })).toBeNull();
    expect(parsePayload({ ...payload, coachId: 'bob' })).toBeNull();
    expect(parsePayload({ ...payload, transcript: '   ' })).toBeNull();
    expect(parsePayload('n’importe quoi')).toBeNull();
  });
});

describe('normalizeReply', () => {
  it('borne la note et limite les listes à trois éléments', () => {
    const r = normalizeReply({
      contentScore: 140,
      summary: ' Bien joué ',
      strengths: ['a', 'b', 'c', 'd'],
      tips: ['x', '', 'y'],
      rewrite: { before: '', after: '' },
    });
    expect(r).toEqual({ contentScore: 100, summary: 'Bien joué', strengths: ['a', 'b', 'c'], tips: ['x', 'y'], rewrite: null });
  });

  it('rejette une réponse incomplète', () => {
    expect(normalizeReply({ summary: 'ok', tips: ['x'] })).toBeNull();
    expect(normalizeReply(null)).toBeNull();
  });
});

describe('prompts', () => {
  it('met la transcription entre balises et décrit les mesures', () => {
    const msg = userMessage(parsePayload(payload)!);
    expect(msg).toContain('<transcript>\nbonjour euh je vais vous parler de mon projet\n</transcript>');
    expect(msg).toContain('172 words per minute');
    expect(msg).toContain('intonation: monotone');
    expect(msg).toContain('1 min 15 s');
  });

  it('adapte la personnalité et la langue', () => {
    expect(systemPrompt('sofia', 'fr')).toContain('former trial lawyer');
    expect(systemPrompt('sofia', 'fr')).toContain('« tu »');
    expect(systemPrompt('lea', 'en')).toContain('Write everything in English');
  });
});
