import { hasCrossedFrame } from './frame-crossing';

describe('hasCrossedFrame', () => {
  it.each([
    [9, 10, 10, true],
    [8, 12, 10, true],
    [10, 11, 10, false],
    [5, 9, 10, false],
    [10, 10, 10, false],
    [20, 2, 10, false],
    [20, 2, 21, true],
    [20, 2, 0, true],
    [8, 9, 10, false],
  ])('de %i à %i, cible %i : %s', (previous, current, target, expected) => {
    expect(hasCrossedFrame(previous, current, target)).toBe(expected);
  });
});
