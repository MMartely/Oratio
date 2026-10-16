// Les enregistrements audio restent en mémoire le temps de la visite :
// ils ne sont ni sauvegardés ni envoyés tant que l'utilisateur n'a pas choisi de les garder.
const urls = new Map<string, string>();

export function keepRecording(sessionId: string, blob: Blob) {
  urls.set(sessionId, URL.createObjectURL(blob));
}

export const recordingUrl = (sessionId: string) => urls.get(sessionId) ?? null;
