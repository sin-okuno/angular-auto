import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { fromSource } from './validation-error-formatter.js';

export function validateMappers(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const mapper of draft.mappers) {
    if (!mapper.inputType || !mapper.outputType) {
      errors.push(
        fromSource(mapper.source, {
          code: 'MAPPER_VALIDATION_ERROR',
          id: mapper.id,
          message: `Mapper "${mapper.id}" requires input and output types.`,
        }),
      );
    }
  }
  return errors;
}
