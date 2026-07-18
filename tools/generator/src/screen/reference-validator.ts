import type {
  ActionDefinition,
  ScreenDefinition,
  TypeDefinition,
} from '../types/screen-definition.js';
import type { ErrorCode, ValidationIssue } from '../utils/errors.js';

const PRIMITIVE_TYPES = new Set<string>([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'unknown',
  'never',
  'object',
  'Date',
  'string[]',
  'number[]',
  'boolean[]',
]);

function collectTypeNames(definition: ScreenDefinition): Set<string> {
  const names = new Set<string>();
  const lists: TypeDefinition[][] = [
    definition.types.api,
    definition.types.view,
    definition.types.action,
  ];
  for (const list of lists) {
    for (const type of list) {
      names.add(type.name);
    }
  }
  return names;
}

/** Splits a type expression into its atomic, non-array base type names. */
function baseTypeTokens(typeExpr: string): string[] {
  return typeExpr
    .split('|')
    .map((part) => part.trim().replace(/\[\]$/, ''))
    .filter((part) => part.length > 0);
}

function isKnownType(typeExpr: string, typeNames: Set<string>): boolean {
  return baseTypeTokens(typeExpr).every(
    (token) => PRIMITIVE_TYPES.has(token) || PRIMITIVE_TYPES.has(`${token}[]`) || typeNames.has(token),
  );
}

function error(
  code: ErrorCode,
  target: string,
  cause: string,
  fix: string,
): ValidationIssue {
  return { code, severity: 'error', target, cause, fix };
}

function warning(
  code: ErrorCode,
  target: string,
  cause: string,
  fix: string,
): ValidationIssue {
  return { code, severity: 'warning', target, cause, fix };
}

function checkDuplicates(definition: ScreenDefinition, issues: ValidationIssue[]): void {
  const groups: Array<{ label: string; values: string[] }> = [
    { label: 'operation id', values: definition.operations.map((o) => o.id) },
    { label: 'action id', values: definition.actions.map((a) => a.id) },
    { label: 'action name', values: definition.actions.map((a) => a.name) },
    { label: 'api id', values: definition.apis.map((a) => a.id) },
    { label: 'api name', values: definition.apis.map((a) => a.name) },
    {
      label: 'type name',
      values: [
        ...definition.types.api,
        ...definition.types.view,
        ...definition.types.action,
      ].map((t) => t.name),
    },
  ];
  for (const group of groups) {
    const seen = new Set<string>();
    for (const value of group.values) {
      if (seen.has(value)) {
        issues.push(
          error(
            'DUPLICATE_DEFINITION_ERROR',
            `${group.label}: ${value}`,
            `Duplicate ${group.label} "${value}".`,
            `Rename or remove the duplicate ${group.label}.`,
          ),
        );
      }
      seen.add(value);
    }
  }
}

function checkTypeReferences(
  definition: ScreenDefinition,
  typeNames: Set<string>,
  issues: ValidationIssue[],
): void {
  const check = (typeExpr: string | null, target: string, section: string): void => {
    if (!typeExpr) {
      return;
    }
    if (!isKnownType(typeExpr, typeNames)) {
      issues.push(
        error(
          'TYPE_REFERENCE_ERROR',
          target,
          `Unknown type "${typeExpr}" referenced in ${section}.`,
          `Add "${baseTypeTokens(typeExpr).join(', ')}" to "型定義" or fix the reference.`,
        ),
      );
    }
  };

  for (const api of definition.apis) {
    check(api.requestType, `api:${api.id}.requestType`, 'API一覧');
    check(api.responseType, `api:${api.id}.responseType`, 'API一覧');
  }
  for (const field of definition.store.fields) {
    check(field.type, `store:${field.name}`, 'Store構成');
  }
  for (const action of definition.actions) {
    check(action.payloadType, `action:${action.id}.payloadType`, 'Action一覧');
  }
  const allTypes = [
    ...definition.types.api,
    ...definition.types.view,
    ...definition.types.action,
  ];
  for (const type of allTypes) {
    for (const property of type.properties) {
      check(property.type, `type:${type.name}.${property.name}`, '型定義');
    }
  }
}

