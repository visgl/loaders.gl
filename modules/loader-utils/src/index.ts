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
} from './types';

// GENERAL UTILS
export {assert} from './lib/env-utils/assert';
export {
  isBrowser,
  isWorker,
  nodeVersion,
  self,
  window,
  global,
  document
} from './lib/env-utils/globals';

export {mergeLoaderOptions} from './lib/option-utils/merge-loader-options';

// LOADERS.GL-SPECIFIC WORKER UTILS
export {createLoaderWorker} from './lib/worker-loader-utils/create-loader-worker';
export {parseWithWorker, canParseWithWorker} from './lib/worker-loader-utils/parse-with-worker';
export {canEncodeWithWorker} from './lib/worker-loader-utils/encode-with-worker';

// PARSER UTILS
export {parseJSON} from './lib/parser-utils/parse-json';

// MEMORY COPY UTILS
export {
  sliceArrayBuffer,
  concatenateArrayBuffers,
  concatenateTypedArrays,
  compareArrayBuffers
} from './lib/binary-utils/array-buffer-utils';
export {padToNBytes, copyToArray, copyArrayBuffer} from './lib/binary-utils/memory-copy-utils';
export {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView,
  copyPaddedArrayBufferToDataView,
  copyPaddedStringToDataView
} from './lib/binary-utils/dataview-copy-utils';
export {getFirstCharacters, getMagicString} from './lib/binary-utils/get-first-characters';

// ITERATOR UTILS
export {
  makeTextEncoderIterator,
  makeTextDecoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from './lib/iterators/text-iterators';
export {forEach, concatenateArrayBuffersAsync} from './lib/iterators/async-iteration';

// REQUEST UTILS
export {default as RequestScheduler} from './lib/request-utils/request-scheduler';

// PATH HELPERS
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/path-utils/file-aliases';
export {addAliases as _addAliases} from './lib/path-utils/file-aliases';

// MICRO LOADERS
export {JSONLoader} from './json-loader';

// NODE support

// Node.js emulation (can be used in browser)

// Avoid direct use of `Buffer` which pulls in 50KB polyfill
export {isBuffer, toBuffer, toArrayBuffer} from './lib/binary-utils/memory-conversion-utils';

// Note.js wrappers (can be safely imported, but not used in browser)

// Use instead of importing 'util' to avoid node dependencies
export {promisify1, promisify2} from './lib/node/promisify';

// `path` replacement (avoids bundling big path polyfill)
import * as path from './lib/path-utils/path';
export {path};

// Use instead of importing 'fs' to avoid node dependencies`
import * as fs from './lib/node/fs';
export {fs};

// Use instead of importing 'stream' to avoid node dependencies`
import * as stream from './lib/node/stream';
export {stream};

// EXPERIMENTAL
export type {ReadableFile} from './lib/filesystems/readable-file';
export {makeReadableFile} from './lib/filesystems/readable-file';

export type {WritableFile} from './lib/filesystems/writable-file';
export {makeWritableFile} from './lib/filesystems/writable-file';

export {default as _NodeFileSystem} from './lib/filesystems/node-filesystem';
