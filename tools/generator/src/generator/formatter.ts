import prettier from 'prettier';

import type { RenderedFile } from '../types/generator-options.js';
import { logger } from '../utils/logger.js';

function parserForPath(relativePath: string): prettier.BuiltInParserName | null {
  if (relativePath.endsWith('.ts')) {
    return 'typescript';
  }
  if (relativePath.endsWith('.component.html') || relativePath.endsWith('.html')) {
    return 'angular';
  }
  if (relativePath.endsWith('.scss')) {
    return 'scss';
  }
  if (relativePath.endsWith('.json')) {
    return 'json';
  }
  return null;
}

/**
 * Formats every rendered file with Prettier so that generated output is stable
 * and diffs are meaningful. Formatting is deterministic given the same input.
 */
export async function formatFiles(files: RenderedFile[]): Promise<RenderedFile[]> {
  const result: RenderedFile[] = [];
  for (const file of files) {
    const parser = parserForPath(file.relativePath);
    if (!parser) {
      result.push(file);
      continue;
    }
    try {
      const formatted = await prettier.format(file.content, {
        parser,
        singleQuote: true,
        printWidth: 100,
      });
      result.push({ relativePath: file.relativePath, content: formatted });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Prettier skipped ${file.relativePath}: ${message}`);
      result.push(file);
    }
  }
  return result;
}
