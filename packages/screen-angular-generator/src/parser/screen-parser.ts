import type {
  DraftAction,
  DraftApi,
  DraftApiParameter,
  DraftDisplayRule,
  DraftEffectRule,
  DraftField,
  DraftMapper,
  DraftOperation,
  DraftPermission,
  DraftReducerRule,
  DraftScreenMeta,
  DraftStoreField,
  DraftTestCase,
  DraftType,
  DraftValidation,
  DraftRule,
  DraftUnsavedChanges,
  DraftConcurrentUpdate,
} from '../domain/draft-screen.types.js';
import type { ParserWarning } from '../domain/parser-warning.types.js';
import type { SourceLocation } from '../domain/source-location.types.js';
import { asBoolean, asNullableString, asString } from '../utilities/normalize.js';
import type { LocatedNode, ParsedMarkdownStructure } from './markdown-ast-parser.js';
import { parseGfmTable, type ParsedTable } from './markdown-table-parser.js';
import { classifyTable } from './table-classifier.js';
import type { Table } from 'mdast';

export interface ScreenParseResult {
  screen: DraftScreenMeta;
  permissions: DraftPermission[];
  operations: DraftOperation[];
  fields: DraftField[];
  apis: DraftApi[];
  types: DraftType[];
  actions: DraftAction[];
  storeFeatureKey: string | null;
  storeFields: DraftStoreField[];
  reducerRules: DraftReducerRule[];
  nonStoreState: Array<{ id: string; name: string; managedBy: string }>;
  effects: DraftEffectRule[];
  validations: DraftValidation[];
  mappers: DraftMapper[];
  displayRules: DraftDisplayRule[];
  unsavedChanges: DraftUnsavedChanges;
  concurrentUpdate: DraftConcurrentUpdate;
  rules: DraftRule[];
  tests: DraftTestCase[];
  warnings: ParserWarning[];
  classifiedTableCount: number;
}

function source(
  file: string,
  sectionPath: string[],
  lineStart: number,
  lineEnd: number,
): SourceLocation {
  return {
    file,
    section: sectionPath.join(' > '),
    lineStart,
    lineEnd,
  };
}

function cell(
  row: { values: Record<string, string | number | boolean | null>; raw: Record<string, string> },
  ...keys: string[]
): string | number | boolean | null {
  for (const key of keys) {
    if (key in row.values) {
      return row.values[key] ?? null;
    }
  }
  return null;
}

function cellRaw(
  row: { raw: Record<string, string> },
  ...keys: string[]
): string {
  for (const key of keys) {
    if (key in row.raw) {
      return row.raw[key] ?? '';
    }
  }
  return '';
}

function typeCategory(typeId: string): DraftType['category'] {
  if (typeId.startsWith('api.')) return 'api';
  if (typeId.startsWith('view.')) return 'view';
  if (typeId.startsWith('payload.')) return 'payload';
  if (typeId.startsWith('common.')) return 'common';
  return 'unknown';
}

