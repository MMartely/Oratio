// Voix de synthèse du téléphone, pour que le recruteur pose ses questions à voix haute.
import type { Lang } from '../types';

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

function pickVoice(lang: Lang) {
  const voices = synth()?.getVoices() ?? [];
  const prefix = lang === 'fr' ? 'fr' : 'en';
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ?? voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

/**
 * Lit le texte et se résout à la fin de la lecture. Sans voix de synthèse, ou si le navigateur
 * ne signale jamais la fin, on attend une durée estimée d'après la longueur du texte.
 */
export function speak(text: string, lang: Lang): Promise<void> {
  const s = synth();
  const estimate = 1500 + text.split(/\s+/).length * 420;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, s ? estimate + 4000 : 600);
    if (!s) return;
    try {
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
      const voice = pickVoice(lang);
      if (voice) u.voice = voice;
      u.rate = 1;
      u.onend = finish;
      u.onerror = finish;
      s.speak(u);
    } catch {
      finish();
    }
  });
}

export function stopSpeaking() {
  try {
    synth()?.cancel();
  } catch {
    /* rien à arrêter */
  }
}
