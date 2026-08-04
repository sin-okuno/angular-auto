import { readDraftScreen } from '../utilities/draft-loader.js';
import { log } from '../utilities/logger.js';
import {
  formatValidationErrors,
  validateSpecification,
} from '../validator/specification-validator.js';

export interface ValidateCommandOptions {
  spec: string;
}

function stageStatus(errors: { severity: string }[]): string {
  return errors.some((item) => item.severity === 'error') ? 'FAILED' : 'OK';
}

export async function runValidateCommand(options: ValidateCommandOptions): Promise<void> {
  const { draft } = await readDraftScreen(options.spec);
  log('READ', 'draft-screen.yaml');

  const result = validateSpecification(draft);

  log('VALIDATE', `schema: ${stageStatus(result.stages.schema)}`);
  log('VALIDATE', `ids: ${stageStatus(result.stages.ids)}`);
  log('VALIDATE', `references: ${stageStatus(result.stages.references)}`);
  log('VALIDATE', `architecture: ${stageStatus(result.stages.architecture)}`);
  log('VALIDATE', `APIs: ${stageStatus(result.stages.apis)}`);
  log('VALIDATE', `validations: ${stageStatus(result.stages.validations)}`);

  if (!result.ok) {
    console.error(`\n${formatValidationErrors(result.errors)}\n`);
    process.exitCode = 1;
    return;
  }

  if (result.warnings.length > 0) {
    log('VALIDATE', `${result.warnings.length} warning(s)`);
  }
  log('DONE', '');
}
