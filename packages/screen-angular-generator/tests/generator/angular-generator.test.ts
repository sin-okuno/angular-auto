import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { generateAngular, loadResolvedScreen } from '../../src/generator/angular-generator.js';
import { validateAngularVersion } from '../../src/generator/angular-version-validator.js';
import { buildGenerationContext } from '../../src/generator/generation-context-builder.js';
import { buildManifest, readManifest, writeManifest } from '../../src/generator/manifest-manager.js';
import { buildOutputPlan } from '../../src/generator/output-plan-builder.js';
import { renderAllFeatureFiles } from '../../src/generator/output-plan-files.js';
import { applyOutputPlan } from '../../src/generator/output-writer.js';
import type { GenerateOptions } from '../../src/generator/generation-types.js';
import type { TargetInspection } from '../../src/generator/target-project-inspector.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const specDir = path.join(packageRoot, 'specs/product-structure');
const fixtureRoot = path.join(packageRoot, 'tests/output/angular-22-app');

function baseOptions(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
  return {
    spec: specDir,
    target: fixtureRoot,
    angularVersion: 22,
    componentApi: 'decorators',
    templateControlFlow: 'builtIn',
    dependencyInjection: 'inject',
    dryRun: true,
    force: false,
    clean: false,
    allowVersionMismatch: false,
    ...overrides,
  };
}

function tempTarget(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sag-gen-'));
}

function seedMinimalAngularTarget(root: string, angularMajor = 22): void {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'temp-app',
        dependencies: {
          '@angular/core': `${angularMajor}.0.0`,
          '@angular/common': `${angularMajor}.0.0`,
          '@angular/forms': `${angularMajor}.0.0`,
          '@angular/router': `${angularMajor}.0.0`,
          '@ngrx/store': '22.0.0-beta.0',
          '@ngrx/effects': '22.0.0-beta.0',
          rxjs: '7.8.0',
        },
        devDependencies: {
          '@angular/cli': `${angularMajor}.0.0`,
          '@angular/compiler-cli': `${angularMajor}.0.0`,
          '@angular-devkit/build-angular': `${angularMajor}.0.0`,
          karma: '6.4.0',
          prettier: '3.5.3',
        },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(root, 'angular.json'), JSON.stringify({ version: 1, projects: {} }));
  fs.mkdirSync(path.join(root, 'node_modules/prettier/bin'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'node_modules/prettier/bin/prettier.cjs'),
    '#!/usr/bin/env node\nprocess.exit(0);\n',
  );
}

