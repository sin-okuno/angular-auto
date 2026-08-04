import type { DraftScreenDocument } from '../domain/draft-screen.types.js';
import {
  GENERATOR_VERSION,
  RESOLVER_VERSION,
  type ResolvedScreenDocument,
} from '../domain/resolved-screen.types.js';
import { resolveActions } from './action-resolver.js';
import { resolveApis } from './api-resolver.js';
import { resolveEffects } from './architecture-rule-resolver.js';
import { resolveComponents } from './component-resolver.js';
import { resolveForms, resolveValidations } from './form-resolver.js';
import { resolveMappers } from './mapper-resolver.js';
import {
  toFeatureCamel,
  toFeatureKebab,
  toFeaturePascal,
} from './naming-resolver.js';
import { resolveStore } from './store-resolver.js';
import { resolveTypes } from './type-resolver.js';

export interface ResolveStats {
  typeReferences: number;
  actionReferences: number;
  componentReferences: number;
}

export function resolveSpecification(draft: DraftScreenDocument): {
  document: ResolvedScreenDocument;
  stats: ResolveStats;
} {
  const featureKebab = toFeatureKebab(draft.screen.featureName);
  const featureCamel = toFeatureCamel(draft.screen.featureName);
  const featurePascal = toFeaturePascal(draft.screen.featureName);

  const resolvedTypes = resolveTypes(draft);
  const resolvedApis = resolveApis(draft);
  const resolvedActions = resolveActions(draft);
  const resolvedStore = resolveStore(draft);
  const resolvedEffects = resolveEffects(draft);
  const resolvedMappers = resolveMappers(draft);
  const resolvedForms = resolveForms(draft);
  const resolvedValidations = resolveValidations(draft);
  const resolvedComponents = resolveComponents(draft);

  const rootComponent =
    resolvedComponents.find((item) => item.parent == null) ?? resolvedComponents[0];

  const document: ResolvedScreenDocument = {
    metadata: {
      resolverVersion: RESOLVER_VERSION,
      generatedAt: new Date().toISOString(),
      sourceDraft: 'draft-screen.yaml',
    },
    generator: {
      target: 'angular',
      generatorVersion: GENERATOR_VERSION,
    },
    angular: {
      version: {
        major: 22,
        range: '>=22.0.0 <23.0.0',
      },
      architecture: draft.angular.architecture,
      component: draft.angular.component,
      template: draft.angular.template,
      forms: draft.angular.forms,
      state: { library: 'ngrx' },
      typescript: { range: '>=6.0.0 <6.1.0' },
      node: { range: '>=22.22.3 <23' },
    },
    screen: {
      ...draft.screen,
      featureKebab,
      featureCamel,
      featurePascal,
    },
    resolvedTypes,
    resolvedApis,
    resolvedActions,
    resolvedStore,
    resolvedEffects,
    resolvedMappers,
    resolvedForms,
    resolvedValidations,
    resolvedComponents,
    resolvedModule: {
      className: `${featurePascal}Module`,
      fileName: `${featureKebab}.module.ts`,
      declarations: resolvedComponents.map((item) => item.className),
    },
    resolvedRouting: {
      className: `${featurePascal}RoutingModule`,
      fileName: `${featureKebab}-routing.module.ts`,
      routes: draft.routing.routes.map((route) => {
        const component = resolvedComponents.find(
          (item) => item.id === route.component || item.className === route.component,
        );
        return {
          path: route.path,
          componentClassName: component?.className ?? rootComponent?.className ?? route.component,
          guard: route.guard ?? null,
        };
      }),
    },
    resolvedTests: draft.tests.map((test) => ({
      id: test.id,
      target: test.target,
      content: test.content,
    })),
  };

  const stats: ResolveStats = {
    typeReferences: resolvedTypes.length,
    actionReferences: resolvedActions.length,
    componentReferences: resolvedComponents.length,
  };

  return { document, stats };
}