function checkActionReferences(
  definition: ScreenDefinition,
  issues: ValidationIssue[],
): void {
  const actionIds = new Set(definition.actions.map((a) => a.id));
  const apiIds = new Set(definition.apis.map((a) => a.id));
  const operationIds = new Set(definition.operations.map((o) => o.id));
  const storeFields = new Set(definition.store.fields.map((f) => f.name));

  const checkRef = (
    value: string | null,
    set: Set<string>,
    code: ErrorCode,
    target: string,
    kind: string,
  ): void => {
    if (value && !set.has(value)) {
      issues.push(
        error(
          code,
          target,
          `${kind} "${value}" does not exist.`,
          `Define "${value}" or correct the reference.`,
        ),
      );
    }
  };

  for (const action of definition.actions) {
    checkRef(action.successAction, actionIds, 'ACTION_REFERENCE_ERROR', `action:${action.id}.successAction`, 'Success action');
    checkRef(action.failureAction, actionIds, 'ACTION_REFERENCE_ERROR', `action:${action.id}.failureAction`, 'Failure action');
    checkRef(action.api, apiIds, 'API_REFERENCE_ERROR', `action:${action.id}.api`, 'API');
    checkRef(action.relatedOperation, operationIds, 'OPERATION_REFERENCE_ERROR', `action:${action.id}.relatedOperation`, 'Operation');
    for (const update of action.storeUpdates) {
      if (!storeFields.has(update.field)) {
        issues.push(
          error(
            'STORE_REFERENCE_ERROR',
            `action:${action.id}.storeUpdates.${update.field}`,
            `Store field "${update.field}" does not exist.`,
            `Add "${update.field}" to "Store構成" or fix the update target.`,
          ),
        );
      }
    }
  }
}

function checkPermissionReferences(
  definition: ScreenDefinition,
  issues: ValidationIssue[],
): void {
  const permissionCodes = new Set(definition.permissions.map((p) => p.code));
  for (const operation of definition.operations) {
    if (operation.requiresPermission && !permissionCodes.has(operation.requiresPermission)) {
      issues.push(
        error(
          'PERMISSION_REFERENCE_ERROR',
          `operation:${operation.id}`,
          `Permission "${operation.requiresPermission}" is not defined.`,
          `Add "${operation.requiresPermission}" to "権限制御".`,
        ),
      );
    }
  }
}

function checkInitialValues(
  definition: ScreenDefinition,
  issues: ValidationIssue[],
): void {
  for (const field of definition.store.fields) {
    const parts = baseTypeTokens(field.type);
    const isArray = /\[\]$/.test(field.type);
    const initial = field.initial;
    let ok = false;
    if (isArray && initial === '[]') {
      ok = true;
    } else if (initial === 'null' && (parts.includes('null') || field.type.includes('null'))) {
      ok = true;
    } else if ((initial === 'true' || initial === 'false') && parts.includes('boolean')) {
      ok = true;
    } else if (/^-?\d+(?:\.\d+)?$/.test(initial) && parts.includes('number')) {
      ok = true;
    } else if (/^'.*'$/.test(initial) && parts.includes('string')) {
      ok = true;
    }
    if (!ok) {
      issues.push(
        error(
          'INITIAL_VALUE_ERROR',
          `store:${field.name}`,
          `Initial value "${initial}" is not compatible with type "${field.type}".`,
          `Use an initializer that matches "${field.type}" (e.g. [] for arrays, null for nullable types).`,
        ),
      );
    }
  }
}

function checkConcurrentUpdate(
  definition: ScreenDefinition,
  typeByName: Map<string, TypeDefinition>,
  issues: ValidationIssue[],
): void {
  if (!definition.concurrentUpdate.enabled) {
    return;
  }
  const revisionField = definition.concurrentUpdate.revisionField;
  const updateApis = definition.apis.filter((api) =>
    ['PUT', 'POST', 'PATCH'].includes(api.method),
  );
  for (const api of updateApis) {
    if (!api.requestType) {
      continue;
    }
    const type = typeByName.get(api.requestType);
    if (type && !type.properties.some((p) => p.name === revisionField)) {
      issues.push(
        error(
          'CONCURRENT_UPDATE_ERROR',
          `api:${api.id}`,
          `Update request type "${api.requestType}" is missing the revision field "${revisionField}".`,
          `Add "${revisionField}" to "${api.requestType}" so optimistic concurrency can be enforced.`,
        ),
      );
    }
  }
}

