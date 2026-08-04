import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderStoreModuleFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('store/store.module.ts.hbs', { ...context, header });
}
