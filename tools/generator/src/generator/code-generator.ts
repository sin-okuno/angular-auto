import type { RenderedFile } from '../types/generator-options.js';
import type {
  DetailFieldDefinition,
  ScreenDefinition,
  TypeDefinition,
} from '../types/screen-definition.js';
import { buildActions, type RenderedAction } from '../mapping/action-mapper.js';
import { buildApis, type RenderedApi } from '../mapping/api-mapper.js';
import {
  buildModels,
  type ModelContext,
  type RenderedModelFile,
} from '../mapping/model-mapper.js';
import { buildNaming, type NamingContext } from '../mapping/naming-mapper.js';
import { GeneratorError } from '../utils/errors.js';
import { kebabCase } from '../utils/naming.js';
import { renderTemplate } from './template-renderer.js';

interface NodeProp {
  name: string;
  isChildren: boolean;
}

interface NamedProp {
  name: string;
}

interface FlowContext {
  nodeType: string;
  nodeDtoType: string;
  nodeProps: NodeProp[];
  detailModelType: string;
  detailResponseType: string;
  detailProps: NamedProp[];
  treeResponseType: string;
  treeNodesField: string;
  treeRequestType: string;
  treeRequestProps: NamedProp[];
  updateRequestType: string;
  updateRequestProps: NamedProp[];
  loadTreePayloadType: string;
  savePayloadType: string;
  detailMethodName: string;
  detailPathExample: string;
}

function baseToken(typeExpr: string): string {
  return typeExpr.split('|')[0].trim().replace(/\[\]$/, '');
}

function buildFlow(definition: ScreenDefinition): FlowContext {
  const typeByName = new Map<string, TypeDefinition>();
  for (const type of [
    ...definition.types.api,
    ...definition.types.view,
    ...definition.types.action,
  ]) {
    typeByName.set(type.name, type);
  }

  const findApi = (id: string) => {
    const api = definition.apis.find((a) => a.id === id);
    if (!api) {
      throw new GeneratorError(
        'API_REFERENCE_ERROR',
        `tree-detail templates require an API with id "${id}".`,
        {
          section: 'API一覧',
          fix: `Add an API row with id "${id}" (expected: loadTree, loadDetail, updateDetail).`,
        },
      );
    }
    return api;
  };

  const findAction = (id: string) => {
    const action = definition.actions.find((a) => a.id === id);
    if (!action || !action.payloadType) {
      throw new GeneratorError(
        'ACTION_REFERENCE_ERROR',
        `tree-detail templates require action "${id}" with a payload type.`,
        {
          section: 'Action一覧・Store更新内容',
          fix: `Add action "${id}" with a payload type (expected: loadTree, saveProduct).`,
        },
      );
    }
    return action;
  };

  const treeApi = findApi('loadTree');
  const detailApi = findApi('loadDetail');
  const updateApi = findApi('updateDetail');

  const nodeType = definition.tree.nodeType;
  const treeResponseType = treeApi.responseType ?? '';
  const treeResponseDef = typeByName.get(treeResponseType);
  const nodesProperty = treeResponseDef?.properties.find((p) => /\[\]$/.test(p.type));
  const treeNodesField = nodesProperty?.name ?? 'nodes';
  const nodeDtoType = nodesProperty ? baseToken(nodesProperty.type) : `${nodeType}Dto`;

  const nodeDef = typeByName.get(nodeType);
  const nodeProps: NodeProp[] = (nodeDef?.properties ?? []).map((p) => ({
    name: p.name,
    isChildren: baseToken(p.type) === nodeType && /\[\]$/.test(p.type),
  }));

  const detailModelType = definition.detail.modelType;
  const detailDef = typeByName.get(detailModelType);
  const detailProps: NamedProp[] = (detailDef?.properties ?? []).map((p) => ({ name: p.name }));

  const treeRequestType = treeApi.requestType ?? '';
  const treeRequestProps: NamedProp[] = (
    typeByName.get(treeRequestType)?.properties ?? []
  ).map((p) => ({ name: p.name }));

  const updateRequestType = updateApi.requestType ?? '';
  const updateRequestProps: NamedProp[] = (
    typeByName.get(updateRequestType)?.properties ?? []
  ).map((p) => ({ name: p.name }));

  return {
    nodeType,
    nodeDtoType,
    nodeProps,
    detailModelType,
    detailResponseType: detailApi.responseType ?? '',
    detailProps,
    treeResponseType,
    treeNodesField,
    treeRequestType,
    treeRequestProps,
    updateRequestType,
    updateRequestProps,
    loadTreePayloadType: findAction('loadTree').payloadType as string,
    savePayloadType: findAction('saveProduct').payloadType as string,
    detailMethodName: 'loadDetail',
    detailPathExample: detailApi.path.replace(/\{[a-zA-Z0-9_]+\}/g, 'P1'),
  };
}

interface HeaderContext {
  sourceSpecification: string;
  screenDefinition: string;
}

/**
 * Deterministic file header, derived solely from the definition so that every
 * entry point (generate/all/check/dry-run) produces byte-identical output.
 */
