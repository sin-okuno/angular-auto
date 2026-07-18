import type { Token, Tokens } from 'marked';

import type { MarkdownSection } from '../types/markdown-specification.js';
import { normalizeCell, parseTable } from './table-parser.js';

interface TokenWithLine {
  token: Token;
  line: number;
}

function countLines(raw: string): number {
  if (!raw) {
    return 0;
  }
  const matches = raw.match(/\n/g);
  return matches ? matches.length : 0;
}

/** Annotates each top-level token with its 1-based starting line. */
export function withLineNumbers(tokens: Token[]): TokenWithLine[] {
  let cursor = 1;
  const result: TokenWithLine[] = [];
  for (const token of tokens) {
    result.push({ token, line: cursor });
    cursor += countLines((token as { raw?: string }).raw ?? '');
  }
  return result;
}

/**
 * Groups the flat token stream into sections keyed by level-2 (`##`) headings.
 * Content before the first `##` heading is ignored (used for the title only).
 */
export function parseSections(tokens: TokenWithLine[]): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  for (const { token, line } of tokens) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth === 2) {
      const heading = normalizeCell((token as Tokens.Heading).text);
      current = {
        heading,
        level: 2,
        line,
        paragraphs: [],
        tables: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    if (token.type === 'table') {
      current.tables.push(parseTable(token as Tokens.Table, line));
    } else if (token.type === 'paragraph') {
      current.paragraphs.push(normalizeCell((token as Tokens.Paragraph).text));
    } else if (token.type === 'text') {
      const text = normalizeCell((token as Tokens.Text).text);
      if (text) {
        current.paragraphs.push(text);
      }
    }
  }

  return sections;
}
