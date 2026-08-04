import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedApi } from '../domain/resolved-screen.types.js';
import { apiMethodName } from './naming-resolver.js';
import { resolveTypeRef, rewriteTypeExpression } from './type-resolver.js';

export function resolveApis(draft: DraftScreenDocument): ResolvedApi[] {
  return draft.apis.map((api) => ({
    id: api.id,
    name: api.name,
    method: api.method,
    path: api.path,
    methodName: apiMethodName(api.id),
    requestType: resolveTypeRef(api.requestType, draft, 'services'),
    responseType: resolveTypeRef(api.responseType, draft, 'services'),
    permission: api.permission,
    description: api.description,
    parameters: api.parameters.map((parameter) => ({
      id: parameter.id,
      name: parameter.name,
      location: parameter.location,
      tsType: rewriteTypeExpression(parameter.type, draft.types),
      required: parameter.required,
    })),
    source: api.source,
  }));
}
