import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderModelFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  const common = { ...context, header };
  return [
    {
      relativePath: `models/${context.featureKebab}-api.models.ts`,
      content: renderTemplate('models/api-models.ts.hbs', { ...common, types: context.apiTypes }),
    },
    {
      relativePath: `models/${context.featureKebab}-view.models.ts`,
      content: renderTemplate('models/view-models.ts.hbs', { ...common, types: context.viewTypes }),
    },
    {
      relativePath: `models/${context.featureKebab}-payload.models.ts`,
      content: renderTemplate('models/payload-models.ts.hbs', {
        ...common,
        types: context.payloadTypes,
      }),
    },
    {
      relativePath: `models/${context.featureKebab}-common.models.ts`,
      content: renderTemplate('models/common-models.ts.hbs', {
        ...common,
        types: context.commonTypes,
      }),
    },
    {
      relativePath: `models/${context.featureKebab}-view-model.ts`,
      content: renderTemplate('models/feature-view-model.ts.hbs', common),
    },
  ];
}
