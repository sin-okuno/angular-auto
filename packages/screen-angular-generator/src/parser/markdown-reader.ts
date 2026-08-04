import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { readTextFile } from '../utilities/file-system.js';

export interface MarkdownDocument {
  fileName: string;
  filePath: string;
  content: string;
  tree: Root;
}

export async function readMarkdownDocument(
  filePath: string,
  fileName: string,
): Promise<MarkdownDocument> {
  const content = await readTextFile(filePath);
  return {
    fileName,
    filePath,
    content,
    tree: parseMarkdownAst(content),
  };
}

export function parseMarkdownAst(content: string): Root {
  const normalized = content.replace(/\r\n/g, '\n');
  return unified().use(remarkParse).use(remarkGfm).parse(normalized) as Root;
}
