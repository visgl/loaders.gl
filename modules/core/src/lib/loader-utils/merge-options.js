import {DEFAULT_LOADER_OPTIONS} from '../constants';
import {NullLog} from './loggers';

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;

let globalOptions = {...DEFAULT_LOADER_OPTIONS};

// Set global loader options
export function setGlobalOptions(options) {
  globalOptions = mergeOptionsInternal(globalOptions, options);
}

// Merges options with global opts and loader defaults, also injects baseUri
export function mergeOptions(loader, options, url, topOptions = null) {
  validateLoaderOptions(loader, options, topOptions);
  return mergeOptionsInternal(loader, options, url);
}

/**
 * Warn for unsupported options
 * @param {*} loader
 * @param {object} options
 * @param {object | null} topOptions
 * @param {*} log
 */
function validateLoaderOptions(loader, options, topOptions, log = console) {
  // Check top level options
  if (topOptions) {
    for (const key in options) {
      // Only check non-object valued top-level keys
      if (typeof options[key] !== 'object' && !topOptions[key]) {
        log.warn(`Top-level loader option ${key} not recognized`);
      }
    }
  }

  // Get the loader specific options if any
  const idOptions = (options && options[loader.id]) || {};

  // Validate loader specific options
  for (const key in idOptions) {
    if (!(key in loader.options[loader.id])) {
      log.warn(`${loader.name} loader option ${loader.id}.${key} not recognized`);
    }
  }
}

function mergeOptionsInternal(loader, options, url) {
  const loaderDefaultOptions = loader.options || {};

  const mergedOptions = {...loaderDefaultOptions};

  addUrlOptions(mergedOptions, url);

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNestedFields(mergedOptions, globalOptions);
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
