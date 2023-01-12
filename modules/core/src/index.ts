// loaders.gl, MIT license

// TYPES
export type {
  Loader,
  LoaderWithParser,
  LoaderContext,
  LoaderOptions,
  Writer,
  WriterOptions,
  DataType,
  SyncDataType,
  BatchableDataType,
  IFileSystem,
  IRandomAccessReadFileSystem
} from '@loaders.gl/loader-utils';

// FILE READING AND WRITING
export {fetchFile} from './lib/fetch/fetch-file';

export {readArrayBuffer} from './lib/fetch/read-array-buffer';
export {readFileSync} from './lib/fetch/read-file';
export {writeFile, writeFileSync} from './lib/fetch/write-file';

// CONFIGURATION
export {setLoaderOptions, getLoaderOptions} from './lib/api/loader-options';
export {registerLoaders} from './lib/api/register-loaders';
export {selectLoader, selectLoaderSync} from './lib/api/select-loader';

// LOADING (READING + PARSING)
export {parse} from './lib/api/parse';
export {parseSync} from './lib/api/parse-sync';
export {parseInBatches} from './lib/api/parse-in-batches';

export {load} from './lib/api/load';
export {loadInBatches} from './lib/api/load-in-batches';

// ENCODING (ENCODING AND WRITING)
export {encode, encodeSync, encodeInBatches, encodeText, encodeURLtoURL} from './lib/api/encode';
export {save, saveSync} from './lib/api/save';

// CORE UTILS SHARED WITH LOADERS (RE-EXPORTED FROM LOADER-UTILS)
export {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';
export {RequestScheduler} from '@loaders.gl/loader-utils';

// ITERATOR UTILS
export {makeIterator} from './iterators/make-iterator/make-iterator';
export {makeStream} from './iterators/make-stream/make-node-stream';

// CORE LOADERS
export {NullWorkerLoader, NullLoader} from './null-loader';
export {JSONLoader} from '@loaders.gl/loader-utils';

// EXPERIMENTAL
export {default as _fetchProgress} from './lib/progress/fetch-progress';
export {default as _BrowserFileSystem} from './lib/filesystems/browser-filesystem';

// FOR TESTING
export {_unregisterLoaders} from './lib/api/register-loaders';

//
// TODO - MOVE TO LOADER-UTILS AND DEPRECATE IN CORE?
//

export {isBrowser, isWorker, self, window, global, document} from '@loaders.gl/loader-utils';
export {assert} from '@loaders.gl/loader-utils';
export {forEach, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

export {
  makeTextDecoderIterator,
  makeTextEncoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from '@loaders.gl/loader-utils';

// "JAVASCRIPT" UTILS - move to loader-utils?
export {
  isPureObject,
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isResponse,
  isReadableStream,
  isWritableStream
} from './javascript-utils/is-type';
