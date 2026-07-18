import type {
  MarkdownSection,
  MarkdownSpecification,
  MarkdownTable,
} from '../types/markdown-specification.js';
import type {
  ActionDefinition,
  ApiDefinition,
  ApiMethod,
  DetailFieldDefinition,
  OperationDefinition,
  PermissionDefinition,
  ScreenDefinition,
  StoreFieldDefinition,
  StoreUpdateDefinition,
  TypeDefinition,
  TypePropertyDefinition,
} from '../types/screen-definition.js';
import { GeneratorError } from '../utils/errors.js';
import { normalizeCell, splitBr } from '../markdown/table-parser.js';

const API_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function findSection(spec: MarkdownSpecification, heading: string): MarkdownSection {
  const section = spec.sections.find((s) => s.heading === heading);
  if (!section) {
    throw new GeneratorError('MISSING_SECTION_ERROR', `Section not found: ${heading}`, {
      section: heading,
      fix: `Add "## ${heading}" to ${spec.sourcePath}.`,
    });
  }
  return section;
}

function findTable(section: MarkdownSection, requiredHeaders: string[]): MarkdownTable {
  const table = section.tables.find((t) =>
    requiredHeaders.every((header) => t.headers.includes(header)),
  );
  if (!table) {
    const found = section.tables.map((t) => `[${t.headers.join(', ')}]`).join(' ');
    throw new GeneratorError(
      'MISSING_COLUMN_ERROR',
      `Section "${section.heading}" is missing a table with columns: ${requiredHeaders.join(', ')}`,
      {
        section: section.heading,
        line: section.line,
        fix: `Add a table containing columns [${requiredHeaders.join(
          ', ',
        )}]. Found tables: ${found || '(none)'}`,
      },
    );
  }
  return table;
}

function readMetaTable(section: MarkdownSection): Map<string, string> {
  const table = findTable(section, ['項目', '値']);
  const map = new Map<string, string>();
  for (const row of table.rows) {
    map.set(normalizeCell(row.raw['項目'] ?? ''), normalizeCell(row.raw['値'] ?? ''));
  }
  return map;
}

function requireMeta(
  map: Map<string, string>,
  key: string,
  section: string,
): string {
  const value = map.get(key);
  if (value === undefined || value === '') {
    throw new GeneratorError('MISSING_COLUMN_ERROR', `Missing meta value "${key}".`, {
      section,
      fix: `Add a row "| ${key} | <value> |" to the metadata table of section "${section}".`,
    });
  }
  return value;
}

function toBoolean(raw: string): boolean {
  return normalizeCell(raw).toLowerCase() === 'true';
}

function nullableString(raw: string | undefined): string | null {
  const value = normalizeCell(raw ?? '');
  if (value === '' || value === '-' || value === 'なし' || value === 'null') {
    return null;
  }
  return value;
}

function convertScreenMeta(spec: MarkdownSpecification): ScreenDefinition['screen'] {
  const meta = readMetaTable(findSection(spec, '画面概要'));
  const pageType = requireMeta(meta, 'ページタイプ', '画面概要');
  if (pageType !== 'tree-detail') {
    throw new GeneratorError(
      'SCHEMA_VALIDATION_ERROR',
      `Unsupported pageType "${pageType}".`,
      { section: '画面概要', fix: 'Set ページタイプ to "tree-detail".' },
    );
  }
  return {
    id: requireMeta(meta, '画面ID', '画面概要'),
    name: requireMeta(meta, '画面名', '画面概要'),
    route: requireMeta(meta, 'ルート', '画面概要'),
    pageType: 'tree-detail',
    featureName: requireMeta(meta, '機能名', '画面概要'),
  };
}

function convertPermissions(spec: MarkdownSpecification): PermissionDefinition[] {
  const table = findTable(findSection(spec, '権限制御'), ['権限コード', '用途']);
  return table.rows.map((row) => ({
    code: normalizeCell(row.raw['権限コード'] ?? ''),
    description: normalizeCell(row.raw['用途'] ?? ''),
  }));
}

