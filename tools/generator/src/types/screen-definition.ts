/**
 * Structured, validated representation of a screen specification.
 *
 * This mirrors the on-disk `screen.yaml` document one-to-one so that the
 * conversion (Markdown -> ScreenDefinition -> yaml) and the loading
 * (yaml -> ScreenDefinition) paths agree on a single shape.
 */

export type PageType = 'tree-detail';

export type FormStateManagement = 'local' | 'store';

export type TypeCategory = 'api' | 'view' | 'action';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type PrimitiveDefault = string | number | boolean | null;

export interface ScreenMeta {
  id: string;
  name: string;
  route: string;
  pageType: PageType;
  featureName: string;
}

export interface PermissionDefinition {
  code: string;
  description: string;
}

export interface OperationDefinition {
  id: string;
  name: string;
  description: string;
  requiresPermission: string | null;
}

export interface SearchFieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export interface SearchDefinition {
  conditionType: string;
  fields: SearchFieldDefinition[];
}

export interface TreeRuleDefinition {
  id: string;
  description: string;
}

export interface TreeDefinition {
  nodeType: string;
  idField: string;
  detailIdField: string;
  displayFields: string[];
  rules: TreeRuleDefinition[];
}

export interface DetailFieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface DetailDefinition {
  modelType: string;
  fields: DetailFieldDefinition[];
  formStateManagement: FormStateManagement;
}

export interface ApiDefinition {
  id: string;
  name: string;
  method: ApiMethod;
  path: string;
  requestType: string | null;
  responseType: string | null;
  description: string;
}

export interface StoreFieldDefinition {
  name: string;
  type: string;
  /** TypeScript initializer expression, e.g. `[]`, `null`, `false`, `0`. */
  initial: string;
  description: string;
}

export interface StoreDefinition {
  featureKey: string;
  fields: StoreFieldDefinition[];
}

export interface TypePropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
  description: string;
}

export interface TypeDefinition {
  name: string;
  properties: TypePropertyDefinition[];
}

export interface TypesDefinition {
  api: TypeDefinition[];
  view: TypeDefinition[];
  action: TypeDefinition[];
}

export interface StoreUpdateDefinition {
  field: string;
  value: string;
}

export interface ActionDefinition {
  id: string;
  name: string;
  category: string;
  payloadType: string | null;
  api: string | null;
  successAction: string | null;
  failureAction: string | null;
  relatedOperation: string | null;
  storeUpdates: StoreUpdateDefinition[];
}

export interface UnsavedChangesDefinition {
  enabled: boolean;
  dirtySource: string;
  operations: string[];
  confirmMessage: string;
}

export interface ConcurrentUpdateDefinition {
  enabled: boolean;
  revisionField: string;
  statusCode: number;
  errorCode: string;
  message: string;
}

export interface DisplayRuleDefinition {
  id: string;
  condition: string;
  behavior: string;
}

export interface ValidationDefinition {
  field: string;
  rule: string;
  message: string;
}

export interface TestDefinition {
  id: string;
  target: string;
  description: string;
}

export interface ScreenDefinition {
  version: number;
  screen: ScreenMeta;
  permissions: PermissionDefinition[];
  operations: OperationDefinition[];
  search: SearchDefinition;
  tree: TreeDefinition;
  detail: DetailDefinition;
  apis: ApiDefinition[];
  store: StoreDefinition;
  types: TypesDefinition;
  actions: ActionDefinition[];
  unsavedChanges: UnsavedChangesDefinition;
  concurrentUpdate: ConcurrentUpdateDefinition;
  displayRules: DisplayRuleDefinition[];
  validations: ValidationDefinition[];
  tests: TestDefinition[];
}
