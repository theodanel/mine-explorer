import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it.each([
    [45_000, '45 s'],
    [12 * 60_000 + 5_000, '12 min 05'],
    [3 * 3_600_000 + 20 * 60_000, '3 h 20'],
    [2 * 86_400_000 + 4 * 3_600_000, '2 j 4 h'],
    [-5, '0 s'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
