import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

const COMPARABLE_RULES = new Set([
  'required',
  'maxLength',
  'minLength',
  'min',
  'max',
  'integer',
  'uuid',
  'pattern',
]);

function normalizeRuleName(rule: string): string {
  const lower = rule.toLowerCase();
  if (lower.includes('maxlength')) return 'maxLength';
  if (lower.includes('minlength')) return 'minLength';
  if (lower.includes('required')) return 'required';
  if (lower.includes('integer')) return 'integer';
  if (lower.includes('uuid')) return 'uuid';
  if (lower.includes('pattern')) return 'pattern';
  if (lower === 'min' || lower.includes('min(')) return 'min';
  if (lower === 'max' || lower.includes('max(')) return 'max';
  return rule;
}

function extractValidatorConstraint(angularValidator: string | null | undefined): {
  rule: string;
  value: string | number | null;
} | null {
  if (!angularValidator) return null;
  const maxLength = angularValidator.match(/maxLength\((\d+)\)/i);
  if (maxLength) return { rule: 'maxLength', value: Number(maxLength[1]) };
  const minLength = angularValidator.match(/minLength\((\d+)\)/i);
  if (minLength) return { rule: 'minLength', value: Number(minLength[1]) };
  const min = angularValidator.match(/\bmin\((\d+)\)/i);
  if (min) return { rule: 'min', value: Number(min[1]) };
  const max = angularValidator.match(/\bmax\((\d+)\)/i);
  if (max) return { rule: 'max', value: Number(max[1]) };
  if (/required/i.test(angularValidator)) return { rule: 'required', value: true as unknown as null };
  if (/integer/i.test(angularValidator)) return { rule: 'integer', value: null };
  if (/uuid/i.test(angularValidator)) return { rule: 'uuid', value: null };
  return null;
}

export function validateValidationConsistency(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const apiById = new Map(
    draft.validations.filter((item) => item.scope === 'api').map((item) => [item.id, item]),
  );

  for (const screenValidation of draft.validations.filter((item) => item.scope === 'screen')) {
    if (!screenValidation.apiValidation) continue;
    const apiValidation = apiById.get(screenValidation.apiValidation);
    if (!apiValidation) {
      errors.push(
        fromSource(screenValidation.source, {
          code: 'VALIDATION_CONSISTENCY_ERROR',
          id: screenValidation.id,
          field: 'apiValidation',
          value: screenValidation.apiValidation,
          message: `Screen validation "${screenValidation.id}" references missing API validation "${screenValidation.apiValidation}".`,
        }),
      );
      continue;
    }

    const screenConstraint = extractValidatorConstraint(screenValidation.angularValidator);
    const apiRule = normalizeRuleName(apiValidation.rule);
    if (!screenConstraint) continue;
    if (!COMPARABLE_RULES.has(screenConstraint.rule)) continue;

    if (screenConstraint.rule !== apiRule && apiRule !== screenValidation.rule) {
      // compare by extracted rule vs api rule name
    }

    if (
      screenConstraint.rule === 'maxLength' ||
      screenConstraint.rule === 'minLength' ||
      screenConstraint.rule === 'min' ||
      screenConstraint.rule === 'max'
    ) {
      const apiValue = apiValidation.value;
      if (
        apiValue != null &&
        screenConstraint.value != null &&
        String(apiValue) !== String(screenConstraint.value)
      ) {
        errors.push(
          fromSource(screenValidation.source, {
            code: 'VALIDATION_CONSISTENCY_ERROR',
            id: screenValidation.id,
            field: screenConstraint.rule,
            value: String(screenConstraint.value),
            message: `Screen ${screenConstraint.rule}=${screenConstraint.value} does not match API ${apiValidation.id} ${apiRule}=${apiValue}.`,
          }),
        );
      }
    }
  }

  return errors;
}
