import type { ResolvedScreenDocument } from '../domain/resolved-screen.types.js';
import type { GenerateOptions, GenerationContext } from './generation-types.js';
import {
  buildDispatchArgExpr,
  buildFailureArgExpr,
  buildRequestArgExpr,
  buildSaveEmitExpr,
  buildSuccessArgExpr,
  buildTypedPathExpression,
  enrichApiTypesWithPathParams,
  sanitizeTsTypeName,
} from './type-expression-builder.js';

function sanitizeInitial(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '空Set' || trimmed === '空のSet') return 'new Set<string>()';
  if (trimmed === '空文字') return "''";
  if (trimmed === 'なし') return 'null';
  if (trimmed === 'false') return 'false';
  if (trimmed === 'true') return 'true';
  return trimmed;
}

function normalizeValidator(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'uuidValidator') return 'uuidValidator()';
  if (trimmed === 'integerValidator') return 'integerValidator()';
  if (trimmed === 'integer') return 'integerValidator()';
  if (trimmed === 'required') return 'Validators.required';
  if (trimmed === 'maxLength') return 'Validators.maxLength(255)';
  if (trimmed === 'minLength') return 'Validators.minLength(1)';
  if (trimmed === 'min') return 'Validators.min(0)';
  if (trimmed === 'max') return 'Validators.max(Number.MAX_SAFE_INTEGER)';
  if (/^Validators\./.test(trimmed)) return trimmed;
  return trimmed;
}

