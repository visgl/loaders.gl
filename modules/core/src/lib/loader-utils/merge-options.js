import {NullLog, ConsoleLog} from './loggers';

const COMMON_DEFAULT_OPTIONS = {
  log: new ConsoleLog()
};

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;
// Merges
export function mergeOptions(loader, options) {
  const loaderDefaultOptions =
    loader && (loader.DEFAULT_OPTIONS || loader.defaultOptions || loader.options || {});

  const mergedOptions = {
    ...COMMON_DEFAULT_OPTIONS,
    ...loaderDefaultOptions,
    dataType: 'arraybuffer', // TODO - explain why this option is needed for parsing
    ...options // Merges any non-nested fields, but clobbers nested fields
  };

  // LOGGING

  // options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  // Merge nested fields
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

  return mergedOptions;
}
