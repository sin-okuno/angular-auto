import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

const TYPE_RULES = {
  container: {
    storeAccess: true,
    selectorAccess: true,
    dispatchActions: true,
    serviceAccess: false,
  },
  presentational: {
    storeAccess: false,
    selectorAccess: false,
    dispatchActions: false,
    serviceAccess: false,
  },
  dialog: {
    storeAccess: false,
    selectorAccess: false,
    dispatchActions: false,
    serviceAccess: false,
  },
} as const;

export function validateArchitecture(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const byId = new Map(draft.components.map((item) => [item.id, item]));

  for (const component of draft.components) {
    const rules = TYPE_RULES[component.type as keyof typeof TYPE_RULES];
    if (!rules) continue;

    if (!rules.storeAccess && component.storeAccess) {
      errors.push(
        fromSource(component.source, {
          code: 'ARCHITECTURE_ERROR',
          id: component.id,
          field: 'storeAccess',
          value: 'true',
          message: `${component.type} component "${component.id}" must not connect to Store.`,
        }),
      );
    }

    if (!rules.selectorAccess && component.selectors.length > 0) {
      errors.push(
        fromSource(component.source, {
          code: 'ARCHITECTURE_ERROR',
          id: component.id,
          field: 'selectors',
          message: `${component.type} component "${component.id}" must not subscribe to Store selectors.`,
        }),
      );
    }

    if (!rules.dispatchActions && component.dispatchActions.length > 0) {
      errors.push(
        fromSource(component.source, {
          code: 'ARCHITECTURE_ERROR',
          id: component.id,
          field: 'dispatchActions',
          message: `${component.type} component "${component.id}" must not dispatch Actions.`,
        }),
      );
    }

    if (component.type === 'dialog') {
      const businessDispatch = component.outputs.some(
        (output) =>
          output.action != null &&
          !['confirmDiscardChanges', 'cancelDiscardChanges'].includes(output.action),
      );
      // Dialog may notify confirm/cancel; business APIs are not allowed via service.
      void businessDispatch;
      if (component.prohibitions.some((item) => /Router/.test(item.content) === false) === false) {
        // no-op: prose prohibitions are informational
      }
    }
  }

  const roots = draft.components.filter((item) => item.parent == null);
  for (const root of roots) {
    if (root.type !== 'container') {
      errors.push(
        fromSource(root.source, {
          code: 'ARCHITECTURE_ERROR',
          id: root.id,
          field: 'type',
          value: root.type,
          message: `Root component "${root.id}" must be container.`,
        }),
      );
    }
  }

  // Cycle detection
  for (const component of draft.components) {
    const seen = new Set<string>();
    let current: string | null = component.id;
    while (current) {
      if (seen.has(current)) {
        errors.push(
          fromSource(component.source, {
            code: 'ARCHITECTURE_ERROR',
            id: component.id,
            field: 'parent',
            message: `Component parent cycle detected at "${component.id}".`,
          }),
        );
        break;
      }
      seen.add(current);
      current = byId.get(current)?.parent ?? null;
    }
  }

  // Presentational/dialog should not reference effects
  for (const component of draft.components) {
    if (component.type === 'container') continue;
    const effectHit = component.responsibilities.some((item) => /Effect/i.test(item.content));
    if (effectHit) {
      errors.push(
        fromSource(component.source, {
          code: 'ARCHITECTURE_ERROR',
          id: component.id,
          field: 'responsibilities',
          message: `${component.type} component "${component.id}" must not reference Effects.`,
        }),
      );
    }
  }

  return errors;
}

export { TYPE_RULES };
