import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { DraftScreenDocument } from '../../src/domain/draft-screen.types.js';
import { parseSpecification } from '../../src/parser/specification-parser.js';
import { resolveSpecification } from '../../src/resolver/specification-resolver.js';
import { typeIdToTsName, componentIdToFileName, actionCreatorName } from '../../src/resolver/naming-resolver.js';
import { suggestCandidates } from '../../src/utilities/reference-utils.js';
import { validateIds } from '../../src/validator/id-validator.js';
import { validateReferences } from '../../src/validator/reference-validator.js';
import { validateArchitecture } from '../../src/validator/architecture-validator.js';
import { validateApis } from '../../src/validator/api-validator.js';
import { validateValidationConsistency } from '../../src/validator/validation-consistency-validator.js';
import { validateSpecification } from '../../src/validator/specification-validator.js';
import { writeResolvedScreenYaml } from '../../src/writer/resolved-yaml-writer.js';
import { pathExists } from '../../src/utilities/file-system.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const validSpec = path.join(root, 'fixtures', 'valid-spec');

async function loadValidDraft(): Promise<DraftScreenDocument> {
  const parsed = await parseSpecification(validSpec);
  return parsed.document;
}

describe('Phase 2 Validator', () => {
  it('validates a normal draft-screen document', async () => {
    const draft = await loadValidDraft();
    const result = validateSpecification(draft);
    expect(result.ok).toBe(true);
  });

  it('detects duplicate component IDs', async () => {
    const draft = await loadValidDraft();
    const clone = structuredClone(draft.components[0]!);
    draft.components.push(clone);
    const errors = validateIds(draft);
    expect(errors.some((item) => item.code === 'DUPLICATE_ID_ERROR')).toBe(true);
  });

  it('detects duplicate type IDs', async () => {
    const draft = await loadValidDraft();
    draft.types.push(structuredClone(draft.types[0]!));
    const errors = validateIds(draft);
    expect(errors.some((item) => item.message.includes('type'))).toBe(true);
  });

  it('detects missing actions', async () => {
    const draft = await loadValidDraft();
    const component = draft.components.find((item) => item.id === 'productSearch')!;
    component.outputs[0]!.action = 'searchTrees';
    const errors = validateReferences(draft);
    expect(errors.some((item) => item.value === 'searchTrees')).toBe(true);
  });

  it('detects missing types', async () => {
    const draft = await loadValidDraft();
    draft.apis[0]!.requestType = 'api.doesNotExist';
    const errors = validateReferences(draft);
    expect(errors.some((item) => item.value === 'api.doesNotExist')).toBe(true);
  });

  it('detects missing parent components', async () => {
    const draft = await loadValidDraft();
    const child = draft.components.find((item) => item.id === 'productSearch')!;
    child.parent = 'missingParent';
    const errors = validateReferences(draft);
    expect(errors.some((item) => item.value === 'missingParent')).toBe(true);
  });

  it('detects parent cycles', async () => {
    const draft = await loadValidDraft();
    const a = draft.components.find((item) => item.id === 'productSearch')!;
    const b = draft.components.find((item) => item.id === 'productTree')!;
    a.parent = b.id;
    b.parent = a.id;
    const errors = validateArchitecture(draft);
    expect(errors.some((item) => /cycle/i.test(item.message))).toBe(true);
  });

  it('detects presentational store access', async () => {
    const draft = await loadValidDraft();
    const search = draft.components.find((item) => item.id === 'productSearch')!;
    search.storeAccess = true;
    const errors = validateArchitecture(draft);
    expect(errors.some((item) => /must not connect to Store/.test(item.message))).toBe(true);
  });

  it('detects presentational action dispatch', async () => {
    const draft = await loadValidDraft();
    const search = draft.components.find((item) => item.id === 'productSearch')!;
    search.dispatchActions.push({ trigger: 'click', action: 'searchTree' });
    const errors = validateArchitecture(draft);
    expect(errors.some((item) => /must not dispatch Actions/.test(item.message))).toBe(true);
  });

  it('detects dialog business action execution', async () => {
    const draft = await loadValidDraft();
    const dialog = draft.components.find((item) => item.type === 'dialog')!;
    dialog.outputs.push({
      id: 'saved',
      name: 'saved',
      payloadType: null,
      operation: null,
      action: 'saveProduct',
      source: dialog.source,
    });
    const { validateComponents } = await import('../../src/validator/component-validator.js');
    const errors = validateComponents(draft);
    expect(errors.some((item) => /business actions/.test(item.message))).toBe(true);
  });

  it('detects missing APIs', async () => {
    const draft = await loadValidDraft();
    draft.actions[0]!.api = 'missingApi';
    const errors = validateReferences(draft);
    expect(errors.some((item) => item.value === 'missingApi')).toBe(true);
  });

  it('detects path parameter mismatches', async () => {
    const draft = await loadValidDraft();
    const detail = draft.apis.find((item) => item.id === 'loadDetail')!;
    detail.path = '/api/products/{productId}';
    detail.parameters = detail.parameters.filter((item) => item.name !== 'productId');
    const errors = validateApis(draft);
    expect(errors.some((item) => /Path parameter/.test(item.message))).toBe(true);
  });

  it('detects store field mismatches', async () => {
    const draft = await loadValidDraft();
    draft.store.reducerRules.push({
      actionId: 'enterPage',
      updates: 'unknownField=true',
      source: draft.actions[0]!.source,
    });
    const { validateStore } = await import('../../src/validator/store-validator.js');
    const errors = validateStore(draft);
    expect(errors.some((item) => item.value === 'unknownField')).toBe(true);
  });

  it('detects validation consistency mismatches', async () => {
    const draft = await loadValidDraft();
    const screen = draft.validations.find(
      (item) => item.scope === 'screen' && item.apiValidation && item.angularValidator?.includes('maxLength'),
    );
    expect(screen).toBeTruthy();
    const api = draft.validations.find((item) => item.id === screen!.apiValidation);
    expect(api).toBeTruthy();
    api!.value = 999;
    screen!.angularValidator = 'Validators.maxLength(100)';
    api!.rule = 'maxLength';
    const errors = validateValidationConsistency(draft);
    expect(errors.some((item) => item.code === 'VALIDATION_CONSISTENCY_ERROR')).toBe(true);
  });

  it('returns multiple errors together', async () => {
    const draft = await loadValidDraft();
    draft.types.push(structuredClone(draft.types[0]!));
    draft.apis[0]!.requestType = 'api.missingOne';
    draft.actions[0]!.api = 'missingTwo';
    const result = validateSpecification(draft);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('suggests candidate IDs', () => {
    const candidates = suggestCandidates('searchTrees', ['searchTree', 'clearSearch', 'selectNode']);
    expect(candidates[0]).toBe('searchTree');
  });
});

describe('Phase 2 Resolver', () => {
  it('maps type IDs to TypeScript names', () => {
    expect(typeIdToTsName('view.searchCondition', 'ProductSearchCondition')).toBe(
      'ProductSearchCondition',
    );
    expect(typeIdToTsName('payload.saveProduct')).toBe('SaveProduct');
  });

  it('maps component IDs to file names', () => {
    expect(componentIdToFileName('productSearch')).toBe('product-search');
  });

  it('resolves action creator names', () => {
    expect(actionCreatorName('searchTree')).toBe('searchTree');
  });

  it('resolves selector / effect / api / mapper / form names via resolved document', async () => {
    const draft = await loadValidDraft();
    const { document } = resolveSpecification(draft);
    expect(document.resolvedStore.selectors[0]?.name.startsWith('select')).toBe(true);
    expect(document.resolvedApis[0]?.methodName).toBeTruthy();
    expect(document.resolvedMappers[0]?.functionName).toBeTruthy();
    expect(document.resolvedForms[0]?.factoryName.startsWith('create')).toBe(true);
    expect(document.resolvedEffects[0]?.effectName.endsWith('$')).toBe(true);
  });

  it('resolves import paths', async () => {
    const draft = await loadValidDraft();
    const { document } = resolveSpecification(draft);
    const input = document.resolvedComponents
      .flatMap((component) => component.inputs)
      .find((item) => item.id === 'condition');
    expect(input?.type).toBeTruthy();
    if (input && 'importPath' in input.type && input.type.importPath) {
      expect(input.type.importPath.includes('models')).toBe(true);
    }
  });

  it('resolves parent components and output handlers', async () => {
    const draft = await loadValidDraft();
    const { document } = resolveSpecification(draft);
    const search = document.resolvedComponents.find((item) => item.id === 'productSearch');
    expect(search?.parent?.id).toBe('productStructurePage');
    expect(search?.outputs[0]?.handledBy?.handlerName.startsWith('on')).toBe(true);
  });

  it('applies component type rules', async () => {
    const draft = await loadValidDraft();
    const { document } = resolveSpecification(draft);
    const search = document.resolvedComponents.find((item) => item.id === 'productSearch');
    expect(search?.type.rules.storeAccess).toBe(false);
    expect(search?.type.rules.dispatchActions).toBe(false);
    const page = document.resolvedComponents.find((item) => item.id === 'productStructurePage');
    expect(page?.type.rules.storeAccess).toBe(true);
  });

  it('writes resolved-screen.yaml when valid', async () => {
    const draft = await loadValidDraft();
    const validation = validateSpecification(draft);
    expect(validation.ok).toBe(true);
    const { document } = resolveSpecification(draft);
    const output = path.join(validSpec, 'resolved-screen.yaml');
    await writeResolvedScreenYaml(output, document);
    expect(await pathExists(output)).toBe(true);
  });

  it('does not write when unresolved references exist', async () => {
    const draft = await loadValidDraft();
    draft.apis[0]!.requestType = 'api.missingType';
    const validation = validateSpecification(draft);
    expect(validation.ok).toBe(false);
  });
});
