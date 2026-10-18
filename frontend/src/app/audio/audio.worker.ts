/// <reference lib="webworker" />
// Calcule bruitages et musiques hors du fil principal : le jeu ne fige plus pendant le calcul.
import { AudioRequest, AudioResult, renderRequest, requestKey } from './audio-renderer';

addEventListener('message', ({ data }: MessageEvent<AudioRequest>) => {
  const samples = renderRequest(data);
  const result: AudioResult = { key: requestKey(data), samples };
  // Le tampon est transféré, pas copié
  postMessage(result, [samples.buffer]);
});
