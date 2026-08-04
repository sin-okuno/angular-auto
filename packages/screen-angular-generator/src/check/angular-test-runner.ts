import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { resolveNodeExecutable } from './node-executable.js';

export function runAngularTests(targetRoot: string): void {
  const ng = path.join(targetRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  const node = resolveNodeExecutable(targetRoot);
  if (fs.existsSync(ng)) {
    execFileSync(node, [ng, 'test', '--watch=false', '--browsers=ChromeHeadless'], {
      cwd: targetRoot,
      stdio: 'inherit',
    });
    return;
  }
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, ['ng', 'test', '--watch=false', '--browsers=ChromeHeadless'], {
    cwd: targetRoot,
    stdio: 'inherit',
    shell: true,
  });
}
