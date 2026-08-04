import type { ValidationError } from './validation-error.types.js';

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
