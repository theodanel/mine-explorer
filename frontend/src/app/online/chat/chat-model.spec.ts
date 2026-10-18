import { chatLength, chatRefusalText, isChatView } from './chat-model';

describe('Discussion', () => {
  it('compte un emoji pour un caractère, comme le serveur', () => {
    expect(chatLength('salut 👋')).toBe(7);
    expect(chatLength('⛏️')).toBe(2);
  });

  it('explique chaque refus du serveur au joueur', () => {
    expect(chatRefusalText('chat-link')).toContain('liens');
    expect(chatRefusalText('chat-too-fast')).toContain('5 secondes');
    expect(chatRefusalText(null)).toContain('réessaie');
  });

  it('refuse une réponse du serveur mal formée', () => {
    const message = { id: 1, pseudo: 'Alice', text: 'salut', sentAt: '2026-10-18T20:00:00Z', mine: false };
    expect(isChatView({ messages: [message], canWrite: true, moderator: false })).toBe(true);
    expect(isChatView({ messages: [{ ...message, text: 3 }], canWrite: true, moderator: false })).toBe(false);
    expect(isChatView({ messages: [] })).toBe(false);
  });
});
