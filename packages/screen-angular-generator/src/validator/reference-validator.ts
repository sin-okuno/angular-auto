import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import {
  extractTypeTokens,
  isBlankRef,
  isTypeId,
} from '../utilities/reference-utils.js';
import { missingRef } from './validation-error-formatter.js';

function splitRefs(value: string | null | undefined): string[] {
  if (isBlankRef(value)) {
    return [];
  }
  return value!
    .split(/[,、]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '-');
}

export function validateReferences(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const typeIds = new Set(draft.types.map((item) => item.id));
  const actionIds = new Set(draft.actions.map((item) => item.id));
  const apiIds = new Set(draft.apis.map((item) => item.id));
  const operationIds = new Set(draft.operations.map((item) => item.id));
  const permissionIds = new Set(draft.permissions.map((item) => item.id));
  const storeFieldIds = new Set(draft.store.fields.map((item) => item.id));
  const componentIds = new Set(draft.components.map((item) => item.id));
  const componentTypeIds = new Set(draft.componentTypes.map((item) => item.id));
  const validationIds = new Set(draft.validations.map((item) => item.id));

  const ensureType = (
    value: string | null | undefined,
    source: DraftScreenDocument['types'][number]['source'] | undefined,
    id: string | undefined,
    field: string,
  ): void => {
    if (isBlankRef(value)) return;
    for (const token of extractTypeTokens(value!)) {
      if (!isTypeId(token)) continue;
      if (!typeIds.has(token)) {
        errors.push(
          missingRef(source, {
            ...(id !== undefined ? { id } : {}),
            field,
            value: token,
            kind: 'Type',
            pool: typeIds,
          }),
        );
      }
    }
  };

  for (const api of draft.apis) {
    ensureType(api.requestType, api.source, api.id, 'requestType');
    ensureType(api.responseType, api.source, api.id, 'responseType');
    if (!isBlankRef(api.permission) && !permissionIds.has(api.permission!)) {
      errors.push(
        missingRef(api.source, {
          id: api.id,
          field: 'permission',
          value: api.permission!,
          kind: 'Permission',
          pool: permissionIds,
        }),
      );
    }
  }

  for (const action of draft.actions) {
    ensureType(action.payloadType, action.source, action.id, 'payloadType');
    if (!isBlankRef(action.api) && !apiIds.has(action.api!)) {
      errors.push(
        missingRef(action.source, {
          id: action.id,
          field: 'api',
          value: action.api!,
          kind: 'API',
          pool: apiIds,
        }),
      );
    }
    if (!isBlankRef(action.successAction) && !actionIds.has(action.successAction!)) {
      errors.push(
        missingRef(action.source, {
          id: action.id,
          field: 'successAction',
          value: action.successAction!,
          kind: 'Action',
          pool: actionIds,
        }),
      );
    }
    if (!isBlankRef(action.failureAction) && !actionIds.has(action.failureAction!)) {
      errors.push(
        missingRef(action.source, {
          id: action.id,
          field: 'failureAction',
          value: action.failureAction!,
          kind: 'Action',
          pool: actionIds,
        }),
      );
    }
    for (const operationId of splitRefs(action.relatedOperation)) {
      if (!operationIds.has(operationId)) {
        errors.push(
          missingRef(action.source, {
            id: action.id,
            field: 'relatedOperation',
            value: operationId,
            kind: 'Operation',
            pool: operationIds,
          }),
        );
      }
    }
  }

  for (const field of draft.store.fields) {
    ensureType(field.type, field.source, field.id, 'type');
  }

  for (const rule of draft.store.reducerRules) {
    if (!actionIds.has(rule.actionId)) {
      errors.push(
        missingRef(rule.source, {
          id: rule.actionId,
          field: 'actionId',
          value: rule.actionId,
          kind: 'Action',
          pool: actionIds,
        }),
      );
    }
    for (const update of rule.updates.split(/[;\n]/)) {
      const fieldName = update.split('=')[0]?.trim();
      if (fieldName && /^[a-z][A-Za-z0-9]*$/.test(fieldName) && !storeFieldIds.has(fieldName)) {
        errors.push(
          missingRef(rule.source, {
            id: rule.actionId,
            field: 'storeUpdates',
            value: fieldName,
            kind: 'Store field',
            pool: storeFieldIds,
          }),
        );
      }
    }
  }

  for (const effect of draft.effects) {
    if (!isBlankRef(effect.action) && !actionIds.has(effect.action)) {
      errors.push(
        missingRef(effect.source, {
          id: effect.id,
          field: 'action',
          value: effect.action,
          kind: 'Action',
          pool: actionIds,
        }),
      );
    }
  }

  for (const mapper of draft.mappers) {
    ensureType(mapper.inputType, mapper.source, mapper.id, 'inputType');
    ensureType(mapper.outputType, mapper.source, mapper.id, 'outputType');
  }

  for (const form of draft.forms) {
    ensureType(form.type, form.source, form.id, 'type');
    if (!componentIds.has(form.ownerComponent)) {
      errors.push(
        missingRef(form.source, {
          id: form.id,
          field: 'ownerComponent',
          value: form.ownerComponent,
          kind: 'Component',
          pool: componentIds,
        }),
      );
    }
  }

  for (const component of draft.components) {
    if (!componentTypeIds.has(component.type)) {
      errors.push(
        missingRef(component.source, {
          id: component.id,
          field: 'type',
          value: component.type,
          kind: 'Component type',
          pool: componentTypeIds,
        }),
      );
    }
    if (!isBlankRef(component.parent) && !componentIds.has(component.parent!)) {
      errors.push(
        missingRef(component.source, {
          id: component.id,
          field: 'parent',
          value: component.parent!,
          kind: 'Component',
          pool: componentIds,
        }),
      );
    }
    for (const input of component.inputs) {
      ensureType(input.type, input.source, `${component.id}.${input.id}`, 'type');
    }
    for (const output of component.outputs) {
      ensureType(output.payloadType, output.source, `${component.id}.${output.id}`, 'payloadType');
      for (const operationId of splitRefs(output.operation)) {
        if (!operationIds.has(operationId)) {
          errors.push(
            missingRef(output.source, {
              id: `${component.id}.${output.id}`,
              field: 'operation',
              value: operationId,
              kind: 'Operation',
              pool: operationIds,
            }),
          );
        }
      }
      for (const actionId of splitRefs(output.action)) {
        if (!actionIds.has(actionId)) {
          errors.push(
            missingRef(output.source, {
              id: `${component.id}.${output.id}`,
              field: 'action',
              value: actionId,
              kind: 'Action',
              pool: actionIds,
            }),
          );
        }
      }
    }
    for (const control of component.formControls) {
      for (const validationId of splitRefs(control.validation)) {
        if (!validationIds.has(validationId)) {
          errors.push(
            missingRef(control.source, {
              id: `${component.id}.${control.id}`,
              field: 'validation',
              value: validationId,
              kind: 'Validation',
              pool: validationIds,
            }),
          );
        }
      }
    }
    for (const dispatch of component.dispatchActions) {
      if (!isBlankRef(dispatch.action) && !actionIds.has(dispatch.action)) {
        errors.push(
          missingRef(component.source, {
            id: component.id,
            field: 'dispatchActions',
            value: dispatch.action,
            kind: 'Action',
            pool: actionIds,
          }),
        );
      }
    }
  }

  for (const operation of draft.operations) {
    if (!isBlankRef(operation.requiresPermission) && !permissionIds.has(operation.requiresPermission!)) {
      errors.push(
        missingRef(operation.source, {
          id: operation.id,
          field: 'requiresPermission',
          value: operation.requiresPermission!,
          kind: 'Permission',
          pool: permissionIds,
        }),
      );
    }
  }

  return errors;
}
