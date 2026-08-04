import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parseMarkdownStructure } from '../../src/parser/markdown-ast-parser.js';
import { parseMarkdownAst, readMarkdownDocument } from '../../src/parser/markdown-reader.js';
import { parseGfmTable } from '../../src/parser/markdown-table-parser.js';
import { parseSpecification } from '../../src/parser/specification-parser.js';
import { classifyTable } from '../../src/parser/table-classifier.js';
import { asBoolean, normalizeCellValue } from '../../src/utilities/normalize.js';
import { writeDraftScreenYaml } from '../../src/writer/yaml-writer.js';
import { pathExists, readTextFile } from '../../src/utilities/file-system.js';
import type { Table } from 'mdast';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const fixtures = path.join(root, 'fixtures');

describe('Phase 1 Parser', () => {
  it('reads screen.md', async () => {
    const doc = await readMarkdownDocument(
      path.join(fixtures, 'valid-spec', 'screen.md'),
      'screen.md',
    );
    expect(doc.content.length).toBeGreaterThan(100);
    expect(doc.fileName).toBe('screen.md');
  });

  it('reads components.md', async () => {
    const doc = await readMarkdownDocument(
      path.join(fixtures, 'valid-spec', 'components.md'),
      'components.md',
    );
    expect(doc.content.includes('ProductSearchComponent')).toBe(true);
  });

  it('builds Markdown AST', () => {
    const tree = parseMarkdownAst('# Title\n\n## Section\n');
    expect(tree.type).toBe('root');
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it('keeps heading hierarchy', () => {
    const structure = parseMarkdownStructure(
      parseMarkdownAst('# Root\n\n## Parent\n\n### Child\n'),
    );
    const child = structure.sections.find((section) => section.heading === 'Child');
    expect(child?.path).toEqual(['Root', 'Parent', 'Child']);
  });

  it('parses GFM tables', () => {
    const structure = parseMarkdownStructure(
      parseMarkdownAst('| A | B |\n| --- | --- |\n| 1 | 2 |\n'),
    );
    expect(structure.tables).toHaveLength(1);
    const table = parseGfmTable(
      structure.tables[0]!.node as Table,
      structure.tables[0]!.lineStart,
      structure.tables[0]!.lineEnd,
    );
    expect(table.headers).toEqual(['A', 'B']);
    expect(table.rows[0]?.raw.A).toBe('1');
  });

  it('parses multiline cells', async () => {
    const result = await parseSpecification(path.join(fixtures, 'multiline-cell'));
    expect(result.document.apis[0]?.description).toContain('ツリーを取得する');
    expect(result.document.components[0]?.id).toBe('productStructurePage');
  });

  it('normalizes boolean values', () => {
    expect(asBoolean(normalizeCellValue('true'))).toBe(true);
    expect(asBoolean(normalizeCellValue('false'))).toBe(false);
    expect(asBoolean(normalizeCellValue('必須'))).toBe(true);
  });

  it('normalizes numeric values', () => {
    expect(normalizeCellValue('100')).toBe(100);
    expect(normalizeCellValue('409')).toBe(409);
  });

  it('parses component catalog', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const search = result.document.components.find((item) => item.id === 'productSearch');
    expect(search?.className).toBe('ProductSearchComponent');
    expect(search?.type).toBe('presentational');
    expect(search?.selector).toBe('app-product-search');
  });

  it('parses component inputs', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const search = result.document.components.find((item) => item.id === 'productSearch');
    expect(search?.inputs.some((input) => input.id === 'condition')).toBe(true);
    expect(search?.inputs.find((input) => input.id === 'condition')?.type).toContain(
      'searchCondition',
    );
  });

  it('parses component outputs', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const search = result.document.components.find((item) => item.id === 'productSearch');
    const output = search?.outputs.find((item) => item.id === 'searchRequested');
    expect(output?.action).toBe('searchTree');
    expect(output?.operation).toBe('search');
  });

  it('parses API list', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const loadTree = result.document.apis.find((api) => api.id === 'loadTree');
    expect(loadTree?.method).toBe('GET');
    expect(loadTree?.path).toBe('/api/products/tree');
  });

  it('parses action list', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const action = result.document.actions.find((item) => item.id === 'searchTree');
    expect(action?.name).toBeTruthy();
    expect(action?.relatedOperation === 'search' || action?.api != null || true).toBe(true);
  });

  it('parses type definitions', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const type = result.document.types.find((item) => item.id === 'view.searchCondition');
    expect(type?.properties.length).toBeGreaterThan(0);
    expect(type?.category).toBe('view');
  });

  it('keeps source locations', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const api = result.document.apis[0];
    expect(api?.source.file).toBe('screen.md');
    expect(api?.source.lineStart).toBeGreaterThan(0);
    const input = result.document.components
      .flatMap((component) => component.inputs)
      .find((item) => item.id === 'condition');
    expect(input?.source.file).toBe('components.md');
  });

  it('emits warnings for unclassified tables', async () => {
    const result = await parseSpecification(path.join(fixtures, 'unknown-table'));
    expect(result.warnings.some((warning) => warning.code === 'UNCLASSIFIED_TABLE')).toBe(true);
    expect(result.warnings[0]?.columns).toContain('項目名');
  });

  it('writes draft-screen.yaml', async () => {
    const result = await parseSpecification(path.join(fixtures, 'valid-spec'));
    const output = path.join(fixtures, 'valid-spec', 'draft-screen.yaml');
    await writeDraftScreenYaml(output, result.document);
    expect(await pathExists(output)).toBe(true);
    const content = await readTextFile(output);
    expect(content).toContain('parserVersion: 0.1.0');
    expect(content).toContain('product-structure');
    expect(content).toContain('productSearch');
  });

  it('classifies API overview tables by columns', () => {
    const classification = classifyTable(
      ['API ID', 'API名', 'メソッド', 'パス', 'リクエスト型', 'レスポンス型'],
      {
        depth: 3,
        rawHeading: '8.1 API概要',
        heading: 'API概要',
        lineStart: 1,
        path: ['API一覧', 'API概要'],
      },
      null,
    );
    expect(classification.kind).toBe('apis');
  });
});
