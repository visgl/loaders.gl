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

// LOADERS.GL-SPECIFIC WORKER UTILS
export {createLoaderWorker} from './lib/worker-loader-utils/create-loader-worker';
export {parseWithWorker, canParseWithWorker} from './lib/worker-loader-utils/parse-with-worker';

// PARSER UTILS
export {parseJSON} from './lib/parser-utils/parse-json';

// MEMORY COPY UTILS
export {isBuffer, toBuffer, bufferToArrayBuffer} from './lib/binary-utils/buffer-utils';
export {
  toArrayBuffer,
  sliceArrayBuffer,
  concatenateArrayBuffers,
  concatenateTypedArrays,
  compareArrayBuffers
} from './lib/binary-utils/array-buffer-utils';
export {padToNBytes, copyToArray, copyArrayBuffer} from './lib/binary-utils/memory-copy-utils';
export {
  copyPaddedArrayBufferToDataView,
  copyPaddedStringToDataView
} from './lib/binary-utils/binary-copy-utils';
export {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView
} from './lib/binary-utils/encode-utils';
export {getFirstCharacters, getMagicString} from './lib/binary-utils/get-first-characters';

// PATH UTILS
import * as path from './lib/path-utils/path';
export {path};
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/path-utils/file-aliases';
export {addAliases as _addAliases} from './lib/path-utils/file-aliases';

// ITERATOR UTILS
export {
  makeTextEncoderIterator,
  makeTextDecoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from './lib/iterator-utils/text-iterators';
export {forEach, concatenateArrayBuffersAsync} from './lib/iterator-utils/async-iteration';

// REQUEST UTILS
export {default as RequestScheduler} from './lib/request-utils/request-scheduler';

export {JSONLoader} from './json-loader';
