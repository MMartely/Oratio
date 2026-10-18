export function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    // Identifiant au format UUID v4, exigé par la base de données.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}
