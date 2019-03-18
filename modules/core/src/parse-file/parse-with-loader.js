import {
  getArrayBufferOrStringFromDataSync,
  getArrayBufferOrStringFromData,
  getAsyncIteratorFromData,
  getIteratorFromData
} from './get-data';

import parseWithWorker from '../worker-utils/parse-with-worker';

// TODO: support progress and abort
// TODO: support moving loading to worker
export async function parseWithLoader(data, loader, options = {}, url) {
  data = await getArrayBufferOrStringFromData(data, loader);

  // First check for synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return await promisify(loader.parseTextSync, loader, url, data, options);
  }

  // Now check for synchronous binary data parser, wrap results in promises
  if (loader.parseSync) {
    return await promisify(loader.parseSync, loader, url, data, options);
  }

  // Check for asynchronous parser
  if (loader.parse) {
    return await loader.parse(data, options);
  }

  if (loader.worker) {
    return await parseWithWorker(loader.worker, data, options);
  }

  // TBD - If asynchronous parser not available, return null
  // => This loader does not work on loaded data and only supports `loadAndParseAsync`
  return null;
}

export function parseWithLoaderSync(data, loader, options = {}, url) {
  data = getArrayBufferOrStringFromDataSync(data, loader);

  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options);
  }

  if (loader.parseSync) {
    return loader.parseSync(data, options);
  }

  // TBD - If synchronous parser not available, return null
  return null;
}

export async function parseWithLoaderInBatches(data, loader, options = {}, url) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatches) {
    const inputIterator = await getAsyncIteratorFromData(data);
    const outputIterator = loader.parseInBatches(inputIterator, loader, url, data, options);
    return outputIterator;
  }

  return null;
}

export async function parseWithLoaderInBatchesSync(data, loader, options = {}, url) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatchesSync) {
    const inputIterator = getIteratorFromData(data);
    const outputIterator = loader.parseInBatchesSync(inputIterator, loader, url, data, options);
    return outputIterator;
  }

  return null;
}

// Helper function to wrap parser result/error in promise
// TODO - align with Node.js promisify
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
