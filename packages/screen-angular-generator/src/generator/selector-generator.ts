import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderSelectorFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('store/selectors.ts.hbs', { ...context, header });
}
