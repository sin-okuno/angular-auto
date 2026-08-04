import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

export function validateComponents(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const componentIds = new Set(draft.components.map((item) => item.id));

  for (const component of draft.components) {
    if (component.parent && !componentIds.has(component.parent)) {
      errors.push(
        fromSource(component.source, {
          code: 'COMPONENT_VALIDATION_ERROR',
          id: component.id,
          field: 'parent',
          value: component.parent,
          message: `Parent component "${component.parent}" does not exist.`,
        }),
      );
    }

    for (const binding of component.childBindings) {
      if (!componentIds.has(binding.child) && binding.child !== component.id) {
        // child may be listed by class-ish names in some tables; only flag camelCase ids
        if (/^[a-z][A-Za-z0-9]*$/.test(binding.child) && !componentIds.has(binding.child)) {
          errors.push(
            fromSource(component.source, {
              code: 'COMPONENT_VALIDATION_ERROR',
              id: component.id,
              field: 'childBindings',
              value: binding.child,
              message: `Child component "${binding.child}" does not exist.`,
            }),
          );
        }
      }
    }

    if (component.type === 'dialog') {
      for (const output of component.outputs) {
        if (output.action && /saveProduct|loadTree|updateDetail/.test(output.action)) {
          errors.push(
            fromSource(output.source, {
              code: 'ARCHITECTURE_ERROR',
              id: `${component.id}.${output.id}`,
              field: 'action',
              value: output.action,
              message: `Dialog "${component.id}" must not execute business actions directly.`,
            }),
          );
        }
      }
    }
  }

  return errors;
}
