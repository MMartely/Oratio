import { FRAME_SECONDS, HOP_SECONDS, VoiceAnalyzer, type AcousticSummary } from './voiceAnalyzer';

export const MAX_FILE_SECONDS = 15 * 60;

export class FileTooLong extends Error {}

/** Analyse un fichier audio ou vidéo importé (mémo vocal, enregistrement d'un discours). */
export async function analyzeFile(file: File, onProgress: (ratio: number) => void): Promise<AcousticSummary> {
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const audio = await ctx.decodeAudioData(await file.arrayBuffer());
    if (audio.duration > MAX_FILE_SECONDS) throw new FileTooLong();
    const sr = audio.sampleRate;
    const mono = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const data = audio.getChannelData(c);
      for (let i = 0; i < data.length; i++) mono[i] += data[i] / audio.numberOfChannels;
    }
    const analyzer = new VoiceAnalyzer();
    const win = Math.round(sr * FRAME_SECONDS);
    const hop = Math.round(sr * HOP_SECONDS);
    let frames = 0;
    for (let i = 0; i + win <= mono.length; i += hop) {
      analyzer.push(mono.subarray(i, i + win), sr, hop / sr);
      if (++frames % 300 === 0) {
        onProgress(i / mono.length);
        await new Promise((r) => setTimeout(r));
      }
    }
    onProgress(1);
    return analyzer.summary();
  } finally {
    void ctx.close();
  }
}
