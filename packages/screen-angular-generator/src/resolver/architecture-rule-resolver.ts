import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedEffect } from '../domain/resolved-screen.types.js';
import { effectName } from './naming-resolver.js';
import { isBlankRef } from '../utilities/reference-utils.js';

export function resolveEffects(draft: DraftScreenDocument): ResolvedEffect[] {
  return draft.effects.map((effect) => {
    const maybeApi = draft.actions.find((action) => action.id === effect.action)?.api ?? null;
    const dispatchLooksLikeApi =
      !isBlankRef(effect.dispatchTarget) &&
      draft.apis.some((api) => effect.dispatchTarget.includes(api.id));

    return {
      id: effect.id,
      effectName: effectName(effect.id),
      action: effect.action,
      condition: effect.condition,
      dispatchTarget: effect.dispatchTarget,
      api: maybeApi ?? (dispatchLooksLikeApi ? effect.dispatchTarget : null),
    };
  });
}
