import { FRAME_SECONDS } from './voiceAnalyzer';

export interface Capture {
  /** Flux du micro, et de la caméra en mode miroir (pour l'aperçu vidéo). */
  readonly stream: MediaStream;
  /** Démarre l'enregistrement audio (après le compte à rebours). */
  begin(): void;
  /** Arrête le micro et renvoie l'enregistrement audio (si le navigateur sait enregistrer). */
  stop(): Promise<Blob | null>;
  cancel(): void;
}

export type CaptureError = 'unsupported' | 'denied' | 'no-device' | 'unknown';

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];

/**
 * Ouvre le micro, appelle `onFrame` ~33 fois par seconde avec le son le plus récent,
 * et enregistre en parallèle pour permettre de se réécouter.
 */
export async function startCapture(
  onFrame: (frame: Float32Array, sampleRate: number, dt: number) => void,
  options: { video?: boolean } = {},
): Promise<Capture> {
  if (!navigator.mediaDevices?.getUserMedia) throw new CaptureFailure('unsupported');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      video: options.video ? { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } } : false,
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    throw new CaptureFailure(
      name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'no-device' : 'unknown',
    );
  }

  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = ctx.sampleRate > 30000 ? 2048 : 1024;
  source.connect(analyser);
  const size = Math.min(analyser.fftSize, Math.round(ctx.sampleRate * FRAME_SECONDS));
  const buffer = new Float32Array(analyser.fftSize);

  let last = performance.now();
  const timer = window.setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    analyser.getFloatTimeDomainData(buffer);
    onFrame(buffer.subarray(buffer.length - size), ctx.sampleRate, dt);
  }, 30);

  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  if (typeof MediaRecorder !== 'undefined') {
    const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported?.(t));
    try {
      // On n'enregistre que le son, même quand la caméra est ouverte.
      recorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    } catch {
      recorder = null;
    }
  }

  const release = () => {
    window.clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  return {
    stream,
    begin: () => {
      try {
        if (recorder?.state === 'inactive') recorder.start(1000);
      } catch {
        recorder = null;
      }
    },
    stop: () =>
      new Promise((resolve) => {
        if (!recorder || recorder.state === 'inactive') {
          release();
          return resolve(null);
        }
        recorder.onstop = () => {
          release();
          resolve(chunks.length ? new Blob(chunks, { type: recorder!.mimeType || chunks[0].type }) : null);
        };
        recorder.stop();
      }),
    cancel: () => {
      try {
        recorder?.stop();
      } catch {
        /* déjà arrêté */
      }
      release();
    },
  };
}

export class CaptureFailure extends Error {
  constructor(public code: CaptureError) {
    super(code);
  }
}
