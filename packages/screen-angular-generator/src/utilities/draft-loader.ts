import fs from 'node:fs/promises';
import { parse } from 'yaml';

import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import { joinPath, resolveSpecDirectory } from './paths.js';

export async function readDraftScreen(
  specOption: string,
): Promise<{ draft: DraftScreenDocument; draftPath: string }> {
  const specDir = resolveSpecDirectory(specOption);
  const draftPath = joinPath(specDir, 'draft-screen.yaml');
  const content = await fs.readFile(draftPath, 'utf8');
  const draft = parse(content) as DraftScreenDocument;
  return { draft, draftPath };
}
