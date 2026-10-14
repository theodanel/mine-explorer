// Tests d'interface des pages : elles s'affichent sur une sauvegarde donnée, et leurs boutons changent bien l'état du jeu.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';

import { AUDIO_CONTEXT_FACTORY, Sound } from '../audio/sound';
import { CHALLENGE_MILESTONES } from '../balance/challenge';
import { workshopGoldCost } from '../balance/workshop';
import { Challenge } from '../challenge/challenge';
import { ChallengePage } from '../challenge/challenge-page/challenge-page';
import { Evolution } from '../evolution/evolution';
import { EvolutionPage } from '../evolution/evolution-page/evolution-page';
import { AutoForge } from '../forge/auto-forge';
import { ForgeFiltersDialog } from '../forge/forge-filters/forge-filters';
import { MissionCounters } from '../missions/mission-counters';
import { Navigation } from '../navigation/navigation';
import { ProfilePage } from '../profile/profile-page/profile-page';
import { Skills } from '../skills/skills';
import { SkillsPage } from '../skills/skills-page/skills-page';
import { GeodeShards } from '../wallet/geode-shards';
import { Workshop } from '../workshop/workshop';
import { WorkshopPage } from '../workshop/workshop-page/workshop-page';

function save(values: Record<string, unknown>): void {
  localStorage.clear();
  for (const [key, value] of Object.entries(values)) {
    localStorage.setItem(`mine-explorer.${key}`, typeof value === 'string' ? value : JSON.stringify(value));
  }
}

function render<T>(component: Type<T>): { fixture: ComponentFixture<T>; root: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

function click(root: HTMLElement, selector: string): void {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Élément introuvable : ${selector}`);
  }
  element.click();
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes(text));
  if (button === undefined) {
    throw new Error(`Bouton introuvable : ${text}`);
  }
  return button;
}

const COUNTERS = { rocksBroken: 0, itemsForged: 0, itemsSold: 0, segmentsPaid: 0, eventsTouched: 0 };

describe('Page Profil', () => {
  it('change le volume et ouvre l\'évolution', () => {
    save({ progress: { zone: 2, stage: 1, damage: 0 } });
    const { fixture, root } = render(ProfilePage);
    buttonByText(root, 'Moyen').click();
    fixture.detectChanges();
    expect(TestBed.inject(Sound).volume()).toBe(0.5);
    expect(buttonByText(root, 'Moyen').getAttribute('aria-checked')).toBe('true');
    click(root, '.evolution');
    expect(TestBed.inject(Navigation).page()).toBe('evolution');
  });
});

describe('Page Évolution', () => {
  it('montre le palier en cours, donne les éclats d\'une mission et refuse la promotion trop tôt', () => {
    save({ progress: { zone: 2, stage: 1, damage: 0 }, counters: { ...COUNTERS, itemsForged: 10 } });
    const { fixture, root } = render(EvolutionPage);
    expect(root.textContent).toContain('Palier 1');
    expect(root.textContent).toContain('Atteindre la zone 2');
    const shards = TestBed.inject(GeodeShards);
    const before = shards.amount();
    click(root, '.claim:not([disabled])');
    fixture.detectChanges();
    expect(shards.amount()).toBeGreaterThan(before);
    expect(root.querySelector<HTMLButtonElement>('.promote')?.disabled).toBe(true);
  });

  it('laisse regarder un palier fermé sans pouvoir le remplir', () => {
    save({ progress: { zone: 1, stage: 1, damage: 0 } });
    const { fixture, root } = render(EvolutionPage);
    const tiers = root.querySelectorAll<HTMLButtonElement>('.tier');
    tiers[2].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Remplis le palier précédent');
  });

  it('promeut le mineur quand tous les paliers sont remplis', () => {
    save({
      progress: { zone: 5, stage: 1, damage: 0 },
      pickaxe: { level: 10, segments: 0, upgradeEndsAt: null },
      counters: { ...COUNTERS, itemsForged: 350, rocksBroken: 60 },
    });
    const { fixture, root } = render(EvolutionPage);
    click(root, '.promote');
    fixture.detectChanges();
    expect(TestBed.inject(Evolution).form().id).toBe('miner');
  });
});

describe('Page du Défi de la mine', () => {
  it('affiche les points et donne un palier atteint', () => {
    save({ progress: { zone: 3, stage: 1, damage: 0 } });
    const { fixture, root } = render(ChallengePage);
    TestBed.inject(MissionCounters).record('itemsForged', CHALLENGE_MILESTONES[0].points);
    fixture.detectChanges();
    expect(root.textContent).toContain(`${CHALLENGE_MILESTONES[0].points} points`);
    buttonByText(root, 'Récupérer').click();
    fixture.detectChanges();
    expect(TestBed.inject(Challenge).claimed()).toEqual([0]);
  });
});

describe('Page Atelier', () => {
  it('reste fermée avant le Mineur', () => {
    save({ progress: { zone: 3, stage: 1, damage: 0 } });
    const { root } = render(WorkshopPage);
    expect(root.textContent).toContain('Mineur');
    expect([...root.querySelectorAll<HTMLButtonElement>('.upgrade')].every((button) => button.disabled)).toBe(true);
  });

  it('renforce la pièce portée quand l\'or et le minerai suffisent', () => {
    save({
      progress: { zone: 8, stage: 1, damage: 0 },
      evolution: '1',
      coins: String(workshopGoldCost('steel', 0) * 5),
      ores: { wood: 0, stone: 0, copper: 0, iron: 0, steel: 50, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0 },
      equipment: { equipped: { boots: { id: 'b1', slot: 'boots', tier: 'steel', level: 10, stats: { strikePower: 5 } } }, pending: null },
    });
    const { fixture, root } = render(WorkshopPage);
    click(root, '.upgrade:not([disabled])');
    fixture.detectChanges();
    expect(TestBed.inject(Workshop).levels()).toEqual({ boots: { steel: 1 } });
  });
});

describe('Page Compétences', () => {
  it('apprend un sort avec les points des zones terminées', () => {
    save({ progress: { zone: 3, stage: 1, damage: 0 } });
    const { fixture, root } = render(SkillsPage);
    const skills = TestBed.inject(Skills);
    const before = skills.available();
    const learn = root.querySelector<HTMLButtonElement>('.learn');
    expect(learn).not.toBeNull();
    learn?.click();
    fixture.detectChanges();
    expect(skills.available()).toBeLessThan(before);
  });
});

describe('Filtres de la forge', () => {
  it('ne garde les filtres qu\'après « Valider »', () => {
    save({});
    const { fixture, root } = render(ForgeFiltersDialog);
    const autoForge = TestBed.inject(AutoForge);
    root.querySelector<HTMLButtonElement>('.chips .chip')?.click();
    fixture.detectChanges();
    expect(autoForge.filtered()).toBe(false);
    buttonByText(root, 'Valider').click();
    expect(autoForge.filtered()).toBe(true);
    expect(autoForge.filters().slots).toHaveLength(1);
  });
});
