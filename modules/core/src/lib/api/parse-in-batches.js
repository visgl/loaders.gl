import {concatenateChunksAsync} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getUrlFromData} from '../loader-utils/get-data';
import {getLoaderContext} from '../loader-utils/context-utils';
import {getAsyncIteratorFromData} from '../loader-utils/get-data';
import {selectLoader} from './select-loader';

// Ensure `parse` is available in context if loader falls back to `parse`
import {parse} from './parse';

export async function parseInBatches(data, loaders, options, context) {
  // Signature: parseInBatches(data, options, url) - Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = options;
    options = loaders;
    loaders = null;
  }

  // Resolve any promise
  data = await data;

  options = options || {};

  // DEPRECATED - backwards compatibility, last param can be URL...
  let url = '';
  if (typeof context === 'string') {
    url = context;
    context = null;
  }

  // Extract a url for auto detection
  const autoUrl = getUrlFromData(data, url);

  // Chooses a loader and normalizes it
  // TODO - only uses URL, need a selectLoader variant that peeks at first stream chunk...
  const loader = selectLoader(null, loaders, options, {url: autoUrl});
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = normalizeOptions(options, loader, loaders, url);

  context = getLoaderContext({url, parseInBatches, parse, loaders}, options, context);

  return await parseWithLoaderInBatches(loader, data, options, context);
}

async function parseWithLoaderInBatches(loader, data, options, context) {
  const inputIterator = await getAsyncIteratorFromData(data);

  async function* parseChunkInBatches() {
    // concatenating data iterator into single chunk
    const arrayBuffer = await concatenateChunksAsync(inputIterator);
    // yield a single batch, the output from loader.parse()
    yield loader.parse(arrayBuffer, options, context, loader);
  }

  let outputIterator;

  if (!loader.parseInBatches) {
    outputIterator = await parseChunkInBatches();
  } else {
    outputIterator = await loader.parseInBatches(inputIterator, options, context, loader);
  }

  // Generate metadata batch if requested
  if (!options.metadata) {
    return outputIterator;
  }

  const metadataBatch = {
    batchType: 'metadata',
    metadata: {
      _loader: loader,
      _context: context
    },
    // Populate with some default fields to avoid crashing
    data: [],
    bytesUsed: 0
  };

  async function* makeMetadataBatchIterator(iterator) {
    yield metadataBatch;
    yield* iterator;
  }

  return makeMetadataBatchIterator(outputIterator);
}
