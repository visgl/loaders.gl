import {assert} from '@loaders.gl/loader-utils';
import {concatenateChunksAsync, makeTransformIterator} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getLoaderContext} from '../loader-utils/context-utils';
import {getAsyncIteratorFromData, getReadableStream} from '../loader-utils/get-data';
import {getResourceUrlAndType} from '../utils/resource-utils';
import {selectLoader} from './select-loader';

// Ensure `parse` is available in context if loader falls back to `parse`
import {parse} from './parse';

export async function parseInBatches(data, loaders, options, context) {
  assert(!context || typeof context === 'object'); // parseInBatches no longer accepts final url

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

/**
 * Loader has beens selected and context has been prepared, see if we need to emit a metadata batch
 */
async function parseWithLoaderInBatches(loader, data, options, context) {
  const outputIterator = await parseToOutputIterator(loader, data, options, context);

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

/**
 * Prep work is done, now it is time to start parsing into an output operator
 * The approach depends on which parse function the loader exposes
 * `parseInBatches` (preferred), `parseStreamInBatches` (limited), `parse` (fallback)
 */
async function parseToOutputIterator(loader, data, options, context) {
  if (loader.parseInBatches) {
    const inputIterator = await getAsyncIteratorFromData(data);

    const iteratorChain = applyInputTransforms(inputIterator, options);

    return await loader.parseInBatches(iteratorChain, options, context, loader);
  }

  if (loader.parseStreamInBatches) {
    const stream = await getReadableStream(data);
    if (stream) {
      if (options.transforms) {
        // eslint-disable-next-line
        console.warn(
          'options.transforms not implemented for loaders that use `parseStreamInBatches`'
        );
      }
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

/**
 * Create an iterator chain with any transform iterators (crypto, decompression)
 * @param inputIterator
 * @param options
 */
function applyInputTransforms(inputIterator, options) {
  let iteratorChain = inputIterator;
  for (const Transform of options.transforms || []) {
    // @ts-ignore
    iteratorChain = makeTransformIterator(iteratorChain, Transform, options);
  }
  return iteratorChain;
}
