import type { Table } from 'mdast';

import type {
  DraftComponent,
  DraftComponentType,
  DraftForm,
  DraftImplementationRule,
  DraftModuleConfig,
  DraftRoutingConfig,
  DraftTestCase,
} from '../domain/draft-screen.types.js';
import type { ParserWarning } from '../domain/parser-warning.types.js';
import type { SourceLocation } from '../domain/source-location.types.js';
import { asBoolean, asNullableString, asString, splitCommaList } from '../utilities/normalize.js';
import type { ParsedMarkdownStructure } from './markdown-ast-parser.js';
import { parseGfmTable } from './markdown-table-parser.js';
import { classifyTable } from './table-classifier.js';

export interface ComponentsParseResult {
  componentTypes: DraftComponentType[];
  implementationRules: DraftImplementationRule[];
  components: DraftComponent[];
  forms: DraftForm[];
  module: DraftModuleConfig;
  routing: DraftRoutingConfig;
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
  row: { values: Record<string, string | number | boolean | null> },
  ...keys: string[]
): string | number | boolean | null {
  for (const key of keys) {
    if (key in row.values) {
      return row.values[key] ?? null;
    }
  }
  return null;
}

function cellRaw(row: { raw: Record<string, string> }, ...keys: string[]): string {
  for (const key of keys) {
    if (key in row.raw) {
      return row.raw[key] ?? '';
    }
  }
  return '';
}

function emptyComponent(partial: Partial<DraftComponent> & Pick<DraftComponent, 'id' | 'source'>): DraftComponent {
  return {
    className: '',
    selector: '',
    type: 'presentational',
    parent: null,
    storeAccess: false,
    ownsForm: false,
    responsibilities: [],
    selectors: [],
    dispatchActions: [],
    childBindings: [],
    inputs: [],
    outputs: [],
    formControls: [],
    localState: [],
    behaviorRules: [],
    prohibitions: [],
    appliedRules: [],
    ...partial,
  };
}

function findComponentContext(
  componentsById: Map<string, DraftComponent>,
  componentsByClass: Map<string, DraftComponent>,
  sectionPath: string[],
): DraftComponent | null {
  for (let index = sectionPath.length - 1; index >= 0; index -= 1) {
    const heading = sectionPath[index] ?? '';
    const byClass = componentsByClass.get(heading);
    if (byClass) {
      return byClass;
    }
    const byId = componentsById.get(heading);
    if (byId) {
      return byId;
    }
  }
  return null;
}

