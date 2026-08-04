import type { DraftScreenDocument, DraftType } from '../domain/draft-screen.types.js';
import type { ResolvedType, ResolvedTypeRef } from '../domain/resolved-screen.types.js';
import { extractTypeTokens, isTypeId } from '../utilities/reference-utils.js';
import {
  importPathToModels,
  modelsFileName,
  toFeatureKebab,
  typeIdToTsName,
} from './naming-resolver.js';

function categoryOf(type: DraftType): 'api' | 'view' | 'payload' | 'common' {
  if (type.category === 'api' || type.category === 'view' || type.category === 'payload' || type.category === 'common') {
    return type.category;
  }
  if (type.id.startsWith('api.')) return 'api';
  if (type.id.startsWith('view.')) return 'view';
  if (type.id.startsWith('payload.')) return 'payload';
  return 'common';
}

export function resolveTypes(draft: DraftScreenDocument): ResolvedType[] {
  const featureKebab = toFeatureKebab(draft.screen.featureName);
  return draft.types.map((type) => {
    const category = categoryOf(type);
    const tsName = typeIdToTsName(type.id, type.name);
    const sourceFile = `models/${modelsFileName(featureKebab, category)}`;
    return {
      id: type.id,
      tsName,
      category,
      sourceFile,
      importPathFromModels: `./${modelsFileName(featureKebab, category).replace(/\.ts$/, '')}`,
      properties: type.properties.map((property) => ({
        name: property.name,
        tsType: rewriteTypeExpression(property.type, draft.types),
        optional: property.optional,
      })),
      source: type.source,
    };
  });
}

export function rewriteTypeExpression(typeExpr: string, types: DraftType[]): string {
  let result = typeExpr;
  for (const token of extractTypeTokens(typeExpr)) {
    if (!isTypeId(token)) continue;
    const found = types.find((item) => item.id === token);
    const tsName = typeIdToTsName(token, found?.name);
    result = result.replaceAll(token, tsName);
  }
  return result;
}

export function resolveTypeRef(
  typeId: string | null | undefined,
  draft: DraftScreenDocument,
  fromDir: string,
): ResolvedTypeRef | null {
  if (!typeId) return null;
  const tokens = extractTypeTokens(typeId);
  const primary = tokens.find((token) => isTypeId(token)) ?? (isTypeId(typeId) ? typeId : null);
  if (!primary) {
    return {
      id: typeId,
      tsName: typeId,
      sourceFile: '',
      importPath: '',
    };
  }
  const found = draft.types.find((item) => item.id === primary);
  const category = found ? categoryOf(found) : primary.split('.')[0]! as 'api' | 'view' | 'payload' | 'common';
  const featureKebab = toFeatureKebab(draft.screen.featureName);
  const tsName = rewriteTypeExpression(typeId, draft.types);
  return {
    id: primary,
    tsName,
    sourceFile: `models/${modelsFileName(featureKebab, category)}`,
    importPath: importPathToModels(fromDir, featureKebab, category),
  };
}
