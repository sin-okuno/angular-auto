import { createTwoFilesPatch } from 'diff';

import type { FileChange } from '../types/generator-options.js';

export interface ChangeSummary {
  created: number;
  updated: number;
  unchanged: number;
  deleted: number;
  hasChanges: boolean;
}

export function summarizeChanges(changes: FileChange[]): ChangeSummary {
  const summary: ChangeSummary = {
    created: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    hasChanges: false,
  };
  for (const change of changes) {
    switch (change.type) {
      case 'CREATE':
        summary.created += 1;
        break;
      case 'UPDATE':
        summary.updated += 1;
        break;
      case 'DELETE':
        summary.deleted += 1;
        break;
      case 'UNCHANGED':
        summary.unchanged += 1;
        break;
    }
  }
  summary.hasChanges = summary.created + summary.updated + summary.deleted > 0;
  return summary;
}

export function formatChangeList(changes: FileChange[]): string {
  return changes.map((change) => `${change.type} ${change.relativePath}`).join('\n');
}

export function createUnifiedDiff(
  relativePath: string,
  oldContent: string,
  newContent: string,
): string {
  return createTwoFilesPatch(
    relativePath,
    relativePath,
    oldContent,
    newContent,
    'current',
    'generated',
  );
}
