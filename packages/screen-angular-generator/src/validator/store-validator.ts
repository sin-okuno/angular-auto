import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

export function validateStore(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const storeIds = new Set(draft.store.fields.map((item) => item.id));

  for (const field of draft.store.fields) {
    if (
      /dirty|touched|hover|focus|expanded/i.test(field.id) ||
      /dirty|touched|hover|focus|expanded/i.test(field.name)
    ) {
      errors.push(
        fromSource(field.source, {
          code: 'STORE_VALIDATION_ERROR',
          id: field.id,
          field: 'name',
          message: `Transient UI state "${field.id}" must not be stored in global Store unless explicitly specified.`,
          severity: 'warning',
        }),
      );
    }
  }

  for (const rule of draft.store.reducerRules) {
    for (const update of rule.updates
      .split(/[;\n]/)
      .map((part) => part.trim())
      .filter(Boolean)) {
      const field = update.split('=')[0]?.trim();
      if (field && /^[a-z][A-Za-z0-9]*$/.test(field) && !storeIds.has(field)) {
        errors.push(
          fromSource(rule.source, {
            code: 'STORE_VALIDATION_ERROR',
            id: rule.actionId,
            field: 'updates',
            value: field,
            message: `Reducer updates unknown Store field "${field}".`,
          }),
        );
      }
    }
  }

  return errors;
}
