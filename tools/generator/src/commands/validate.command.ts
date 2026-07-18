import { loadScreenYaml } from '../screen/screen-loader.js';
import { validateSchema } from '../screen/schema-validator.js';
import { validateReferences } from '../screen/reference-validator.js';
import type { ScreenDefinition } from '../types/screen-definition.js';
import type { ValidateOptions } from '../types/generator-options.js';
import { formatIssue, type ValidationIssue } from '../utils/errors.js';
import { resolveWithinRoot, toRelativeFromRoot } from '../generator/output-resolver.js';
import { logger } from '../utils/logger.js';

export interface ValidationResult {
  ok: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

/** Runs schema + reference validation against an already-loaded definition. */
export async function validateDefinition(
  definition: ScreenDefinition,
): Promise<ValidationResult> {
  logger.step('Validating JSON Schema');
  await validateSchema(definition);
  logger.success('Schema validation passed');

  logger.step('Validating cross-references');
  const issues = validateReferences(definition);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  for (const issue of issues) {
    if (issue.severity === 'error') {
      logger.error(`\n${formatIssue(issue)}`);
    } else {
      logger.warn(`\n${formatIssue(issue)}`);
    }
  }

  if (errors.length === 0) {
    logger.success(`Reference validation passed (${warnings.length} warning(s))`);
  }

  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    issues,
  };
}

export async function runValidate(options: ValidateOptions): Promise<ValidationResult> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Loading screen.yaml: ${toRelativeFromRoot(inputAbs)}`);
  const definition = await loadScreenYaml(inputAbs);
  return validateDefinition(definition);
}
