import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Prefer portable Node 22.22.3+ when system Node is below Angular CLI requirements. */
export function resolveNodeExecutable(_targetRoot: string): string {
  const portable = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../tests/tools/node-v22.22.3/node.exe',
  );
  if (process.platform === 'win32' && fs.existsSync(portable)) {
    return portable;
  }
  const portableUnix = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../tests/tools/node-v22.22.3/bin/node',
  );
  if (fs.existsSync(portableUnix)) {
    return portableUnix;
  }
  return process.execPath;
}
