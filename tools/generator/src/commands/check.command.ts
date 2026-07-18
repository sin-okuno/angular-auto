import fs from 'fs-extra';

import { parseMarkdown } from '../markdown/markdown-parser.js';
import { convertToScreenDefinition } from '../screen/screen-converter.js';
import { serializeScreen } from '../screen/screen-loader.js';
import { validateDefinition } from './validate.command.js';
import { buildHeader, generateFeature } from '../generator/code-generator.js';
import { formatFiles } from '../generator/formatter.js';
import {
  defaultCodeOutput,
  defaultScreenPath,
  resolveChanges,
  resolveWithinRoot,
  toRelativeFromRoot,
} from '../generator/output-resolver.js';
import { formatChangeList, summarizeChanges } from '../generator/diff-calculator.js';
import type { AllOptions } from '../types/generator-options.js';
import { kebabCase } from '../utils/naming.js';
import { logger } from '../utils/logger.js';

export interface CheckResult {
  ok: boolean;
}

/**
 * Verifies that the Markdown, screen.yaml, and generated code are all in sync.
 * Exits non-zero when validation fails or anything is out of date.
 */
export async function runCheck(options: AllOptions): Promise<CheckResult> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Parsing Markdown: ${toRelativeFromRoot(inputAbs)}`);
  const specification = await parseMarkdown(inputAbs);
  const definition = convertToScreenDefinition(specification);

  const validation = await validateDefinition(definition);
  let ok = validation.ok;

  const screenAbs = options.screenOutput
    ? resolveWithinRoot(options.screenOutput)
    : defaultScreenPath(inputAbs);
  const expectedYaml = serializeScreen(definition);
  const actualYaml = (await fs.pathExists(screenAbs))
    ? await fs.readFile(screenAbs, 'utf8')
    : null;
  if (actualYaml !== expectedYaml) {
    ok = false;
    logger.error(
      `screen.yaml is out of date: ${toRelativeFromRoot(screenAbs)} (run generate:screen).`,
    );
  } else {
    logger.success('screen.yaml is up to date.');
  }

  const outputAbs = options.codeOutput
    ? resolveWithinRoot(options.codeOutput)
    : defaultCodeOutput(kebabCase(definition.screen.featureName));

  const rendered = generateFeature(definition, buildHeader(definition));
  const formatted = await formatFiles(rendered);
  const { changes } = await resolveChanges(formatted, outputAbs, options.force);
  const summary = summarizeChanges(changes);

  if (summary.hasChanges) {
    ok = false;
    logger.error('Generated code is out of date:');
    logger.plain(
      formatChangeList(
        changes.filter((change) => change.type !== 'UNCHANGED'),
      ),
    );
  } else {
    logger.success('Generated code is up to date.');
  }

  if (ok) {
    logger.success('Check passed: specification, screen.yaml, and code are in sync.');
  } else {
    logger.error('Check failed: see the differences above.');
  }

  return { ok };
}
