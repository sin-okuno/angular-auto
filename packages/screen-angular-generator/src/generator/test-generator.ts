import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderTestFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  return [
    {
      relativePath: `store/${context.featureKebab}.reducer.spec.ts`,
      content: renderTemplate('tests/reducer.spec.ts.hbs', { ...context, header }),
    },
    {
      relativePath: `store/${context.featureKebab}.selectors.spec.ts`,
      content: renderTemplate('tests/selectors.spec.ts.hbs', { ...context, header }),
    },
    {
      relativePath: `store/${context.featureKebab}.effects.spec.ts`,
      content: renderTemplate('tests/effects.spec.ts.hbs', { ...context, header }),
    },
    {
      relativePath: `services/${context.featureKebab}-api.service.spec.ts`,
      content: renderTemplate('tests/api.service.spec.ts.hbs', { ...context, header }),
    },
    {
      relativePath: `mappers/${context.featureKebab}.mapper.spec.ts`,
      content: renderTemplate('tests/mapper.spec.ts.hbs', { ...context, header }),
    },
    {
      relativePath: 'forms/validation.spec.ts',
      content: renderTemplate('tests/validation.spec.ts.hbs', { ...context, header }),
    },
  ];
}
