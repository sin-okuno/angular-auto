import type {
  ResolvedAction,
  ResolvedApi,
  ResolvedMapper,
  ResolvedType,
  ResolvedTypeRef,
} from '../domain/resolved-screen.types.js';

function sanitizeTsTypeName(tsName: string | null | undefined): string {
  if (!tsName || !tsName.trim()) return 'unknown';
  const trimmed = tsName.trim();
  if (trimmed === 'integer') return 'number';
  if (trimmed.endsWith('[]')) {
    return `${sanitizeTsTypeName(trimmed.slice(0, -2))}[]`;
  }
  if (/^(Set|Map|Array|ReadonlyArray|Record)<.*>$/.test(trimmed)) {
    return trimmed;
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) return trimmed;
  if (trimmed.includes('|')) {
    return trimmed
      .split('|')
      .map((part) => sanitizeTsTypeName(part.trim()))
      .join(' | ');
  }
  return 'string';
}

function stripArraySuffix(tsType: string): string {
  return tsType.endsWith('[]') ? tsType.slice(0, -2) : tsType;
}

function findType(
  types: ResolvedType[],
  ref: ResolvedTypeRef | null | undefined,
): ResolvedType | null {
  if (!ref) return null;
  return types.find((type) => type.id === ref.id || type.tsName === ref.tsName) ?? null;
}

function findTypeByTsName(types: ResolvedType[], tsName: string): ResolvedType | null {
  const sanitized = sanitizeTsTypeName(tsName);
  return types.find((type) => type.tsName === sanitized) ?? null;
}

function typesEqual(a: string, b: string): boolean {
  return sanitizeTsTypeName(a) === sanitizeTsTypeName(b);
}

export function enrichApiTypesWithPathParams(
  apiTypes: ResolvedType[],
  apis: ResolvedApi[],
): ResolvedType[] {
  const extras = new Map<string, Array<{ name: string; tsType: string; optional: boolean }>>();

  for (const api of apis) {
    if (!api.requestType) continue;
    const pathParams = api.parameters.filter((parameter) =>
      parameter.location.toLowerCase().includes('path'),
    );
    if (pathParams.length === 0) continue;

    const key = api.requestType.id;
    const existing = extras.get(key) ?? [];
    for (const parameter of pathParams) {
      if (existing.some((item) => item.name === parameter.name)) continue;
      existing.push({
        name: parameter.name,
        tsType: sanitizeTsTypeName(parameter.tsType),
        optional: !parameter.required,
      });
    }
    extras.set(key, existing);
  }

  return apiTypes.map((type) => {
    const extraProps = extras.get(type.id);
    if (!extraProps?.length) return type;
    const properties = [...type.properties];
    for (const extra of extraProps) {
      if (properties.some((property) => property.name === extra.name)) continue;
      properties.unshift(extra);
    }
    return { ...type, properties };
  });
}

export function buildTypedPathExpression(path: string): string {
  return path.replace(/\{([a-zA-Z0-9_]+)\}/g, '${request.$1}');
}

export function buildRequestArgExpr(options: {
  featureCamel: string;
  action: ResolvedAction;
  api: ResolvedApi | undefined;
  allTypes: ResolvedType[];
  mappers: ResolvedMapper[];
}): string {
  const { featureCamel, action, api, allTypes, mappers } = options;
  const mapperNs = `${featureCamel}Mappers`;
  const payloadType = findType(allTypes, action.payloadType);
  const requestMapper =
    mappers.find((mapper) => mapper.outputType.id === api?.requestType?.id) ?? null;

  if (requestMapper) {
    if (
      action.payloadType &&
      (action.payloadType.id === requestMapper.inputType.id ||
        typesEqual(action.payloadType.tsName, requestMapper.inputType.tsName))
    ) {
      return `${mapperNs}.${requestMapper.functionName}(action)`;
    }

    if (payloadType) {
      const matchingProps = payloadType.properties.filter((property) =>
        typesEqual(property.tsType, requestMapper.inputType.tsName),
      );
      if (matchingProps.length >= 1) {
        return `${mapperNs}.${requestMapper.functionName}(action.${matchingProps[0]!.name})`;
      }
    }
  }

  return 'action';
}