function convertOperations(spec: MarkdownSpecification): OperationDefinition[] {
  const table = findTable(findSection(spec, '画面操作'), ['操作ID', '操作名', '説明']);
  return table.rows.map((row) => ({
    id: normalizeCell(row.raw['操作ID'] ?? ''),
    name: normalizeCell(row.raw['操作名'] ?? ''),
    description: normalizeCell(row.raw['説明'] ?? ''),
    requiresPermission: nullableString(row.raw['必要権限']),
  }));
}

function convertSearch(spec: MarkdownSpecification): ScreenDefinition['search'] {
  const section = findSection(spec, '検索条件');
  const meta = readMetaTable(section);
  const table = findTable(section, ['フィールド', 'ラベル', '型', '必須']);
  return {
    conditionType: requireMeta(meta, '条件型', '検索条件'),
    fields: table.rows.map((row) => ({
      name: normalizeCell(row.raw['フィールド'] ?? ''),
      label: normalizeCell(row.raw['ラベル'] ?? ''),
      type: normalizeCell(row.raw['型'] ?? ''),
      required: toBoolean(row.raw['必須'] ?? 'false'),
    })),
  };
}

function convertTree(spec: MarkdownSpecification): ScreenDefinition['tree'] {
  const section = findSection(spec, '製品構成ツリー');
  const meta = readMetaTable(section);
  const rules = findTable(section, ['ルールID', '内容']);
  return {
    nodeType: requireMeta(meta, 'ノード型', '製品構成ツリー'),
    idField: requireMeta(meta, 'IDフィールド', '製品構成ツリー'),
    detailIdField: requireMeta(meta, '詳細IDフィールド', '製品構成ツリー'),
    displayFields: splitBr(meta.get('表示フィールド') ?? ''),
    rules: rules.rows.map((row) => ({
      id: normalizeCell(row.raw['ルールID'] ?? ''),
      description: normalizeCell(row.raw['内容'] ?? ''),
    })),
  };
}

function convertDetail(spec: MarkdownSpecification): ScreenDefinition['detail'] {
  const section = findSection(spec, '製品詳細項目');
  const meta = readMetaTable(section);
  const table = findTable(section, ['フィールド', 'ラベル', '型', '必須', '編集可']);
  const formStateManagement = requireMeta(meta, 'フォーム状態管理', '製品詳細項目');
  if (formStateManagement !== 'local' && formStateManagement !== 'store') {
    throw new GeneratorError(
      'SCHEMA_VALIDATION_ERROR',
      `Invalid フォーム状態管理 "${formStateManagement}".`,
      { section: '製品詳細項目', fix: 'Use "local" or "store".' },
    );
  }
  const fields: DetailFieldDefinition[] = table.rows.map((row) => ({
    name: normalizeCell(row.raw['フィールド'] ?? ''),
    label: normalizeCell(row.raw['ラベル'] ?? ''),
    type: normalizeCell(row.raw['型'] ?? ''),
    required: toBoolean(row.raw['必須'] ?? 'false'),
    editable: toBoolean(row.raw['編集可'] ?? 'false'),
  }));
  return {
    modelType: requireMeta(meta, 'モデル型', '製品詳細項目'),
    fields,
    formStateManagement,
  };
}

