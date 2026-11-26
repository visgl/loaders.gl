// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Re-export core API so they don't get overwritten
export {
  fetchFile,
  FetchError,
  readArrayBuffer,
  setLoaderOptions,
  getLoaderOptions,
  compareLoaderOptions,
  registerLoaders,
  selectLoader,
  selectLoaderSync,
  parse,
  parseFile,
  parseSync,
  parseInBatches,
  preload,
  preloadSync,
  coreApi,
  load,
  loadInBatches,
  encodeTable,
  encodeTableAsText,
  encodeTableInBatches,
  encode,
  encodeSync,
  encodeInBatches,
  encodeURLtoURL,
  encodeText,
  encodeTextSync,
  createDataSource,
  createDataSourceSync,
  _selectSource,
  setPathPrefix,
  getPathPrefix,
  resolvePath,
  RequestScheduler,
  makeIterator,
  makeStream,
  NullLoader,
  JSONLoader,
  _fetchProgress,
  _BrowserFileSystem,
  _unregisterLoaders,
  isBrowser,
  isWorker,
  self,
  window,
  global,
  document,
  assert,
  forEach,
  concatenateArrayBuffersAsync,
  makeTextDecoderIterator,
  makeTextEncoderIterator,
  makeLineIterator,
  makeNumberedLineIterator,
  isPureObject,
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isResponse,
  isReadableStream,
  isWritableStream
} from '@loaders.gl/core';
export type {
  Loader,
  LoaderWithParser,
  LoaderContext,
  CoreAPI,
  LoaderOptions,
  Writer,
  WriterOptions,
  DataType,
  SyncDataType,
  BatchableDataType,
  ReadableFile,
  WritableFile,
  Stat,
  FileSystem,
  RandomAccessFileSystem,
  SourceLoader
} from '@loaders.gl/core';
export {SPLATFormat} from './src/splats-format';
export {SPLATLoader} from './src/splat-loader-types';
export {KSPLATFormat} from './src/splats-format';
export {KSPLATLoader} from './src/ksplat-loader-types';
export {SPZFormat} from './src/splats-format';
export {SPZLoader} from './src/spz-loader-types';
export {parseSPZ, parseSPZToGaussianSplats} from './src/lib/parse-spz';
export {RADFormat} from './src/splats-format';
export {RADLoader} from './src/rad-loader-types';
export {RADSource} from './src/rad-source-loader';
export {resolveRADChunkUrl} from './src/rad-source-loader';
export type {
  RADChunkMetadata,
  RADChunkMetadataJSON,
  RADChunkProperty,
  RADChunkPropertyCompression,
  RADChunkPropertyEncoding,
  RADChunkPropertyName,
  RADChunkRange,
  RADMetadata,
  RADMetadataJSON,
  RADSplatEncoding
} from './src/lib/parse-rad';
export type {
  RADChunkRequestOptions,
  RADChunkTableIteratorOptions,
  RADSourceLoaderOptions
} from './src/rad-source-loader';
export type {GaussianSplats, SplatsLoaderOptions} from './src/types';
export type {SPZCoordinateSystem} from './src/types';
