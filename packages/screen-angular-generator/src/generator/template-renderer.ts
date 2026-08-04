import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templateRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../templates/angular-22-ngrx',
);

let helpersRegistered = false;

function registerHelpers(): void {
  if (helpersRegistered) return;
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
  Handlebars.registerHelper('and', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });
  Handlebars.registerHelper('or', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });
  Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value));
  Handlebars.registerHelper('join', (values: unknown, sep?: unknown) => {
    if (!Array.isArray(values)) return '';
    const delimiter = typeof sep === 'string' ? sep : ', ';
    return values.join(delimiter);
  });
  helpersRegistered = true;
}

export function renderTemplate(relativeTemplatePath: string, context: unknown): string {
  registerHelpers();
  const fullPath = path.join(templateRoot, relativeTemplatePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}
