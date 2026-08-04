import fs from 'node:fs';
import path from 'node:path';

import type { PlannedFile } from './generation-types.js';

export function applyOutputPlan(plan: PlannedFile[], dryRun: boolean): void {
  if (dryRun) {
    return;
  }
  for (const file of plan) {
    if (file.action === 'DELETE') {
      fs.unlinkSync(file.absolutePath);
      continue;
    }
    if (file.action === 'CREATE' || file.action === 'UPDATE') {
      fs.mkdirSync(path.dirname(file.absolutePath), { recursive: true });
      fs.writeFileSync(file.absolutePath, file.content, 'utf8');
    }
  }
}

export function summarizePlan(plan: PlannedFile[]): Record<string, number> {
  const summary: Record<string, number> = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    UNCHANGED: 0,
    CONFLICT: 0,
  };
  for (const file of plan) {
    summary[file.action] = (summary[file.action] ?? 0) + 1;
  }
  return summary;
}
