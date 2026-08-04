import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

export function validateForms(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const componentIds = new Set(draft.components.map((item) => item.id));
  for (const form of draft.forms) {
    if (!componentIds.has(form.ownerComponent)) {
      errors.push(
        fromSource(form.source, {
          code: 'FORM_VALIDATION_ERROR',
          id: form.id,
          field: 'ownerComponent',
          value: form.ownerComponent,
          message: `Form owner component "${form.ownerComponent}" does not exist.`,
        }),
      );
    }
  }
  return errors;
}
