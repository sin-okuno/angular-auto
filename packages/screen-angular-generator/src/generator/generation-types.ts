import type { ResolvedScreenDocument } from '../domain/resolved-screen.types.js';

export interface GenerateOptions {
  spec: string;
  target: string;
  angularVersion: number;
  componentApi: 'decorators' | 'signals';
  templateControlFlow: 'builtIn' | 'structuralDirectives';
  dependencyInjection: 'inject' | 'constructor';
  dryRun: boolean;
  force: boolean;
  clean: boolean;
  allowVersionMismatch: boolean;
  feature?: string;
}

export interface PlannedFile {
  relativePath: string;
  absolutePath: string;
  content: string;
  action: 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'DELETE' | 'CONFLICT';
}

export interface GenerationManifest {
  generatorVersion: string;
  specId: string;
  generatedAt: string;
  files: string[];
}

export interface GenerationContext {
  resolved: ResolvedScreenDocument;
  options: GenerateOptions;
  featureKebab: string;
  featureCamel: string;
  featurePascal: string;
  featureRoot: string;
  actionsGroupName: string;
  apiTypes: ResolvedScreenDocument['resolvedTypes'];
  viewTypes: ResolvedScreenDocument['resolvedTypes'];
  payloadTypes: ResolvedScreenDocument['resolvedTypes'];
  commonTypes: ResolvedScreenDocument['resolvedTypes'];
  useBuiltInControlFlow: boolean;
  useInject: boolean;
  useDecoratorApi: boolean;
  actionEvents: Array<{
    eventName: string;
    creatorName: string;
    hasPayload: boolean;
    payloadTsName: string | null;
  }>;
  actionPayloadImports: string[];
  actionViewImports: string[];
  actionCommonImports: string[];
  apiErrorTsName: string;
  effectDefs: Array<{
    effectName: string;
    triggerCreator: string;
    apiMethod: string;
    successCreator: string;
    failureCreator: string;
    requestArgExpr: string;
    successArgExpr: string;
    failureArgExpr: string;
  }>;
  pageComponents: ResolvedScreenDocument['resolvedComponents'];
  childComponents: Array<{
    selector: string;
    inputs: Array<
      ResolvedScreenDocument['resolvedComponents'][number]['inputs'][number] & {
        bindingExpr?: string;
      }
    >;
    outputs: ResolvedScreenDocument['resolvedComponents'][number]['outputs'];
  }>;
  containerHandlers: Array<{
    handlerName: string;
    payloadTsName: string | null;
    actionCreator: string | null;
    dispatchArgExpr: string | null;
  }>;
  containerHandlerImports: Array<{ importPath: string; importName: string }>;
}
