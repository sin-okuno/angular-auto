import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

import type { ResolvedScreenDocument } from '../domain/resolved-screen.types.js';
import { log } from '../utilities/logger.js';
import { validateAngularVersion, validateDependencies } from './angular-version-validator.js';
import { formatGeneratedFiles } from './formatter-runner.js';
import { buildGenerationContext } from './generation-context-builder.js';
import type { GenerateOptions, PlannedFile } from './generation-types.js';
import { buildManifest, writeManifest } from './manifest-manager.js';
import { renderAllFeatureFiles } from './output-plan-files.js';
import { buildOutputPlan } from './output-plan-builder.js';
import { applyOutputPlan, summarizePlan } from './output-writer.js';
import { inspectTargetProject } from './target-project-inspector.js';

export function loadResolvedScreen(specDir: string): ResolvedScreenDocument {
  const filePath = path.join(specDir, 'resolved-screen.yaml');
  if (!fs.existsSync(filePath)) {
    throw new Error(`resolved-screen.yaml not found: ${filePath}`);
  }
  return parse(fs.readFileSync(filePath, 'utf8')) as ResolvedScreenDocument;
}

export async function generateAngular(options: GenerateOptions): Promise<{
  plan: PlannedFile[];
  summary: Record<string, number>;
}> {
  const specDir = path.resolve(options.spec);
  const targetRoot = path.resolve(options.target);
  const resolved = loadResolvedScreen(specDir);

  const inspection = inspectTargetProject(targetRoot);
  const version = validateAngularVersion(
    inspection,
    options.angularVersion,
    options.allowVersionMismatch,
  );
  if (!version.ok) {
    throw new Error(version.message);
  }
  log('TARGET', version.message.replace(/\n/g, ' '));

  const deps = validateDependencies(inspection);
  if (!deps.ok) {
    throw new Error(
      `[DEPENDENCY_ERROR]\nMissing: ${deps.missing.join(', ')}\n\nRecommended:\n${deps.recommendCommand}`,
    );
  }

  const context = buildGenerationContext(resolved, options);
  const rendered = renderAllFeatureFiles(context);
  const plan = buildOutputPlan(context, targetRoot, rendered, {
    force: options.force,
    clean: options.clean,
  });

  const conflicts = plan.filter((file) => file.action === 'CONFLICT');
  if (conflicts.length > 0 && !options.dryRun) {
    throw new Error(
      `[FILE_EXISTS]\n\nFile:\n${conflicts[0]!.relativePath}\n\nUse --force to overwrite generated files.`,
    );
  }

  const summary = summarizePlan(plan);
  log('PLAN', `create: ${summary.CREATE ?? 0}`);
  log('PLAN', `update: ${summary.UPDATE ?? 0}`);
  log('PLAN', `delete: ${summary.DELETE ?? 0}`);

  if (options.dryRun) {
    for (const file of plan) {
      log('PLAN', `${file.action} ${file.relativePath}`);
    }
    log('DONE', 'dry-run (no files written)');
    return { plan, summary };
  }

  applyOutputPlan(plan, false);
  const written = plan
    .filter((file) => file.action === 'CREATE' || file.action === 'UPDATE')
    .map((file) => file.relativePath);
  log('GENERATE', `${written.length} files`);

  await formatGeneratedFiles(targetRoot, written);
  log('FORMAT', 'prettier: OK');

  const featureRootAbs = path.join(targetRoot, context.featureRoot);
  const manifestFiles = plan
    .filter((file) => file.action !== 'DELETE' && file.action !== 'CONFLICT')
    .map((file) => path.relative(featureRootAbs, file.absolutePath).split(path.sep).join('/'))
    .filter((file) => file !== '.screen-generator-manifest.json');
  writeManifest(featureRootAbs, buildManifest(resolved.screen.id, manifestFiles));
  log('MANIFEST', 'written');
  log('DONE', '');

  return { plan, summary };
}
