import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

function collectDuplicates(
  items: Array<{ id: string; source?: { file: string; section: string; lineStart: number; lineEnd: number } }>,
  label: string,
  errors: ValidationError[],
): void {
  const seen = new Map<string, number>();
  for (const item of items) {
    const count = seen.get(item.id) ?? 0;
    seen.set(item.id, count + 1);
    if (count >= 1) {
      errors.push(
        fromSource(item.source, {
          code: 'DUPLICATE_ID_ERROR',
          id: item.id,
          field: 'id',
          value: item.id,
          message: `Duplicate ${label} ID "${item.id}".`,
        }),
      );
    }
  }
}

export function validateIds(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  collectDuplicates(draft.permissions, 'permission', errors);
  collectDuplicates(draft.operations, 'operation', errors);
  collectDuplicates(draft.apis, 'api', errors);
  collectDuplicates(draft.types, 'type', errors);
  collectDuplicates(draft.actions, 'action', errors);
  collectDuplicates(draft.store.fields, 'store field', errors);
  collectDuplicates(draft.effects, 'effect', errors);
  collectDuplicates(
    draft.validations.map((item) => ({
      id: `${item.scope}:${item.id}`,
      source: item.source,
    })),
    'validation',
    errors,
  );
  collectDuplicates(draft.mappers, 'mapper', errors);
  collectDuplicates(draft.forms, 'form', errors);
  collectDuplicates(draft.componentTypes, 'component type', errors);
  collectDuplicates(
    draft.implementationRules.map((item) => ({
      id: `${item.id}:${item.appliesTo.slice().sort().join('+')}`,
      source: item.source,
    })),
    'implementation rule',
    errors,
  );
  collectDuplicates(draft.components, 'component', errors);

  for (const component of draft.components) {
    collectDuplicates(
      component.inputs.map((item) => ({ id: item.id, source: item.source })),
      `component ${component.id} input`,
      errors,
    );
    collectDuplicates(
      component.outputs.map((item) => ({ id: item.id, source: item.source })),
      `component ${component.id} output`,
      errors,
    );
    collectDuplicates(
      component.responsibilities.map((item) => ({ id: item.id, source: component.source })),
      `component ${component.id} responsibility`,
      errors,
    );
    collectDuplicates(
      component.localState.map((item) => ({ id: item.id, source: item.source })),
      `component ${component.id} local state`,
      errors,
    );
    collectDuplicates(
      component.formControls.map((item) => ({ id: item.id, source: item.source })),
      `component ${component.id} form control`,
      errors,
    );
    collectDuplicates(
      component.prohibitions.map((item) => ({ id: item.id, source: component.source })),
      `component ${component.id} prohibition`,
      errors,
    );
    collectDuplicates(
      component.behaviorRules.map((item) => ({ id: item.id, source: component.source })),
      `component ${component.id} behavior rule`,
      errors,
    );
  }

  return errors;
}
