import { renderActionFile } from './action-generator.js';
import { renderApiServiceFile } from './api-service-generator.js';
import { renderComponentFiles } from './component-generator.js';
import { renderEffectFile } from './effect-generator.js';
import { renderFeatureModuleFile } from './feature-module-generator.js';
import { renderFormFiles } from './form-generator.js';
import type { GenerationContext } from './generation-types.js';
import { renderGuardFiles } from './guard-generator.js';
import { renderMapperFile } from './mapper-generator.js';
import { renderModelFiles } from './model-generator.js';
import { renderReducerFile } from './reducer-generator.js';
import { renderRoutingModuleFile } from './routing-generator.js';
import { renderSelectorFile } from './selector-generator.js';
import { renderStateFile } from './state-generator.js';
import { renderStoreModuleFile } from './store-module-generator.js';
import { renderTestFiles } from './test-generator.js';
import { renderValidatorFiles } from './validator-generator.js';

function header(context: GenerationContext): Record<string, string> {
  return {
    sourceSpecification: `specs/${context.featureKebab}/`,
    screenDefinition: `specs/${context.featureKebab}/resolved-screen.yaml`,
  };
}

export function renderAllFeatureFiles(
  context: GenerationContext,
): Array<{ relativePath: string; content: string }> {
  const base = context.featureRoot;
  const h = header(context);
  const files: Array<{ relativePath: string; content: string }> = [];

  for (const file of renderModelFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }

  files.push({
    relativePath: `${base}/store/${context.featureKebab}.actions.ts`,
    content: renderActionFile(context, h),
  });
  files.push({
    relativePath: `${base}/store/${context.featureKebab}.state.ts`,
    content: renderStateFile(context, h),
  });
  files.push({
    relativePath: `${base}/store/${context.featureKebab}.reducer.ts`,
    content: renderReducerFile(context, h),
  });
  files.push({
    relativePath: `${base}/store/${context.featureKebab}.selectors.ts`,
    content: renderSelectorFile(context, h),
  });
  files.push({
    relativePath: `${base}/store/${context.featureKebab}.effects.ts`,
    content: renderEffectFile(context, h),
  });
  files.push({
    relativePath: `${base}/store/${context.featureKebab}-store.module.ts`,
    content: renderStoreModuleFile(context, h),
  });

  files.push({
    relativePath: `${base}/services/${context.featureKebab}-api.service.ts`,
    content: renderApiServiceFile(context, h),
  });
  files.push({
    relativePath: `${base}/mappers/${context.featureKebab}.mapper.ts`,
    content: renderMapperFile(context, h),
  });

  for (const file of renderFormFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }
  for (const file of renderValidatorFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }
  for (const file of renderComponentFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }

  files.push({
    relativePath: `${base}/${context.featureKebab}.module.ts`,
    content: renderFeatureModuleFile(context, h),
  });
  files.push({
    relativePath: `${base}/${context.featureKebab}-routing.module.ts`,
    content: renderRoutingModuleFile(context, h),
  });

  for (const file of renderGuardFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }
  for (const file of renderTestFiles(context, h)) {
    files.push({ relativePath: `${base}/${file.relativePath}`, content: file.content });
  }

  return files;
}
