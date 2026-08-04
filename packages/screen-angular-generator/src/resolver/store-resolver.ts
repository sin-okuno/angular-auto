import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedScreenDocument } from '../domain/resolved-screen.types.js';
import { extractTypeTokens, isTypeId } from '../utilities/reference-utils.js';
import { actionCreatorName, selectorName, toFeatureCamel, toFeaturePascal } from './naming-resolver.js';
import { resolveTypeRef, rewriteTypeExpression } from './type-resolver.js';

export function resolveStore(
  draft: DraftScreenDocument,
): ResolvedScreenDocument['resolvedStore'] {
  const featureCamel = toFeatureCamel(draft.screen.featureName);
  const featurePascal = toFeaturePascal(draft.screen.featureName);

  const fields = draft.store.fields.map((field) => {
    const tokens = extractTypeTokens(field.type);
    const primary = tokens.find((token) => isTypeId(token)) ?? null;
    return {
      id: field.id,
      name: field.name,
      tsType: rewriteTypeExpression(field.type, draft.types),
      initial: field.initial,
      description: field.description,
      typeRef: primary ? resolveTypeRef(primary, draft, 'store') : null,
    };
  });

  const selectors = fields.map((field) => ({
    id: field.id,
    name: selectorName(field.name || field.id),
    storeField: field.name || field.id,
  }));

  const reducerRules = draft.store.reducerRules.map((rule) => ({
    actionId: rule.actionId,
    creatorName: actionCreatorName(rule.actionId),
    updates: rule.updates
      .split(/[;\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf('=');
        return {
          field: eq === -1 ? part : part.slice(0, eq).trim(),
          expression: eq === -1 ? 'state' : part.slice(eq + 1).trim(),
        };
      }),
  }));

  return {
    featureKey: draft.store.featureKey ?? featureCamel,
    stateInterfaceName: `${featurePascal}State`,
    initialStateName: `initial${featurePascal}State`,
    fields,
    selectors,
    reducerRules,
  };
}
