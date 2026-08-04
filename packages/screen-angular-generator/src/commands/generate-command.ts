import path from 'node:path';

import { generateAngular } from '../generator/angular-generator.js';
import type { GenerateOptions } from '../generator/generation-types.js';
import { log } from '../utilities/logger.js';
import { resolveSpecDirectory } from '../utilities/paths.js';

export type GenerateCommandOptions = GenerateOptions;

export async function runGenerateCommand(options: GenerateCommandOptions): Promise<void> {
  const spec = resolveSpecDirectory(options.spec);
  log('RESOLVE', path.join(spec, 'resolved-screen.yaml'));
  await generateAngular({ ...options, spec });
}
