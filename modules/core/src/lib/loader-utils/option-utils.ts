// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Loader,
  LoaderOptions,
  StrictLoaderOptions,
  registerJSModules
} from '@loaders.gl/loader-utils';
import {isPureObject, isObject} from '../../javascript-utils/is-type';
import {probeLog, NullLog} from './loggers';
import {DEFAULT_LOADER_OPTIONS, REMOVED_LOADER_OPTIONS} from './option-defaults';

const CORE_LOADER_OPTION_KEYS = [
  'baseUri',
  'fetch',
  'mimeType',
  'fallbackMimeType',
  'ignoreRegisteredLoaders',
  'nothrow',
  'log',
  'useLocalLibraries',
  'CDN',
  'worker',
  'maxConcurrency',
  'maxMobileConcurrency',
  'reuseWorkers',
  '_nodeWorkers',
  '_workerType',
  'limit',
  '_limitMB',
  'batchSize',
  'batchDebounceMs',
  'metadata',
  'transforms'
] as const;

/**
 * Global state for loaders.gl. Stored on `globalThis.loaders._state`
 */
type GlobalLoaderState = {
  loaderRegistry: Loader[];
  globalOptions: LoaderOptions;
};

/**
 * Helper for safely accessing global loaders.gl variables
 * Wraps initialization of global variable in function to defeat overly aggressive tree-shakers
 */
export function getGlobalLoaderState(): GlobalLoaderState {
  // @ts-ignore
  globalThis.loaders = globalThis.loaders || {};
  // @ts-ignore
  const {loaders} = globalThis;

  // Add _state object to keep separate from modules added to globalThis.loaders
  if (!loaders._state) {
    loaders._state = {};
  }
  return loaders._state;
}

/**
 * Store global loader options on the global object to increase chances of cross loaders-version interoperability
 * NOTE: This use case is not reliable but can help when testing new versions of loaders.gl with existing frameworks
 * @returns global loader options merged with default loader options
 */
export function getGlobalLoaderOptions(): LoaderOptions {
  const state = getGlobalLoaderState();
  // Ensure all default loader options from this library are mentioned
  state.globalOptions = state.globalOptions || {
    ...DEFAULT_LOADER_OPTIONS,
    core: {...DEFAULT_LOADER_OPTIONS.core}
  };
  moveDeprecatedTopLevelOptionsToCore(state.globalOptions);
  addDeprecatedTopLevelOptions(state.globalOptions);
  return state.globalOptions;
}

/**
 * Set global loader options
 * @param options
 */
export function setGlobalOptions(options: LoaderOptions): void {
  const state = getGlobalLoaderState();
  const globalOptions = getGlobalLoaderOptions();
  // @ts-expect-error First param looks incorrect
  state.globalOptions = normalizeOptionsInternal(globalOptions, options);
  // Make sure any new modules are registered
  registerJSModules(options.modules);
}

/**
 * Merges options with global opts and loader defaults, also injects baseUri
 * @param options
 * @param loader
 * @param loaders
 * @param url
 */
export function normalizeOptions(
  options: LoaderOptions,
  loader: Loader,
  loaders?: Loader[],
  url?: string
): StrictLoaderOptions {
  loaders = loaders || [];
  loaders = Array.isArray(loaders) ? loaders : [loaders];

  validateOptions(options, loaders);
  return normalizeLoaderOptions(normalizeOptionsInternal(loader, options, url));
}

/**
 * Returns a copy of the provided options with deprecated top-level core fields moved into `core`
 * and removed from the top level. This keeps global options from leaking deprecated aliases into
 * loader-specific option maps during normalization.
 */
export function normalizeLoaderOptions(options: LoaderOptions): StrictLoaderOptions {
  const normalized = cloneLoaderOptions(options);
  moveDeprecatedTopLevelOptionsToCore(normalized);
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if (normalized.core && normalized.core[key] !== undefined) {
      delete (normalized as Record<string, unknown>)[key];
    }
  }
  return normalized as StrictLoaderOptions;
}

// VALIDATE OPTIONS

/**
 * Warn for unsupported options
 * @param options
 * @param loaders
 */
function validateOptions(options: LoaderOptions, loaders: Loader[]): void {
  // Check top level options
  validateOptionsObject(options, null, DEFAULT_LOADER_OPTIONS, REMOVED_LOADER_OPTIONS, loaders);
  for (const loader of loaders) {
    // Get the scoped, loader specific options from the user supplied options
    const idOptions: Record<string, unknown> =
      ((options && options[loader.id]) as Record<string, unknown>) || {};

    // Get scoped, loader specific default and deprecated options from the selected loader
    const loaderOptions = (loader.options && loader.options[loader.id]) || {};
    const deprecatedOptions =
      (loader.deprecatedOptions && loader.deprecatedOptions[loader.id]) || {};

    // Validate loader specific options
    // @ts-ignore
    validateOptionsObject(idOptions, loader.id, loaderOptions, deprecatedOptions, loaders);
  }
}

