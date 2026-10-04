// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isSourceLoader, mergeOptions} from '@loaders.gl/loader-utils';
import type {
  Loader,
  LoaderOptions,
  LoaderWithParser,
  StrictLoaderOptions
} from '@loaders.gl/loader-utils';

const loaderImplementationPromises = new Map<Loader, Map<string, Promise<LoaderWithParser>>>();
const loaderImplementations = new Map<Loader, Map<string, LoaderWithParser>>();

/** Gets a parser-bearing implementation for a loader, loading it if needed. */
export async function getLoaderImplementation(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (isSourceLoader(loader)) {
    const source = loader.preload ? await loader.preload(url || '', options) : loader;
    if (!isSourceLoader(source)) {
      throw new Error(
        `${loader.id} source loader preload() did not return a runtime source loader`
      );
    }
    return source as unknown as LoaderWithParser;
  }
  if (isLoaderWithParser(loader)) {
    return loader;
  }

  const implementationCacheKey = getLoaderImplementationCacheKey(loader, options);
  const loaderImplementation = loaderImplementations.get(loader)?.get(implementationCacheKey);
  if (loaderImplementation) {
    return loaderImplementation;
  }

  let loaderImplementationPromisesForLoader = loaderImplementationPromises.get(loader);
  if (!loaderImplementationPromisesForLoader) {
    loaderImplementationPromisesForLoader = new Map();
    loaderImplementationPromises.set(loader, loaderImplementationPromisesForLoader);
  }

  let loaderImplementationPromise =
    loaderImplementationPromisesForLoader.get(implementationCacheKey);
  if (!loaderImplementationPromise) {
    loaderImplementationPromise = resolveLoaderImplementation(loader, options, url)
      .then(implementation => {
        let loaderImplementationsForLoader = loaderImplementations.get(loader);
        if (!loaderImplementationsForLoader) {
          loaderImplementationsForLoader = new Map();
          loaderImplementations.set(loader, loaderImplementationsForLoader);
        }
        loaderImplementationsForLoader.set(implementationCacheKey, implementation);
        return implementation;
      })
      .catch(error => {
        loaderImplementationPromisesForLoader.delete(implementationCacheKey);
        if (loaderImplementationPromisesForLoader.size === 0) {
          loaderImplementationPromises.delete(loader);
        }
        throw error;
      });
    loaderImplementationPromisesForLoader.set(implementationCacheKey, loaderImplementationPromise);
  }

  return await loaderImplementationPromise;
}

/** Gets a cached parser-bearing implementation for a loader without loading it. */
export function getLoaderImplementationSync(loader: Loader): LoaderWithParser | null {
  if (loader.subloaders && !preparedLoaders.has(loader)) {
    const prepared = preparedDefaults.get(loader);
    if (prepared) return prepared;
    if (!isLoaderWithParser(loader)) return null;
  }
  if (isLoaderWithParser(loader)) {
    return loader;
  }

  const implementationCacheKey = getLoaderImplementationCacheKey(loader);
  return loaderImplementations.get(loader)?.get(implementationCacheKey) || null;
}

/** Returns true when a loader object already includes parser methods. */
export function isLoaderWithParser(loader: Loader): loader is LoaderWithParser {
  const candidate = loader as LoaderWithParser;
  return Boolean(
    candidate.parse ||
      candidate.parseSync ||
      candidate.parseInBatches ||
      candidate.parseText ||
      candidate.parseTextSync ||
      candidate.parseFile ||
      candidate.parseFileInBatches
  );
}

/** Resolves a parser-bearing implementation through loader preload or the test import fallback. */
async function resolveLoaderImplementation(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (loader.preload) {
    const preloadedLoader = await loader.preload(url || '', options);
    if (isLoaderWithParser(preloadedLoader as Loader)) {
      return preloadedLoader as LoaderWithParser;
    }

    throw new Error(`${loader.id} loader preload() did not return a parser-bearing loader`);
  }

  const implementationSpecifier = getLoaderImplementationSpecifier(loader, options);
  return await importLoaderImplementation(implementationSpecifier, loader.id);
}

/** Gets the dynamic implementation specifier for the test worker fallback path. */
function getLoaderImplementationSpecifier(loader: Loader, options?: LoaderOptions): string {
  const workerType = options?._workerType || options?.core?._workerType;
  if (workerType === 'test') {
    const sourcePath = `modules/${loader.module}/src/${loader.id}-loader.ts`;
    if (typeof window !== 'undefined') {
      return `/${sourcePath}`;
    }

    if (typeof process !== 'undefined' && process.cwd) {
      return new URL(sourcePath, `file://${process.cwd()}/`).toString();
    }

    return sourcePath;
  }

  throw new Error(
    `${loader.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`
  );
}

/** Gets the cache key for option-selected parser implementations. */
function getLoaderImplementationCacheKey(loader: Loader, options?: LoaderOptions): string {
  const loaderOptions = options?.[loader.id] as {backend?: unknown} | undefined;
  const defaultLoaderOptions = loader.options?.[loader.id] as {backend?: unknown} | undefined;
  return String(loaderOptions?.backend || defaultLoaderOptions?.backend || '');
}

