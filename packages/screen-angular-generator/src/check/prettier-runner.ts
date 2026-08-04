import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function resolvePrettierBin(targetRoot: string): string {
  const candidates = [
    path.join(targetRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs'),
    path.join(targetRoot, 'node_modules', 'prettier', 'bin', 'prettier.mjs'),
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../node_modules/prettier/bin/prettier.cjs',
    ),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Prettier binary not found.');
}

export function runPrettierCheck(targetRoot: string, featurePath: string): void {
  const bin = resolvePrettierBin(targetRoot);
  execFileSync(process.execPath, [bin, '--check', featurePath], {
    cwd: targetRoot,
    stdio: 'inherit',
  });
}
