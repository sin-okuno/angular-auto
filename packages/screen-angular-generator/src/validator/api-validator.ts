import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import type { ValidationError } from '../domain/validation-error.types.js';
import { isBlankRef } from '../utilities/reference-utils.js';
import { fromSource } from './validation-error-formatter.js';

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export function validateApis(draft: DraftScreenDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const api of draft.apis) {
    if (!METHODS.has(api.method)) {
      errors.push(
        fromSource(api.source, {
          code: 'API_VALIDATION_ERROR',
          id: api.id,
          field: 'method',
          value: api.method,
          message: `Invalid HTTP method "${api.method}".`,
        }),
      );
    }

    const pathParams = [...api.path.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]!);
    const definedPathParams = api.parameters
      .filter((parameter) => /path/i.test(parameter.location))
      .map((parameter) => parameter.name);

    for (const pathParam of pathParams) {
      if (!definedPathParams.includes(pathParam)) {
        errors.push(
          fromSource(api.source, {
            code: 'API_VALIDATION_ERROR',
            id: api.id,
            field: 'path',
            value: pathParam,
            message: `Path parameter "{${pathParam}}" is missing from API parameter definitions.`,
          }),
        );
      }
    }

    for (const defined of definedPathParams) {
      if (!pathParams.includes(defined)) {
        errors.push(
          fromSource(api.source, {
            code: 'API_VALIDATION_ERROR',
            id: api.id,
            field: 'parameters',
            value: defined,
            message: `Path parameter "${defined}" is not present in URL "${api.path}".`,
          }),
        );
      }
    }

    const bodyParams = api.parameters.filter((parameter) => /body/i.test(parameter.location));
    const queryParams = api.parameters.filter((parameter) => /query/i.test(parameter.location));

    if ((api.method === 'GET' || api.method === 'DELETE') && bodyParams.length > 0) {
      errors.push(
        fromSource(api.source, {
          code: 'API_VALIDATION_ERROR',
          id: api.id,
          field: 'parameters',
          message: `${api.method} API "${api.id}" must not have body parameters.`,
        }),
      );
    }

    const queryNames = new Set(queryParams.map((item) => item.name));
    for (const body of bodyParams) {
      if (queryNames.has(body.name)) {
        errors.push(
          fromSource(body.source, {
            code: 'API_VALIDATION_ERROR',
            id: api.id,
            field: 'parameters',
            value: body.name,
            message: `Parameter "${body.name}" is duplicated across query and body.`,
          }),
        );
      }
    }

    if (isBlankRef(api.requestType) === false && api.requestType) {
      // ok
    }
    if (isBlankRef(api.responseType)) {
      errors.push(
        fromSource(api.source, {
          code: 'API_VALIDATION_ERROR',
          id: api.id,
          field: 'responseType',
          message: `API "${api.id}" requires a response type.`,
        }),
      );
    }
  }

  return errors;
}
