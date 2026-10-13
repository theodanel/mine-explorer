import { TestBed } from '@angular/core/testing';

import { segmentCost } from '../balance/balance';
import { SKILL_NODES, SkillNode } from '../balance/skill-tree';
import { Wallet } from '../wallet/wallet';
import { Skills } from './skills';

const node = (id: string): SkillNode => SKILL_NODES.find((candidate) => candidate.id === id) as SkillNode;

const PROGRESS_KEY = 'mine-explorer.progress';
const COINS_KEY = 'mine-explorer.coins';

describe('Skills', () => {
  function setup(zone: number, coins = 0): { skills: Skills; wallet: Wallet } {
    localStorage.clear();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ zone, stage: 1, damage: 0 }));
    localStorage.setItem(COINS_KEY, String(coins));
    return { skills: TestBed.inject(Skills), wallet: TestBed.inject(Wallet) };
  }

  it('gagne ses points avec les zones terminées', () => {
    const { skills } = setup(3);
    expect(skills.available()).toBe(6);
  });

  it('place un sort appris dans le premier emplacement libre', () => {
    const { skills } = setup(3);
    expect(skills.learn(node('dynamite'))).toBe(true);
    expect(skills.equipped()).toEqual(['dynamite', null, null]);
    expect(skills.available()).toBe(4);
  });

  it('échange deux sorts quand on en déplace un', () => {
    const { skills } = setup(3);
    skills.learn(node('dynamite'));
    skills.learn(node('frenzy'));
    skills.equip('frenzy', 0);
    expect(skills.equipped()).toEqual(['frenzy', 'dynamite', null]);
  });

  it('rembourse l\'arbre contre un segment de pioche', () => {
    const { skills, wallet } = setup(3, 1000);
    skills.learn(node('dynamite'));
    expect(skills.respec()).toBe(true);
    expect(skills.available()).toBe(6);
    expect(skills.equipped()).toEqual([null, null, null]);
    expect(wallet.coins()).toBe(1000 - (segmentCost(1) ?? 0));
  });

  it('refuse de rembourser sans assez d\'or', () => {
    const { skills } = setup(3, 0);
    skills.learn(node('dynamite'));
    expect(skills.respec()).toBe(false);
    expect(skills.available()).toBe(4);
  });

  it('ignore une sauvegarde qui équipe un sort non appris', () => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.skills', JSON.stringify({ ranks: {}, equipped: ['firedamp', null, null], auto: false }));
    expect(TestBed.inject(Skills).equipped()).toEqual([null, null, null]);
  });
});