// eslint-disable-next-line max-params, complexity
function validateOptionsObject(
  options: LoaderOptions,
  id: string | null,
  defaultOptions: Record<string, unknown>,
  deprecatedOptions: Record<string, unknown>,
  loaders: Loader[]
): void {
  const loaderName = id || 'Top level';
  const prefix = id ? `${id}.` : '';

  for (const key in options) {
    // If top level option value is an object it could options for a loader, so ignore
    const isSubOptions = !id && isObject(options[key]);
    const isBaseUriOption = key === 'baseUri' && !id;
    const isWorkerUrlOption = key === 'workerUrl' && id;
    // <loader>.workerUrl requires special handling as it is now auto-generated and no longer specified as a default option.
    if (!(key in defaultOptions) && !isBaseUriOption && !isWorkerUrlOption) {
      // Issue deprecation warnings
      if (key in deprecatedOptions) {
        probeLog.warn(
          `${loaderName} loader option \'${prefix}${key}\' no longer supported, use \'${deprecatedOptions[key]}\'`
        )();
      } else if (!isSubOptions) {
        const suggestion = findSimilarOption(key, loaders);
        probeLog.warn(
          `${loaderName} loader option \'${prefix}${key}\' not recognized. ${suggestion}`
        )();
      }
    }
  }
}

function findSimilarOption(optionKey: string, loaders: Loader[]): string {
  const lowerCaseOptionKey = optionKey.toLowerCase();
  let bestSuggestion = '';
  for (const loader of loaders) {
    for (const key in loader.options) {
      if (optionKey === key) {
        return `Did you mean \'${loader.id}.${key}\'?`;
      }
      const lowerCaseKey = key.toLowerCase();
      const isPartialMatch =
        lowerCaseOptionKey.startsWith(lowerCaseKey) || lowerCaseKey.startsWith(lowerCaseOptionKey);
      if (isPartialMatch) {
        bestSuggestion = bestSuggestion || `Did you mean \'${loader.id}.${key}\'?`;
      }
    }
  }
  return bestSuggestion;
}

function normalizeOptionsInternal(
  loader: Loader,
  options: LoaderOptions,
  url?: string
): LoaderOptions {
  const loaderDefaultOptions = loader.options || {};

  const mergedOptions = {...loaderDefaultOptions};
  if (loaderDefaultOptions.core) {
    mergedOptions.core = {...loaderDefaultOptions.core};
  }
  moveDeprecatedTopLevelOptionsToCore(mergedOptions);

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.core?.log === null) {
    mergedOptions.core = {...mergedOptions.core, log: new NullLog()};
  }

  mergeNestedFields(mergedOptions, normalizeLoaderOptions(getGlobalLoaderOptions()));

  const userOptions = normalizeLoaderOptions(options);
  mergeNestedFields(mergedOptions, userOptions);

  addUrlOptions(mergedOptions, url);
  addDeprecatedTopLevelOptions(mergedOptions);

  return mergedOptions;
}

// Merge nested options objects
function mergeNestedFields(mergedOptions: LoaderOptions, options: LoaderOptions): void {
  for (const key in options) {
    // Check for nested options
    // object in options => either no key in defaultOptions or object in defaultOptions
    if (key in options) {
      const value = options[key];
      if (isPureObject(value) && isPureObject(mergedOptions[key])) {
        mergedOptions[key] = {
          ...(mergedOptions[key] as object),
          ...(options[key] as object)
        };
      } else {
        mergedOptions[key] = options[key];
      }
    }
    // else: No need to merge nested opts, and the initial merge already copied over the nested options
  }
}

/**
 * Harvest information from the url
 * @deprecated This is mainly there to support a hack in the GLTFLoader
 * TODO - baseUri should be a directory, i.e. remove file component from baseUri
 * TODO - extract extension?
 * TODO - extract query parameters?
 * TODO - should these be injected on context instead of options?
 */
function addUrlOptions(options: LoaderOptions, url?: string): void {
  if (!url) {
    return;
  }
  const hasTopLevelBaseUri = options.baseUri !== undefined;
  const hasCoreBaseUri = options.core?.baseUri !== undefined;
  if (!hasTopLevelBaseUri && !hasCoreBaseUri) {
    options.core ||= {};
    options.core.baseUri = url;
  }
}

function cloneLoaderOptions(options: LoaderOptions): LoaderOptions {
  const clonedOptions = {...options};
  if (options.core) {
    clonedOptions.core = {...options.core};
  }
  return clonedOptions;
}

function moveDeprecatedTopLevelOptionsToCore(options: LoaderOptions): void {
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if ((options as Record<string, unknown>)[key] !== undefined) {
      const coreOptions = (options.core = options.core || {});
      const coreRecord = coreOptions as Record<string, unknown>;
      // Treat deprecated top-level core options as aliases to `options.core`, but never override an explicitly
      // provided `options.core` value.
      if (coreRecord[key] === undefined) {
        coreRecord[key] = (options as Record<string, unknown>)[key];
      }
    }
  }
}

function addDeprecatedTopLevelOptions(options: LoaderOptions): void {
  const coreOptions = options.core as Record<string, unknown> | undefined;
  if (!coreOptions) {
    return;
  }
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if (coreOptions[key] !== undefined) {
      (options as Record<string, unknown>)[key] = coreOptions[key];
    }
  }
}
