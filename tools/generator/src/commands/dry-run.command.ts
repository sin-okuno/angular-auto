import { parseMarkdown } from '../markdown/markdown-parser.js';
import { convertToScreenDefinition } from '../screen/screen-converter.js';
import {
  defaultCodeOutput,
  resolveWithinRoot,
  toRelativeFromRoot,
} from '../generator/output-resolver.js';
import type { AllOptions } from '../types/generator-options.js';
import { kebabCase } from '../utils/naming.js';
import { logger } from '../utils/logger.js';
import { generateFromDefinition } from './generate.command.js';
import { validateDefinition } from './validate.command.js';

/**
 * Shows what a full generation would change without writing anything and without
 * modifying screen.yaml on disk.
 */
export async function runDryRun(options: AllOptions): Promise<void> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Parsing Markdown: ${toRelativeFromRoot(inputAbs)}`);
  const specification = await parseMarkdown(inputAbs);
  const definition = convertToScreenDefinition(specification);

  const validation = await validateDefinition(definition);
  if (!validation.ok) {
    logger.warn('Validation reported errors. Showing the diff anyway.');
  }

  const outputAbs = options.codeOutput
    ? resolveWithinRoot(options.codeOutput)
    : defaultCodeOutput(kebabCase(definition.screen.featureName));

  await generateFromDefinition({
    definition,
    outputAbs,
    dryRun: true,
    force: options.force,
  });
}
