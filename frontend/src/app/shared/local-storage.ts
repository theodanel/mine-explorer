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
