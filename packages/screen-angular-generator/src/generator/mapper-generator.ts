import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderMapperFile(
  context: GenerationContext,
  header: Record<string, string>,
): string {
  return renderTemplate('mappers/mapper.ts.hbs', { ...context, header });
}
