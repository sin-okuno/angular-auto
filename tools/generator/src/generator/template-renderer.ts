import { fileURLToPath } from 'node:url';
import path from 'node:path';

import fs from 'fs-extra';
import Handlebars from 'handlebars';

import { GeneratorError } from '../utils/errors.js';
import { camelCase, constantCase, kebabCase, pascalCase } from '../utils/naming.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(currentDir, '../../../../templates');

let helpersRegistered = false;
const templateCache = new Map<string, Handlebars.TemplateDelegate>();

function registerHelpers(): void {
  if (helpersRegistered) {
    return;
  }
  Handlebars.registerHelper('pascalCase', (value: unknown) => pascalCase(String(value)));
  Handlebars.registerHelper('camelCase', (value: unknown) => camelCase(String(value)));
  Handlebars.registerHelper('kebabCase', (value: unknown) => kebabCase(String(value)));
  Handlebars.registerHelper('constantCase', (value: unknown) => constantCase(String(value)));
  Handlebars.registerHelper('lower', (value: unknown) => String(value).toLowerCase());
  Handlebars.registerHelper('upper', (value: unknown) => String(value).toUpperCase());
  Handlebars.registerHelper('capitalize', (value: unknown) => {
    const text = String(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  });
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
  Handlebars.registerHelper('and', (a: unknown, b: unknown) => Boolean(a) && Boolean(b));
  Handlebars.registerHelper('or', (a: unknown, b: unknown) => Boolean(a) || Boolean(b));
  Handlebars.registerHelper('not', (a: unknown) => !a);
  Handlebars.registerHelper('includes', (list: unknown, value: unknown) =>
    Array.isArray(list) ? list.includes(value) : false,
  );
  Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value));
  Handlebars.registerHelper('join', (list: unknown, separator: unknown) =>
    Array.isArray(list) ? list.join(typeof separator === 'string' ? separator : ', ') : '',
  );
  helpersRegistered = true;
}

/** Resolves a template path and guarantees it stays inside the templates root. */
function resolveTemplatePath(relativePath: string): string {
  const resolved = path.resolve(TEMPLATES_ROOT, relativePath);
  const relative = path.relative(TEMPLATES_ROOT, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new GeneratorError(
      'PATH_SECURITY_ERROR',
      `Template path escapes the templates directory: ${relativePath}`,
      { target: relativePath },
    );
  }
  return resolved;
}

function compileTemplate(relativePath: string): Handlebars.TemplateDelegate {
  registerHelpers();
  const cached = templateCache.get(relativePath);
  if (cached) {
    return cached;
  }
  const absolutePath = resolveTemplatePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new GeneratorError(
      'TEMPLATE_RENDER_ERROR',
      `Template not found: ${relativePath}`,
      { target: relativePath },
    );
  }
  const source = fs.readFileSync(absolutePath, 'utf8');
  const template = Handlebars.compile(source, { noEscape: true, strict: false });
  templateCache.set(relativePath, template);
  return template;
}

export function renderTemplate(relativePath: string, context: unknown): string {
  const template = compileTemplate(relativePath);
  try {
    return template(context as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new GeneratorError(
      'TEMPLATE_RENDER_ERROR',
      `Failed to render template ${relativePath}: ${message}`,
      { target: relativePath },
    );
  }
}

export { TEMPLATES_ROOT };
