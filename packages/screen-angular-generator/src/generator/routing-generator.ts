import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderRoutingModuleFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('module/routing.module.ts.hbs', { ...context, header });
}
