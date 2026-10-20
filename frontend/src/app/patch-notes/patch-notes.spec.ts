import { TestBed } from '@angular/core/testing';

import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { PatchNotes, unseenReleases } from './patch-notes';
import { Release, RELEASES } from './patch-notes-data';

const SEEN_KEY = 'mine-explorer.patch-notes-seen';

function release(id: string): Release {
  return { id, title: id, fixes: [] };
}

function createNotes(stagesReached: number): PatchNotes {
  TestBed.configureTestingModule({ providers: [{ provide: Progression, useValue: { stagesReached: () => stagesReached } }] });
  return TestBed.inject(PatchNotes);
}

describe('notes de mise en production', () => {
  beforeEach(() => localStorage.clear());

  it('ne garde que les notes plus récentes que la dernière lue, trois au plus', () => {
    const releases = ['2026-12-01', '2026-11-01', '2026-10-01', '2026-09-01', '2026-08-01'].map(release);
    expect(unseenReleases(releases, '2026-10-01').map((note) => note.id)).toEqual(['2026-12-01', '2026-11-01']);
    expect(unseenReleases(releases, '2026-12-01')).toEqual([]);
    expect(unseenReleases(releases, '2026-01-01')).toHaveLength(3);
  });

  it('montre seulement la dernière note à un joueur d’avant cette fenêtre', () => {
    expect(unseenReleases(['2026-11-01', '2026-10-01'].map(release), null).map((note) => note.id)).toEqual(['2026-11-01']);
  });

  it('ne montre rien à un nouveau joueur, et le retient', () => {
    const notes = createNotes(1);
    expect(notes.hasNews()).toBe(false);
    expect(readStorage(SEEN_KEY)).toBe(RELEASES[0].id);
  });

  it('montre la note une seule fois à un joueur qui revient', () => {
    const notes = createNotes(40);
    expect(notes.releases()).toEqual([RELEASES[0]]);
    notes.dismiss();
    expect(notes.hasNews()).toBe(false);
    expect(readStorage(SEEN_KEY)).toBe(RELEASES[0].id);
  });

  it('ne remontre pas une note déjà lue', () => {
    writeStorage(SEEN_KEY, RELEASES[0].id);
    expect(createNotes(40).hasNews()).toBe(false);
  });
});
