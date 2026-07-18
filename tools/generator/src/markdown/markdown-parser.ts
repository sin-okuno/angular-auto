import fs from 'fs-extra';
import { lexer, type Tokens } from 'marked';

import type { MarkdownSection, MarkdownSpecification } from '../types/markdown-specification.js';
import { GeneratorError } from '../utils/errors.js';
import { normalizeCell } from './table-parser.js';
import { parseSections, withLineNumbers } from './section-parser.js';

export const REQUIRED_SECTIONS: readonly string[] = [
  '画面概要',
  '権限制御',
  '画面操作',
  '検索条件',
  '製品構成ツリー',
  '製品詳細項目',
  'API一覧',
  'Store構成',
  '型定義',
  'Action一覧・Store更新内容',
  '未保存変更',
  '同時更新',
  '表示ルール',
  '入力チェック',
  '主なテスト観点',
];

export async function parseMarkdown(sourcePath: string): Promise<MarkdownSpecification> {
  const content = await fs.readFile(sourcePath, 'utf8');
  return parseMarkdownContent(content, sourcePath);
}

export function parseMarkdownContent(
  content: string,
  sourcePath: string,
): MarkdownSpecification {
  const normalized = content.replace(/\r\n/g, '\n');
  const tokens = lexer(normalized);
  const annotated = withLineNumbers(tokens);

  const titleToken = annotated.find(
    ({ token }) => token.type === 'heading' && (token as Tokens.Heading).depth === 1,
  );
  const title = titleToken
    ? normalizeCell((titleToken.token as Tokens.Heading).text)
    : 'Untitled Specification';

  const sections = parseSections(annotated);
  assertRequiredSections(sections, sourcePath);

  return { sourcePath, title, sections };
}

function assertRequiredSections(sections: MarkdownSection[], sourcePath: string): void {
  const present = new Set(sections.map((section) => section.heading));
  const missing = REQUIRED_SECTIONS.filter((heading) => !present.has(heading));
  if (missing.length > 0) {
    throw new GeneratorError(
      'MISSING_SECTION_ERROR',
      `Required section(s) missing: ${missing.join(', ')}`,
      {
        section: missing[0],
        fix: `Add the following level-2 heading(s) to ${sourcePath}: ${missing
          .map((heading) => `## ${heading}`)
          .join(', ')}`,
      },
    );
  }
}
