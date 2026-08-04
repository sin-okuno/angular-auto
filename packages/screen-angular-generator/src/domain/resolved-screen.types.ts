import type { DraftAngularConfig, DraftScreenMeta } from './draft-screen.types.js';
import type { SourceLocation } from './source-location.types.js';

export const RESOLVER_VERSION = '0.1.0';
export const GENERATOR_VERSION = '0.1.0';

export interface ResolvedTypeRef {
  id: string;
  tsName: string;
  sourceFile: string;
  importPath: string;
}

export interface ResolvedType {
  id: string;
  tsName: string;
  category: string;
  sourceFile: string;
  importPathFromModels: string;
  properties: Array<{
    name: string;
    tsType: string;
    optional: boolean;
  }>;
  source: SourceLocation;
}

export interface ResolvedApi {
  id: string;
  name: string;
  method: string;
  path: string;
  methodName: string;
  requestType: ResolvedTypeRef | null;
  responseType: ResolvedTypeRef | null;
  permission: string | null;
  description: string;
  parameters: Array<{
    id: string;
    name: string;
    location: string;
    tsType: string;
    required: boolean;
  }>;
  source: SourceLocation;
}

export interface ResolvedAction {
  id: string;
  name: string;
  creatorName: string;
  eventName: string;
  payloadType: ResolvedTypeRef | null;
  api: string | null;
  successAction: string | null;
  failureAction: string | null;
  relatedOperation: string | null;
  storeUpdates: Array<{ field: string; expression: string }>;
  source: SourceLocation;
}

export interface ResolvedStoreField {
  id: string;
  name: string;
  tsType: string;
  initial: string;
  description: string;
  typeRef: ResolvedTypeRef | null;
}

export interface ResolvedSelector {
  id: string;
  name: string;
  storeField: string | null;
}

export interface ResolvedEffect {
  id: string;
  effectName: string;
  action: string;
  condition: string;
  dispatchTarget: string;
  api: string | null;
}

export interface ResolvedMapper {
  id: string;
  functionName: string;
  inputType: ResolvedTypeRef;
  outputType: ResolvedTypeRef;
  purpose: string;
}

export interface ResolvedFormControl {
  id: string;
  propertyName: string;
  field: string | null;
  apiParameter: string | null;
  validationIds: string[];
  validators: string[];
}

export interface ResolvedForm {
  id: string;
  factoryName: string;
  interfaceName: string;
  ownerComponent: string;
  type: ResolvedTypeRef;
  controls: ResolvedFormControl[];
}

export interface ResolvedValidation {
  id: string;
  field: string;
  rule: string;
  value: string | number | boolean | null;
  angularValidator: string | null;
  scope: 'screen' | 'api';
}

export interface ComponentTypeRules {
  storeAccess: boolean;
  selectorAccess: boolean;
  dispatchActions: boolean;
  serviceAccess: boolean;
  httpClientAccess: boolean;
  apiMapping: boolean;
}

export interface ResolvedComponentInput {
  id: string;
  propertyName: string;
  required: boolean;
  type: ResolvedTypeRef | { id: string; tsName: string; importPath: null };
}

export interface ResolvedComponentOutput {
  id: string;
  propertyName: string;
  payloadType: ResolvedTypeRef | { id: string; tsName: string; importPath: null } | null;
  operation: { id: string } | null;
  action: { id: string; creatorName: string } | null;
  handledBy: {
    componentId: string;
    handlerName: string;
    action: { id: string; creatorName: string } | null;
  } | null;
}

export interface ResolvedComponent {
  id: string;
  className: string;
  fileName: string;
  selector: string;
  type: {
    id: string;
    rules: ComponentTypeRules;
  };
  parent: {
    id: string;
    className: string;
    fileName: string;
  } | null;
  storeAccess: boolean;
  ownsForm: boolean;
  formId: string | null;
  inputs: ResolvedComponentInput[];
  outputs: ResolvedComponentOutput[];
  selectors: Array<{ id: string; name: string }>;
  dispatchActions: Array<{ trigger: string; action: { id: string; creatorName: string } }>;
  formControls: ResolvedFormControl[];
  localState: Array<{ id: string; name: string; tsType: string; initial: string }>;
  appliedRules: string[];
  source: SourceLocation;
}

export interface ResolvedScreenDocument {
  metadata: {
    resolverVersion: string;
    generatedAt: string;
    sourceDraft: string;
  };
  generator: {
    target: 'angular';
    generatorVersion: string;
  };
  angular: {
    version: {
      major: 22;
      range: string;
    };
    architecture: DraftAngularConfig['architecture'];
    component: DraftAngularConfig['component'];
    template: DraftAngularConfig['template'];
    forms: DraftAngularConfig['forms'];
    state: { library: 'ngrx' };
    typescript: { range: string };
    node: { range: string };
  };
  screen: DraftScreenMeta & {
    featureKebab: string;
    featureCamel: string;
    featurePascal: string;
  };
  resolvedTypes: ResolvedType[];
  resolvedApis: ResolvedApi[];
  resolvedActions: ResolvedAction[];
  resolvedStore: {
    featureKey: string;
    stateInterfaceName: string;
    initialStateName: string;
    fields: ResolvedStoreField[];
    selectors: ResolvedSelector[];
    reducerRules: Array<{ actionId: string; creatorName: string; updates: Array<{ field: string; expression: string }> }>;
  };
  resolvedEffects: ResolvedEffect[];
  resolvedMappers: ResolvedMapper[];
  resolvedForms: ResolvedForm[];
  resolvedValidations: ResolvedValidation[];
  resolvedComponents: ResolvedComponent[];
  resolvedModule: {
    className: string;
    fileName: string;
    declarations: string[];
  };
  resolvedRouting: {
    className: string;
    fileName: string;
    routes: Array<{ path: string; componentClassName: string; guard?: string | null }>;
  };
  resolvedTests: Array<{ id: string; target: string; content: string }>;
}
