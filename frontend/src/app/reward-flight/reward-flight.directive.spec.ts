import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Gains, RewardFlight } from './reward-flight';
import { RewardFlightDirective } from './reward-flight.directive';

@Component({
  imports: [RewardFlightDirective],
  template: `<button type="button" appRewardFlight (click)="claim()">Récupérer</button>`,
})
class Host {
  reward: Gains = {};
  private readonly wallet = TestBed.inject(Wallet);
  private readonly shards = TestBed.inject(GeodeShards);

  claim(): void {
    if (this.reward.coins) {
      this.wallet.add(this.reward.coins);
    }
    if (this.reward.shards) {
      this.shards.add(this.reward.shards);
    }
  }
}

describe('RewardFlightDirective', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  function setup(reward: Gains) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.reward = reward;
    fixture.detectChanges();
    const launch = vi.spyOn(TestBed.inject(RewardFlight), 'launch');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    return { launch, button };
  }

  it('fait voler ce que le clic a rapporté', () => {
    const { launch, button } = setup({ coins: 50, shards: 2 });
    button.dispatchEvent(new Event('pointerdown'));
    button.click();
    vi.runAllTimers();
    expect(launch).toHaveBeenCalledWith(expect.anything(), { coins: 50, shards: 2 });
  });

  it('ne fait rien voler sans appui préalable (clic simulé par le code)', () => {
    const { launch, button } = setup({ coins: 50 });
    button.click();
    vi.runAllTimers();
    expect(launch).not.toHaveBeenCalled();
  });
});