describe('Phase 3 Angular generator', () => {
  const temps: string[] = [];

  afterEach(() => {
    for (const dir of temps.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('loads resolved-screen.yaml', () => {
    const resolved = loadResolvedScreen(specDir);
    expect(resolved.screen.id).toBeTruthy();
    expect(resolved.resolvedComponents.length).toBeGreaterThan(0);
  });

  it('detects non-Angular-22 projects', () => {
    const inspection: TargetInspection = {
      packageJsonPath: '',
      angularJsonPath: '',
      packageJson: {},
      angularMajor: 21,
      typescriptRange: '~5.9.0',
      hasNgRxStore: true,
      hasNgRxEffects: true,
      hasForms: true,
      testRunner: 'karma',
    };
    const result = validateAngularVersion(inspection, 22, false);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('[ANGULAR_VERSION_ERROR]');
    expect(result.message).toContain('21');
  });

  it('builds generation context and renders core artifacts', () => {
    const resolved = loadResolvedScreen(specDir);
    const context = buildGenerationContext(resolved, baseOptions());
    const files = renderAllFeatureFiles(context);
    const byPath = Object.fromEntries(files.map((file) => [file.relativePath, file.content]));

    const actions = byPath[`src/app/features/${context.featureKebab}/store/${context.featureKebab}.actions.ts`]!;
    expect(actions).toContain('createActionGroup');
    expect(actions).not.toContain('standalone: false');
    expect(actions).not.toMatch(/\bany\b/);

    const state = byPath[`src/app/features/${context.featureKebab}/store/${context.featureKebab}.state.ts`]!;
    expect(state).toContain('export interface');
    expect(state).toContain('initial');

    const reducer = byPath[`src/app/features/${context.featureKebab}/store/${context.featureKebab}.reducer.ts`]!;
    expect(reducer).toContain('createReducer');
    expect(reducer).toContain('on(');

    const selectors = byPath[`src/app/features/${context.featureKebab}/store/${context.featureKebab}.selectors.ts`]!;
    expect(selectors).toContain('createSelector');
    expect(selectors).toContain(`select${context.featurePascal}ViewModel`);

    const effects = byPath[`src/app/features/${context.featureKebab}/store/${context.featureKebab}.effects.ts`]!;
    expect(effects).toContain('createEffect');
    expect(effects).toContain('ofType');
    expect(effects).not.toContain('as never');
    expect(effects).toContain('mapSearchToApi(action.condition)');
    expect(effects).toContain('mapHttpError(error)');
    expect(effects).toContain('mapTreeDtoToView');

    const api = byPath[`src/app/features/${context.featureKebab}/services/${context.featureKebab}-api.service.ts`]!;
    expect(api).toContain('HttpClient');
    expect(api).toContain('inject(HttpClient)');

    const mapper = byPath[`src/app/features/${context.featureKebab}/mappers/${context.featureKebab}.mapper.ts`]!;
    expect(mapper).toContain('export function');

    const module = byPath[`src/app/features/${context.featureKebab}/${context.featureKebab}.module.ts`]!;
    expect(module).toContain('@NgModule');
    expect(module).toContain('ReactiveFormsModule');

    const routing = byPath[`src/app/features/${context.featureKebab}/${context.featureKebab}-routing.module.ts`]!;
    expect(routing).toContain('RouterModule.forChild');

    const models = byPath[`src/app/features/${context.featureKebab}/models/${context.featureKebab}-api.models.ts`]!;
    expect(models).toContain('export interface');
    expect(models).not.toMatch(/\bany\b/);
  });

  it('generates typed forms, components, guards, and built-in control flow', () => {
    const resolved = loadResolvedScreen(specDir);
    const context = buildGenerationContext(resolved, baseOptions());
    const files = renderAllFeatureFiles(context);
    const contents = files.map((file) => file.content).join('\n');

    expect(contents).toContain('FormGroup');
    expect(contents).toContain('standalone: false');
    expect(contents).toContain('@if');
    expect(contents).toContain('CanActivateFn');
    expect(contents).toContain('CanDeactivateFn');
    expect(contents).toContain('ChangeDetectionStrategy.OnPush');
    expect(contents).not.toMatch(/:\s*any\b/);
  });

  it('dry-run does not write files', async () => {
    const target = tempTarget();
    temps.push(target);
    seedMinimalAngularTarget(target);
    const before = fs.existsSync(path.join(target, 'src/app/features'));
    await generateAngular(baseOptions({ target, dryRun: true, force: true }));
    expect(before).toBe(false);
    expect(fs.existsSync(path.join(target, 'src/app/features'))).toBe(false);
  });

  it('refuses overwrite without --force', async () => {
    const target = tempTarget();
    temps.push(target);
    seedMinimalAngularTarget(target);
    const resolved = loadResolvedScreen(specDir);
    const context = buildGenerationContext(resolved, baseOptions({ target }));
    const rendered = renderAllFeatureFiles(context);
    const plan = buildOutputPlan(context, target, rendered, { force: true, clean: false });
    applyOutputPlan(plan, false);

    const sample = path.join(
      target,
      `src/app/features/${context.featureKebab}/store/${context.featureKebab}.actions.ts`,
    );
    fs.writeFileSync(sample, `${fs.readFileSync(sample, 'utf8')}\n// touched\n`, 'utf8');

    await expect(generateAngular(baseOptions({ target, dryRun: false, force: false }))).rejects.toThrow(
      /FILE_EXISTS/,
    );
  });

  it('writes a manifest and clean deletes only tracked files', () => {
    const target = tempTarget();
    temps.push(target);
    const featureRoot = path.join(target, 'src/app/features/product-structure');
    fs.mkdirSync(path.join(featureRoot, 'models'), { recursive: true });
    const tracked = path.join(featureRoot, 'models/tracked.ts');
    const manual = path.join(featureRoot, 'manual.ts');
    fs.writeFileSync(tracked, '// AUTO-GENERATED FILE.\n');
    fs.writeFileSync(manual, '// manual\n');
    writeManifest(featureRoot, buildManifest('productStructure', ['models/tracked.ts']));

    const resolved = loadResolvedScreen(specDir);
    const context = buildGenerationContext(resolved, baseOptions({ target }));
    const rendered = renderAllFeatureFiles(context).filter((file) =>
      file.relativePath.includes('models/product-structure-api.models.ts'),
    );
    const plan = buildOutputPlan(context, target, rendered, { force: true, clean: true });
    expect(plan.some((file) => file.action === 'DELETE' && file.relativePath.endsWith('models/tracked.ts'))).toBe(
      true,
    );
    expect(plan.some((file) => file.relativePath.endsWith('manual.ts'))).toBe(false);
    expect(readManifest(featureRoot)?.files).toContain('models/tracked.ts');
  });
});