export function buildHeader(definition: ScreenDefinition): HeaderContext {
  const base = kebabCase(definition.screen.featureName);
  return {
    sourceSpecification: `specs/${base}.md`,
    screenDefinition: `screens/${base}.yaml`,
  };
}

interface FormFieldContext {
  name: string;
  label: string;
  type: string;
  disabled: boolean;
  defaultValue: string;
  validators: string;
  editable: boolean;
}

interface TemplateContext {
  header: HeaderContext;
  naming: NamingContext;
  screen: ScreenDefinition['screen'];
  permissions: ScreenDefinition['permissions'];
  operations: ScreenDefinition['operations'];
  search: ScreenDefinition['search'];
  tree: ScreenDefinition['tree'];
  detail: ScreenDefinition['detail'];
  apis: RenderedApi[];
  store: ScreenDefinition['store'];
  models: ModelContext;
  actions: RenderedAction[];
  unsavedChanges: ScreenDefinition['unsavedChanges'];
  concurrentUpdate: ScreenDefinition['concurrentUpdate'];
  displayRules: ScreenDefinition['displayRules'];
  validations: ScreenDefinition['validations'];
  tests: ScreenDefinition['tests'];
  viewPermission: string;
  updatePermission: string;
  detailIdField: string;
  revisionField: string;
  formFields: FormFieldContext[];
  editableFormFields: FormFieldContext[];
  nodeLabelBinding: string;
  viewModelNames: string[];
  apiTypeNames: string[];
  viewTypeNames: string[];
  actionTypeNames: string[];
  actionPayloadTypes: string[];
  flow: FlowContext;
}

function pickPermission(
  definition: ScreenDefinition,
  keyword: string,
  fallbackIndex: number,
): string {
  const match = definition.permissions.find((p) => p.code.includes(keyword));
  if (match) {
    return match.code;
  }
  const fallback = definition.permissions[fallbackIndex] ?? definition.permissions[0];
  return fallback ? fallback.code : keyword;
}

function defaultValueFor(type: string): string {
  if (/\[\]$/.test(type)) {
    return '[]';
  }
  if (type.includes('null')) {
    return 'null';
  }
  if (type === 'number') {
    return '0';
  }
  if (type === 'boolean') {
    return 'false';
  }
  if (type === 'string') {
    return "''";
  }
  return 'null';
}

function validatorsFor(
  field: DetailFieldDefinition,
  definition: ScreenDefinition,
): string {
  const validators: string[] = [];
  if (field.required) {
    validators.push('Validators.required');
  }
  for (const validation of definition.validations) {
    if (validation.field !== field.name) {
      continue;
    }
    if (validation.rule === 'required' && !field.required) {
      validators.push('Validators.required');
    } else if (validation.rule.startsWith('min:')) {
      validators.push(`Validators.min(${validation.rule.slice(4)})`);
    } else if (validation.rule.startsWith('max:')) {
      validators.push(`Validators.max(${validation.rule.slice(4)})`);
    } else if (validation.rule.startsWith('maxLength:')) {
      validators.push(`Validators.maxLength(${validation.rule.slice(10)})`);
    }
  }
  return [...new Set(validators)].join(', ');
}

function buildFormFields(definition: ScreenDefinition): FormFieldContext[] {
  return definition.detail.fields.map((field) => ({
    name: field.name,
    label: field.label,
    type: field.type,
    disabled: !field.editable,
    defaultValue: defaultValueFor(field.type),
    validators: validatorsFor(field, definition),
    editable: field.editable,
  }));
}

function buildContext(
  definition: ScreenDefinition,
  header: HeaderContext,
): TemplateContext {
  const formFields = buildFormFields(definition);
  return {
    header,
    naming: buildNaming(definition),
    screen: definition.screen,
    permissions: definition.permissions,
    operations: definition.operations,
    search: definition.search,
    tree: definition.tree,
    detail: definition.detail,
    apis: buildApis(definition),
    store: definition.store,
    models: buildModels(definition),
    actions: buildActions(definition),
    unsavedChanges: definition.unsavedChanges,
    concurrentUpdate: definition.concurrentUpdate,
    displayRules: definition.displayRules,
    validations: definition.validations,
    tests: definition.tests,
    viewPermission: pickPermission(definition, 'VIEW', 0),
    updatePermission: pickPermission(definition, 'UPDATE', 1),
    detailIdField: definition.tree.detailIdField,
    revisionField: definition.concurrentUpdate.revisionField,
    formFields,
    editableFormFields: formFields.filter((field) => field.editable),
    nodeLabelBinding:
      definition.tree.displayFields.length > 0
        ? definition.tree.displayFields.map((field) => `node.${field}`).join(" + ' ' + ")
        : `node.${definition.tree.idField}`,
    viewModelNames: definition.types.view.map((type) => type.name),
    apiTypeNames: definition.types.api.map((type) => type.name),
    viewTypeNames: definition.types.view.map((type) => type.name),
    actionTypeNames: definition.types.action.map((type) => type.name),
    actionPayloadTypes: [
      ...new Set(
        definition.actions
          .map((action) => action.payloadType)
          .filter((type): type is string => type !== null),
      ),
    ].sort(),
    flow: buildFlow(definition),
  };
}

