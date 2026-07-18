import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Ajv, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs-extra';

import type { ScreenDefinition } from '../types/screen-definition.js';
import { GeneratorError } from '../utils/errors.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(currentDir, '../../../../schemas/screen.schema.json');

function formatSchemaError(error: ErrorObject): string {
  const location = error.instancePath || '(root)';
  return `${location} ${error.message ?? 'is invalid'}`;
}

/**
 * Validates a ScreenDefinition against the JSON Schema. Throws a
 * SCHEMA_VALIDATION_ERROR listing every failing path.
 */
export async function validateSchema(definition: ScreenDefinition): Promise<void> {
  const schema = await fs.readJson(SCHEMA_PATH);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(definition);
  if (!valid) {
    const errors = validate.errors ?? [];
    const details = errors.map(formatSchemaError).join('\n  - ');
    throw new GeneratorError(
      'SCHEMA_VALIDATION_ERROR',
      `screen.yaml failed JSON Schema validation:\n  - ${details}`,
      {
        fix: 'Fix the reported paths in the Markdown source, then regenerate screen.yaml.',
      },
    );
  }
}

export { SCHEMA_PATH };
