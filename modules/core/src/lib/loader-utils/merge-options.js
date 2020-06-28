import {global} from '@loaders.gl/loader-utils';
import {DEFAULT_LOADER_OPTIONS} from '../constants';
import {NullLog} from './loggers';

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;

// Store global loader options on the global object to increase chances of cross loaders-version interoperability
// NOTE: This use case is not reliable but can help when testing new versions of loaders.gl with existing frameworks
global.loaders = global.loaders || {};
global.loaders._globalOptions = global.loaders._globalOptions || {};
// Ensure all default loader options from this library are mentioned
global.loaders._globalOptions = Object.assign(
  {},
  DEFAULT_LOADER_OPTIONS,
  global.loaders._globalOptions
);

// Set global loader options
export function setGlobalOptions(options) {
  global.loaders._globalOptions = mergeOptionsInternal(global.loaders._globalOptions, options);
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
// eslint-disable-next-line complexity
function validateLoaderOptions(
  loader,
  options,
  topOptions = DEFAULT_LOADER_OPTIONS,
  // eslint-disable-next-line
  log = console
) {
  // Check top level options
  if (topOptions) {
    for (const key in options) {
      // Only check non-object valued top-level keys
      if (typeof options[key] !== 'object' && !topOptions[key]) {
        log.warn(`Top-level loader option ${key} not recognized`);
      }
    }
  }

  // Get the scoped, loader specific options from the user supplied options
  const idOptions = (options && options[loader.id]) || {};

  // Get scoped, loader specific default and deprecated options from the selected loader
  const loaderOptions = (loader.options && loader.options[loader.id]) || {};
  const deprecatedOptions = (loader.defaultOptions && loader.defaultOptions[loader.id]) || {};

  // Validate loader specific options
  for (const key in idOptions) {
    if (!(key in loaderOptions)) {
      // Issue deprecation warnings
      if (key in deprecatedOptions) {
        log.warn(
          `${loader.name} loader option ${loader.id}.${key} deprecated, use ${
            deprecatedOptions[key]
          }`
        );
        // TODO - auto set updated option?
      } else {
        log.warn(`${loader.name} loader option ${loader.id}.${key} not recognized`);
      }
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

  mergeNestedFields(mergedOptions, global.loaders._globalOptions);
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
