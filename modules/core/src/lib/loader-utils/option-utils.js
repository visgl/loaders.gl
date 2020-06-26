import {global} from '@loaders.gl/loader-utils';
import {isPureObject, isObject} from '../../javascript-utils/is-type';
import {fetchFile} from '../fetch/fetch-file';
import {NullLog, ConsoleLog} from './loggers';

const DEFAULT_LOADER_OPTIONS = {
  fetch: null,
  CDN: 'https://unpkg.com/@loaders.gl',
  worker: true, // By default, use worker if provided by loader
  log: new ConsoleLog(), // A probe.gl compatible (`log.log()()` syntax) that just logs to console
  dataType: 'arraybuffer', // TODO - explain why this option is needed for parsing
  metadata: false // TODO - currently only implemented for parseInBatches, adds initial metadata batch
};

const DEPRECATED_LOADER_OPTIONS = {
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

// export function getOptions(options = {}) {
//   // Note: No options validation at this stage
//   const mergedOptions = {...options};

//   // LOGGING: options.log can be set to `null` to defeat logging, but should always be a valid log
//   // TODO - move to context, no need to modify options...
//   // @ts-ignore
//   if (mergedOptions.log === null) {
//     // @ts-ignore
//     mergedOptions.log = new NullLog();
//   }

//   mergeNestedFields(mergedOptions, getGlobalLoaderOptions());
//   return mergedOptions;
// }

// Merges options with global opts and loader defaults, also injects baseUri
export function normalizeOptions(options, loader, candidateLoaders = [], url) {
  validateLoaderOptions(options, loader);
  return normalizeOptionsInternal(loader, options, url);
}

export function getFetchFunction(options, context) {
  const globalOptions = getGlobalLoaderOptions();
  const fetchOptions = options.fetch || globalOptions.fetch;
  switch (typeof fetchOptions) {
    case 'function':
      return fetchOptions;
    case 'object':
      return url => fetchFile(url, fetchOptions);
    default:
      if (context && context.fetch) {
        return context.fetch;
      }
      // TODO DEPRECATED, support for root level fetch options will be removed in 3.0
      return url => fetchFile(url, options);
    // return fetchFile;
  }
}

// VALIDATE OPTIONS

/**
 * Warn for unsupported options
 * @param {object} options
 * @param {*} loader
 * @param {*} log
 */
// eslint-disable-next-line complexity
function validateLoaderOptions(
  options,
  loader,
  // eslint-disable-next-line
  log = console
) {
  // Check top level options
  validateOptionsObject(options, null, log, DEFAULT_LOADER_OPTIONS, DEPRECATED_LOADER_OPTIONS);

  // Get the scoped, loader specific options from the user supplied options
  const idOptions = (options && options[loader.id]) || {};

  // Get scoped, loader specific default and deprecated options from the selected loader
  const loaderOptions = (loader.options && loader.options[loader.id]) || {};
  const deprecatedOptions = (loader.defaultOptions && loader.defaultOptions[loader.id]) || {};

  // Validate loader specific options
  validateOptionsObject(idOptions, loader.id, log, loaderOptions, deprecatedOptions);
}

function validateOptionsObject(options, id, log, defaultOptions, deprecatedOptions) {
  const loaderName = id || 'Top level';
  const prefix = id ? `${id}.` : '';

  for (const key in options) {
    const isSubOptions = !id && isObject(options[key]);
    if (!isSubOptions && !(key in defaultOptions)) {
      // Issue deprecation warnings
      if (key in deprecatedOptions) {
        log.warn(
          `${loaderName} loader option ${prefix}${key} deprecated, use ${deprecatedOptions[key]}`
        );
      } else {
        log.warn(`${loaderName} loader option ${prefix}${key} not recognized`);
      }
    }
  }
}

function normalizeOptionsInternal(loader, options, url) {
  const loaderDefaultOptions = loader.options || {};

  const mergedOptions = {...loaderDefaultOptions};

  addUrlOptions(mergedOptions, url);

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNestedFields(mergedOptions, getGlobalLoaderOptions());
  mergeNestedFields(mergedOptions, options);

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
  if (url && !('baseUri' in options)) {
    options.baseUri = url;
  }
}
