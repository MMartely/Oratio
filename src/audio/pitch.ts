const MIN_F = 70;
const MAX_F = 450;
const TARGET_RATE = 16000;

export interface Pitch {
  /** Fréquence fondamentale en Hz, 0 si aucune périodicité n'est trouvée. */
  freq: number;
  /** Netteté de la périodicité (0 à 1) : proche de 1 pour une voyelle tenue. */
  clarity: number;
}

/**
 * Détection de la hauteur de voix par fonction de différence normalisée (méthode de McLeod).
 * Le signal est d'abord sous-échantillonné vers ~16 kHz pour rester léger sur téléphone.
 */
export function detectPitch(frame: Float32Array, sampleRate: number): Pitch {
  const factor = Math.max(1, Math.floor(sampleRate / TARGET_RATE));
  const n = Math.floor(frame.length / factor);
  const sr = sampleRate / factor;
  const x = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < factor; k++) s += frame[i * factor + k];
    x[i] = s / factor;
    mean += x[i];
  }
  mean /= n;
  for (let i = 0; i < n; i++) x[i] -= mean;

  const minLag = Math.floor(sr / MAX_F);
  const maxLag = Math.min(n - 2, Math.ceil(sr / MIN_F));
  const nsdf = new Float32Array(maxLag + 2);
  for (let tau = 1; tau <= maxLag + 1; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i + tau < n; i++) {
      acf += x[i] * x[i + tau];
      m += x[i] * x[i] + x[i + tau] * x[i + tau];
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // On ignore le lobe autour de 0, puis on garde le meilleur point de chaque lobe positif.
  let tau = 1;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  const peaks: [number, number][] = [];
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau] <= 0) tau++;
    let best = -1;
    let bestTau = -1;
    while (tau <= maxLag && nsdf[tau] > 0) {
      if (nsdf[tau] > best) {
        best = nsdf[tau];
        bestTau = tau;
      }
      tau++;
    }
    if (bestTau >= minLag) peaks.push([bestTau, best]);
  }
  if (peaks.length === 0) return { freq: 0, clarity: 0 };

  const highest = Math.max(...peaks.map((p) => p[1]));
  const [t, value] = peaks.find((p) => p[1] >= 0.9 * highest)!;
  const a = nsdf[t - 1];
  const b = nsdf[t];
  const c = nsdf[t + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const lag = t + Math.max(-0.5, Math.min(0.5, shift));
  return { freq: sr / lag, clarity: value };
}

/** Hauteur en demi-tons par rapport à 100 Hz. */
export const toSemitones = (freq: number) => 12 * Math.log2(freq / 100);
