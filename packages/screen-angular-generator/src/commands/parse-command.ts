import type { ParserWarning } from '../domain/parser-warning.types.js';
import { parseSpecification } from '../parser/specification-parser.js';
import { log } from '../utilities/logger.js';
import { joinPath, resolveSpecDirectory, toPosix } from '../utilities/paths.js';
import { writeDraftScreenYaml } from '../writer/yaml-writer.js';

export interface ParseCommandOptions {
  spec: string;
}

function formatWarning(warning: ParserWarning): string {
  const columns =
    warning.columns && warning.columns.length > 0
      ? `\nColumns:\n${warning.columns.map((column) => `- ${column}`).join('\n')}`
      : '';
  return [
    `[PARSER_WARNING]`,
    `File: ${warning.file}`,
    `Section: ${warning.section}`,
    `Lines: ${warning.lineStart}-${warning.lineEnd}`,
    '',
    warning.message,
    columns,
  ].join('\n');
}

export async function runParseCommand(options: ParseCommandOptions): Promise<void> {
  const specDir = resolveSpecDirectory(options.spec);

  log('PARSE', 'screen.md');
  log('PARSE', 'components.md');

  const result = await parseSpecification(options.spec);

  const totalTables = result.stats.classifiedTables + result.stats.unclassifiedTables;
  log('CLASSIFY', `${totalTables} tables`);
  if (result.stats.unclassifiedTables > 0) {
    log('WARNING', `${result.stats.unclassifiedTables} unclassified tables`);
    for (const warning of result.warnings) {
      console.log(`\n${formatWarning(warning)}\n`);
    }
  }

  const outputPath = joinPath(specDir, 'draft-screen.yaml');
  await writeDraftScreenYaml(outputPath, result.document);
  log('WRITE', toPosix(outputPath));
  log('DONE', '');
}
