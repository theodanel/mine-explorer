import { TestBed } from '@angular/core/testing';

import { FlightKind, pieceCount, Point, RewardFlight } from './reward-flight';

describe('pieceCount', () => {
  it.each([
    [0, 3],
    [5, 3],
    [10, 4],
    [250, 6],
    [1_000_000, 8],
  ])('%i gagnés → %i pièces', (amount, expected) => {
    expect(pieceCount(amount)).toBe(expected);
  });
});

describe('RewardFlight', () => {
  const origin: Point = { x: 10, y: 20 };

  it('ne fait voler que les ressources réellement gagnées', () => {
    const flight = TestBed.inject(RewardFlight);
    const launched: [FlightKind, number][] = [];
    flight.attach((kind, _origin, amount) => launched.push([kind, amount]));

    flight.launch(origin, { coins: 120, shards: 0 });
    flight.launch(origin, { coins: -5, shards: 3 });

    expect(launched).toEqual([
      ['coins', 120],
      ['shards', 3],
    ]);
  });

  it('ne fait rien sans couche branchée', () => {
    const flight = TestBed.inject(RewardFlight);
    flight.attach(null);
    expect(() => flight.launch(origin, { coins: 10 })).not.toThrow();
  });
});
