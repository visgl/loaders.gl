// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Loader,
  LoaderOptions,
  registerJSModules,
  isPureObject,
  isObject,
  StrictLoaderOptions,
  getLoaderLog,
  path
} from '@loaders.gl/core/loader-utils';
import {probeLog} from './loggers';
import {DEFAULT_LOADER_OPTIONS, REMOVED_LOADER_OPTIONS} from './option-defaults';
import {getShapeOptionKey} from './native-arrow';
import {stripQueryString} from '../utils/url-utils';

/**
 * Appends loader search parameters to a URL while preserving existing parameters and fragments.
 * @param url URL to update
 * @param options Loader options containing optional search parameters
 * @returns URL with the configured parameters appended
 */
export function applySearchParamsToUrl(url: string, options?: LoaderOptions): string {
  const searchParams = options?.searchParams;
  if (!searchParams || Object.keys(searchParams).length === 0 || /^(?:data|blob):/i.test(url)) {
    return url;
  }

  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const urlWithoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = urlWithoutHash.indexOf('?');
  const path = queryIndex >= 0 ? urlWithoutHash.slice(0, queryIndex) : urlWithoutHash;
  const query = queryIndex >= 0 ? urlWithoutHash.slice(queryIndex + 1) : '';
  const existingSearchParams = new URLSearchParams(query);
  const appendedSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (!existingSearchParams.has(key)) {
      appendedSearchParams.set(key, String(value));
    }
  }

  const serializedAppendedSearchParams = appendedSearchParams.toString();
  return `${path}${queryIndex >= 0 ? `?${query}` : ''}${
    serializedAppendedSearchParams
      ? `${queryIndex >= 0 ? '&' : '?'}${serializedAppendedSearchParams}`
      : ''
  }${hash}`;
}

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
export function getGlobalLoaderOptions(): StrictLoaderOptions {
  const state = getGlobalLoaderState();
  // Ensure all default loader options from this library are mentioned
  state.globalOptions = state.globalOptions || {
    ...DEFAULT_LOADER_OPTIONS,
    core: {...DEFAULT_LOADER_OPTIONS.core}
  };
  return cloneLoaderOptions(state.globalOptions) as StrictLoaderOptions;
}

/**
 * Set global loader options
 * @param options
 */
export function setGlobalOptions(options: LoaderOptions): void {
  const state = getGlobalLoaderState();
  const globalOptions = getGlobalLoaderOptions();
  validateOptions(options, []);
  validateWorkerThreshold(options);
  mergeNestedFields(globalOptions, options);
  state.globalOptions = globalOptions;
  // Make sure any new modules are registered
  registerJSModules(options.modules);
}

/**
 * Merges options with global opts and loader defaults, also injects baseUrl
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
  validateWorkerThreshold(options);
  const normalizedOptions = normalizeOptionsInternal(loader, options, url);
  validateWorkerThreshold(normalizedOptions);
  return normalizedOptions as StrictLoaderOptions;
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

/** Validates the automatic worker-selection threshold. */
function validateWorkerThreshold(options: LoaderOptions): void {
  const threshold = options.core?.workerThreshold;
  if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0 || threshold > 1)) {
    throw new Error('core.workerThreshold must be a finite number between 0 and 1');
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
    const isLifecycleOption = !id && ['signal', 'onProgress'].includes(key);
    const isWorkerUrlOption = key === 'workerUrl' && id;
    // <loader>.workerUrl requires special handling as it is now auto-generated and no longer specified as a default option.
    if (!(key in defaultOptions) && !isLifecycleOption && !isWorkerUrlOption) {
      // Issue deprecation warnings
      if (key in deprecatedOptions) {
        if (probeLog.level > 0) {
          probeLog.warn(
            `${loaderName} loader option \'${prefix}${key}\' no longer supported, use \'${deprecatedOptions[key]}\'`
          )();
        }
      } else if (!isSubOptions) {
        if (probeLog.level > 0) {
          const suggestion = findSimilarOption(key, loaders);
          probeLog.warn(
            `${loaderName} loader option \'${prefix}${key}\' not recognized. ${suggestion}`
          )();
        }
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

  const shapeKey = loader.defaultShape && getShapeOptionKey(loader);
  if (shapeKey) {
    mergedOptions[shapeKey] = {
      ...(loaderDefaultOptions[shapeKey] as object),
      shape: loader.defaultShape
    };
  }
  mergeNestedFields(mergedOptions, getGlobalLoaderOptions());

  mergeNestedFields(mergedOptions, options);
  applyCoreShapeDefault(mergedOptions, options, loader);
  if (mergedOptions.core?.log === null) {
    mergedOptions.core = {...mergedOptions.core, log: getLoaderLog(mergedOptions)};
  }

  addUrlOptions(mergedOptions, url);

  return mergedOptions;
}

/**
 * Applies `options.core.shape` to a loader's scoped `shape` option when that loader declares
 * shape support and neither global nor user-supplied loader-scoped options override it.
 * @param mergedOptions fully merged options object being normalized
 * @param userOptions normalized user-supplied options
 * @param loader selected loader
 */
function applyCoreShapeDefault(
  mergedOptions: LoaderOptions,
  userOptions: LoaderOptions,
  loader: Loader
): void {
  const coreShape = mergedOptions.core?.shape;
  if (coreShape === undefined) {
    return;
  }

  const shapeOptionKey = getShapeOptionKey(loader);
  if (!shapeOptionKey) {
    return;
  }
  const loaderScopedDefaults = loader.options?.[shapeOptionKey];
  if (!isPureObject(loaderScopedDefaults) || !('shape' in loaderScopedDefaults)) {
    return;
  }

  const globalLoaderScopedOptions = getGlobalLoaderOptions()[shapeOptionKey];
  if (isPureObject(globalLoaderScopedOptions) && 'shape' in globalLoaderScopedOptions) {
    return;
  }

  const userLoaderScopedOptions = userOptions[shapeOptionKey];
  if (isPureObject(userLoaderScopedOptions) && 'shape' in userLoaderScopedOptions) {
    return;
  }

  const loaderScopedOptions = mergedOptions[shapeOptionKey];
  mergedOptions[shapeOptionKey] = {
    ...(isPureObject(loaderScopedOptions) ? loaderScopedOptions : {}),
    shape: coreShape
  };
}

/**
 * Merges one level of nested option objects into the target options record.
 * @param mergedOptions target options object to mutate
 * @param options source options object
 */
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
 * @deprecated This is mainly there to support loaders that still resolve from options
 * TODO - extract extension?
 * TODO - extract query parameters?
 * TODO - should these be injected on context instead of options?
 */
function addUrlOptions(options: LoaderOptions, url?: string): void {
  if (!url) {
    return;
  }
  const hasCoreBaseUrl = options.core?.baseUrl !== undefined;
  if (!hasCoreBaseUrl) {
    options.core ||= {};
    options.core.baseUrl = path.dirname(stripQueryString(url));
  }
}

function cloneLoaderOptions(options: LoaderOptions): LoaderOptions {
  const clonedOptions = {...options};
  if (options.core) {
    clonedOptions.core = {...options.core};
  }
  return clonedOptions;
}
