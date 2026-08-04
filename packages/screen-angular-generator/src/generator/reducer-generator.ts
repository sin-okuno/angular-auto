import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderReducerFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('store/reducer.ts.hbs', { ...context, header });
}
