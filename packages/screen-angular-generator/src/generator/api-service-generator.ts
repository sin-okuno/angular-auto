import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderApiServiceFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('services/api.service.ts.hbs', { ...context, header });
}
