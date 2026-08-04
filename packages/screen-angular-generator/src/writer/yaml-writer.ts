import { stringify } from 'yaml';

import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import { writeTextFile } from '../utilities/file-system.js';

export async function writeDraftScreenYaml(
  filePath: string,
  document: DraftScreenDocument,
): Promise<void> {
  const yamlText = stringify(document, {
    lineWidth: 120,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });
  await writeTextFile(filePath, yamlText);
}
