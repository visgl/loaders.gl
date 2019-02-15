import {autoDetectLoader} from './auto-detect-loader';
import {parseWithLoader, parseWithLoaderSync} from './parse-with-loader';

export function parseFileSync(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return parseWithLoaderSync(data, loader, options, url);
}

// TODO - should accept loader.parseAsyncIterator and concatenate.
export async function parseFile(data, loaders, options, url) {
  data = await data;
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return await parseWithLoader(data, loader, options, url);
}

export function parseFileAsIterator(inputIterator, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  if (loader.parseIterator) {
    const iterator = loader.parseIterator(inputIterator, options, url);
    if (iterator) {
      return iterator;
    }
  }

  // TODO - look for parseSync and pre-concatenate the iterator input
  throw new Error(`${loader.name} loader cannot parse data source using synchronous iterators`);
}

// TODO - should accept loader.parseSync/parse and generate 1 chunk asyncIterator
export async function parseFileAsAsyncIterator(inputAsyncIterator, loaders, options, url) {
  inputAsyncIterator = await inputAsyncIterator;
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;

  if (loader.parseAsyncIterator) {
    const asyncIterator = loader.parseAsyncIterator(inputAsyncIterator, options, url);
    if (asyncIterator) {
      return asyncIterator;
    }
  }
  // TODO - look for parseSyncIterator and make an async adapter
  // TODO - look for parseAsync and pre-concatenate the async iterator input
  throw new Error(`${loader.name} loader cannot parse data source using async iterators`);
}
