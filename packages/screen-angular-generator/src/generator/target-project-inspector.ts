import fs from 'node:fs';
import path from 'node:path';

export interface TargetInspection {
  packageJsonPath: string;
  angularJsonPath: string;
  packageJson: Record<string, unknown>;
  angularMajor: number | null;
  typescriptRange: string | null;
  hasNgRxStore: boolean;
  hasNgRxEffects: boolean;
  hasForms: boolean;
  testRunner: 'karma' | 'vitest' | 'unknown';
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

function majorOf(version: string | undefined): number | null {
  if (!version) return null;
  const match = version.replace(/^[\^~>=<\s]*/, '').match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

export function inspectTargetProject(targetRoot: string): TargetInspection {
  const packageJsonPath = path.join(targetRoot, 'package.json');
  const angularJsonPath = path.join(targetRoot, 'angular.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Target package.json not found: ${packageJsonPath}`);
  }
  if (!fs.existsSync(angularJsonPath)) {
    throw new Error(`Target angular.json not found: ${angularJsonPath}`);
  }

  const packageJson = readJson(packageJsonPath);
  const deps = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
  };

  let testRunner: TargetInspection['testRunner'] = 'unknown';
  if (deps['karma'] || deps['@angular-devkit/build-angular']) {
    testRunner = 'karma';
  }
  if (deps['vitest'] && !deps['karma']) {
    testRunner = 'vitest';
  }
  if (deps['karma']) {
    testRunner = 'karma';
  }

  return {
    packageJsonPath,
    angularJsonPath,
    packageJson,
    angularMajor: majorOf(deps['@angular/core']),
    typescriptRange: deps['typescript'] ?? null,
    hasNgRxStore: Boolean(deps['@ngrx/store']),
    hasNgRxEffects: Boolean(deps['@ngrx/effects']),
    hasForms: Boolean(deps['@angular/forms']),
    testRunner,
  };
}
