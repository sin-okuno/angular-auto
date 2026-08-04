import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderStateFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('store/state.ts.hbs', { ...context, header });
}
