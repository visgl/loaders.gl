import {NullLog, ConsoleLog} from './loggers';

const COMMON_DEFAULT_OPTIONS = {
  worker: true, // By default, use worker if provided by loader
  log: new ConsoleLog() // A probe.gl compatible (`log.log()()` syntax) that just logs to console
};

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;
// Merges
export function mergeOptions(loader, options, url) {
  const loaderDefaultOptions =
    loader && (loader.DEFAULT_OPTIONS || loader.defaultOptions || loader.options || {});

  const mergedOptions = {
    ...COMMON_DEFAULT_OPTIONS,
    ...loaderDefaultOptions,
    dataType: 'arraybuffer', // TODO - explain why this option is needed for parsing
    ...options // Merges any non-nested fields, but clobbers nested fields
  };

  // TODO - remove file component from baseUri
  if (url && !('baseUri' in mergedOptions)) {
    mergedOptions.baseUri = url;
  }

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNesteFields(mergedOptions, options, loaderDefaultOptions);

  return mergedOptions;
}

// Merge nested options objects
function mergeNesteFields(mergedOptions, options, loaderDefaultOptions) {
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
