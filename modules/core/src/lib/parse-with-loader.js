import assert from '../utils/assert';
import parseWithWorker from './parse-with-worker';
import {
  getArrayBufferOrStringFromDataSync,
  getArrayBufferOrStringFromData,
  getAsyncIteratorFromData,
  getIteratorFromData,
  // getLengthFromData,
  getUrlFromData
} from './loader-utils/get-data';

// TODO: support progress and abort
// TODO: support moving loading to worker
// TODO - should accept loader.parseAsyncIterator and concatenate.
export async function parseWithLoader(data, loader, options, url) {
  url = url || getUrlFromData(data);
  data = await getArrayBufferOrStringFromData(data, loader);

  // First check for synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return loader.parseTextSync(data, options, url, loader);
  }

  // Now check for synchronous binary data parser, wrap results in promises
  if (loader.parseSync) {
    return loader.parseSync(data, options, url, loader);
  }

  // Check for asynchronous parser
  if (loader.parse) {
    return await loader.parse(data, options, url, loader);
  }

  if (loader.worker) {
    return await parseWithWorker(loader.worker, data, options);
  }

  // TBD - If asynchronous parser not available, return null
  // => This loader does not work on loaded data and only supports `loadAndParseAsync`
  return assert(false);
}

// TODO - should accept loader.parseSync/parse and generate 1 chunk asyncIterator
export function parseWithLoaderSync(data, loader, options, url) {
  data = getArrayBufferOrStringFromDataSync(data, loader);

  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options, url, loader);
  }

  if (loader.parseSync) {
    return loader.parseSync(data, options, url, loader);
  }

  // TBD - If synchronous parser not available, return null
  // new Error(`Could not parse ${url || 'data'} using ${loader.name} loader`);
  return assert(false);
}

export async function parseWithLoaderInBatches(data, loader, options, url) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatches) {
    const inputIterator = await getAsyncIteratorFromData(data);
    const outputIterator = loader.parseInBatches(inputIterator, options, url, loader);
    return outputIterator;
  }

  // TODO - update after test cases have been fixed
  return null;
}

export async function parseWithLoaderInBatchesSync(data, loader, options, url) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatchesSync) {
    const inputIterator = getIteratorFromData(data);
    const outputIterator = loader.parseInBatchesSync(inputIterator, options, url, loader, url);
    return outputIterator;
  }

  return assert(false);
}
