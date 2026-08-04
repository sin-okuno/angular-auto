import { camelCase, kebabCase, pascalCase } from '../utilities/case-converter.js';

export function toFeatureKebab(featureName: string): string {
  return kebabCase(featureName);
}

export function toFeatureCamel(featureName: string): string {
  return camelCase(featureName.replace(/-/g, ' '));
}

export function toFeaturePascal(featureName: string): string {
  return pascalCase(featureName.replace(/-/g, ' '));
}

export function typeIdToTsName(typeId: string, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim().length > 0) {
    return fallbackName;
  }
  const bare = typeId.includes('.') ? typeId.split('.').slice(1).join('.') : typeId;
  return pascalCase(bare);
}

export function componentIdToFileName(componentId: string): string {
  return kebabCase(componentId);
}

export function actionCreatorName(actionId: string): string {
  return camelCase(actionId);
}

export function actionEventName(actionName: string, actionId: string): string {
  if (actionName && actionName.trim().length > 0) {
    return actionName;
  }
  return pascalCase(actionId)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

export function selectorName(storeFieldOrId: string): string {
  const base = camelCase(storeFieldOrId);
  return `select${pascalCase(base)}`;
}

export function effectName(ruleId: string): string {
  return `${camelCase(ruleId)}$`;
}

export function apiMethodName(apiId: string): string {
  return camelCase(apiId);
}

export function mapperFunctionName(mapperId: string): string {
  return camelCase(mapperId.startsWith('map') ? mapperId : `map${pascalCase(mapperId)}`);
}

export function formFactoryName(formId: string): string {
  return `create${pascalCase(formId)}Form`;
}

export function formInterfaceName(formId: string): string {
  return `${pascalCase(formId)}Form`;
}

export function outputHandlerName(outputId: string): string {
  return `on${pascalCase(outputId)}`;
}

export function modelsFileName(featureKebab: string, category: string): string {
  return `${featureKebab}-${category}.models.ts`;
}

export function importPathToModels(
  fromDir: string,
  featureKebab: string,
  category: 'api' | 'view' | 'payload' | 'common',
): string {
  const file = `${featureKebab}-${category}.models`;
  // fromDir examples: 'components/product-search', 'store', 'services', 'mappers', 'forms'
  const depth = fromDir.split('/').filter(Boolean).length;
  const prefix = depth === 0 ? './models' : `${'../'.repeat(depth)}models`;
  return `${prefix}/${file}`;
}
