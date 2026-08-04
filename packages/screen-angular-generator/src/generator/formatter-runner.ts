import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function formatGeneratedFiles(
  targetRoot: string,
  relativeFiles: string[],
): Promise<void> {
  if (relativeFiles.length === 0) {
    return;
  }
  const prettierBin = resolvePrettierBin(targetRoot);
  const config = resolvePrettierConfig(targetRoot);
  const args = ['--write', ...relativeFiles];
  if (config) {
    args.unshift('--config', config);
  }
  execFileSync(process.execPath, [prettierBin, ...args], {
    cwd: targetRoot,
    stdio: 'pipe',
  });
}

function resolvePrettierBin(targetRoot: string): string {
  const local = path.join(targetRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (fs.existsSync(local)) return local;
  const localMjs = path.join(targetRoot, 'node_modules', 'prettier', 'bin', 'prettier.mjs');
  if (fs.existsSync(localMjs)) return localMjs;
  const generatorRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const fallback = path.join(generatorRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (fs.existsSync(fallback)) return fallback;
  throw new Error('Prettier binary not found.');
}

function resolvePrettierConfig(targetRoot: string): string | null {
  const candidates = ['.prettierrc', '.prettierrc.json', 'prettier.config.js', 'prettier.config.cjs'];
  for (const candidate of candidates) {
    const full = path.join(targetRoot, candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}
