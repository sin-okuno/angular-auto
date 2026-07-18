import type { Tokens } from 'marked';

import type { CellValue, MarkdownRow, MarkdownTable } from '../types/markdown-specification.js';
import { GeneratorError } from '../utils/errors.js';

const FULL_WIDTH_SPACE = /\u3000/g;
const BR_TAG = /<br\s*\/?>(?:\s*)/gi;

/** Collapses full/half width spaces and trims a raw cell string. */
export function normalizeCell(raw: string): string {
  return raw.replace(FULL_WIDTH_SPACE, ' ').replace(/\s+/g, ' ').trim();
}

/** Splits a cell on <br> into a trimmed, non-empty list. */
export function splitBr(raw: string): string[] {
  return raw
    .split(BR_TAG)
    .map((part) => normalizeCell(part))
    .filter((part) => part.length > 0);
}

/**
 * Interprets a raw cell string following the specification rules:
 * - `<br>` separated values become an array
 * - `-` / empty / `なし` mean "unset" -> null
 * - `null` -> null, `true`/`false` -> boolean, numeric -> number
 * - Union types such as `string | null` are preserved verbatim as strings.
 */
export function inferValue(raw: string): CellValue {
  if (BR_TAG.test(raw)) {
    return splitBr(raw);
  }
  const value = normalizeCell(raw);
  if (value === '' || value === '-' || value === 'なし') {
    return null;
  }
  if (value === 'null') {
    return null;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

export function parseTable(
  token: Tokens.Table,
  line: number,
): MarkdownTable {
  const headers = token.header.map((cell) => normalizeCell(cell.text));
  if (headers.length === 0) {
    throw new GeneratorError('MARKDOWN_PARSE_ERROR', 'Table has no header row.', {
      line,
    });
  }

  const rows: MarkdownRow[] = token.rows.map((cells, index) => {
    const raw: Record<string, string> = {};
    const parsed: Record<string, CellValue> = {};
    headers.forEach((header, columnIndex) => {
      const cell = cells[columnIndex];
      const text = cell ? cell.text : '';
      raw[header] = text;
      parsed[header] = inferValue(text);
    });
    return { raw, cells: parsed, line: line + 2 + index };
  });

  return { headers, rows, line };
}
