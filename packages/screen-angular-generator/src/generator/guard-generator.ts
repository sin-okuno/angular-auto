import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderGuardFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  return [
    {
      relativePath: `guards/${context.featureKebab}-access.guard.ts`,
      content: renderTemplate('guards/access.guard.ts.hbs', { ...context, header }),
    },
    {
      relativePath: `guards/${context.featureKebab}-deactivate.guard.ts`,
      content: renderTemplate('guards/deactivate.guard.ts.hbs', { ...context, header }),
    },
  ];
}
