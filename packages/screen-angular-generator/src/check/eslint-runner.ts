import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function runEslintCheck(targetRoot: string, featurePath: string): void {
  const local = path.join(targetRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
  if (fs.existsSync(local)) {
    execFileSync(process.execPath, [local, featurePath], {
      cwd: targetRoot,
      stdio: 'inherit',
    });
    return;
  }
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, ['eslint', featurePath], {
    cwd: targetRoot,
    stdio: 'inherit',
    shell: true,
  });
}
