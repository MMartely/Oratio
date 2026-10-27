import { describe, expect, it } from 'vitest';
import { follow, heardKeys, prepareScript, similar, wordKey } from '../teleprompter/follow';

const text =
  'Bonjour à toutes et à tous. Je m’appelle Fatou, et je travaille depuis cinq ans dans la logistique à Abidjan. ' +
  'Mon métier, c’est de faire arriver les bons produits, au bon endroit, au bon moment. ' +
  'Ce que j’aime le plus, c’est résoudre les problèmes avec l’équipe.';
const script = prepareScript(text);

/** Simule une lecture : on donne à l'algorithme ce que la reconnaissance a entendu jusque-là. */
const read = (heard: string, from = 0) => follow(script.keys, from, heardKeys(heard));

describe('prompteur qui suit la voix', () => {
  it('prépare le texte pour la comparaison', () => {
    expect(wordKey('L’équipe.')).toBe('lequipe');
    expect(script.display[0]).toBe('Bonjour');
    expect(script.display).toHaveLength(script.keys.length);
    expect(similar('logistique', 'logistiques')).toBe(true);
    expect(similar('bon', 'bons')).toBe(false);
  });

  it('avance au fil des mots lus', () => {
    expect(read('bonjour à toutes')).toBe(3);
    expect(read('je m’appelle Fatou', 6)).toBe(9);
    // Petites erreurs de reconnaissance sur les mots longs.
    expect(read('dans la logistiques à Abidjan', 9)).toBe(script.keys.indexOf('abidjan') + 1);
  });

  it('ne bouge pas tant que rien ne correspond, et ne recule jamais', () => {
    expect(read('euh alors voilà', 5)).toBe(5);
    expect(read('bonjour à toutes', 20)).toBe(20);
    expect(read('')).toBe(0);
  });

  it('ne saute pas loin sur un seul mot répété', () => {
    // « bon » apparaît deux fois plus loin : un mot court isolé ne suffit pas.
    const pos = script.keys.indexOf('faire');
    expect(read('bon', pos)).toBe(pos);
  });

  it('retrouve la lecture après un passage sauté', () => {
    const target = script.keys.indexOf('resoudre');
    expect(read('c’est résoudre les problèmes', 3)).toBe(target + 3);
  });
});
