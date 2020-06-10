// FILE READING AND WRITING
export {fetchFile} from './lib/fetch/fetch-file';

export {readFileSync} from './lib/fetch/read-file'; // TODO - deprecate?
export {writeFile, writeFileSync} from './lib/fetch/write-file';

// CONFIGURATION
export {setLoaderOptions} from './lib/api/set-loader-options';
export {registerLoaders} from './lib/api/register-loaders';
export {selectLoader} from './lib/api/select-loader';

// LOADING (READING + PARSING)
export {parse} from './lib/api/parse';
export {parseSync} from './lib/api/parse-sync';
export {parseInBatches} from './lib/api/parse-in-batches';

export {load} from './lib/api/load';
export {loadInBatches} from './lib/api/load-in-batches';

// ENCODING (ENCODING AND WRITING)
export {encode, encodeSync, encodeInBatches} from './lib/api/encode';
export {save, saveSync} from './lib/api/save';

// "JAVASCRIPT" UTILS
export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isResponse,
  isReadableStream,
  isWritableStream
} from './javascript-utils/is-type';

export {toArrayBuffer} from './javascript-utils/binary-utils';

// ITERATOR UTILS
export {forEach, concatenateChunksAsync} from './iterator-utils/async-iteration';
export {makeIterator} from './iterator-utils/make-iterator/make-iterator';
export {
  makeTextEncoderIterator,
  makeTextDecoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from '@loaders.gl/loader-utils';

// CORE UTILS SHARED WITH LOADERS (RE-EXPORTED FROM LOADER-UTILS)
export {isBrowser, isWorker, self, window, global, document} from '@loaders.gl/loader-utils';
export {assert} from '@loaders.gl/loader-utils';
export {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';
export {RequestScheduler as RequestScheduler} from '@loaders.gl/loader-utils';

// EXPERIMENTAL
export {default as _WorkerThread} from './worker-utils/worker-thread';
export {default as _WorkerFarm} from './worker-utils/worker-farm';
export {default as _WorkerPool} from './worker-utils/worker-pool';

export {default as _fetchProgress} from './lib/progress/fetch-progress';

// FOR TESTING
export {_unregisterLoaders} from './lib/api/register-loaders';
