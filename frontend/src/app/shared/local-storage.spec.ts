import { readStorage, writeStorage } from './local-storage';

describe('local-storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lit et écrit une valeur', () => {
    writeStorage('mine-explorer.test', 'valeur');
    expect(readStorage('mine-explorer.test')).toBe('valeur');
    localStorage.removeItem('mine-explorer.test');
  });

  it('joue sans sauvegarde quand le stockage est bloqué (navigation privée, WebView)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqué', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('plein', 'QuotaExceededError');
    });
    expect(readStorage('mine-explorer.coins')).toBeNull();
    expect(() => writeStorage('mine-explorer.coins', '1')).not.toThrow();
  });
});
