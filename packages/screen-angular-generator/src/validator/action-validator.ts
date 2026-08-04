import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

export function validateActions(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const component of draft.components) {
    if (component.type === 'container') continue;
    for (const dispatch of component.dispatchActions) {
      errors.push(
        fromSource(component.source, {
          code: 'ACTION_VALIDATION_ERROR',
          id: component.id,
          field: 'dispatchActions',
          value: dispatch.action,
          message: `Action dispatch is allowed only on container components ("${component.id}" is ${component.type}).`,
        }),
      );
    }
  }

  for (const component of draft.components) {
    for (const dispatch of component.dispatchActions) {
      if (/valueChanges|keyup|hover|focus/i.test(dispatch.trigger)) {
        errors.push(
          fromSource(component.source, {
            code: 'ACTION_VALIDATION_ERROR',
            id: component.id,
            field: 'dispatchActions',
            value: dispatch.trigger,
            message: `Dispatching Actions on "${dispatch.trigger}" is prohibited.`,
          }),
        );
      }
    }
  }

  return errors;
}
