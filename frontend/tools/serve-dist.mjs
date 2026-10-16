// Sert le build de production avec les en-têtes de public/_headers, comme Cloudflare Pages :
// vérifie en local que la CSP stricte ne bloque rien. Lancement : node tools/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist/frontend/browser');
const port = Number(process.argv[2] ?? 4370);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** En-têtes de la section « /* » du fichier _headers. */
async function loadHeaders() {
  const text = await readFile(join(root, '_headers'), 'utf8');
  return Object.fromEntries(
    text
      .split('\n')
      .filter((line) => /^\s+\S+:/.test(line))
      .map((line) => {
        const index = line.indexOf(':');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

const headers = await loadHeaders();
createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname));
  // Pas de sortie du dossier servi
  const file = resolve(join(root, path === '/' || path === '\\' ? 'index.html' : path));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, headers).end();
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
