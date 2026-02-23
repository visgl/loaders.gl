// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TYPES

export type {
  // misc
  DataType,
  SyncDataType,
  BatchableDataType,
  TransformBatches,
  // numeric array types
  TypedArray,
  BigTypedArray,
  TypedArrayConstructor,
  BigTypedArrayConstructor,
  NumberArray,
  NumericArray,
  // fetch
  FetchLike
} from './types';

// formats

export type {Format} from './format-types';

// loaders

export type {
  Loader,
  LoaderWithParser,
  LoaderContext,
  StrictLoaderOptions,
  LoaderOptions,
  LoaderOptionsType,
  LoaderReturnType,
  LoaderBatchType,
  LoaderArrayOptionsType,
  LoaderArrayReturnType,
  LoaderArrayBatchType
} from './loader-types';

export {parseFromContext, parseSyncFromContext, parseInBatchesFromContext} from './loader-types';

// writers

export type {
  Writer,
  WriterWithEncoder,
  WriterOptions,
  WriterOptionsType,
  WriterDataType,
  WriterBatchType
} from './writer-types';

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

export {log} from './lib/log-utils/log';

export type {ReadableStreamType} from './lib/javascript-utils/is-type';
export {
  isObject,
  isPureObject,
  isArrayBuffer,
  isArrayBufferLike,
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isResponse,
  isFile,
  isBlob,
  isWritableDOMStream,
  isReadableDOMStream,
  isWritableNodeStream,
  isReadableNodeStream,
  isReadableStream,
  isWritableStream
} from './lib/javascript-utils/is-type';

// Options and modules
export type {RequiredOptions} from './lib/option-utils/merge-options';
export {mergeOptions, getRequiredOptions} from './lib/option-utils/merge-options';

// Modules (external libraries)
export {registerJSModules} from './lib/module-utils/js-module-utils';
export {checkJSModule, getJSModule, getJSModuleOrNull} from './lib/module-utils/js-module-utils';

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
  concatenateArrayBuffersFromArray,
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
export {
  forEach,
  concatenateArrayBuffersAsync,
  toArrayBufferIterator
} from './lib/iterators/async-iteration';

// REQUEST UTILS
export {default as RequestScheduler} from './lib/request-utils/request-scheduler';
export {parseContentType} from './lib/request-utils/parse-content-type';

// PATH HELPERS
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/path-utils/file-aliases';
export {addAliases as _addAliases} from './lib/path-utils/file-aliases';

// MICRO LOADERS
export {JSONLoader} from './json-loader';

// NODE support

// Node.js emulation (can be used in browser)

// Avoid direct use of `Buffer` which pulls in 50KB polyfill
export {
  isBuffer,
  toBuffer,
  toArrayBuffer,
  toArrayBufferView,
  copyToArrayBuffer,
  ensureArrayBuffer
} from './lib/binary-utils/memory-conversion-utils';

// Note.js wrappers (can be safely imported, but not used in browser)

// Use instead of importing 'util' to avoid node dependencies
export {promisify1, promisify2} from './lib/node/promisify';

// `path` replacement (avoids bundling big path polyfill)
import * as path from './lib/path-utils/path';
export {path};

// Use instead of importing 'stream' to avoid node dependencies`
import * as stream from './lib/node/stream';
export {stream};

// EXPERIMENTAL: FILE SYSTEMS

export type {ReadableFile, WritableFile, Stat} from './lib/files/file';
export {BlobFile} from './lib/files/blob-file';
export {HttpFile} from './lib/files/http-file';
export {NodeFileFacade as NodeFile} from './lib/files/node-file-facade';

export type {FileSystem, RandomAccessFileSystem} from './lib/filesystems/filesystem';
export {NodeFileSystemFacade as NodeFilesystem} from './lib/filesystems/node-filesystem-facade';

// EXPERIMENTAL: DATA SOURCES
export type {Source, SourceArrayOptionsType, SourceArrayDataSourceType} from './source-types';

export type {DataSourceOptions} from './lib/sources/data-source';
export {DataSource} from './lib/sources/data-source';

export {ImageSource} from './lib/sources/image-source';
export type {ImageType} from './lib/sources/utils/image-type';
export type {ImageSourceMetadata} from './lib/sources/image-source';
export type {GetImageParameters} from './lib/sources/image-source';

export type {VectorSource} from './lib/sources/vector-source';
export type {VectorSourceMetadata} from './lib/sources/vector-source';
export type {GetFeaturesParameters} from './lib/sources/vector-source';

export type {TileSource} from './lib/sources/tile-source';
export type {TileSourceMetadata, GetTileParameters} from './lib/sources/tile-source';
export type {GetTileDataParameters} from './lib/sources/tile-source';

export type {ImageTileSource} from './lib/sources/image-tile-source';

export type {VectorTileSource} from './lib/sources/vector-tile-source';
export type {VectorTile} from './lib/sources/vector-tile-source';
