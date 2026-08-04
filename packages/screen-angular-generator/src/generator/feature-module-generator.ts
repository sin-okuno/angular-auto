import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderFeatureModuleFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('module/feature.module.ts.hbs', { ...context, header });
}
