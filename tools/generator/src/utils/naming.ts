import {
  camelCase as ccCamelCase,
  constantCase as ccConstantCase,
  kebabCase as ccKebabCase,
  pascalCase as ccPascalCase,
} from 'change-case';

/**
 * Deterministic identifier casing helpers. All transforms are pure functions
 * so that the same specification always yields the same generated identifiers.
 */

export function kebabCase(value: string): string {
  return ccKebabCase(value);
}

export function camelCase(value: string): string {
  return ccCamelCase(value);
}

export function pascalCase(value: string): string {
  return ccPascalCase(value);
}

export function constantCase(value: string): string {
  return ccConstantCase(value);
}

export function featureClassName(feature: string): string {
  return pascalCase(feature);
}

export function componentClassName(feature: string): string {
  return `${pascalCase(feature)}Component`;
}

export function componentSelector(feature: string, prefix = 'app'): string {
  return `${kebabCase(prefix)}-${kebabCase(feature)}`;
}

export function moduleClassName(feature: string): string {
  return `${pascalCase(feature)}Module`;
}

export function routingModuleClassName(feature: string): string {
  return `${pascalCase(feature)}RoutingModule`;
}

export function serviceClassName(feature: string): string {
  return `${pascalCase(feature)}Service`;
}

export function effectClassName(feature: string): string {
  return `${pascalCase(feature)}Effects`;
}

export function stateInterfaceName(feature: string): string {
  return `${pascalCase(feature)}State`;
}

export function featureKey(feature: string): string {
  return camelCase(feature);
}

/**
 * Converts a human Action name (which may be Japanese or English) into a
 * camelCase identifier suitable for a NgRx action creator. Japanese names are
 * preserved verbatim (they cannot be safely re-cased) while ASCII names are
 * camelCased.
 */
export function actionPropName(actionName: string): string {
  if (/^[\x00-\x7F]+$/.test(actionName)) {
    return camelCase(actionName);
  }
  return actionName.replace(/\s+/g, '');
}
