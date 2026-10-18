import { keepRecording } from '../audio/recordings';
import { backend } from '../services/backend';
import { useApp } from '../store/useApp';
import type { AnalysisResult } from '../types';

/** En dessous, l'enregistrement est trop court pour être analysé. */
export const MIN_SPEECH_SECONDS = 5;

/** Garde l'audio pour la visite, et sur le serveur pour les abonnés Premium. */
export function useSaveAudio() {
  const session = useApp((s) => s.session);
  const plan = useApp((s) => s.data?.plan);
  return (result: AnalysisResult, blob: Blob) => {
    keepRecording(result.id, blob);
    if (plan !== 'premium' || !session) return;
    result.recorded = true;
    void backend.saveRecording(session.id, result.id, blob).catch(() => undefined);
  };
}
