import type { ScreenDefinition, TypeDefinition } from '../types/screen-definition.js';
import { kebabCase } from '../utils/naming.js';

export interface RenderedProperty {
  name: string;
  type: string;
  optional: boolean;
  description: string;
}

export interface RenderedImport {
  path: string;
  names: string[];
}

export interface RenderedType {
  name: string;
  properties: RenderedProperty[];
  imports: RenderedImport[];
}

/** One generated TypeScript file that may contain multiple interfaces. */
export interface RenderedModelFile {
  /** File base name without extension, e.g. `action-payloads`. */
  fileBase: string;
  types: RenderedType[];
  imports: RenderedImport[];
}

export interface ModelContext {
  /** One file per API DTO. */
  api: RenderedModelFile[];
  /** One file per view/store model. */
  view: RenderedModelFile[];
  /** All action payload interfaces in a single file. */
  action: RenderedModelFile[];
}

type ModelDir = 'api' | 'store' | 'actions';

const PRIMITIVES = new Set<string>([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'unknown',
  'never',
  'object',
  'Date',
]);

/** Shared file that holds every action payload interface. */
export const ACTION_PAYLOADS_FILE_BASE = 'action-payloads';

interface RegistryEntry {
  dir: ModelDir;
  file: string;
  name: string;
}

function baseTokens(typeExpr: string): string[] {
  return typeExpr
    .split('|')
    .map((part) => part.trim().replace(/\[\]$/, ''))
    .filter((part) => part.length > 0);
}

function buildRegistry(definition: ScreenDefinition): Map<string, RegistryEntry> {
  const registry = new Map<string, RegistryEntry>();
  for (const type of definition.types.api) {
    registry.set(type.name, { dir: 'api', file: kebabCase(type.name), name: type.name });
  }
  for (const type of definition.types.view) {
    registry.set(type.name, { dir: 'store', file: kebabCase(type.name), name: type.name });
  }
  for (const type of definition.types.action) {
    registry.set(type.name, {
      dir: 'actions',
      file: ACTION_PAYLOADS_FILE_BASE,
      name: type.name,
    });
  }
  return registry;
}

function computeImports(
  type: TypeDefinition,
  ownDir: ModelDir,
  ownFile: string,
  registry: Map<string, RegistryEntry>,
): RenderedImport[] {
  const byPath = new Map<string, Set<string>>();
  for (const property of type.properties) {
    for (const token of baseTokens(property.type)) {
      if (PRIMITIVES.has(token) || token === type.name) {
        continue;
      }
      const entry = registry.get(token);
      if (!entry) {
        continue;
      }
      // Same physical file (e.g. two action payloads) needs no import.
      if (entry.dir === ownDir && entry.file === ownFile) {
        continue;
      }
      const path =
        entry.dir === ownDir
          ? `./${entry.file}.model`
          : `../${entry.dir}/${entry.file}.model`;
      if (!byPath.has(path)) {
        byPath.set(path, new Set());
      }
      byPath.get(path)!.add(entry.name);
    }
  }
  return [...byPath.entries()]
    .map(([path, names]) => ({ path, names: [...names].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function mergeImports(importsList: RenderedImport[][]): RenderedImport[] {
  const byPath = new Map<string, Set<string>>();
  for (const imports of importsList) {
    for (const item of imports) {
      if (!byPath.has(item.path)) {
        byPath.set(item.path, new Set());
      }
      for (const name of item.names) {
        byPath.get(item.path)!.add(name);
      }
    }
  }
  return [...byPath.entries()]
    .map(([path, names]) => ({ path, names: [...names].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function mapType(
  type: TypeDefinition,
  dir: ModelDir,
  fileBase: string,
  registry: Map<string, RegistryEntry>,
): RenderedType {
  return {
    name: type.name,
    properties: type.properties.map((property) => ({
      name: property.name,
      type: property.type,
      optional: property.optional,
      description: property.description,
    })),
    imports: computeImports(type, dir, fileBase, registry),
  };
}

function oneFilePerType(
  types: TypeDefinition[],
  dir: ModelDir,
  registry: Map<string, RegistryEntry>,
): RenderedModelFile[] {
  return types.map((type) => {
    const fileBase = kebabCase(type.name);
    const rendered = mapType(type, dir, fileBase, registry);
    return {
      fileBase,
      types: [rendered],
      imports: rendered.imports,
    };
  });
}

function consolidatedActionFile(
  types: TypeDefinition[],
  registry: Map<string, RegistryEntry>,
): RenderedModelFile[] {
  if (types.length === 0) {
    return [];
  }
  const fileBase = ACTION_PAYLOADS_FILE_BASE;
  const rendered = types.map((type) => mapType(type, 'actions', fileBase, registry));
  return [
    {
      fileBase,
      types: rendered,
      imports: mergeImports(rendered.map((type) => type.imports)),
    },
  ];
}

export function buildModels(definition: ScreenDefinition): ModelContext {
  const registry = buildRegistry(definition);
  return {
    api: oneFilePerType(definition.types.api, 'api', registry),
    view: oneFilePerType(definition.types.view, 'store', registry),
    action: consolidatedActionFile(definition.types.action, registry),
  };
}
