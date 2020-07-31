import {assert} from '@loaders.gl/loader-utils';
import {concatenateChunksAsync} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getLoaderContext} from '../loader-utils/context-utils';
import {getAsyncIteratorFromData, getReadableStream} from '../loader-utils/get-data';
import {getResourceUrlAndType} from '../utils/resource-utils';
import {selectLoader} from './select-loader';

// Ensure `parse` is available in context if loader falls back to `parse`
import {parse} from './parse';

export async function parseInBatches(data, loaders, options, context) {
  assert(!context || typeof context !== 'string', 'parseInBatches no longer accepts final url');

  // Signature: parseInBatches(data, options, url) - Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = options;
    options = loaders;
    loaders = null;
  }

  data = await data; // Resolve any promise
  options = options || {};

  // Extract a url for auto detection
  const {url} = getResourceUrlAndType(data);

  // Chooses a loader and normalizes it
  // Note - only uses URL and contentType for streams and iterator inputs
  const loader = await selectLoader(data, loaders, options);
  // Note: if options.nothrow was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = normalizeOptions(options, loader, loaders, url);
  context = getLoaderContext({url, parseInBatches, parse, loaders}, options, context);

  return await parseWithLoaderInBatches(loader, data, options, context);
}

async function parseWithLoaderInBatches(loader, data, options, context) {
  const outputIterator = await loadToOutputIterator(loader, data, options, context);

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

async function loadToOutputIterator(loader, data, options, context) {
  if (loader.parseInBatches) {
    const inputIterator = await getAsyncIteratorFromData(data);
    return await loader.parseInBatches(inputIterator, options, context, loader);
  }
  if (loader.parseStreamInBatches) {
    const stream = await getReadableStream(data);
    if (stream) {
      return loader.parseStreamInBatches(stream, options, context);
    }
  }

  // Fallback: load atomically using `parse` concatenating input iterator into single chunk
  async function* parseChunkInBatches() {
    const inputIterator = await getAsyncIteratorFromData(data);
    const arrayBuffer = await concatenateChunksAsync(inputIterator);
    // yield a single batch, the output from loader.parse()
    yield loader.parse(arrayBuffer, options, context, loader);
  }

  return await parseChunkInBatches();
}
