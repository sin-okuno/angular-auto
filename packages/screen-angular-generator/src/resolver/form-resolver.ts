import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedForm } from '../domain/resolved-screen.types.js';
import { formFactoryName, formInterfaceName } from './naming-resolver.js';
import { resolveTypeRef } from './type-resolver.js';

export function resolveForms(draft: DraftScreenDocument): ResolvedForm[] {
  return draft.forms.map((form) => {
    const owner = draft.components.find((component) => component.id === form.ownerComponent);
    const controls = (owner?.formControls ?? []).map((control) => {
      const validationIds = control.validation
        ? control.validation
            .split(/[,、]/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0 && part !== '-')
        : [];
      return {
        id: control.id,
        propertyName: control.name || control.id,
        field: control.field,
        apiParameter: control.apiParameter,
        validationIds,
        validators: draft.validations
          .filter((validation) => validationIds.includes(validation.id))
          .map((validation) => validation.angularValidator ?? validation.rule)
          .filter((value): value is string => Boolean(value)),
      };
    });

    const type = resolveTypeRef(form.type, draft, 'forms') ?? {
      id: form.type,
      tsName: form.type,
      sourceFile: '',
      importPath: '',
    };

    return {
      id: form.id,
      factoryName: formFactoryName(form.id),
      interfaceName: formInterfaceName(form.id),
      ownerComponent: form.ownerComponent,
      type,
      controls,
    };
  });
}

export function resolveValidations(draft: DraftScreenDocument) {
  return draft.validations.map((validation) => ({
    id: validation.id,
    field: validation.field,
    rule: validation.rule,
    value: validation.value ?? null,
    angularValidator: validation.angularValidator ?? null,
    scope: validation.scope,
  }));
}