function toKebab(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function sanitizePropertyType(name: string, tsType: string): string {
  let type = sanitizeTsTypeName(tsType);
  if (name === 'categoryId') {
    type = 'string | null';
  }
  return type;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function typeImportName(tsName: string | null | undefined): string | null {
  if (!tsName) return null;
  const sanitized = sanitizeTsTypeName(tsName.replace(/\[\]$/, ''));
  return isValidIdentifier(sanitized) ? sanitized : null;
}

function enrichTypeRef<T extends { tsName?: string; importPath?: string | null } | null | undefined>(
  type: T,
): T {
  if (!type || typeof type !== 'object') return type;
  const tsName = sanitizeTsTypeName(type.tsName);
  const importName = type.importPath ? typeImportName(type.tsName) : null;
  return {
    ...type,
    tsName,
    importName,
  };
}

function nullableTsType(tsType: string, initial: string): string {
  const sanitized = sanitizeTsTypeName(tsType);
  if (initial.trim() === 'null' && !sanitized.includes('|')) {
    return `${sanitized} | null`;
  }
  return sanitized;
}

const INPUT_TO_STATE: Record<string, string> = {
  condition: 'searchCondition',
  nodes: 'treeNodes',
  loading: 'treeLoading',
  error: 'treeError',
  detail: 'detail',
  selectedComponentId: 'selectedComponentId',
  selectedProductId: 'selectedProductId',
  saving: 'saving',
  saveError: 'saveError',
  concurrentUpdate: 'concurrentUpdate',
  readonly: 'concurrentUpdate',
  disabled: 'saving',
  visible: 'concurrentUpdate',
  message: 'saveError',
};

export function buildGenerationContext(
  resolved: ResolvedScreenDocument,
  options: GenerateOptions,
): GenerationContext {
  const featureKebab = resolved.screen.featureKebab;
  const featureCamel = resolved.screen.featureCamel;
  const featurePascal = resolved.screen.featurePascal;

  const apiTypes = enrichApiTypesWithPathParams(
    resolved.resolvedTypes
      .filter((type) => type.category === 'api')
      .map((type) => ({
        ...type,
        properties: type.properties.map((property) => ({
          ...property,
          tsType: sanitizePropertyType(property.name, property.tsType),
        })),
      })),
    resolved.resolvedApis,
  );
  const viewTypes = resolved.resolvedTypes
    .filter((type) => type.category === 'view')
    .map((type) => ({
      ...type,
      properties: type.properties.map((property) => ({
        ...property,
        tsType: sanitizePropertyType(property.name, property.tsType),
      })),
    }));
  const payloadTypes = resolved.resolvedTypes
    .filter((type) => type.category === 'payload')
    .map((type) => ({
      ...type,
      properties: type.properties.map((property) => ({
        ...property,
        tsType: sanitizePropertyType(property.name, property.tsType),
      })),
    }));
  const commonTypes = resolved.resolvedTypes
    .filter((type) => type.category === 'common')
    .map((type) => ({
      ...type,
      properties: type.properties.map((property) => ({
        ...property,
        tsType: sanitizePropertyType(property.name, property.tsType),
      })),
    }));
  const knownFields = new Set(resolved.resolvedStore.fields.map((field) => field.name));
  const allTypes = [...apiTypes, ...viewTypes, ...payloadTypes, ...commonTypes];

  const sanitized = {
    ...resolved,
    resolvedStore: {
      ...resolved.resolvedStore,
      fields: resolved.resolvedStore.fields.map((field) => ({
        ...field,
        tsType: nullableTsType(field.tsType, field.initial),
        initial: sanitizeInitial(field.initial),
      })),
      reducerRules: resolved.resolvedStore.reducerRules.map((rule) => ({
        ...rule,
        updates: rule.updates.map((update) => ({
          ...update,
          valid: knownFields.has(update.field) && isValidIdentifier(update.field),
        })),
      })),
    },
    resolvedApis: resolved.resolvedApis.map((api) => {
      const parameters = api.parameters.map((parameter) => ({
        ...parameter,
        location: parameter.location.toLowerCase().includes('query')
          ? 'query'
          : parameter.location.toLowerCase().includes('path')
            ? 'path'
            : parameter.location.toLowerCase().includes('body')
              ? 'body'
              : parameter.location,
      }));
      return {
        ...api,
        pathExpression: buildTypedPathExpression(api.path),
        parameters,
        hasQueryParams: parameters.some((parameter) => parameter.location === 'query'),
      };
    }),
    resolvedForms: resolved.resolvedForms.map((form) => ({
      ...form,
      controls: form.controls.map((control) => ({
        ...control,
        validators: unique(control.validators.map(normalizeValidator)),
      })),
    })),
    resolvedComponents: resolved.resolvedComponents.map((component) => {
      const form = resolved.resolvedForms.find((item) => item.id === component.formId);
      const inputs = component.inputs.map((input) => ({
        ...input,
        type: enrichTypeRef(input.type),
      }));
      const outputs = component.outputs.map((output) => ({
        ...output,
        payloadType: enrichTypeRef(output.payloadType),
      }));
      const typeImports = unique(
        [
          ...inputs
            .filter((input) => {
              const type = input.type as { importName?: string | null; importPath?: string | null };
              return Boolean(type?.importName && type?.importPath);
            })
            .map((input) => {
              const type = input.type as unknown as { importName: string; importPath: string };
              return `${type.importPath}::${type.importName}`;
            }),
          ...outputs
            .filter((output) => {
              const type = output.payloadType as unknown as {
                importName?: string | null;
                importPath?: string | null;
              } | null;
              return Boolean(type?.importName && type?.importPath);
            })
            .map((output) => {
              const type = output.payloadType as unknown as {
                importName: string;
                importPath: string;
              };
              return `${type.importPath}::${type.importName}`;
            }),
        ],
      ).map((key) => {
        const [importPath, importName] = key.split('::');
        return { importPath, importName };
      });

      const formTypeName = form?.type.tsName ? sanitizeTsTypeName(form.type.tsName) : null;
      const formInitProperty =
        inputs.find((input) => {
          const type = input.type as { tsName?: string };
          return formTypeName && sanitizeTsTypeName(type.tsName) === formTypeName;
        })?.propertyName ?? null;

      const searchOutput = outputs.find((output) => output.id === 'searchRequested') ?? null;
      const saveOutput = outputs.find((output) => output.id === 'saveRequested') ?? null;
      const searchOutputProperty = searchOutput?.propertyName ?? null;
      const saveOutputProperty = saveOutput?.propertyName ?? null;
      const savePayloadTsName = saveOutput?.payloadType
        ? sanitizeTsTypeName(
            (saveOutput.payloadType as { tsName?: string }).tsName ?? '',
          )
        : null;
      const saveEmitExpr =
        savePayloadTsName && form
          ? buildSaveEmitExpr({
              payloadTsName: savePayloadTsName,
              formControlNames: form.controls.map((control) => control.propertyName),
              inputNames: inputs.map((input) => ({
                name: input.propertyName,
                tsName: sanitizeTsTypeName((input.type as { tsName?: string }).tsName ?? ''),
              })),
              allTypes,
            })
          : null;

      return {
        ...component,
        inputs,
        outputs,
        typeImports,
        localState: component.localState.map((state) => {
          const initial = sanitizeInitial(state.initial);
          let tsType = initial.includes('new Set')
            ? 'Set<string>'
            : sanitizeTsTypeName(state.tsType);
          if (initial === 'null' && !tsType.includes('|')) {
            tsType = `${tsType} | null`;
          }
          return {
            ...state,
            tsType,
            initial,
          };
        }),
        formFactoryName: form?.factoryName ?? null,
        formInterfaceName: form?.interfaceName ?? null,
        formFileBase: form ? toKebab(form.id) : null,
        formControls: form
          ? form.controls.map((control) => ({
              ...control,
              validators: unique(control.validators.map(normalizeValidator)),
            }))
          : [],
        formInitProperty,
        searchOutputProperty,
        saveOutputProperty,
        saveEmitExpr,
      };
    }),
  };

  const actionEvents = sanitized.resolvedActions.map((action) => ({
    eventName: action.eventName,
    creatorName: action.creatorName,
    hasPayload: Boolean(action.payloadType?.tsName),
    payloadTsName: action.payloadType?.tsName ?? null,
  }));

  const actionPayloadImports = unique(
    sanitized.resolvedActions
      .map((action) => action.payloadType?.tsName ?? '')
      .filter((name) => payloadTypes.some((type) => type.tsName === name)),
  );
  const actionViewImports = unique(
    sanitized.resolvedActions
      .map((action) => typeImportName(action.payloadType?.tsName) ?? '')
      .filter((name) => viewTypes.some((type) => type.tsName === name)),
  );
  const actionCommonImports = unique(
    sanitized.resolvedActions
      .map((action) => action.payloadType?.tsName ?? '')
      .filter((name) => commonTypes.some((type) => type.tsName === name)),
  );

  const actionsById = new Map(sanitized.resolvedActions.map((action) => [action.id, action]));
  const apisById = new Map(sanitized.resolvedApis.map((api) => [api.id, api]));
  const mappers = sanitized.resolvedMappers;

  const effectDefs = sanitized.resolvedActions
    .filter((action) => action.api && action.successAction && action.failureAction)
    .map((action) => {
      const api = apisById.get(action.api!);
      const success = actionsById.get(action.successAction!);
      const failure = actionsById.get(action.failureAction!);
      return {
        effectName: `${action.creatorName}$`,
        triggerCreator: action.creatorName,
        apiMethod: api?.methodName ?? action.api!,
        successCreator: success?.creatorName ?? action.successAction!,
        failureCreator: failure?.creatorName ?? action.failureAction!,
        requestArgExpr: buildRequestArgExpr({
          featureCamel,
          action,
          api,
          allTypes,
          mappers,
        }),
        successArgExpr: buildSuccessArgExpr({
          featureCamel,
          action,
          success,
          api,
          allTypes,
          mappers,
        }),
        failureArgExpr: buildFailureArgExpr({
          featureCamel,
          failure,
          allTypes,
        }),
      };
    });

  const pageComponents = sanitized.resolvedComponents.filter(
    (component) => component.type.id === 'container' && component.parent == null,
  );

  const root = pageComponents[0];
  const childComponents = root
    ? sanitized.resolvedComponents
        .filter((component) => component.parent?.id === root.id)
        .map((component) => ({
          selector: component.selector,
          inputs: component.inputs.map((input) => {
            const mapped = INPUT_TO_STATE[input.propertyName] ?? input.propertyName;
            const raw = knownFields.has(mapped)
              ? `vm.${mapped}`
              : `$any(vm)['${input.propertyName}']`;
            return {
              ...input,
              bindingExpr: `$any(${raw})`,
            };
          }),
          outputs: component.outputs.map((output) => ({
            ...output,
            hasPayload: Boolean(output.payloadType?.tsName),
          })),
        }))
    : [];

  const containerHandlers: Array<{
    handlerName: string;
    payloadTsName: string | null;
    actionCreator: string | null;
    dispatchArgExpr: string | null;
  }> = [];
  const containerHandlerImports: Array<{ importPath: string; importName: string }> = [];
  const seenHandlers = new Set<string>();

  for (const child of childComponents) {
    for (const output of child.outputs) {
      const handlerName = output.handledBy?.handlerName;
      if (!handlerName || seenHandlers.has(handlerName)) continue;
      seenHandlers.add(handlerName);
      const payload = output.payloadType as {
        tsName?: string;
        importName?: string | null;
        importPath?: string | null;
      } | null;
      const payloadTsName = payload?.tsName ? sanitizeTsTypeName(payload.tsName) : null;
      const handledAction = output.handledBy?.action
        ? actionsById.get(output.handledBy.action.id) ??
          sanitized.resolvedActions.find(
            (action) => action.creatorName === output.handledBy?.action?.creatorName,
          )
        : null;
      containerHandlers.push({
        handlerName,
        payloadTsName,
        actionCreator: output.handledBy?.action?.creatorName ?? null,
        dispatchArgExpr: buildDispatchArgExpr({
          outputPayloadTsName: payloadTsName,
          action: handledAction,
          allTypes,
        }),
      });
      if (payload?.importName && payload.importPath) {
        containerHandlerImports.push({
          importPath: payload.importPath,
          importName: payload.importName,
        });
      }
    }
  }

  return {
    resolved: sanitized as unknown as ResolvedScreenDocument,
    options,
    featureKebab,
    featureCamel,
    featurePascal,
    featureRoot: `src/app/features/${featureKebab}`,
    actionsGroupName: `${featurePascal}Actions`,
    apiTypes,
    viewTypes,
    payloadTypes,
    commonTypes,
    useBuiltInControlFlow: options.templateControlFlow === 'builtIn',
    useInject: options.dependencyInjection === 'inject',
    useDecoratorApi: options.componentApi === 'decorators',
    actionEvents,
    actionPayloadImports,
    actionViewImports,
    actionCommonImports,
    apiErrorTsName:
      commonTypes.find((type) => type.tsName === 'ApiError')?.tsName ??
      '{ code: string; message: string; status: number; fieldErrors: unknown[] }',
    effectDefs,
    pageComponents,
    childComponents,
    containerHandlers,
    containerHandlerImports: unique(
      containerHandlerImports.map((item) => `${item.importPath}::${item.importName}`),
    ).map((key) => {
      const [importPath, importName] = key.split('::');
      return { importPath: importPath!, importName: importName! };
    }),
  };
}
