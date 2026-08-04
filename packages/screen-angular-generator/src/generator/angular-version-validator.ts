import type { TargetInspection } from './target-project-inspector.js';

export function validateAngularVersion(
  inspection: TargetInspection,
  requiredMajor: number,
  allowMismatch: boolean,
): { ok: boolean; message: string } {
  if (inspection.angularMajor == null) {
    return {
      ok: false,
      message: '[ANGULAR_VERSION_ERROR]\n\nRequired:\n22.x\n\nDetected:\n(missing @angular/core)',
    };
  }
  if (inspection.angularMajor !== requiredMajor) {
    const message = `[ANGULAR_VERSION_ERROR]\n\nRequired:\n${requiredMajor}.x\n\nDetected:\n${inspection.angularMajor}`;
    if (allowMismatch) {
      return { ok: true, message: `${message}\n\nContinuing because --allow-version-mismatch was set.` };
    }
    return { ok: false, message };
  }
  return { ok: true, message: `Angular ${inspection.angularMajor}.x` };
}

export function validateDependencies(inspection: TargetInspection): {
  ok: boolean;
  missing: string[];
  recommendCommand: string | null;
} {
  const missing: string[] = [];
  if (!inspection.hasNgRxStore) missing.push('@ngrx/store');
  if (!inspection.hasNgRxEffects) missing.push('@ngrx/effects');
  if (!inspection.hasForms) missing.push('@angular/forms');

  if (missing.length === 0) {
    return { ok: true, missing, recommendCommand: null };
  }

  const ngrxVersion =
    inspection.angularMajor === 22 ? '@ngrx/store@22.0.0-beta.0 @ngrx/effects@22.0.0-beta.0' : '@ngrx/store @ngrx/effects';
  const packages = missing
    .map((name) => {
      if (name.startsWith('@ngrx/')) {
        return ngrxVersion.includes(name) ? undefined : name;
      }
      return name;
    })
    .filter((value): value is string => Boolean(value));

  const recommendCommand = `npm install ${[...new Set([...packages, ...(missing.some((item) => item.startsWith('@ngrx/')) ? ngrxVersion.split(' ') : [])])].join(' ')}`;

  return { ok: false, missing, recommendCommand };
}
