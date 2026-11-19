/**
 * Demande au navigateur de ne pas effacer les données de l'app (PRD §11).
 * Sans effet si l'API est absente ou si le navigateur refuse.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