function convertApis(spec: MarkdownSpecification): ApiDefinition[] {
  const table = findTable(findSection(spec, 'API一覧'), [
    'API ID',
    'API名',
    'メソッド',
    'パス',
    'リクエスト型',
    'レスポンス型',
  ]);
  return table.rows.map((row) => {
    const method = normalizeCell(row.raw['メソッド'] ?? '').toUpperCase();
    if (!API_METHODS.includes(method)) {
      throw new GeneratorError(
        'SCHEMA_VALIDATION_ERROR',
        `Invalid API method "${method}".`,
        {
          section: 'API一覧',
          line: row.line,
          fix: `Use one of ${API_METHODS.join(', ')}.`,
        },
      );
    }
    return {
      id: normalizeCell(row.raw['API ID'] ?? ''),
      name: normalizeCell(row.raw['API名'] ?? ''),
      method: method as ApiMethod,
      path: normalizeCell(row.raw['パス'] ?? ''),
      requestType: nullableString(row.raw['リクエスト型']),
      responseType: nullableString(row.raw['レスポンス型']),
      description: normalizeCell(row.raw['説明'] ?? ''),
    };
  });
}

function convertStore(spec: MarkdownSpecification): ScreenDefinition['store'] {
  const section = findSection(spec, 'Store構成');
  const meta = readMetaTable(section);
  const table = findTable(section, ['フィールド', '型', '初期値']);
  const fields: StoreFieldDefinition[] = table.rows.map((row) => ({
    name: normalizeCell(row.raw['フィールド'] ?? ''),
    type: normalizeCell(row.raw['型'] ?? ''),
    initial: normalizeCell(row.raw['初期値'] ?? 'null') || 'null',
    description: normalizeCell(row.raw['説明'] ?? ''),
  }));
  return {
    featureKey: requireMeta(meta, 'フィーチャーキー', 'Store構成'),
    fields,
  };
}

function convertTypes(spec: MarkdownSpecification): ScreenDefinition['types'] {
  const table = findTable(findSection(spec, '型定義'), [
    'カテゴリー',
    '型名',
    'プロパティ',
    '型',
  ]);
  const buckets: Record<string, Map<string, TypeDefinition>> = {
    api: new Map(),
    view: new Map(),
    action: new Map(),
  };
  for (const row of table.rows) {
    const category = normalizeCell(row.raw['カテゴリー'] ?? '');
    if (!buckets[category]) {
      throw new GeneratorError(
        'SCHEMA_VALIDATION_ERROR',
        `Invalid type category "${category}".`,
        { section: '型定義', line: row.line, fix: 'Use api, view, or action.' },
      );
    }
    const typeName = normalizeCell(row.raw['型名'] ?? '');
    const property: TypePropertyDefinition = {
      name: normalizeCell(row.raw['プロパティ'] ?? ''),
      type: normalizeCell(row.raw['型'] ?? ''),
      optional: toBoolean(row.raw['任意'] ?? 'false'),
      description: normalizeCell(row.raw['説明'] ?? ''),
    };
    const bucket = buckets[category];
    const existing = bucket.get(typeName);
    if (existing) {
      existing.properties.push(property);
    } else {
      bucket.set(typeName, { name: typeName, properties: [property] });
    }
  }
  return {
    api: [...buckets['api'].values()],
    view: [...buckets['view'].values()],
    action: [...buckets['action'].values()],
  };
}

function parseStoreUpdates(raw: string): StoreUpdateDefinition[] {
  const items = splitBr(raw);
  const updates: StoreUpdateDefinition[] = [];
  for (const item of items) {
    const eq = item.indexOf('=');
    if (eq === -1) {
      continue;
    }
    updates.push({
      field: item.slice(0, eq).trim(),
      value: item.slice(eq + 1).trim(),
    });
  }
  return updates;
}

function convertActions(spec: MarkdownSpecification): ActionDefinition[] {
  const table = findTable(findSection(spec, 'Action一覧・Store更新内容'), [
    'アクションID',
    'アクション名',
    'ペイロード型',
    '成功アクション',
    '失敗アクション',
    'Store更新内容',
  ]);
  return table.rows.map((row) => ({
    id: normalizeCell(row.raw['アクションID'] ?? ''),
    name: normalizeCell(row.raw['アクション名'] ?? ''),
    category: normalizeCell(row.raw['カテゴリー'] ?? 'general') || 'general',
    payloadType: nullableString(row.raw['ペイロード型']),
    api: nullableString(row.raw['API']),
    successAction: nullableString(row.raw['成功アクション']),
    failureAction: nullableString(row.raw['失敗アクション']),
    relatedOperation: nullableString(row.raw['関連操作']),
    storeUpdates: parseStoreUpdates(row.raw['Store更新内容'] ?? ''),
  }));
}

