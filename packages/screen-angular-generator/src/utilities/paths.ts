import path from 'node:path';

export function resolveSpecDirectory(specOption: string, cwd: string = process.cwd()): string {
  return path.resolve(cwd, specOption);
}

export function joinPath(...parts: string[]): string {
  return path.join(...parts);
}

export function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}
