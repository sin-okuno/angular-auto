import { buildHeader, generateFeature } from '../generator/code-generator.js';
import { formatFiles } from '../generator/formatter.js';
import { applyChanges } from '../generator/file-writer.js';
import {
  defaultCodeOutput,
  resolveChanges,
  resolveWithinRoot,
  toRelativeFromRoot,
} from '../generator/output-resolver.js';
import { formatChangeList, summarizeChanges, type ChangeSummary } from '../generator/diff-calculator.js';
import { loadScreenYaml } from '../screen/screen-loader.js';
import type { FileChange, GenerateOptions } from '../types/generator-options.js';
import type { ScreenDefinition } from '../types/screen-definition.js';
import { kebabCase } from '../utils/naming.js';
import { logger } from '../utils/logger.js';
import { validateDefinition } from './validate.command.js';

export interface GenerateResult {
  changes: FileChange[];
  summary: ChangeSummary;
  outputAbs: string;
}

export interface GenerateFromDefinitionArgs {
  definition: ScreenDefinition;
  outputAbs: string;
  dryRun: boolean;
  force: boolean;
}

/**
 * Renders, formats, and diffs the feature. Writes only when not a dry-run.
 * Generation happens fully in memory first (the "temp" stage) and is compared
 * against disk before anything is written.
 */
export async function generateFromDefinition(
  args: GenerateFromDefinitionArgs,
): Promise<GenerateResult> {
  logger.step('Generating code (in memory)');
  const rendered = generateFeature(args.definition, buildHeader(args.definition));

  logger.step('Formatting with Prettier');
  const formatted = await formatFiles(rendered);

  logger.step('Computing file changes');
  const { changes } = await resolveChanges(formatted, args.outputAbs, args.force);
  const summary = summarizeChanges(changes);

  logger.plain('');
  logger.plain(formatChangeList(changes));
  logger.plain('');

  if (args.dryRun) {
    logger.info('No files were written.');
  } else {
    await applyChanges(changes);
    logger.success(
      `Applied: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted, ${summary.unchanged} unchanged.`,
    );
  }

  return { changes, summary, outputAbs: args.outputAbs };
}

export async function runGenerate(options: GenerateOptions): Promise<GenerateResult> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Loading screen.yaml: ${toRelativeFromRoot(inputAbs)}`);
  const definition = await loadScreenYaml(inputAbs);

  const validation = await validateDefinition(definition);
  if (!validation.ok) {
    throw new Error(
      `Validation failed with ${validation.errorCount} error(s). Fix them before generating.`,
    );
  }

  const outputAbs = options.output
    ? resolveWithinRoot(options.output)
    : defaultCodeOutput(kebabCase(definition.screen.featureName));

  return generateFromDefinition({
    definition,
    outputAbs,
    dryRun: options.dryRun,
    force: options.force,
  });
}
