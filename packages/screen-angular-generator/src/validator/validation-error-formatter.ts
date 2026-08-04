import type { ValidationError } from '../domain/validation-error.types.js';
import type { SourceLocation } from '../domain/source-location.types.js';
import { suggestCandidates } from '../utilities/reference-utils.js';

export function error(
  partial: Omit<ValidationError, 'severity'> & { severity?: ValidationError['severity'] },
): ValidationError {
  const result: ValidationError = {
    severity: partial.severity ?? 'error',
    code: partial.code,
    message: partial.message,
  };
  if (partial.file !== undefined) result.file = partial.file;
  if (partial.section !== undefined) result.section = partial.section;
  if (partial.lineStart !== undefined) result.lineStart = partial.lineStart;
  if (partial.lineEnd !== undefined) result.lineEnd = partial.lineEnd;
  if (partial.id !== undefined) result.id = partial.id;
  if (partial.field !== undefined) result.field = partial.field;
  if (partial.value !== undefined) result.value = partial.value;
  if (partial.candidates !== undefined) result.candidates = partial.candidates;
  return result;
}

export function fromSource(
  source: SourceLocation | undefined,
  partial: Omit<ValidationError, 'severity' | 'file' | 'section' | 'lineStart' | 'lineEnd'> & {
    severity?: ValidationError['severity'];
  },
): ValidationError {
  return error({
    ...partial,
    ...(source
      ? {
          file: source.file,
          section: source.section,
          lineStart: source.lineStart,
          lineEnd: source.lineEnd,
        }
      : {}),
  });
}

export function missingRef(
  source: SourceLocation | undefined,
  options: {
    code?: ValidationError['code'];
    id?: string;
    field: string;
    value: string;
    kind: string;
    pool: Iterable<string>;
  },
): ValidationError {
  return fromSource(source, {
    code: options.code ?? 'REFERENCE_ERROR',
    ...(options.id !== undefined ? { id: options.id } : {}),
    field: options.field,
    value: options.value,
    message: `${options.kind} "${options.value}" was not found.`,
    candidates: suggestCandidates(options.value, options.pool),
  });
}
