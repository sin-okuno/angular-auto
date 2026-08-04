import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedAction } from '../domain/resolved-screen.types.js';
import { actionCreatorName, actionEventName } from './naming-resolver.js';
import { resolveTypeRef } from './type-resolver.js';

function parseUpdates(rawList: string[]): Array<{ field: string; expression: string }> {
  const updates: Array<{ field: string; expression: string }> = [];
  for (const raw of rawList) {
    for (const part of raw.split(/[;\n]/)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      updates.push({
        field: trimmed.slice(0, eq).trim(),
        expression: trimmed.slice(eq + 1).trim(),
      });
    }
  }
  return updates;
}

export function resolveActions(draft: DraftScreenDocument): ResolvedAction[] {
  const reducerByAction = new Map(
    draft.store.reducerRules.map((rule) => [rule.actionId, rule.updates]),
  );

  return draft.actions.map((action) => {
    const fromReducer = reducerByAction.get(action.id);
    const storeUpdates = parseUpdates(
      action.storeUpdates.length > 0 ? action.storeUpdates : fromReducer ? [fromReducer] : [],
    );
    return {
      id: action.id,
      name: action.name,
      creatorName: actionCreatorName(action.id),
      eventName: actionEventName(action.name, action.id),
      payloadType: resolveTypeRef(action.payloadType, draft, 'store'),
      api: action.api,
      successAction: action.successAction,
      failureAction: action.failureAction,
      relatedOperation: action.relatedOperation,
      storeUpdates,
      source: action.source,
    };
  });
}
