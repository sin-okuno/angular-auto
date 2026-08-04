import { PARSER_VERSION, type DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ParserWarning } from '../domain/parser-warning.types.js';
import { joinPath, resolveSpecDirectory } from '../utilities/paths.js';
import { parseMarkdownStructure } from './markdown-ast-parser.js';
import { readMarkdownDocument } from './markdown-reader.js';
import { parseComponentsDocument } from './components-parser.js';
import { parseScreenDocument } from './screen-parser.js';

export interface ParseSpecificationResult {
  document: DraftScreenDocument;
  warnings: ParserWarning[];
  stats: {
    screenTables: number;
    componentsTables: number;
    classifiedTables: number;
    unclassifiedTables: number;
  };
}

function defaultAngularConfig(): DraftScreenDocument['angular'] {
  return {
    version: 22,
    architecture: {
      standalone: false,
      moduleBased: true,
    },
    component: {
      api: 'decorators',
      dependencyInjection: 'inject',
      changeDetection: 'OnPush',
    },
    template: {
      controlFlow: 'builtIn',
      styleProperty: 'styleUrl',
    },
    forms: {
      type: 'reactive',
      typed: true,
    },
  };
}

export async function parseSpecification(specOption: string): Promise<ParseSpecificationResult> {
  const specDir = resolveSpecDirectory(specOption);
  const screenPath = joinPath(specDir, 'screen.md');
  const componentsPath = joinPath(specDir, 'components.md');

  const screenDoc = await readMarkdownDocument(screenPath, 'screen.md');
  const componentsDoc = await readMarkdownDocument(componentsPath, 'components.md');

  const screenStructure = parseMarkdownStructure(screenDoc.tree);
  const componentsStructure = parseMarkdownStructure(componentsDoc.tree);

  const screen = parseScreenDocument(screenStructure, 'screen.md');
  const components = parseComponentsDocument(componentsStructure, 'components.md');

  const warnings = [...screen.warnings, ...components.warnings];
  const classifiedTables = screen.classifiedTableCount + components.classifiedTableCount;

  const document: DraftScreenDocument = {
    metadata: {
      parserVersion: PARSER_VERSION,
      generatedAt: new Date().toISOString(),
      sourceFiles: ['screen.md', 'components.md'],
    },
    screen: screen.screen,
    angular: defaultAngularConfig(),
    permissions: screen.permissions,
    operations: screen.operations,
    fields: screen.fields,
    apis: screen.apis,
    types: screen.types,
    actions: screen.actions,
    store: {
      featureKey: screen.storeFeatureKey,
      fields: screen.storeFields,
      reducerRules: screen.reducerRules,
      selectors: [],
      nonStoreState: screen.nonStoreState,
    },
    effects: screen.effects,
    validations: screen.validations,
    mappers: screen.mappers,
    componentTypes: components.componentTypes,
    implementationRules: components.implementationRules,
    components: components.components,
    forms: components.forms,
    module: components.module,
    routing: components.routing,
    tests: [...screen.tests, ...components.tests],
    displayRules: screen.displayRules,
    unsavedChanges: screen.unsavedChanges,
    concurrentUpdate: screen.concurrentUpdate,
    rules: screen.rules,
    warnings,
  };

  return {
    document,
    warnings,
    stats: {
      screenTables: screenStructure.tables.length,
      componentsTables: componentsStructure.tables.length,
      classifiedTables,
      unclassifiedTables: warnings.filter((item) => item.code === 'UNCLASSIFIED_TABLE').length,
    },
  };
}
