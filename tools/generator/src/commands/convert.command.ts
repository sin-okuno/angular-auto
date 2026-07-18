import path from 'node:path';

import { parseMarkdown } from '../markdown/markdown-parser.js';
import { convertToScreenDefinition } from '../screen/screen-converter.js';
import { writeScreenYaml } from '../screen/screen-loader.js';
import type { ConvertOptions } from '../types/generator-options.js';
import { defaultScreenPath, resolveWithinRoot, toRelativeFromRoot } from '../generator/output-resolver.js';
import { logger } from '../utils/logger.js';

export interface ConvertResult {
  screenPath: string;
  featureKebab: string;
}

/**
 * Parses a Markdown specification and writes the derived screen.yaml.
 * Returns the resolved output path for chaining by higher-level commands.
 */
export async function runConvert(options: ConvertOptions): Promise<ConvertResult> {
  const inputAbs = resolveWithinRoot(options.input);
  logger.step(`Parsing Markdown: ${toRelativeFromRoot(inputAbs)}`);
  const specification = await parseMarkdown(inputAbs);
  const definition = convertToScreenDefinition(specification);

  const outputAbs = options.output
    ? resolveWithinRoot(options.output)
    : defaultScreenPath(inputAbs);

  await writeScreenYaml(definition, outputAbs);
  logger.success(`screen.yaml written: ${toRelativeFromRoot(outputAbs)}`);

  return {
    screenPath: outputAbs,
    featureKebab: definition.screen.featureName,
  };
}

export function screenPathFor(inputMarkdown: string, output?: string): string {
  return output ? resolveWithinRoot(output) : defaultScreenPath(resolveWithinRoot(inputMarkdown));
}

export function markdownRelative(inputMarkdown: string): string {
  return toRelativeFromRoot(resolveWithinRoot(inputMarkdown));
}

export function toProjectRelative(absolute: string): string {
  return toRelativeFromRoot(absolute);
}

export function basenameNoExt(filePath: string): string {
  return path.basename(filePath).replace(/\.[^.]+$/, '');
}
