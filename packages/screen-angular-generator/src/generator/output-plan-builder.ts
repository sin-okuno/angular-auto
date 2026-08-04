import fs from 'node:fs';
import path from 'node:path';

import type { GenerationContext, PlannedFile } from './generation-types.js';
import { readManifest } from './manifest-manager.js';

const AUTO_HEADER = 'AUTO-GENERATED FILE';

export function buildOutputPlan(
  context: GenerationContext,
  targetRoot: string,
  rendered: Array<{ relativePath: string; content: string }>,
  options: { force: boolean; clean: boolean },
): PlannedFile[] {
  const featureRootAbs = path.join(targetRoot, context.featureRoot);
  const existingManifest = readManifest(featureRootAbs);
  const planned = new Map<string, PlannedFile>();

  for (const file of rendered) {
    const absolutePath = path.join(targetRoot, file.relativePath);
    const exists = fs.existsSync(absolutePath);
    let action: PlannedFile['action'] = 'CREATE';

    if (exists) {
      const current = fs.readFileSync(absolutePath, 'utf8');
      if (current === file.content) {
        action = 'UNCHANGED';
      } else if (!options.force) {
        const isGenerated = current.includes(AUTO_HEADER);
        const tracked = existingManifest?.files.includes(
          path.relative(featureRootAbs, absolutePath).split(path.sep).join('/'),
        );
        action = isGenerated || tracked ? 'CONFLICT' : 'CONFLICT';
      } else {
        const isGenerated = current.includes(AUTO_HEADER);
        const rel = path.relative(featureRootAbs, absolutePath).split(path.sep).join('/');
        const tracked = existingManifest?.files.includes(rel) ?? false;
        if (!isGenerated && !tracked) {
          action = 'CONFLICT';
        } else {
          action = 'UPDATE';
        }
      }
    }

    planned.set(file.relativePath, {
      relativePath: file.relativePath,
      absolutePath,
      content: file.content,
      action,
    });
  }

  if (options.clean && existingManifest) {
    for (const tracked of existingManifest.files) {
      const relativePath = path.posix.join(context.featureRoot, tracked);
      if (planned.has(relativePath)) continue;
      const absolutePath = path.join(targetRoot, relativePath);
      if (fs.existsSync(absolutePath)) {
        planned.set(relativePath, {
          relativePath,
          absolutePath,
          content: '',
          action: 'DELETE',
        });
      }
    }
  }

  return [...planned.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
