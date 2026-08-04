import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderFormFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  return context.resolved.resolvedForms.map((form) => ({
    relativePath: `forms/${form.id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}-form.factory.ts`,
    content: renderTemplate('forms/form.factory.ts.hbs', { ...context, header, form }),
  }));
}
