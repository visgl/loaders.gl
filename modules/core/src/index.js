// FILE READING AND WRITING
export {fetchFile} from './lib/fetch/fetch-file';
export {readFileSync} from './lib/fetch/read-file';
export {writeFile, writeFileSync} from './lib/fetch/write-file';

// CONFIGURATION
export {setLoaderOptions} from './lib/set-loader-options';
export {registerLoaders} from './lib/register-loaders';

// LOADING (READING + PARSING)
export {parse} from './lib/parse';
export {parseSync} from './lib/parse-sync';
export {parseInBatches} from './lib/parse-in-batches';
export {parseInBatchesSync} from './lib/parse-in-batches-sync';

export {load} from './lib/load';
export {loadInBatches} from './lib/load-in-batches';

// ENCODING (ENCODING AND WRITING)
export {encode, encodeSync, encodeInBatches} from './lib/encode';
export {save, saveSync} from './lib/save';

// "JAVASCRIPT" UTILS
export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from './javascript-utils/is-type';

export {toArrayBuffer} from './javascript-utils/binary-utils';

// ITERATOR UTILS
export {makeStreamIterator} from './iterator-utils/stream-iteration';

export {
  forEach,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './iterator-utils/async-iteration';

export {makeChunkIterator, concatenateChunksAsync} from './iterator-utils/chunk-iteration';

// CORE UTILS SHARED WITH LOADERS (RE-EXPORTED FROM LOADER-UTILS)
export {isBrowser, isWorker, self, window, global, document} from '@loaders.gl/loader-utils';
export {assert} from '@loaders.gl/loader-utils';
export {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';

// EXPERIMENTAL
export {selectLoader as _selectLoader} from './lib/select-loader';

export {default as _WorkerThread} from './worker-utils/worker-thread';
export {default as _WorkerFarm} from './worker-utils/worker-farm';
export {default as _WorkerPool} from './worker-utils/worker-pool';

export {default as _fetchProgress} from './lib/progress/fetch-progress';

// FOR TESTING
export {_unregisterLoaders} from './lib/register-loaders';

// DEPRECATED in v2.1
export {concatenateChunksAsync as contatenateAsyncIterator} from './iterator-utils/chunk-iteration';
export {makeStreamIterator as getStreamIterator} from './iterator-utils/stream-iteration';
