// Exporte les sons fabriqués par synth.ts et les musiques de zone (zone-music.ts) en fichiers WAV, pour les écouter
// hors du jeu.
// Usage : node --import ./tools/register-ts.mjs tools/export-sounds.mts <dossier>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SOUND_IDS } from '../src/app/audio/sound-catalog.ts';
import { renderSound } from '../src/app/audio/synth.ts';
import { renderZoneMusic, ZONE_THEMES } from '../src/app/audio/zone-music.ts';

const RATE = 44100;
const outDir = process.argv[2] ?? 'sons-exportes';

function wav(samples: Float32Array, rate: number): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, index) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(outDir, { recursive: true });
// Tous les bruitages à la suite, séparés d'une demi-seconde de silence
const gap = new Float32Array(RATE / 2);
const parts = SOUND_IDS.flatMap((id) => [renderSound(id, RATE), gap]);
const all = new Float32Array(parts.reduce((sum, part) => sum + part.length, 0));
parts.reduce((offset, part) => (all.set(part, offset), offset + part.length), 0);
writeFileSync(join(outDir, 'bruitages.wav'), wav(all, RATE));
// Une musique par zone, chacune dans son fichier
ZONE_THEMES.forEach((theme, index) => {
  const zone = String(index + 1).padStart(2, '0');
  writeFileSync(join(outDir, `musique-zone-${zone}.wav`), wav(renderZoneMusic(index + 1, 22050), 22050));
  console.log(`Zone ${zone} : ${theme.mood}`);
});
console.log(`Bruitages (dans l'ordre : ${SOUND_IDS.join(', ')}) et musiques des ${ZONE_THEMES.length} zones exportés dans ${outDir}`);
