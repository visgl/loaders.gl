import {isLoaderObject} from '../loader-utils/normalize-loader';
import {mergeOptions} from '../loader-utils/merge-options';
import {getAsyncIteratorFromData} from '../loader-utils/get-data';
import {getLoaderContext} from '../loader-utils/get-loader-context';
import {selectLoader} from './select-loader';
// import {makeTextDecoderIterator} from '../../iterator-utils/text-iterators';

export async function parseInBatches(data, loaders, options, url) {
  // Signature: parseInBatches(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  // Chooses a loader and normalizes it
  // TODO - only uses URL, need a selectLoader variant that peeks at first stream chunk...
  const loader = selectLoader(null, loaders, options, {url});

  // Normalize options
  options = mergeOptions(loader, options, url);

  const context = getLoaderContext({url, loaders}, options);

  return await parseWithLoaderInBatches(loader, data, options, context);
}

async function parseWithLoaderInBatches(loader, data, options, context) {
  if (!loader.parseInBatches) {
    // TODO - call parse and emit a single batch (plus metadata batch)
    throw new Error('loader does not support parseInBatches');
  }

  // Create async iterator adapter for data, and concatenate result
  const inputIterator = await getAsyncIteratorFromData(data);
  // Converts ArrayBuffer chunks to text chunks (leaves text chunks alone)
  // if (loader.text) {
  //   inputIterator = makeTextDecoderIterator(inputIterator);
  // }
  const outputIterator = await loader.parseInBatches(inputIterator, options, context, loader);

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
