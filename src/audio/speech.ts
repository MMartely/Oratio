// Transcription en direct via la reconnaissance vocale du navigateur (Chrome, Edge, Safari).
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TimedWord {
  text: string;
  /** Secondes depuis le début de l'enregistrement (heure d'arrivée du résultat). */
  t: number;
}

export interface SpeechHandle {
  stop(): Promise<void>;
  readonly words: TimedWord[];
  readonly failed: boolean;
}

interface Callbacks {
  onUpdate(finalText: string, interim: string): void;
  onWords?(words: TimedWord[]): void;
  onError?(code: string): void;
}

const ctor = (): any =>
  typeof window === 'undefined' ? undefined : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export const speechSupported = () => Boolean(ctor());

const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported', 'network']);

export function startSpeech(lang: 'fr' | 'en', cb: Callbacks): SpeechHandle {
  const Recognition = ctor();
  const t0 = performance.now();
  const words: TimedWord[] = [];
  let finalText = '';
  let running = true;
  let failed = false;
  let current: any = null;
  let ended: (() => void) | null = null;
  // Sur Android, le mode continu duplique les résultats : on enchaîne des énoncés courts.
  const continuous = !/Android/i.test(navigator.userAgent);

  const create = () => {
    const rec = new Recognition();
    rec.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = String(r[0].transcript).trim();
        if (r.isFinal) {
          if (!text) continue;
          const t = (performance.now() - t0) / 1000;
          const added = text.split(/\s+/).map((w) => ({ text: w, t }));
          words.push(...added);
          finalText += (finalText ? ' ' : '') + text;
          cb.onWords?.(added);
        } else {
          interim += (interim ? ' ' : '') + text;
        }
      }
      cb.onUpdate(finalText, interim);
    };
    rec.onerror = (e: any) => {
      if (FATAL.has(e.error)) {
        running = false;
        failed = true;
        cb.onError?.(e.error);
      }
    };
    rec.onend = () => {
      if (running) {
        try {
          current = create();
          current.start();
          return;
        } catch {
          failed = true;
        }
      }
      ended?.();
    };
    return rec;
  };

  try {
    current = create();
    current.start();
  } catch {
    failed = true;
  }

  return {
    words,
    get failed() {
      return failed;
    },
    stop() {
      running = false;
      return new Promise<void>((resolve) => {
        // Le dernier résultat arrive parfois après l'arrêt : on lui laisse un court délai.
        const timer = setTimeout(resolve, 1500);
        ended = () => {
          clearTimeout(timer);
          resolve();
        };
        try {
          current?.stop();
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    },
  };
}
