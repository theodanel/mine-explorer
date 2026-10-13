// Permet à Node de lancer les règles du jeu telles quelles, sans étape de compilation.
// - resolve : Angular importe './fichier' sans extension, Node exige './fichier.ts'.
// - load : le code importe des types sans `import type` ; seul le compilateur TypeScript sait les retirer,
//   le simple effacement des types de Node échouerait.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  if (isRelative && !/\.[cm]?[jt]s$/.test(specifier) && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return nextResolve(candidate.href, context);
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!/\.m?ts$/.test(url)) {
    return nextLoad(url, context);
  }
  const source = readFileSync(fileURLToPath(url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: fileURLToPath(url),
  });
  return { format: 'module', source: outputText, shortCircuit: true };
}
