import { resolveSpecification } from '../resolver/specification-resolver.js';
import { readDraftScreen } from '../utilities/draft-loader.js';
import { log } from '../utilities/logger.js';
import { joinPath, resolveSpecDirectory, toPosix } from '../utilities/paths.js';
import {
  formatValidationErrors,
  validateSpecification,
} from '../validator/specification-validator.js';
import { writeResolvedScreenYaml } from '../writer/resolved-yaml-writer.js';

export interface ResolveCommandOptions {
  spec: string;
}

export async function runResolveCommand(options: ResolveCommandOptions): Promise<void> {
  const specDir = resolveSpecDirectory(options.spec);
  const { draft } = await readDraftScreen(options.spec);
  log('READ', 'draft-screen.yaml');

  const validation = validateSpecification(draft);
  log('VALIDATE', validation.ok ? 'OK' : 'FAILED');
  if (!validation.ok) {
    console.error(`\n${formatValidationErrors(validation.errors)}\n`);
    process.exitCode = 1;
    return;
  }

  const { document, stats } = resolveSpecification(draft);
  log('RESOLVE', `${stats.typeReferences} type references`);
  log('RESOLVE', `${stats.actionReferences} action references`);
  log('RESOLVE', `${stats.componentReferences} component references`);

  const outputPath = joinPath(specDir, 'resolved-screen.yaml');
  await writeResolvedScreenYaml(outputPath, document);
  log('WRITE', toPosix(outputPath));
  log('DONE', '');
}
