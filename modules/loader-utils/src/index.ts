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
export {canEncodeWithWorker} from './lib/worker-loader-utils/encode-with-worker';

// PARSER UTILS
export {parseJSON} from './lib/parser-utils/parse-json';

// MEMORY COPY UTILS
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

// `path` replacement (avoids bundling big path polyfill)
import * as path from './lib/path-utils/path';
export {path};

// Avoid direct use of `Buffer` which pulls in 50KB polyfill
export {isBuffer, toBuffer, bufferToArrayBuffer} from './lib/binary-utils/buffer-utils';

// Note.js wrappers (can be safely imported, but not used in browser)

// Use instead of importing 'util'
import * as util from './lib/node/util';
export {util};
// TODO - remove
export {promisify} from './lib/node/util';

// Use instead of importing 'fs';`
import * as fs from './lib/node/fs';
export {fs};

// EXPERIMENTAL
export {default as _NodeFileSystem} from './lib/filesystems/node-filesystem';
