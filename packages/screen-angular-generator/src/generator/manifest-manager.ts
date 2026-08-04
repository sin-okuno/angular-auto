import fs from 'node:fs';
import path from 'node:path';

import { GENERATOR_VERSION } from '../domain/resolved-screen.types.js';
import type { GenerationManifest } from './generation-types.js';

export function manifestPath(featureRootAbs: string): string {
  return path.join(featureRootAbs, '.screen-generator-manifest.json');
}

export function readManifest(featureRootAbs: string): GenerationManifest | null {
  const filePath = manifestPath(featureRootAbs);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as GenerationManifest;
}

export function writeManifest(featureRootAbs: string, manifest: GenerationManifest): void {
  fs.mkdirSync(featureRootAbs, { recursive: true });
  fs.writeFileSync(manifestPath(featureRootAbs), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function buildManifest(specId: string, files: string[]): GenerationManifest {
  return {
    generatorVersion: GENERATOR_VERSION,
    specId,
    generatedAt: new Date().toISOString(),
    files: [...files].sort(),
  };
}
