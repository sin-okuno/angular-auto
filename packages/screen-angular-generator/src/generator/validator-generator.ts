import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderValidatorFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  return [
    {
      relativePath: 'validators/integer.validator.ts',
      content: renderTemplate('validators/integer.validator.ts.hbs', { ...context, header }),
    },
    {
      relativePath: 'validators/uuid.validator.ts',
      content: renderTemplate('validators/uuid.validator.ts.hbs', { ...context, header }),
    },
  ];
}
