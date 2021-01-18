import {global} from '@loaders.gl/loader-utils';
import {isPureObject, isObject} from '../../javascript-utils/is-type';
import {fetchFile} from '../fetch/fetch-file';
import {NullLog, ConsoleLog} from './loggers';

const DEFAULT_LOADER_OPTIONS = {
  baseUri: '',
  fetch: null,
  CDN: 'https://unpkg.com/@loaders.gl',
  worker: true, // By default, use worker if provided by loader
  log: new ConsoleLog(), // A probe.gl compatible (`log.log()()` syntax) that just logs to console
  metadata: false, // TODO - currently only implemented for parseInBatches, adds initial metadata batch,
  transforms: [],
  reuseWorkers: true // By default reuse workers
};

const DEPRECATED_LOADER_OPTIONS = {
  dataType: '(no longer used)',
  // Warn if fetch options are used on top-level
  method: 'fetch.method',
  headers: 'fetch.headers',
  body: 'fetch.body',
  mode: 'fetch.mode',
  credentials: 'fetch.credentials',
  cache: 'fetch.cache',
  redirect: 'fetch.redirect',
  referrer: 'fetch.referrer',
  referrerPolicy: 'fetch.referrerPolicy',
  integrity: 'fetch.integrity',
  keepalive: 'fetch.keepalive',
  signal: 'fetch.signal'
};

// Helper to reliably get global loader state
// Wraps initialization of global variable in function to defeat overly agressive tree-shakers
export const getGlobalLoaderState = () => {
  // @ts-ignore
  global.loaders = global.loaders || {};
  // @ts-ignore
  const {loaders} = global;

  // Add _state object to keep separate from modules added to global.loaders
  loaders._state = loaders._state || {};
  return loaders._state;
};

// Store global loader options on the global object to increase chances of cross loaders-version interoperability
// NOTE: This use case is not reliable but can help when testing new versions of loaders.gl with existing frameworks
const getGlobalLoaderOptions = () => {
  const state = getGlobalLoaderState();
  // Ensure all default loader options from this library are mentioned
  state.globalOptions = state.globalOptions || {...DEFAULT_LOADER_OPTIONS};
  return state.globalOptions;
};

// Set global loader options
export function setGlobalOptions(options) {
  const state = getGlobalLoaderState();
  const globalOptions = getGlobalLoaderOptions();
  state.globalOptions = normalizeOptionsInternal(globalOptions, options);
}

// Merges options with global opts and loader defaults, also injects baseUri
// Merges options with global opts and loader defaults, also injects baseUri
export function normalizeOptions(options, loader, loaders, url) {
  loaders = loaders || [];
  loaders = Array.isArray(loaders) ? loaders : [loaders];

  validateOptions(options, loaders);
  return normalizeOptionsInternal(loader, options, url);
}

export function getFetchFunction(options, context) {
  const globalOptions = getGlobalLoaderOptions();

  const fetch = options.fetch || globalOptions.fetch;

  // options.fetch can be a function
  if (typeof fetch === 'function') {
    return fetch;
  }

  // options.fetch can be an options object
  if (isObject(fetch)) {
    return url => fetchFile(url, fetch);
  }

  // else refer to context (from parent loader) if available
  if (context && context.fetch) {
    return context.fetch;
  }

  // else return the default fetch function

  // TODO DEPRECATED, support for root level fetch options will be removed in 3.0
  return url => fetchFile(url, options);

  // return fetchFile;
}

// VALIDATE OPTIONS

/**
 * Warn for unsupported options
 * @param {object} options
 * @param {*} loaders
 * @param {*} log
 */
function validateOptions(
  options,
  loaders,
  // eslint-disable-next-line
  log = console
) {
  // Check top level options
  validateOptionsObject(
    options,
    null,
    log,
    DEFAULT_LOADER_OPTIONS,
    DEPRECATED_LOADER_OPTIONS,
    loaders
  );
  for (const loader of loaders) {
    // Get the scoped, loader specific options from the user supplied options
    const idOptions = (options && options[loader.id]) || {};

    // Get scoped, loader specific default and deprecated options from the selected loader
    const loaderOptions = (loader.options && loader.options[loader.id]) || {};
    const deprecatedOptions = (loader.defaultOptions && loader.defaultOptions[loader.id]) || {};

    // Validate loader specific options
    validateOptionsObject(idOptions, loader.id, log, loaderOptions, deprecatedOptions, loaders);
  }
}

// eslint-disable-next-line max-params
function validateOptionsObject(options, id, log, defaultOptions, deprecatedOptions, loaders) {
  const loaderName = id || 'Top level';
  const prefix = id ? `${id}.` : '';

  for (const key in options) {
    // If top level option value is an object it could options for a loader, so ignore
    const isSubOptions = !id && isObject(options[key]);
    if (!(key in defaultOptions)) {
      // Issue deprecation warnings
      if (key in deprecatedOptions) {
        log.warn(
          `${loaderName} loader option \'${prefix}${key}\' deprecated, use \'${
            deprecatedOptions[key]
          }\'`
        );
      } else if (!isSubOptions) {
        const suggestion = findSimilarOption(key, loaders);
        log.warn(`${loaderName} loader option \'${prefix}${key}\' not recognized. ${suggestion}`);
      }
    }
  }
}

function findSimilarOption(optionKey, loaders) {
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

function normalizeOptionsInternal(loader, options, url) {
  const loaderDefaultOptions = loader.options || {};

  const mergedOptions = {...loaderDefaultOptions};

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNestedFields(mergedOptions, getGlobalLoaderOptions());
  mergeNestedFields(mergedOptions, options);

  addUrlOptions(mergedOptions, url);

  return mergedOptions;
}

// Merge nested options objects
function mergeNestedFields(mergedOptions, options) {
  for (const key in options) {
    // Check for nested options
    // object in options => either no key in defaultOptions or object in defaultOptions
    if (key in options) {
      const value = options[key];
      if (isPureObject(value) && isPureObject(mergedOptions[key])) {
        mergedOptions[key] = {
          ...mergedOptions[key],
          ...options[key]
        };
      } else {
        mergedOptions[key] = options[key];
      }
    }
    // else: No need to merge nested opts, and the initial merge already copied over the nested options
  }
}

// Harvest information from the url
// TODO - baseUri should be a directory, i.e. remove file component from baseUri
// TODO - extract extension?
// TODO - extract query parameters?
// TODO - should these be injected on context instead of options?
function addUrlOptions(options, url) {
  if (url && !options.baseUri) {
    options.baseUri = url;
  }
}
