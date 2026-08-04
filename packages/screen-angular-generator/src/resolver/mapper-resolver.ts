import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ResolvedMapper } from '../domain/resolved-screen.types.js';
import { mapperFunctionName } from './naming-resolver.js';
import { resolveTypeRef } from './type-resolver.js';

export function resolveMappers(draft: DraftScreenDocument): ResolvedMapper[] {
  return draft.mappers.map((mapper) => {
    const inputType = resolveTypeRef(mapper.inputType, draft, 'mappers');
    const outputType = resolveTypeRef(mapper.outputType, draft, 'mappers');
    if (!inputType || !outputType) {
      throw new Error(`Unresolved mapper types for "${mapper.id}"`);
    }
    return {
      id: mapper.id,
      functionName: mapperFunctionName(mapper.id),
      inputType,
      outputType,
      purpose: mapper.purpose,
    };
  });
}
