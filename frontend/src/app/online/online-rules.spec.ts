import { collectSave, isCloudSave, isLeaderboard, isProfile, progressLabel } from './online-rules';

describe('Règles du jeu en ligne', () => {
  it('n\'envoie que les clés de la partie', () => {
    const data = collectSave([
      ['mine-explorer.progress', '{"zone":3,"stage":2,"damage":0}'],
      ['mine-explorer.coins', '42'],
      ['mine-explorer-cloud', '7'],
      ['autre-site', 'x'],
      ['mine-explorer.Majuscule', 'x'],
    ]);
    expect(data).toEqual({ 'mine-explorer.progress': '{"zone":3,"stage":2,"damage":0}', 'mine-explorer.coins': '42' });
  });

  it('lit la progression pour le choix entre deux parties', () => {
    expect(progressLabel({ 'mine-explorer.progress': '{"zone":5,"stage":12,"damage":3}' })).toBe('5-12');
    expect(progressLabel({})).toBe('1-1');
    expect(progressLabel({ 'mine-explorer.progress': 'illisible' })).toBe('1-1');
    expect(progressLabel({ 'mine-explorer.progress': '{"zone":-1,"stage":2}' })).toBe('1-1');
  });

  it('refuse les réponses du serveur mal formées', () => {
    expect(isProfile({ pseudo: 'Théo', createdAt: '2026-10-14T00:00:00Z', providers: ['google'] })).toBe(true);
    expect(isProfile({ pseudo: 3, createdAt: '', providers: [] })).toBe(false);
    expect(isCloudSave({ version: 1, updatedAt: 'x', data: { a: 'b' } })).toBe(true);
    expect(isCloudSave({ version: 1, updatedAt: 'x', data: { a: 2 } })).toBe(false);
    expect(isLeaderboard({ top: [{ rank: 1, pseudo: 'A', value: 10 }], me: null })).toBe(true);
    expect(isLeaderboard({ top: [{ rank: 0, pseudo: 'A', value: 10 }], me: null })).toBe(false);
  });
});
