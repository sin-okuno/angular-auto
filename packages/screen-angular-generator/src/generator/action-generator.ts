import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderActionFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('store/actions.ts.hbs', { ...context, header });
}