export function parseComponentsDocument(
  structure: ParsedMarkdownStructure,
  fileName: string,
): ComponentsParseResult {
  const warnings: ParserWarning[] = [];
  let classifiedTableCount = 0;

  const componentTypes: DraftComponentType[] = [];
  const implementationRules: DraftImplementationRule[] = [];
  const componentsById = new Map<string, DraftComponent>();
  const componentsByClass = new Map<string, DraftComponent>();
  const forms: DraftForm[] = [];
  const tests: DraftTestCase[] = [];
  const module: DraftModuleConfig = { declarations: [] };
  const routing: DraftRoutingConfig = { routes: [] };

  for (const located of structure.tables) {
    const parsed = parseGfmTable(located.node as Table, located.lineStart, located.lineEnd);
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
    const current = findComponentContext(
      componentsById,
      componentsByClass,
      located.section.path,
    );

    switch (classification.kind) {
      case 'componentTypes': {
        for (const row of parsed.rows) {
          componentTypes.push({
            id: asString(cell(row, '種別ID')),
            name: asString(cell(row, '種別名')),
            description: asString(cell(row, '説明')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'implementationRules': {
        for (const row of parsed.rows) {
          implementationRules.push({
            id: asString(cell(row, '原則ID')),
            appliesTo: splitCommaList(asNullableString(cell(row, '適用種別')) ?? ''),
            content: asString(cell(row, '内容')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'componentsCatalog': {
        for (const row of parsed.rows) {
          const id = asString(cell(row, 'Component ID'));
          const className = asString(cell(row, 'クラス名'));
          const component = emptyComponent({
            id,
            className,
            selector: asString(cell(row, 'Selector')),
            type: asString(cell(row, '種別')),
            parent: asNullableString(cell(row, '親Component')),
            storeAccess: asBoolean(cell(row, 'Store接続')),
            ownsForm: asBoolean(cell(row, 'フォーム所有')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
          componentsById.set(id, component);
          componentsByClass.set(className, component);
        }
        break;
      }
      case 'componentMeta': {
        if (!current) {
          break;
        }
        for (const row of parsed.rows) {
          const key = asString(cell(row, '項目'));
          const value = cell(row, '値');
          if (key === 'Component ID') current.id = asString(value);
          if (key === 'クラス名') current.className = asString(value);
          if (key === 'Selector') current.selector = asString(value);
          if (key === '種別') current.type = asString(value);
          if (key === 'Store接続') current.storeAccess = asBoolean(value);
          if (key === 'フォーム所有') current.ownsForm = asBoolean(value);
          if (key === 'フォームID') current.formId = asNullableString(value);
          if (key === 'フォーム型') current.formType = asNullableString(value);
          if (key === 'Change Detection') current.changeDetection = asNullableString(value);
        }
        componentsById.set(current.id, current);
        if (current.className) {
          componentsByClass.set(current.className, current);
        }
        break;
      }
      case 'componentAppliedRules': {
        if (!current) break;
        for (const row of parsed.rows) {
          const ruleId = asString(cell(row, '原則ID'));
          if (ruleId) current.appliedRules.push(ruleId);
        }
        break;
      }
      case 'componentResponsibilities': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.responsibilities.push({
            id: asString(cell(row, '責務ID')),
            content: asString(cell(row, '内容')),
          });
        }
        break;
      }
      case 'componentSelectors': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.selectors.push({
            id: asString(cell(row, 'Selector ID')),
            reference: asString(cell(row, 'Storeまたはルール参照', '参照')),
          });
        }
        break;
      }
      case 'componentDispatchActions': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.dispatchActions.push({
            trigger: asString(cell(row, '発生契機')),
            action: asString(cell(row, 'Action')),
          });
        }
        break;
      }
      case 'componentChildBindings': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.childBindings.push({
            child: asString(cell(row, '子Component')),
            input: asString(cell(row, 'Input')),
            source: asString(cell(row, '参照元')),
          });
        }
        break;
      }
      case 'componentInputs': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.inputs.push({
            id: asString(cell(row, 'Input ID')),
            name: asString(cell(row, 'Input名')),
            type: cellRaw(row, '型', '型または参照'),
            required: asBoolean(cell(row, '必須'), true),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'componentOutputs': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.outputs.push({
            id: asString(cell(row, 'Output ID')),
            name: asString(cell(row, 'Output名')),
            payloadType: asNullableString(cell(row, 'Payload型')),
            operation: asNullableString(cell(row, '操作')),
            action: asNullableString(cell(row, 'Action')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'componentFormControls': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.formControls.push({
            id: asString(cell(row, 'Control ID')),
            name: asString(cell(row, 'Control名')),
            field: asNullableString(cell(row, 'フィールド')),
            apiParameter: asNullableString(cell(row, 'APIパラメータ')),
            validation: asNullableString(cell(row, 'Validation')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'componentLocalState': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.localState.push({
            id: asString(cell(row, 'State ID')),
            name: asString(cell(row, '状態名')),
            type: cellRaw(row, '型'),
            initial: cellRaw(row, '初期値'),
            description: asString(cell(row, '説明')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'componentBehaviorRules': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.behaviorRules.push({
            id: asString(cell(row, '動作ID', 'ルールID', '条件ID')),
            content: asString(cell(row, '内容', '条件')),
          });
        }
        break;
      }
      case 'componentProhibitions': {
        if (!current) break;
        for (const row of parsed.rows) {
          current.prohibitions.push({
            id: asString(cell(row, '禁止事項ID')),
            content: asString(cell(row, '内容')),
          });
        }
        break;
      }
      case 'forms': {
        for (const row of parsed.rows) {
          forms.push({
            id: asString(cell(row, 'Form ID')),
            ownerComponent: asString(cell(row, '所有Component')),
            type: asString(cell(row, '型')),
            componentKind: asString(cell(row, '種別')),
            storePersistence: asString(cell(row, 'Storeへの保存')),
            dirtyUsage: asString(cell(row, 'dirty判定')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      case 'moduleDeclarations': {
        for (const row of parsed.rows) {
          module.declarations.push({
            component: asString(cell(row, 'Component')),
            type: asString(cell(row, '種別')),
          });
        }
        break;
      }
      case 'moduleRouting': {
        for (const row of parsed.rows) {
          routing.routes.push({
            path: asString(cell(row, 'パス')),
            component: asString(cell(row, 'Component')),
            guard: asNullableString(cell(row, 'Guard')),
          });
        }
        break;
      }
      case 'tests': {
        for (const row of parsed.rows) {
          tests.push({
            id: asString(cell(row, 'テストID')),
            target: asString(cell(row, 'Component', '対象')),
            content: asString(cell(row, '内容')),
            source: source(fileName, located.section.path, row.lineStart, row.lineEnd),
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    componentTypes,
    implementationRules,
    components: [...componentsById.values()],
    forms,
    module,
    routing,
    tests,
    warnings,
    classifiedTableCount,
  };
}