export function buildSuccessArgExpr(options: {
  featureCamel: string;
  action: ResolvedAction;
  success: ResolvedAction | undefined;
  api: ResolvedApi | undefined;
  allTypes: ResolvedType[];
  mappers: ResolvedMapper[];
}): string {
  const { featureCamel, action, success, api, allTypes, mappers } = options;
  const mapperNs = `${featureCamel}Mappers`;
  const successPayload = findType(allTypes, success?.payloadType ?? null);
  const apiResponse = findType(allTypes, api?.responseType ?? null);
  const actionPayload = findType(allTypes, action.payloadType);
  const responseMapper =
    mappers.find((mapper) => mapper.inputType.id === api?.responseType?.id) ?? null;

  if (!successPayload) {
    if (responseMapper) {
      return `${mapperNs}.${responseMapper.functionName}(response)`;
    }
    return 'response';
  }

  const parts: string[] = [];
  for (const property of successPayload.properties) {
    const propType = sanitizeTsTypeName(property.tsType);

    if (responseMapper && typesEqual(responseMapper.outputType.tsName, propType)) {
      parts.push(
        `${property.name}: ${mapperNs}.${responseMapper.functionName}(response)`,
      );
      continue;
    }

    if (actionPayload) {
      const actionProp = actionPayload.properties.find((item) => item.name === property.name);
      if (actionProp && typesEqual(actionProp.tsType, propType)) {
        parts.push(`${property.name}: action.${property.name}`);
        continue;
      }
    }

    if (propType.endsWith('[]') && apiResponse) {
      const elementType = stripArraySuffix(propType);
      const responseProp = apiResponse.properties.find((item) => item.name === property.name);
      if (responseProp) {
        const responseElement = stripArraySuffix(sanitizeTsTypeName(responseProp.tsType));
        const elementMapper = mappers.find(
          (mapper) =>
            typesEqual(mapper.inputType.tsName, responseElement) &&
            typesEqual(mapper.outputType.tsName, elementType),
        );
        if (elementMapper) {
          parts.push(
            `${property.name}: response.${property.name}.map((item) => ${mapperNs}.${elementMapper.functionName}(item))`,
          );
          continue;
        }
        if (typesEqual(responseElement, elementType)) {
          parts.push(`${property.name}: response.${property.name}`);
          continue;
        }
      }
    }

    if (apiResponse && typesEqual(apiResponse.tsName, propType)) {
      parts.push(`${property.name}: response`);
      continue;
    }

    if (responseMapper) {
      parts.push(
        `${property.name}: ${mapperNs}.${responseMapper.functionName}(response)`,
      );
      continue;
    }

    parts.push(`${property.name}: response`);
  }

  return `{ ${parts.join(', ')} }`;
}

export function buildFailureArgExpr(options: {
  featureCamel: string;
  failure: ResolvedAction | undefined;
  allTypes: ResolvedType[];
}): string {
  const { featureCamel, failure, allTypes } = options;
  const failurePayload = findType(allTypes, failure?.payloadType ?? null);
  const errorProp =
    failurePayload?.properties.find(
      (property) => property.name === 'error' || typesEqual(property.tsType, 'ApiError'),
    ) ?? null;
  const propName = errorProp?.name ?? 'error';
  return `{ ${propName}: ${featureCamel}Mappers.mapHttpError(error) }`;
}

export function buildDispatchArgExpr(options: {
  outputPayloadTsName: string | null;
  action: ResolvedAction | null | undefined;
  allTypes: ResolvedType[];
}): string | null {
  const { outputPayloadTsName, action, allTypes } = options;
  if (!action?.payloadType) return null;
  if (!outputPayloadTsName) return null;

  if (typesEqual(action.payloadType.tsName, outputPayloadTsName)) {
    return 'payload';
  }

  const actionPayload = findType(allTypes, action.payloadType);
  if (!actionPayload) return 'payload';

  const matching = actionPayload.properties.filter((property) =>
    typesEqual(property.tsType, outputPayloadTsName),
  );
  if (matching.length === 1) {
    return `{ ${matching[0]!.name}: payload }`;
  }

  return 'payload';
}

export function buildSaveEmitExpr(options: {
  payloadTsName: string;
  formControlNames: string[];
  inputNames: Array<{ name: string; tsName: string }>;
  allTypes: ResolvedType[];
}): string | null {
  const { payloadTsName, formControlNames, inputNames, allTypes } = options;
  const payloadType = findTypeByTsName(allTypes, payloadTsName);
  if (!payloadType) return null;

  const parts: string[] = [];

  for (const property of payloadType.properties) {
    const propType = sanitizeTsTypeName(property.tsType);

    if (formControlNames.includes(property.name)) {
      const raw = `this.form.controls.${property.name}.getRawValue()`;
      if (propType === 'number') {
        parts.push(`${property.name}: Number(${raw})`);
      } else {
        parts.push(`${property.name}: ${raw}`);
      }
      continue;
    }

    const exactInput = inputNames.find((input) => input.name === property.name);
    if (exactInput) {
      parts.push(`${property.name}: this.${exactInput.name}`);
      continue;
    }

    const nestedSource = inputNames.find((input) => {
      const inputType = findTypeByTsName(allTypes, input.tsName);
      return inputType?.properties.some((item) => item.name === property.name) ?? false;
    });
    if (nestedSource) {
      parts.push(`${property.name}: this.${nestedSource.name}.${property.name}`);
      continue;
    }

    const aliasedInput = inputNames.find((input) => {
      const name = input.name.toLowerCase();
      const prop = property.name.toLowerCase();
      return (
        name !== prop &&
        name.endsWith(prop) &&
        (typesEqual(input.tsName, propType) || propType === 'string')
      );
    });
    if (aliasedInput) {
      parts.push(`${property.name}: this.${aliasedInput.name}`);
      continue;
    }

    return null;
  }

  return `{ ${parts.join(', ')} }`;
}

export { sanitizeTsTypeName, findType, findTypeByTsName, typesEqual };
