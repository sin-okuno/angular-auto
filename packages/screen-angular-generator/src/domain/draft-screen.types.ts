import type { ParserWarning } from './parser-warning.types.js';
import type { SourceLocation } from './source-location.types.js';

export const PARSER_VERSION = '0.1.0';

export interface DraftAngularConfig {
  version: 22;
  architecture: {
    standalone: false;
    moduleBased: true;
  };
  component: {
    api: 'decorators' | 'signals';
    dependencyInjection: 'inject' | 'constructor';
    changeDetection: 'OnPush';
  };
  template: {
    controlFlow: 'builtIn' | 'structuralDirectives';
    styleProperty: 'styleUrl';
  };
  forms: {
    type: 'reactive';
    typed: true;
  };
}

export interface DraftScreenMeta {
  id: string;
  name: string;
  route: string;
  featureName: string;
  pageType?: string | null;
}

export interface DraftPermission {
  id: string;
  code: string;
  description: string;
  source: SourceLocation;
}

export interface DraftOperation {
  id: string;
  name: string;
  description: string;
  requiresPermission: string | null;
  source: SourceLocation;
}

export interface DraftField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  editable?: boolean | null;
  initialValue?: string | null;
  apiParameter?: string | null;
  apiUpdateTarget?: boolean | null;
  category: 'search' | 'detail' | 'treeDisplay' | 'other';
  source: SourceLocation;
}

export interface DraftApi {
  id: string;
  name: string;
  method: string;
  path: string;
  requestType: string | null;
  responseType: string | null;
  permission: string | null;
  description: string;
  parameters: DraftApiParameter[];
  source: SourceLocation;
}

export interface DraftApiParameter {
  id: string;
  api: string;
  name: string;
  location: string;
  type: string;
  required: boolean;
  nullAllowed?: boolean | null;
  min?: string | number | null;
  max?: string | number | null;
  format?: string | null;
  whenUnspecified?: string | null;
  source: SourceLocation;
}

export interface DraftTypeProperty {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

export interface DraftType {
  id: string;
  name: string;
  category: 'api' | 'view' | 'payload' | 'common' | 'unknown';
  properties: DraftTypeProperty[];
  source: SourceLocation;
}

export interface DraftAction {
  id: string;
  name: string;
  payloadType: string | null;
  api: string | null;
  successAction: string | null;
  failureAction: string | null;
  relatedOperation: string | null;
  storeUpdates: string[];
  source: SourceLocation;
}

export interface DraftStoreField {
  id: string;
  name: string;
  type: string;
  initial: string;
  description: string;
  source: SourceLocation;
}

export interface DraftReducerRule {
  actionId: string;
  updates: string;
  source: SourceLocation;
}

export interface DraftSelector {
  id: string;
  reference: string;
  source: SourceLocation;
}

export interface DraftEffectRule {
  id: string;
  action: string;
  condition: string;
  dispatchTarget: string;
  source: SourceLocation;
}

export interface DraftValidation {
  id: string;
  field: string;
  rule: string;
  value?: string | number | boolean | null;
  message?: string | null;
  apiValidation?: string | null;
  angularValidator?: string | null;
  scope: 'screen' | 'api';
  source: SourceLocation;
}

export interface DraftMapper {
  id: string;
  inputType: string;
  outputType: string;
  purpose: string;
  source: SourceLocation;
}

export interface DraftComponentType {
  id: string;
  name: string;
  description: string;
  source: SourceLocation;
}

export interface DraftImplementationRule {
  id: string;
  appliesTo: string[];
  content: string;
  source: SourceLocation;
}

export interface DraftComponentInput {
  id: string;
  name: string;
  type: string;
  required: boolean;
  source: SourceLocation;
}

export interface DraftComponentOutput {
  id: string;
  name: string;
  payloadType: string | null;
  operation: string | null;
  action: string | null;
  source: SourceLocation;
}

export interface DraftFormControl {
  id: string;
  name: string;
  field: string | null;
  apiParameter: string | null;
  validation: string | null;
  source: SourceLocation;
}

export interface DraftLocalState {
  id: string;
  name: string;
  type: string;
  initial: string;
  description: string;
  source: SourceLocation;
}

export interface DraftComponent {
  id: string;
  className: string;
  selector: string;
  type: string;
  parent: string | null;
  storeAccess: boolean;
  ownsForm: boolean;
  formId?: string | null;
  formType?: string | null;
  changeDetection?: string | null;
  responsibilities: Array<{ id: string; content: string }>;
  selectors: Array<{ id: string; reference: string }>;
  dispatchActions: Array<{ trigger: string; action: string }>;
  childBindings: Array<{ child: string; input: string; source: string }>;
  inputs: DraftComponentInput[];
  outputs: DraftComponentOutput[];
  formControls: DraftFormControl[];
  localState: DraftLocalState[];
  behaviorRules: Array<{ id: string; content: string }>;
  prohibitions: Array<{ id: string; content: string }>;
  appliedRules: string[];
  source: SourceLocation;
}

export interface DraftForm {
  id: string;
  ownerComponent: string;
  type: string;
  componentKind: string;
  storePersistence: string;
  dirtyUsage: string;
  source: SourceLocation;
}

export interface DraftModuleConfig {
  declarations: Array<{ component: string; type: string }>;
  imports?: string[];
  routing?: Array<{ path: string; component: string; guard?: string | null }>;
}

export interface DraftRoutingConfig {
  routes: Array<{ path: string; component: string; guard?: string | null }>;
}

export interface DraftTestCase {
  id: string;
  target: string;
  content: string;
  source: SourceLocation;
}

export interface DraftRule {
  id: string;
  content: string;
  category: string;
  source: SourceLocation;
}

export interface DraftUnsavedChanges {
  enabled: boolean;
  dirtySource: string | null;
  confirmMessage: string | null;
  operations: Array<{ id: string; operation: string; pendingType: string }>;
  meta: Record<string, string | number | boolean | null>;
}

export interface DraftConcurrentUpdate {
  enabled: boolean;
  revisionField: string | null;
  statusCode: number | null;
  errorCode: string | null;
  message: string | null;
  rules: DraftRule[];
  meta: Record<string, string | number | boolean | null>;
}

export interface DraftDisplayRule {
  id: string;
  condition: string;
  behavior: string;
  source: SourceLocation;
}

export interface DraftScreenDocument {
  metadata: {
    parserVersion: string;
    generatedAt: string;
    sourceFiles: string[];
  };
  screen: DraftScreenMeta;
  angular: DraftAngularConfig;
  permissions: DraftPermission[];
  operations: DraftOperation[];
  fields: DraftField[];
  apis: DraftApi[];
  types: DraftType[];
  actions: DraftAction[];
  store: {
    featureKey: string | null;
    fields: DraftStoreField[];
    reducerRules: DraftReducerRule[];
    selectors: DraftSelector[];
    nonStoreState: Array<{ id: string; name: string; managedBy: string }>;
  };
  effects: DraftEffectRule[];
  validations: DraftValidation[];
  mappers: DraftMapper[];
  componentTypes: DraftComponentType[];
  implementationRules: DraftImplementationRule[];
  components: DraftComponent[];
  forms: DraftForm[];
  module: DraftModuleConfig;
  routing: DraftRoutingConfig;
  tests: DraftTestCase[];
  displayRules: DraftDisplayRule[];
  unsavedChanges: DraftUnsavedChanges;
  concurrentUpdate: DraftConcurrentUpdate;
  rules: DraftRule[];
  warnings: ParserWarning[];
}