function splitStoreUpdates(raw: string): string[] {
  return raw
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseScreenDocument(
  structure: ParsedMarkdownStructure,
  fileName: string,
): ScreenParseResult {
  const warnings: ParserWarning[] = [];
  let classifiedTableCount = 0;

  const screen: DraftScreenMeta = {
    id: 'unknown',
    name: structure.title,
    route: 'unknown',
    featureName: 'unknown',
  };

  const permissions: DraftPermission[] = [];
  const operations: DraftOperation[] = [];
  const fields: DraftField[] = [];
  const apis: DraftApi[] = [];
  const apiParameters: DraftApiParameter[] = [];
  const typesById = new Map<string, DraftType>();
  const actionsById = new Map<string, DraftAction>();
  const storeFields: DraftStoreField[] = [];
  const reducerRules: DraftReducerRule[] = [];
  const nonStoreState: Array<{ id: string; name: string; managedBy: string }> = [];
  const effects: DraftEffectRule[] = [];
  const validations: DraftValidation[] = [];
  const mappers: DraftMapper[] = [];
  const displayRules: DraftDisplayRule[] = [];
  const rules: DraftRule[] = [];
  const tests: DraftTestCase[] = [];
  let storeFeatureKey: string | null = null;

  const unsavedChanges: DraftUnsavedChanges = {
    enabled: false,
    dirtySource: null,
    confirmMessage: null,
    operations: [],
    meta: {},
  };
  const concurrentUpdate: DraftConcurrentUpdate = {
    enabled: false,
    revisionField: null,
    statusCode: null,
    errorCode: null,
    message: null,
    rules: [],
    meta: {},
  };

  for (const located of structure.tables) {
    const tableNode = located.node as Table;
    const parsed: ParsedTable = parseGfmTable(tableNode, located.lineStart, located.lineEnd);
    const classification = classifyTable(
      parsed.headers,
      located.section,
      located.precedingParagraph,
    );

    if (classification.kind === 'unknown') {
      warnings.push({
        code: 'UNCLASSIFIED_TABLE',
        file: fileName,
        section: located.section.path.join(' > '),
        lineStart: located.lineStart,
        lineEnd: located.lineEnd,
        message: 'Table could not be classified.',
        columns: parsed.headers,
      });
      continue;
    }

    classifiedTableCount += 1;
    const loc = source(fileName, located.section.path, located.lineStart, located.lineEnd);

    switch (classification.kind) {
      case 'screenMeta': {
        for (const row of parsed.rows) {
          const key = asString(cell(row, '項目ID'));
          const value = asString(cell(row, '値'));
          if (key === 'id') screen.id = value;
          if (key === 'name') screen.name = value;
          if (key === 'route') screen.route = value;
          if (key === 'featureName') screen.featureName = value;
          if (key === 'pageType') screen.pageType = value;
        }
        break;
      }
      case 'permissions': {
        for (const row of parsed.rows) {
          permissions.push({
            id: asString(cell(row, '権限ID')),
            code: asString(cell(row, '権限コード')),
            description: asString(cell(row, '用途')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'operations': {
        for (const row of parsed.rows) {
          operations.push({
            id: asString(cell(row, '操作ID')),
            name: asString(cell(row, '操作名')),
            description: asString(cell(row, '説明')),
            requiresPermission: asNullableString(cell(row, '必要権限')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'searchFields': {
        for (const row of parsed.rows) {
          fields.push({
            id: asString(cell(row, 'フィールドID')),
            name: asString(cell(row, 'フィールド名')),
            label: asString(cell(row, 'ラベル')),
            type: cellRaw(row, '型'),
            required: asBoolean(cell(row, '必須')),
            initialValue: asNullableString(cell(row, '初期値')),
            apiParameter: asNullableString(cell(row, 'APIパラメータ')),
            category: 'search',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'detailFields': {
        for (const row of parsed.rows) {
          fields.push({
            id: asString(cell(row, 'フィールドID')),
            name: asString(cell(row, 'フィールド名')),
            label: asString(cell(row, 'ラベル')),
            type: cellRaw(row, '型'),
            required: asBoolean(cell(row, '必須')),
            editable: asBoolean(cell(row, '編集可'), false),
            apiUpdateTarget: asBoolean(cell(row, 'API更新対象'), false),
            apiParameter: asNullableString(cell(row, 'APIパラメータ')),
            category: 'detail',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'treeDisplayFields': {
        for (const row of parsed.rows) {
          fields.push({
            id: asString(cell(row, '表示項目ID')),
            name: asString(cell(row, 'フィールド')),
            label: asString(cell(row, 'フィールド')),
            type: 'string',
            required: false,
            category: 'treeDisplay',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'apis': {
        for (const row of parsed.rows) {
          apis.push({
            id: asString(cell(row, 'API ID')),
            name: asString(cell(row, 'API名')),
            method: asString(cell(row, 'メソッド')).toUpperCase(),
            path: asString(cell(row, 'パス')),
            requestType: asNullableString(cell(row, 'リクエスト型')),
            responseType: asNullableString(cell(row, 'レスポンス型')),
            permission: asNullableString(cell(row, '必要権限')),
            description: asString(cell(row, '説明')),
            parameters: [],
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'apiParameters': {
        for (const row of parsed.rows) {
          apiParameters.push({
            id: asString(cell(row, 'パラメータID')),
            api: asString(cell(row, 'API')),
            name: asString(cell(row, 'パラメータ名')),
            location: asString(cell(row, '送信先')),
            type: cellRaw(row, '型'),
            required: asBoolean(cell(row, '必須')),
            nullAllowed: asBoolean(cell(row, 'null許可'), false),
            min: (() => {
              const value = cell(row, '最小');
              return typeof value === 'boolean' ? null : value;
            })(),
            max: (() => {
              const value = cell(row, '最大');
              return typeof value === 'boolean' ? null : value;
            })(),
            format: asNullableString(cell(row, '入力可能値・形式')),
            whenUnspecified: asNullableString(cell(row, '未指定時')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'apiValidations': {
        for (const row of parsed.rows) {
          validations.push({
            id: asString(cell(row, 'Validation ID')),
            field: asString(cell(row, 'パラメータ', 'フィールド')),
            rule: asString(cell(row, 'ルール')),
            value: cell(row, '値'),
            message: asNullableString(cell(row, 'メッセージ')),
            scope: 'api',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'screenValidations': {
        for (const row of parsed.rows) {
          validations.push({
            id: asString(cell(row, 'Validation ID')),
            field: asString(cell(row, 'フィールド')),
            rule: asString(cell(row, 'Angular Validator', 'ルール')) || 'custom',
            apiValidation: asNullableString(cell(row, 'API Validation')),
            angularValidator: asNullableString(cell(row, 'Angular Validator')),
            scope: 'screen',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'types': {
        for (const row of parsed.rows) {
          const id = asString(cell(row, '型ID'));
          const name = asString(cell(row, '型名'));
          const existing = typesById.get(id);
          const property = {
            name: asString(cell(row, 'プロパティ')),
            type: cellRaw(row, '型'),
            optional: asBoolean(cell(row, '任意'), false),
          };
          if (existing) {
            existing.properties.push(property);
          } else {
            typesById.set(id, {
              id,
              name,
              category: typeCategory(id),
              properties: [property],
              source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
            });
          }
        }
        break;
      }
      case 'actions': {
        for (const row of parsed.rows) {
          const id = asString(cell(row, 'Action ID'));
          actionsById.set(id, {
            id,
            name: asString(cell(row, 'Action名')),
            payloadType: asNullableString(cell(row, 'Payload型')),
            api: asNullableString(cell(row, 'API')),
            successAction: asNullableString(cell(row, '成功Action')),
            failureAction: asNullableString(cell(row, '失敗Action')),
            relatedOperation: asNullableString(cell(row, '関連操作')),
            storeUpdates: [],
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'reducerUpdates': {
        for (const row of parsed.rows) {
          const actionId = asString(cell(row, 'Action ID'));
          const updates = cellRaw(row, 'Store更新内容');
          reducerRules.push({
            actionId,
            updates,
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
          const action = actionsById.get(actionId);
          if (action) {
            action.storeUpdates = splitStoreUpdates(updates);
          }
        }
        break;
      }
      case 'effectRules': {
        for (const row of parsed.rows) {
          effects.push({
            id: asString(cell(row, 'ルールID')),
            action: asString(cell(row, '対象Action')),
            condition: asString(cell(row, '条件')),
            dispatchTarget: asString(cell(row, 'Dispatch先')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'storeMeta': {
        for (const row of parsed.rows) {
          const key = asString(cell(row, '項目ID'));
          const value = asString(cell(row, '値'));
          if (key === 'featureKey') {
            storeFeatureKey = value;
          }
        }
        break;
      }
      case 'storeFields': {
        for (const row of parsed.rows) {
          storeFields.push({
            id: asString(cell(row, 'Store項目ID')),
            name: asString(cell(row, 'フィールド名')),
            type: cellRaw(row, '型'),
            initial: cellRaw(row, '初期値') || 'null',
            description: asString(cell(row, '説明')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'nonStoreState': {
        for (const row of parsed.rows) {
          nonStoreState.push({
            id: asString(cell(row, '状態ID')),
            name: asString(cell(row, '状態')),
            managedBy: asString(cell(row, '管理先')),
          });
        }
        break;
      }
      case 'mappers': {
        for (const row of parsed.rows) {
          mappers.push({
            id: asString(cell(row, 'Mapper ID')),
            inputType: asString(cell(row, '入力型')),
            outputType: asString(cell(row, '出力型')),
            purpose: asString(cell(row, '用途')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'displayRules': {
        for (const row of parsed.rows) {
          displayRules.push({
            id: asString(cell(row, 'ルールID')),
            condition: asString(cell(row, '条件')),
            behavior: asString(cell(row, '挙動')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'unsavedChangesMeta': {
        for (const row of parsed.rows) {
          const key = asString(cell(row, '項目ID'));
          const value = cell(row, '値');
          unsavedChanges.meta[key] = value;
          if (key === 'enabled') unsavedChanges.enabled = asBoolean(value);
          if (key === 'dirtySource') unsavedChanges.dirtySource = asNullableString(value);
          if (key === 'confirmMessage') unsavedChanges.confirmMessage = asNullableString(value);
        }
        break;
      }
      case 'unsavedChangeOperations': {
        for (const row of parsed.rows) {
          unsavedChanges.operations.push({
            id: asString(cell(row, '対象ID')),
            operation: asString(cell(row, '操作')),
            pendingType: asString(cell(row, '保留操作種別')),
          });
        }
        break;
      }
      case 'concurrentUpdateMeta': {
        for (const row of parsed.rows) {
          const key = asString(cell(row, '項目ID'));
          const value = cell(row, '値');
          concurrentUpdate.meta[key] = value;
          if (key === 'enabled') concurrentUpdate.enabled = asBoolean(value);
          if (key === 'revisionField') concurrentUpdate.revisionField = asNullableString(value);
          if (key === 'statusCode' && typeof value === 'number') concurrentUpdate.statusCode = value;
          if (key === 'errorCode') concurrentUpdate.errorCode = asNullableString(value);
          if (key === 'message') concurrentUpdate.message = asNullableString(value);
        }
        break;
      }
      case 'tests': {
        for (const row of parsed.rows) {
          tests.push({
            id: asString(cell(row, 'テストID')),
            target: asString(cell(row, '対象', 'Component')),
            content: asString(cell(row, '内容')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'permissionRules':
      case 'searchRules':
      case 'treeRules':
      case 'detailFormRules':
      case 'apiCommonRules':
      case 'concurrentUpdateRules': {
        for (const row of parsed.rows) {
          const rule: DraftRule = {
            id: asString(cell(row, 'ルールID')),
            content: asString(cell(row, '内容', '挙動')),
            category: classification.kind,
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          };
          rules.push(rule);
          if (classification.kind === 'concurrentUpdateRules') {
            concurrentUpdate.rules.push(rule);
          }
        }
        break;
      }
      case 'apiErrors': {
        for (const row of parsed.rows) {
          rules.push({
            id: asString(cell(row, 'エラーコード')),
            content: `${asString(cell(row, '条件'))} => HTTP ${asString(cell(row, 'HTTPステータス'))}`,
            category: 'apiErrors',
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      default: {
        // Intentionally ignored informative tables (idExamples, typeNamespaces, meta-only).
        void loc;
        break;
      }
    }
  }

  for (const parameter of apiParameters) {
    const api = apis.find((item) => item.id === parameter.api);
    if (api) {
      api.parameters.push(parameter);
    }
  }

  return {
    screen,
    permissions,
    operations,
    fields,
    apis,
    types: [...typesById.values()],
    actions: [...actionsById.values()],
    storeFeatureKey,
    storeFields,
    reducerRules,
    nonStoreState,
    effects,
    validations,
    mappers,
    displayRules,
    unsavedChanges,
    concurrentUpdate,
    rules,
    tests,
    warnings,
    classifiedTableCount,
  };
}

export function countTables(structure: ParsedMarkdownStructure): number {
  return structure.tables.length;
}

export type { LocatedNode };
