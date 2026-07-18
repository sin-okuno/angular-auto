import type { ApiDefinition, ScreenDefinition } from '../types/screen-definition.js';
import { camelCase } from '../utils/naming.js';

export interface RenderedApi {
  id: string;
  methodName: string;
  httpMethod: string;
  path: string;
  urlExpression: string;
  pathParams: string[];
  requestType: string | null;
  responseType: string;
  hasRequestType: boolean;
  isQuery: boolean;
  isBody: boolean;
  description: string;
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([a-zA-Z0-9_]+)\}/g) ?? [];
  return matches.map((token) => token.slice(1, -1));
}

/** Builds a JS template-literal body, e.g. `/api/products/${productId}`. */
function toUrlExpression(path: string): string {
  return path.replace(/\{([a-zA-Z0-9_]+)\}/g, '${$1}');
}

function mapApi(api: ApiDefinition): RenderedApi {
  const pathParams = extractPathParams(api.path);
  const hasRequestType = api.requestType !== null;
  const isBody = ['POST', 'PUT', 'PATCH'].includes(api.method) && hasRequestType;
  const isQuery = api.method === 'GET' && hasRequestType;
  return {
    id: api.id,
    methodName: camelCase(api.id),
    httpMethod: api.method,
    path: api.path,
    urlExpression: toUrlExpression(api.path),
    pathParams,
    requestType: api.requestType,
    responseType: api.responseType ?? 'void',
    hasRequestType,
    isQuery,
    isBody,
    description: api.description,
  };
}

export function buildApis(definition: ScreenDefinition): RenderedApi[] {
  return definition.apis.map(mapApi);
}
