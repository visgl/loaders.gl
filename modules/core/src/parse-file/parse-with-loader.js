import parseWithWorker from '../worker-utils/parse-with-worker';
import NullLog from '../log-utils/null-log';
import assert from '../utils/assert';

// TODO: support progress and abort
// TODO: support moving loading to worker
export function parseWithLoader(data, loader, options = {}, url) {
  validateLoaderObject(loader);

  // Normalize options
  options = addDefaultParserOptions(options, loader);

  // v0.5 support
  normalizeLegacyLoaderObject(loader);

  if (loader.worker) {
    return parseWithWorker(loader.worker, data, options);
  }

  // First check for synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return promisify(loader.parseTextSync, loader, url, data, options);
  }

  // Now check for synchronous binary data parser, wrap results in promises
  if (loader.parseSync) {
    return promisify(loader.parseSync, loader, url, data, options);
  }

  // Check for asynchronous parser
  if (loader.parse) {
    const promise = loader.parse(data, options);
    // NOTE: keep return on separate statement to facilitate breakpoints here when debugging
    return promise;
  }

  // TBD - If asynchronous parser not available, return null
  // => This loader does not work on loaded data and only supports `loadAndParseAsync`
  return null;
}

export function parseWithLoaderSync(data, loader, options = {}, url) {
  validateLoaderObject(loader);

  // Normalize options
  options = addDefaultParserOptions(options, loader);

  // v0.5 support
  normalizeLegacyLoaderObject(loader);

  // First check for synchronous parsers
  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options);
  }
  if (loader.parseSync) {
    return loader.parseSync(data, options);
  }

  // TBD - If synchronous parser not available, return null
  return null;
}

// Helper function to wrap parser result/error in promise
function promisify(parserFunc, loader, url, data, options) {
  return new Promise((resolve, reject) => {
    try {
      const result = resolve(parserFunc(data, options));
      // NOTE: return on separate statement to facilitate breakpoint setting here when debugging
      resolve(result);
    } catch (error) {
      console.error(error); // eslint-disable-line
      reject(new Error(`Could not parse ${url || 'data'} using ${loader.name} loader`));
    }
  });
}

function addDefaultParserOptions(options, loader) {
  // TODO - explain why this optionb is needed for parsing
  options = Object.assign({}, loader.DEFAULT_OPTIONS, options, {dataType: 'arraybuffer'});

  // LOGGING

  // options.log can be set to `null` to defeat logging
  if (options.log === null) {
    options.log = new NullLog();
  }
  // log defaults to console
  if (!('log' in options)) {
    /* global console */
    options.log = console;
  }

  return options;
}

function validateLoaderObject(loader) {
  const hasParser =
    loader.parseTextSync ||
    loader.parseText ||
    loader.parseSync ||
    loader.parse ||
    loader.loadAndParse ||
    loader.parseStream ||
    loader.worker;
  assert(hasParser);
}

// Converts v0.5 loader object to v1.0
// TODO - update all loaders and remove this function
function normalizeLegacyLoaderObject(loader) {
  if (loader.parseBinary) {
    loader.parseSync = loader.parseBinary;
    // delete loader.parseBinary;
  }

  if (loader.parseText) {
    loader.parseTextSync = loader.parseText;
    // delete loader.parseText;
  }
}
