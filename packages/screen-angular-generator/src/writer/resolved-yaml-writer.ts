import { stringify } from 'yaml';

import type { ResolvedScreenDocument } from '../domain/resolved-screen.types.js';
import { writeTextFile } from '../utilities/file-system.js';
import { validateResolvedSchema } from '../validator/schema-validator.js';

export async function writeResolvedScreenYaml(
  filePath: string,
  document: ResolvedScreenDocument,
): Promise<void> {
  const schemaErrors = validateResolvedSchema(document);
  if (schemaErrors.length > 0) {
    throw new Error(
      `resolved-screen.yaml failed schema validation:\n${schemaErrors
        .map((item) => item.message)
        .join('\n')}`,
    );
  }
  const yamlText = stringify(document, {
    lineWidth: 120,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });
  await writeTextFile(filePath, yamlText);
}
