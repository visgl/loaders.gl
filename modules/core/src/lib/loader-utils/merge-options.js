import {DEFAULT_LOADER_OPTIONS} from '../constants';
import {NullLog} from './loggers';

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;

let globalOptions = {...DEFAULT_LOADER_OPTIONS};

// Set global loader options
export function setGlobalOptions(options) {
  globalOptions = mergeOptions(globalOptions, options);
}

// Merges options with global opts and loader defaults, also injects baseUri
export function mergeOptions(loader, options, url) {
  const loaderDefaultOptions =
    loader && (loader.DEFAULT_LOADER_OPTIONS || loader.defaultOptions || loader.options || {});

  const mergedOptions = {
    ...loaderDefaultOptions,
    ...globalOptions,
    ...options // Merges any non-nested fields, but clobbers nested fields
  };

  addUrlOptions(mergedOptions, url);

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNestedFields(mergedOptions, loaderDefaultOptions, globalOptions);
  mergeNestedFields(mergedOptions, loaderDefaultOptions, options);

  return mergedOptions;
}

// Merge nested options objects
function mergeNestedFields(mergedOptions, loaderDefaultOptions, options) {
  for (const key in options) {
    const value = options[key];
    // Check for nested options
    // object in options => either no key in defaultOptions or object in defaultOptions
    if (isPureObject(value) && key in loaderDefaultOptions) {
      if (isPureObject(loaderDefaultOptions[key])) {
        mergedOptions[key] = {
          ...loaderDefaultOptions[key],
          ...options[key]
        };
      } else {
        mergedOptions.log.warn(`Nested option ${key} not recognized`)();
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
