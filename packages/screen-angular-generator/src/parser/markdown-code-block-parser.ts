import type { Code } from 'mdast';

export interface ParsedCodeBlock {
  lang: string | null;
  value: string;
  lineStart: number;
  lineEnd: number;
}

export function parseCodeBlock(node: Code, lineStart: number, lineEnd: number): ParsedCodeBlock {
  return {
    lang: node.lang ?? null,
    value: node.value.replace(/\r\n/g, '\n'),
    lineStart,
    lineEnd,
  };
}
