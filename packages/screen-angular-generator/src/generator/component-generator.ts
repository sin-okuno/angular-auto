import type { GenerationContext } from './generation-types.js';
import { renderTemplate } from './template-renderer.js';

export function renderComponentFiles(
  context: GenerationContext,
  header: Record<string, string>,
): Array<{ relativePath: string; content: string }> {
  const files: Array<{ relativePath: string; content: string }> = [];
  for (const component of context.resolved.resolvedComponents) {
    const folder =
      component.type.id === 'container' && component.parent == null
        ? `pages/${component.fileName}`
        : `components/${component.fileName}`;
    const templateName =
      component.type.id === 'container'
        ? 'components/container.component.ts.hbs'
        : component.type.id === 'dialog'
          ? 'components/dialog.component.ts.hbs'
          : 'components/presentational.component.ts.hbs';
    files.push({
      relativePath: `${folder}/${component.fileName}.component.ts`,
      content: renderTemplate(templateName, { ...context, header, component }),
    });
    files.push({
      relativePath: `${folder}/${component.fileName}.component.html`,
      content: renderTemplate('components/component.html.hbs', {
        ...context,
        header,
        component,
      }),
    });
    files.push({
      relativePath: `${folder}/${component.fileName}.component.scss`,
      content: renderTemplate('components/component.scss.hbs', {
        ...context,
        header,
        component,
      }),
    });
    files.push({
      relativePath: `${folder}/${component.fileName}.component.spec.ts`,
      content: renderTemplate('components/component.spec.ts.hbs', {
        ...context,
        header,
        component,
      }),
    });
  }
  return files;
}
