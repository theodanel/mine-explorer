/**
 * Indique si une animation en boucle est passée par `target` en allant de `previous` à `current`.
 * Un tick lent peut sauter plusieurs frames d'un coup : tester `current === target` raterait des coups.
 */
export function hasCrossedFrame(previous: number, current: number, target: number): boolean {
  if (current === previous) {
    return false;
  }
  if (current > previous) {
    return previous < target && target <= current;
  }
  // L'animation a bouclé : frames parcourues = previous+1..fin puis 0..current
  return target > previous || target <= current;
}