function convertUnsavedChanges(
  spec: MarkdownSpecification,
): ScreenDefinition['unsavedChanges'] {
  const section = findSection(spec, '未保存変更');
  const meta = readMetaTable(section);
  const opsTable = findTable(section, ['対象操作']);
  return {
    enabled: toBoolean(requireMeta(meta, '有効', '未保存変更')),
    dirtySource: requireMeta(meta, '判定元', '未保存変更'),
    confirmMessage: requireMeta(meta, '確認メッセージ', '未保存変更'),
    operations: opsTable.rows
      .map((row) => normalizeCell(row.raw['対象操作'] ?? ''))
      .filter((value) => value.length > 0),
  };
}

function convertConcurrentUpdate(
  spec: MarkdownSpecification,
): ScreenDefinition['concurrentUpdate'] {
  const meta = readMetaTable(findSection(spec, '同時更新'));
  return {
    enabled: toBoolean(requireMeta(meta, '有効', '同時更新')),
    revisionField: requireMeta(meta, 'リビジョン項目', '同時更新'),
    statusCode: Number(requireMeta(meta, 'ステータスコード', '同時更新')),
    errorCode: requireMeta(meta, 'エラーコード', '同時更新'),
    message: requireMeta(meta, 'メッセージ', '同時更新'),
  };
}

function convertDisplayRules(
  spec: MarkdownSpecification,
): ScreenDefinition['displayRules'] {
  const table = findTable(findSection(spec, '表示ルール'), ['ルールID', '条件', '挙動']);
  return table.rows.map((row) => ({
    id: normalizeCell(row.raw['ルールID'] ?? ''),
    condition: normalizeCell(row.raw['条件'] ?? ''),
    behavior: normalizeCell(row.raw['挙動'] ?? ''),
  }));
}

function convertValidations(
  spec: MarkdownSpecification,
): ScreenDefinition['validations'] {
  const table = findTable(findSection(spec, '入力チェック'), ['フィールド', 'ルール', 'メッセージ']);
  return table.rows.map((row) => ({
    field: normalizeCell(row.raw['フィールド'] ?? ''),
    rule: normalizeCell(row.raw['ルール'] ?? ''),
    message: normalizeCell(row.raw['メッセージ'] ?? ''),
  }));
}

function convertTests(spec: MarkdownSpecification): ScreenDefinition['tests'] {
  const table = findTable(findSection(spec, '主なテスト観点'), ['テストID', '対象', '内容']);
  return table.rows.map((row) => ({
    id: normalizeCell(row.raw['テストID'] ?? ''),
    target: normalizeCell(row.raw['対象'] ?? ''),
    description: normalizeCell(row.raw['内容'] ?? ''),
  }));
}

export function convertToScreenDefinition(
  spec: MarkdownSpecification,
): ScreenDefinition {
  return {
    version: 1,
    screen: convertScreenMeta(spec),
    permissions: convertPermissions(spec),
    operations: convertOperations(spec),
    search: convertSearch(spec),
    tree: convertTree(spec),
    detail: convertDetail(spec),
    apis: convertApis(spec),
    store: convertStore(spec),
    types: convertTypes(spec),
    actions: convertActions(spec),
    unsavedChanges: convertUnsavedChanges(spec),
    concurrentUpdate: convertConcurrentUpdate(spec),
    displayRules: convertDisplayRules(spec),
    validations: convertValidations(spec),
    tests: convertTests(spec),
  };
}
