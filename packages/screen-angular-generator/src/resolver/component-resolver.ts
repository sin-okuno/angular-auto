import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ComponentTypeRules, ResolvedComponent } from '../domain/resolved-screen.types.js';
import { TYPE_RULES } from '../validator/architecture-validator.js';
import {
  actionCreatorName,
  componentIdToFileName,
  outputHandlerName,
  selectorName,
} from './naming-resolver.js';
import { resolveTypeRef, rewriteTypeExpression } from './type-resolver.js';

function rulesFor(typeId: string): ComponentTypeRules {
  const preset = TYPE_RULES[typeId as keyof typeof TYPE_RULES];
  if (preset) {
    return {
      storeAccess: preset.storeAccess,
      selectorAccess: preset.selectorAccess,
      dispatchActions: preset.dispatchActions,
      serviceAccess: preset.serviceAccess,
      httpClientAccess: false,
      apiMapping: false,
    };
  }
  return {
    storeAccess: false,
    selectorAccess: false,
    dispatchActions: false,
    serviceAccess: false,
    httpClientAccess: false,
    apiMapping: false,
  };
}

export function resolveComponents(draft: DraftScreenDocument): ResolvedComponent[] {
  const byId = new Map(draft.components.map((item) => [item.id, item]));

  return draft.components.map((component) => {
    const parent = component.parent ? byId.get(component.parent) : null;
    const parentResolved = parent
      ? {
          id: parent.id,
          className: parent.className,
          fileName: componentIdToFileName(parent.id),
        }
      : null;

    return {
      id: component.id,
      className: component.className,
      fileName: componentIdToFileName(component.id),
      selector: component.selector,
      type: {
        id: component.type,
        rules: rulesFor(component.type),
      },
      parent: parentResolved,
      storeAccess: component.storeAccess,
      ownsForm: component.ownsForm,
      formId: component.formId ?? null,
      inputs: component.inputs.map((input) => {
        const typeRef = resolveTypeRef(input.type, draft, `components/${componentIdToFileName(component.id)}`);
        return {
          id: input.id,
          propertyName: input.name || input.id,
          required: input.required,
          type: typeRef ?? { id: input.type, tsName: input.type, importPath: null },
        };
      }),
      outputs: component.outputs.map((output) => {
        const payload = resolveTypeRef(
          output.payloadType,
          draft,
          `components/${componentIdToFileName(component.id)}`,
        );
        const handledBy = parent
          ? {
              componentId: parent.id,
              handlerName: outputHandlerName(output.id),
              action: output.action
                ? { id: output.action, creatorName: actionCreatorName(output.action) }
                : null,
            }
          : null;
        return {
          id: output.id,
          propertyName: output.name || output.id,
          payloadType: payload,
          operation: output.operation ? { id: output.operation } : null,
          action: output.action
            ? { id: output.action, creatorName: actionCreatorName(output.action) }
            : null,
          handledBy,
        };
      }),
      selectors: component.selectors.map((item) => ({
        id: item.id,
        name: selectorName(item.id),
      })),
      dispatchActions: component.dispatchActions.map((item) => ({
        trigger: item.trigger,
        action: { id: item.action, creatorName: actionCreatorName(item.action) },
      })),
      formControls: component.formControls.map((control) => ({
        id: control.id,
        propertyName: control.name || control.id,
        field: control.field,
        apiParameter: control.apiParameter,
        validationIds: control.validation
          ? control.validation
              .split(/[,、]/)
              .map((part) => part.trim())
              .filter((part) => part.length > 0 && part !== '-')
          : [],
        validators: control.validation
          ? draft.validations
              .filter((validation) =>
                control.validation!
                  .split(/[,、]/)
                  .map((part) => part.trim())
                  .includes(validation.id),
              )
              .map((validation) => validation.angularValidator ?? validation.rule)
              .filter((value): value is string => Boolean(value))
          : [],
      })),
      localState: component.localState.map((state) => ({
        id: state.id,
        name: state.name,
        tsType: rewriteTypeExpression(state.type, draft.types),
        initial: state.initial,
      })),
      appliedRules: component.appliedRules,
      source: component.source,
    };
  });
}
