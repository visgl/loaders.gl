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
export {SPLATFormat, SPLATLoader} from '@loaders.gl/splats/splat';
export {KSPLATFormat, KSPLATLoader} from '@loaders.gl/splats/ksplat';
export {SPZFormat, SPZLoader} from '@loaders.gl/splats/spz';
export {parseSPZ, parseSPZToGaussianSplats} from '@loaders.gl/splats/spz/api';
export {RADFormat, RADLoader} from '@loaders.gl/splats/rad';
export {RADSource} from '@loaders.gl/splats/rad/bundled';
export {resolveRADChunkUrl} from '@loaders.gl/splats/rad/api';
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
  RADSplatEncoding,
  RADChunkRequestOptions,
  RADChunkTableIteratorOptions,
  RADSourceLoaderOptions
} from '@loaders.gl/splats/rad';
export type {GaussianSplats, SplatsLoaderOptions} from '@loaders.gl/splats/types';
export type {SPZCoordinateSystem} from '@loaders.gl/splats/spz';
