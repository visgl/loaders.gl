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
export {default as toArrayBuffer} from './lib/loader-utils/to-array-buffer';

// EXPERIMENTAL
export {selectLoader as _selectLoader} from './lib/select-loader';

export {default as _WorkerThread} from './worker-utils/worker-thread';
export {default as _WorkerFarm} from './worker-utils/worker-farm';
export {default as _WorkerPool} from './worker-utils/worker-pool';

export {default as _fetchProgress} from './lib/progress/fetch-progress';

// FOR TESTING
export {_unregisterLoaders} from './lib/register-loaders';

/* DEPRECATED in v2.1, will remove in a future version */

export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from '@loaders.gl/loader-utils';

// ITERATOR UTILS
export {
  makeStreamIterator,
  contatenateAsyncIterator,
  getStreamIterator,
  forEach,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator,
  makeChunkIterator,
  concatenateChunksAsync
} from '@loaders.gl/loader-utils';

// CORE UTILS SHARED WITH LOADERS (RE-EXPORTED FROM LOADER-UTILS)
export {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';
