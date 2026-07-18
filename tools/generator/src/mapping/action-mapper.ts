import type { ActionDefinition, ScreenDefinition } from '../types/screen-definition.js';

export interface RenderedStoreUpdate {
  field: string;
  value: string;
}

export interface RenderedAction {
  id: string;
  name: string;
  category: string;
  type: string;
  propName: string;
  payloadType: string | null;
  hasPayload: boolean;
  api: string | null;
  successAction: string | null;
  failureAction: string | null;
  relatedOperation: string | null;
  storeUpdates: RenderedStoreUpdate[];
  hasStoreUpdates: boolean;
  needsActionParam: boolean;
}

function sourceLabel(feature: string): string {
  return feature
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapAction(action: ActionDefinition, label: string): RenderedAction {
  const hasPayload = action.payloadType !== null;
  const needsActionParam = action.storeUpdates.some((update) =>
    /\baction\./.test(update.value),
  );
  return {
    id: action.id,
    name: action.name,
    category: action.category,
    type: `[${label}] ${action.name}`,
    propName: action.id,
    payloadType: action.payloadType,
    hasPayload,
    api: action.api,
    successAction: action.successAction,
    failureAction: action.failureAction,
    relatedOperation: action.relatedOperation,
    storeUpdates: action.storeUpdates.map((update) => ({
      field: update.field,
      value: update.value,
    })),
    hasStoreUpdates: action.storeUpdates.length > 0,
    needsActionParam,
  };
}

export function buildActions(definition: ScreenDefinition): RenderedAction[] {
  const label = sourceLabel(definition.screen.featureName);
  return definition.actions.map((action) => mapAction(action, label));
}