/** Imports a module and finds the parser-bearing loader implementation with the requested id. */
async function importLoaderImplementation(
  implementationSpecifier: string,
  loaderId: string
): Promise<LoaderWithParser> {
  const moduleExports = await import(
    /* webpackIgnore: true */ /* @vite-ignore */ implementationSpecifier
  );

  for (const exportValue of Object.values(moduleExports)) {
    if (
      exportValue &&
      typeof exportValue === 'object' &&
      (exportValue as Loader).id === loaderId &&
      isLoaderWithParser(exportValue as Loader)
    ) {
      return exportValue as LoaderWithParser;
    }
  }

  throw new Error(
    `Could not find parser implementation for ${loaderId} in ${implementationSpecifier}`
  );
}

/** Prepared loaders carry caller-local parser bindings rather than shared metadata. */
const preparedLoaders = new WeakSet<Loader>();
/** Successfully prepared default graphs used by synchronous parsing. */
const preparedDefaults = new WeakMap<Loader, LoaderWithParser>();
/** In-flight preparations for default dependency graphs. */
const subloaderPreparations = new WeakMap<Loader, Promise<LoaderWithParser>>();

/** Resolves declared dependencies and binds parser entry points to their implementations. */
export async function preloadLoaderDependencies(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (preparedLoaders.has(loader)) return await getLoaderImplementation(loader, options, url);
  validateSubloaderGraph(loader, options);
  return await prepareLoaderDependencies(loader, options, url);
}

/** Prepares a node after the complete dependency graph has been validated. */
async function prepareLoaderDependencies(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  // Options can select nested backends or overrides; do not share their bindings.
  if (!options) {
    const cached = subloaderPreparations.get(loader);
    if (cached) return await cached;
  }
  const preparation = bindSubloaders(loader, options, url);
  if (!options) {
    subloaderPreparations.set(loader, preparation);
    void preparation.catch(() => subloaderPreparations.delete(loader));
  }
  const prepared = await preparation;
  if (!options) preparedDefaults.set(loader, prepared);
  return prepared;
}

/** Returns declared dependencies with loader-scoped overrides applied. */
function getSubloaders(loader: Loader, options?: LoaderOptions): Record<string, Loader> {
  const scopedOptions = options?.[loader.id] as {subloaders?: Record<string, Loader>} | undefined;
  const overrides = scopedOptions?.subloaders || {};
  return Object.fromEntries(
    Object.entries(loader.subloaders || {}).map(([name, dependency]) => [
      name,
      Object.hasOwn(overrides, name) ? overrides[name] : dependency
    ])
  );
}

/** Rejects cycles and validates override names against all reachable declarations in each namespace. */
function validateSubloaderGraph(loader: Loader, options?: LoaderOptions): void {
  const declarations = new Map<string, Set<string>>();
  visitLoader(loader, []);
  for (const [loaderId, names] of declarations) {
    const scopedOptions = options?.[loaderId] as {subloaders?: Record<string, Loader>} | undefined;
    for (const name of Object.keys(scopedOptions?.subloaders || {})) {
      if (!names.has(name)) throw new Error(`${loaderId}: unknown subloader ${name}`);
    }
  }

  /** Collects declarations from the resolved graph while detecting cycles along each path. */
  function visitLoader(currentLoader: Loader, ancestors: Loader[]): void {
    if (ancestors.includes(currentLoader)) {
      throw new Error(
        `Subloader cycle: ${[...ancestors, currentLoader].map(value => value.id).join(' -> ')}`
      );
    }
    const names = declarations.get(currentLoader.id) || new Set<string>();
    for (const name of Object.keys(currentLoader.subloaders || {})) names.add(name);
    declarations.set(currentLoader.id, names);
    for (const dependency of Object.values(getSubloaders(currentLoader, options))) {
      visitLoader(dependency, [...ancestors, currentLoader]);
    }
  }
}

/** Prepares dependencies concurrently and injects them into parser calls' scoped options. */
async function bindSubloaders(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  const [implementation, entries] = await Promise.all([
    getLoaderImplementation(loader, options, url),
    Promise.all(
      Object.entries(getSubloaders(loader, options)).map(
        async ([name, dependency]) =>
          [name, await prepareLoaderDependencies(dependency, options, url)] as const
      )
    )
  ]);
  const subloaders = Object.fromEntries(entries);
  // Expose preload settings as defaults before core normalizes a later parse call.
  const defaultOptions = mergeOptions(
    implementation.options,
    (options || {}) as StrictLoaderOptions
  );
  defaultOptions.core = {...defaultOptions.core, worker: false};
  const prepared = {...implementation, options: defaultOptions, subloaders};
  delete prepared.preload;
  // Function-valued dependency bindings cannot be transferred to a worker.
  prepared.worker = false;
  for (const method of [
    'parseBlob',
    'createDataSource',
    'parse',
    'parseSync',
    'parseText',
    'parseTextSync',
    'parseInBatches',
    'parseFile',
    'parseFileInBatches',
    'parseUrl'
  ] as const) {
    const parser = (implementation as Record<string, unknown>)[method];
    if (typeof parser === 'function') {
      (prepared as Record<string, unknown>)[method] = (
        data: unknown,
        parseOptions?: LoaderOptions,
        context?: unknown
      ) => {
        const forwardedOptions = mergeOptions(options, parseOptions || {});
        return parser.call(
          implementation,
          data,
          {
            ...forwardedOptions,
            core: {...forwardedOptions.core, worker: false},
            [loader.id]: {...(forwardedOptions[loader.id] as object), subloaders}
          },
          context
        );
      };
    }
  }
  preparedLoaders.add(prepared);
  return prepared;
}
