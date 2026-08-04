import type { Table, TableCell, TableRow } from 'mdast';
import { toString } from 'mdast-util-to-string';

import { normalizeCellValue } from '../utilities/normalize.js';
import { normalizeMultiline, normalizeText } from '../utilities/markdown-text.js';

export interface ParsedTableRow {
  raw: Record<string, string>;
  values: Record<string, string | number | boolean | null>;
  lineStart: number;
  lineEnd: number;
}

export interface ParsedTable {
  headers: string[];
  rows: ParsedTableRow[];
  lineStart: number;
  lineEnd: number;
}

function cellText(cell: TableCell): string {
  return normalizeMultiline(toString(cell));
}

export function parseGfmTable(table: Table, lineStart: number, lineEnd: number): ParsedTable {
  const [headerRow, ...bodyRows] = table.children as TableRow[];
  const headers = (headerRow?.children ?? []).map((cell) => normalizeText(cellText(cell as TableCell)));

  const rows: ParsedTableRow[] = bodyRows.map((row) => {
    const cells = row.children as TableCell[];
    const raw: Record<string, string> = {};
    const values: Record<string, string | number | boolean | null> = {};
    headers.forEach((header, index) => {
      const text = cellText(cells[index] ?? ({ type: 'tableCell', children: [] } as TableCell));
      raw[header] = text;
      values[header] = normalizeCellValue(text);
    });
    return {
      raw,
      values,
      lineStart: row.position?.start.line ?? lineStart,
      lineEnd: row.position?.end.line ?? lineEnd,
    };
  });

  return { headers, rows, lineStart, lineEnd };
}