function checkUnsavedChanges(
  definition: ScreenDefinition,
  typeNames: Set<string>,
  issues: ValidationIssue[],
): void {
  if (!definition.unsavedChanges.enabled) {
    return;
  }
  if (!typeNames.has('PendingOperation')) {
    issues.push(
      error(
        'UNSAVED_CHANGES_ERROR',
        'unsavedChanges',
        'Type "PendingOperation" is required when unsaved-change tracking is enabled.',
        'Add a "PendingOperation" view type to "型定義".',
      ),
    );
  }
  const hasPendingField = definition.store.fields.some((f) => f.name === 'pendingOperation');
  if (!hasPendingField) {
    issues.push(
      error(
        'UNSAVED_CHANGES_ERROR',
        'store:pendingOperation',
        'Store field "pendingOperation" is required for unsaved-change confirmation.',
        'Add "pendingOperation" to "Store構成".',
      ),
    );
  }
  const hasSetPending = definition.actions.some((a) =>
    a.storeUpdates.some((u) => u.field === 'pendingOperation'),
  );
  if (!hasSetPending) {
    issues.push(
      error(
        'UNSAVED_CHANGES_ERROR',
        'actions',
        'No action updates "pendingOperation".',
        'Add a "Set Pending Operation" action that writes to pendingOperation.',
      ),
    );
  }
}

function buildActionGraph(actions: ActionDefinition[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const action of actions) {
    const edges: string[] = [];
    if (action.successAction) {
      edges.push(action.successAction);
    }
    if (action.failureAction) {
      edges.push(action.failureAction);
    }
    graph.set(action.id, edges);
  }
  return graph;
}

function checkReachability(
  definition: ScreenDefinition,
  issues: ValidationIssue[],
): void {
  const referenced = new Set<string>();
  for (const action of definition.actions) {
    if (action.relatedOperation) {
      referenced.add(action.id);
    }
    if (action.successAction) {
      referenced.add(action.successAction);
    }
    if (action.failureAction) {
      referenced.add(action.failureAction);
    }
  }
  for (const action of definition.actions) {
    if (!referenced.has(action.id)) {
      issues.push(
        warning(
          'ACTION_REFERENCE_ERROR',
          `action:${action.id}`,
          `Action "${action.name}" is not reachable from any operation or action.`,
          'Link it to an operation (関連操作) or reference it as a success/failure action.',
        ),
      );
    }
  }
}

function checkCycles(
  definition: ScreenDefinition,
  issues: ValidationIssue[],
): void {
  const graph = buildActionGraph(definition.actions);
  const state = new Map<string, number>(); // 0 = visiting, 1 = done
  const stack: string[] = [];

  const visit = (node: string): void => {
    const status = state.get(node);
    if (status === 1) {
      return;
    }
    if (status === 0) {
      const cycleStart = stack.indexOf(node);
      const cycle = stack.slice(cycleStart).concat(node).join(' -> ');
      issues.push(
        warning(
          'ACTION_REFERENCE_ERROR',
          `cycle:${node}`,
          `Potential unintended action cycle: ${cycle}.`,
          'Break the success/failure cycle unless it is intentional.',
        ),
      );
      return;
    }
    state.set(node, 0);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (graph.has(next)) {
        visit(next);
      }
    }
    stack.pop();
    state.set(node, 1);
  };

  for (const action of definition.actions) {
    visit(action.id);
  }
}

/**
 * Runs all cross-reference checks that JSON Schema cannot express. Returns the
 * full list of issues (errors and warnings) for the caller to report.
 */
export function validateReferences(definition: ScreenDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const typeNames = collectTypeNames(definition);
  const typeByName = new Map<string, TypeDefinition>();
  for (const type of [
    ...definition.types.api,
    ...definition.types.view,
    ...definition.types.action,
  ]) {
    typeByName.set(type.name, type);
  }

  checkDuplicates(definition, issues);
  checkTypeReferences(definition, typeNames, issues);
  checkActionReferences(definition, issues);
  checkPermissionReferences(definition, issues);
  checkInitialValues(definition, issues);
  checkConcurrentUpdate(definition, typeByName, issues);
  checkUnsavedChanges(definition, typeNames, issues);
  checkReachability(definition, issues);
  checkCycles(definition, issues);

  return issues;
}
