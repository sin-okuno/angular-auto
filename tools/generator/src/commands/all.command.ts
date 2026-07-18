import { spawnSync } from 'node:child_process';

import { parseMarkdown } from '../markdown/markdown-parser.js';
import { convertToScreenDefinition } from '../screen/screen-converter.js';
import { writeScreenYaml } from '../screen/screen-loader.js';
import {
  defaultCodeOutput,
  defaultScreenPath,
  PROJECT_ROOT,
  resolveWithinRoot,
  toRelativeFromRoot,
} from '../generator/output-resolver.js';
import type { AllOptions } from '../types/generator-options.js';
import { kebabCase } from '../utils/naming.js';
import { GeneratorError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { generateFromDefinition } from './generate.command.js';
import { validateDefinition } from './validate.command.js';

function runProcess(command: string, args: string[], cwd: string): void {
  logger.step(`Running: ${command} ${args.join(' ')} (cwd: ${toRelativeFromRoot(cwd) || '.'})`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new GeneratorError('BUILD_ERROR', `Command failed: ${command} ${args.join(' ')}`, {
      fix: 'Inspect the output above and fix the reported compilation/build error.',
    });
  }
}

/**
 * End-to-end pipeline: Markdown -> screen.yaml -> validation -> code -> Prettier
 * -> write -> generator typecheck -> Angular build -> (optional) unit tests.
 */
export async function runAll(options: AllOptions): Promise<void> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Parsing Markdown: ${toRelativeFromRoot(inputAbs)}`);
  const specification = await parseMarkdown(inputAbs);
  const definition = convertToScreenDefinition(specification);

  const screenAbs = options.screenOutput
    ? resolveWithinRoot(options.screenOutput)
    : defaultScreenPath(inputAbs);
  await writeScreenYaml(definition, screenAbs);
  logger.success(`screen.yaml written: ${toRelativeFromRoot(screenAbs)}`);

  const validation = await validateDefinition(definition);
  if (!validation.ok) {
    throw new GeneratorError('SCHEMA_VALIDATION_ERROR', 'Validation failed.', {
      fix: 'Resolve the reported validation errors and re-run.',
    });
  }

  const outputAbs = options.codeOutput
    ? resolveWithinRoot(options.codeOutput)
    : defaultCodeOutput(kebabCase(definition.screen.featureName));

  await generateFromDefinition({
    definition,
    outputAbs,
    dryRun: options.dryRun,
    force: options.force,
  });

  if (options.dryRun) {
    return;
  }

  const generatorDir = resolveWithinRoot('tools/generator');
  runProcess('npm', ['run', 'typecheck'], generatorDir);

  runProcess('npx', ['ng', 'build'], PROJECT_ROOT);

  if (options.runTest) {
    runProcess(
      'npx',
      ['ng', 'test', '--watch=false', '--browsers=ChromeHeadless'],
      PROJECT_ROOT,
    );
  }

  logger.success('All steps completed successfully.');
}
