import fs from 'fs-extra';

import type { FileChange } from '../types/generator-options.js';
import { GeneratorError } from '../utils/errors.js';
import { resolveWithinRoot } from './output-resolver.js';

interface BackupEntry {
  absolutePath: string;
  existed: boolean;
  previousContent: string | null;
}

/**
 * Applies the given file changes as a simple transaction: the previous state of
 * every touched file is captured first, and if any write fails the whole batch
 * is rolled back, so a partially-updated feature is never left on disk.
 */
export async function applyChanges(changes: FileChange[]): Promise<void> {
  const actionable = changes.filter(
    (change) => change.type === 'CREATE' || change.type === 'UPDATE' || change.type === 'DELETE',
  );
  if (actionable.length === 0) {
    return;
  }

  const backups: BackupEntry[] = [];
  try {
    for (const change of actionable) {
      resolveWithinRoot(change.absolutePath);
      const existed = await fs.pathExists(change.absolutePath);
      const previousContent = existed
        ? await fs.readFile(change.absolutePath, 'utf8')
        : null;
      backups.push({ absolutePath: change.absolutePath, existed, previousContent });

      if (change.type === 'DELETE') {
        await fs.remove(change.absolutePath);
      } else {
        await fs.ensureDir(dirName(change.absolutePath));
        await fs.writeFile(change.absolutePath, change.nextContent ?? '', 'utf8');
      }
    }
  } catch (error) {
    await rollback(backups);
    const message = error instanceof Error ? error.message : String(error);
    throw new GeneratorError('FILE_WRITE_ERROR', `Failed to write files: ${message}`, {
      fix: 'The previous state was restored. Fix the reported error and retry.',
    });
  }
}

async function rollback(backups: BackupEntry[]): Promise<void> {
  for (const backup of backups.reverse()) {
    if (backup.existed && backup.previousContent !== null) {
      await fs.ensureDir(dirName(backup.absolutePath));
      await fs.writeFile(backup.absolutePath, backup.previousContent, 'utf8');
    } else if (!backup.existed) {
      await fs.remove(backup.absolutePath);
    }
  }
}

function dirName(filePath: string): string {
  return filePath.replace(/[/\\][^/\\]+$/, '');
}
