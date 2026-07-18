import type { ScreenDefinition } from '../types/screen-definition.js';
import {
  camelCase,
  componentClassName,
  componentSelector,
  constantCase,
  effectClassName,
  featureClassName,
  featureKey,
  kebabCase,
  moduleClassName,
  pascalCase,
  routingModuleClassName,
  serviceClassName,
  stateInterfaceName,
} from '../utils/naming.js';

export interface NamingContext {
  feature: string;
  featureKebab: string;
  featureCamel: string;
  featurePascal: string;
  featureConstant: string;
  featureClassName: string;
  componentClassName: string;
  componentSelector: string;
  moduleClassName: string;
  routingModuleClassName: string;
  serviceClassName: string;
  effectClassName: string;
  stateInterfaceName: string;
  featureKey: string;
  actionsClassName: string;
  reducerName: string;
  initialStateName: string;
  fileBase: string;
}

export function buildNaming(definition: ScreenDefinition): NamingContext {
  const feature = definition.screen.featureName;
  const pascal = pascalCase(feature);
  return {
    feature,
    featureKebab: kebabCase(feature),
    featureCamel: camelCase(feature),
    featurePascal: pascal,
    featureConstant: constantCase(feature),
    featureClassName: featureClassName(feature),
    componentClassName: componentClassName(feature),
    componentSelector: componentSelector(feature),
    moduleClassName: moduleClassName(feature),
    routingModuleClassName: routingModuleClassName(feature),
    serviceClassName: serviceClassName(feature),
    effectClassName: effectClassName(feature),
    stateInterfaceName: stateInterfaceName(feature),
    featureKey: definition.store.featureKey || featureKey(feature),
    actionsClassName: `${pascal}Actions`,
    reducerName: `${camelCase(feature)}Reducer`,
    initialStateName: `initial${pascal}State`,
    fileBase: kebabCase(feature),
  };
}
