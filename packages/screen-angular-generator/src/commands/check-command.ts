import fs from 'node:fs';
import path from 'node:path';

import { runAngularBuild } from '../check/angular-build-runner.js';
import { runAngularTests } from '../check/angular-test-runner.js';
import { runEslintCheck } from '../check/eslint-runner.js';
import { runPrettierCheck } from '../check/prettier-runner.js';
import { inspectTargetProject } from '../generator/target-project-inspector.js';
import { log } from '../utilities/logger.js';

export interface CheckCommandOptions {
  target: string;
  feature: string;
}

export async function runCheckCommand(options: CheckCommandOptions): Promise<void> {
  const targetRoot = path.resolve(options.target);
  const featurePath = path.join('src/app/features', options.feature);
  const featureAbs = path.join(targetRoot, featurePath);
  if (!fs.existsSync(featureAbs)) {
    throw new Error(`Feature path not found: ${featureAbs}`);
  }

  const inspection = inspectTargetProject(targetRoot);
  if (inspection.testRunner === 'unknown') {
    throw new Error('Unable to detect test runner from target project (karma/vitest).');
  }

  log('CHECK', 'prettier');
  runPrettierCheck(targetRoot, featurePath);

  log('CHECK', 'eslint');
  runEslintCheck(targetRoot, featurePath);

  log('CHECK', 'ng test');
  runAngularTests(targetRoot);

  log('CHECK', 'ng build');
  runAngularBuild(targetRoot);

  log('DONE', '');
}
