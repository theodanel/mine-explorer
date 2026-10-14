/**
 * Accès à localStorage qui ne fait jamais planter le jeu.
 * Le stockage peut être bloqué (navigation privée, WebView restreinte) : on joue alors sans sauvegarde.
 */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Sauvegarde "${key}" illisible, la partie repart de zéro`, error);
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Impossible d'enregistrer la sauvegarde "${key}"`, error);
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Impossible d'effacer la sauvegarde "${key}"`, error);
  }
}

/** Toutes les clés et valeurs du stockage (vide s'il est bloqué). */
export function storageEntries(): [string, string][] {
  try {
    const entries: [string, string][] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      const value = key === null ? null : localStorage.getItem(key);
      if (key !== null && value !== null) {
        entries.push([key, value]);
      }
    }
    return entries;
  } catch (error) {
    console.warn('Stockage illisible', error);
    return [];
  }
}
