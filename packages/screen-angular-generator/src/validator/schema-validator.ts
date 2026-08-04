import type { ErrorObject } from 'ajv';
import { Ajv } from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ValidationError } from '../domain/validation-error.types.js';
import { error } from './validation-error-formatter.js';

const schemaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../schemas');

function loadSchema(name: string): object {
  return JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8')) as object;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const draftValidate = ajv.compile(loadSchema('draft-screen.schema.json'));
const resolvedValidate = ajv.compile(loadSchema('resolved-screen.schema.json'));

function mapSchemaErrors(schemaErrors: ErrorObject[] | null | undefined): ValidationError[] {
  return (schemaErrors ?? []).map((item) => {
    const value = item.params ? JSON.stringify(item.params) : undefined;
    return error({
      code: 'SCHEMA_VALIDATION_ERROR',
      field: item.instancePath || item.schemaPath,
      message: `${item.instancePath || '/'} ${item.message ?? 'schema validation failed'}`,
      ...(value !== undefined ? { value } : {}),
    });
  });
}

export function validateDraftSchema(document: unknown): ValidationError[] {
  const ok = draftValidate(document);
  if (ok) {
    return [];
  }
  return mapSchemaErrors(draftValidate.errors);
}

export function validateResolvedSchema(document: unknown): ValidationError[] {
  const ok = resolvedValidate(document);
  if (ok) {
    return [];
  }
  return mapSchemaErrors(resolvedValidate.errors);
}