const PAGE_TEMPLATE_DIR = 'tree-detail';

interface FileTemplate {
  template: string;
  output: string;
}

function fileTemplates(naming: NamingContext): FileTemplate[] {
  const base = naming.fileBase;
  const page = `pages/${base}`;
  const store = 'store';
  const services = 'services';
  const mappers = 'mappers';
  const guards = 'guards';
  return [
    { template: 'module.ts.hbs', output: `${base}.module.ts` },
    { template: 'routing.module.ts.hbs', output: `${base}-routing.module.ts` },
    { template: 'component.ts.hbs', output: `${page}/${base}.component.ts` },
    { template: 'component.html.hbs', output: `${page}/${base}.component.html` },
    { template: 'component.scss.hbs', output: `${page}/${base}.component.scss` },
    { template: 'component.spec.ts.hbs', output: `${page}/${base}.component.spec.ts` },
    { template: 'state.ts.hbs', output: `${store}/${base}.state.ts` },
    { template: 'actions.ts.hbs', output: `${store}/${base}.actions.ts` },
    { template: 'reducer.ts.hbs', output: `${store}/${base}.reducer.ts` },
    { template: 'selectors.ts.hbs', output: `${store}/${base}.selectors.ts` },
    { template: 'effects.ts.hbs', output: `${store}/${base}.effects.ts` },
    { template: 'reducer.spec.ts.hbs', output: `${store}/${base}.reducer.spec.ts` },
    { template: 'selectors.spec.ts.hbs', output: `${store}/${base}.selectors.spec.ts` },
    { template: 'effects.spec.ts.hbs', output: `${store}/${base}.effects.spec.ts` },
    { template: 'service.ts.hbs', output: `${services}/${base}.service.ts` },
    { template: 'service.spec.ts.hbs', output: `${services}/${base}.service.spec.ts` },
    { template: 'mapper.ts.hbs', output: `${mappers}/${base}.mapper.ts` },
    { template: 'unsaved-changes.guard.ts.hbs', output: `${guards}/unsaved-changes.guard.ts` },
    { template: 'unsaved-changes.guard.spec.ts.hbs', output: `${guards}/unsaved-changes.guard.spec.ts` },
  ];
}

function renderModelFiles(
  context: TemplateContext,
): RenderedFile[] {
  const files: RenderedFile[] = [];
  const categories: Array<{
    dir: string;
    template: string;
    modelFiles: RenderedModelFile[];
    /** When true, each RenderedModelFile.types[0] is rendered with the single-type template. */
    singleTypeTemplate: boolean;
  }> = [
    {
      dir: 'api',
      template: 'api-model.ts.hbs',
      modelFiles: context.models.api,
      singleTypeTemplate: true,
    },
    {
      dir: 'store',
      template: 'store-model.ts.hbs',
      modelFiles: context.models.view,
      singleTypeTemplate: true,
    },
    {
      dir: 'actions',
      template: 'action-models.ts.hbs',
      modelFiles: context.models.action,
      singleTypeTemplate: false,
    },
  ];
  for (const category of categories) {
    for (const modelFile of category.modelFiles) {
      const content = category.singleTypeTemplate
        ? renderTemplate(`${PAGE_TEMPLATE_DIR}/${category.template}`, {
            ...context,
            type: modelFile.types[0],
          })
        : renderTemplate(`${PAGE_TEMPLATE_DIR}/${category.template}`, {
            ...context,
            file: modelFile,
          });
      files.push({
        relativePath: `models/${category.dir}/${modelFile.fileBase}.model.ts`,
        content,
      });
    }
    const barrel = category.modelFiles
      .map((modelFile) => `export * from './${modelFile.fileBase}.model';`)
      .join('\n');
    files.push({
      relativePath: `models/${category.dir}/index.ts`,
      content: `${modelBarrelHeader(context)}\n${barrel}\n`,
    });
  }
  return files;
}

function modelBarrelHeader(context: TemplateContext): string {
  return [
    '// AUTO-GENERATED FILE.',
    `// Source: ${context.header.sourceSpecification}`,
    `// Definition: ${context.header.screenDefinition}`,
    '// Do not edit this file directly.',
  ].join('\n');
}

/**
 * Renders the entire feature into an in-memory list of files. Pure with respect
 * to the file system: the same ScreenDefinition always yields the same output.
 */
export function generateFeature(
  definition: ScreenDefinition,
  header: HeaderContext,
): RenderedFile[] {
  const context = buildContext(definition, header);
  const naming = context.naming;
  const files: RenderedFile[] = [];

  for (const { template, output } of fileTemplates(naming)) {
    const content = renderTemplate(`${PAGE_TEMPLATE_DIR}/${template}`, context);
    files.push({ relativePath: output, content });
  }

  files.push(...renderModelFiles(context));

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}
