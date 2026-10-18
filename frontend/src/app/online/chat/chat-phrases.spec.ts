import { CHAT_PHRASES, chatPhraseText, isChatMessages } from './chat-phrases';

describe('Phrases de la discussion', () => {
  it('reprend exactement les clés acceptées par le serveur (ChatPhrase.java)', () => {
    expect(CHAT_PHRASES.map((phrase) => phrase.key)).toEqual([
      'hello',
      'gg',
      'thanks',
      'good-luck',
      'zone-cleared',
      'evolved',
      'legendary',
      'abyss',
      'abyss-record',
      'stuck',
      'tip-pickaxe',
      'companion',
      'laugh',
      'wow',
      'see-you',
    ]);
  });

  it("ignore une phrase que cette version du jeu ne connaît pas", () => {
    expect(chatPhraseText('gg')).toBe('Bien joué ! 🎉');
    expect(chatPhraseText('nouvelle-phrase')).toBeNull();
  });

  it('refuse une réponse du serveur mal formée', () => {
    const message = { id: 1, pseudo: 'Alice', phrase: 'gg', sentAt: '2026-10-18T20:00:00Z', mine: false };
    expect(isChatMessages({ messages: [message] })).toBe(true);
    expect(isChatMessages({ messages: [{ ...message, id: '1' }] })).toBe(false);
    expect(isChatMessages({})).toBe(false);
  });
});
