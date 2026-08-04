import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationResult } from '../domain/validation-result.types.js';
import { validateActions } from './action-validator.js';
import { validateApis } from './api-validator.js';
import { validateArchitecture } from './architecture-validator.js';
import { validateComponents } from './component-validator.js';
import { validateForms } from './form-validator.js';
import { validateIds } from './id-validator.js';
import { validateMappers } from './mapper-validator.js';
import { validateReferences } from './reference-validator.js';
import { validateDraftSchema } from './schema-validator.js';
import { validateStore } from './store-validator.js';
import { validateValidationConsistency } from './validation-consistency-validator.js';
import type { ValidationError } from '../domain/validation-error.types.js';

export interface ValidateStages {
  schema: ValidationError[];
  ids: ValidationError[];
  references: ValidationError[];
  architecture: ValidationError[];
  apis: ValidationError[];
  validations: ValidationError[];
  other: ValidationError[];
}

export function validateSpecification(draft: DraftScreenDocument): ValidationResult & {
  stages: ValidateStages;
} {
  const stages: ValidateStages = {
    schema: validateDraftSchema(draft),
    ids: validateIds(draft),
    references: validateReferences(draft),
    architecture: validateArchitecture(draft),
    apis: validateApis(draft),
    validations: validateValidationConsistency(draft),
    other: [
      ...validateComponents(draft),
      ...validateActions(draft),
      ...validateStore(draft),
      ...validateForms(draft),
      ...validateMappers(draft),
    ],
  };

  const all = [
    ...stages.schema,
    ...stages.ids,
    ...stages.references,
    ...stages.architecture,
    ...stages.apis,
    ...stages.validations,
    ...stages.other,
  ];

  return {
    ok: all.every((item) => item.severity !== 'error'),
    errors: all.filter((item) => item.severity === 'error'),
    warnings: all.filter((item) => item.severity === 'warning'),
    stages,
  };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  const blocks = errors.map((item) => {
    const lines = [
      `[${item.code}]`,
      item.file ? `File: ${item.file}` : null,
      item.section ? `Section: ${item.section}` : null,
      item.lineStart != null ? `Lines: ${item.lineStart}-${item.lineEnd ?? item.lineStart}` : null,
      item.id ? `ID: ${item.id}` : null,
      item.field ? `Field: ${item.field}` : null,
      item.value ? `Value: ${item.value}` : null,
      '',
      item.message,
      item.candidates && item.candidates.length > 0
        ? `\nCandidates:\n${item.candidates.map((candidate) => `- ${candidate}`).join('\n')}`
        : null,
    ].filter((line): line is string => line != null);
    return lines.join('\n');
  });
  return `Validation failed with ${errors.length} errors.\n\n${blocks.join('\n\n')}`;
}
