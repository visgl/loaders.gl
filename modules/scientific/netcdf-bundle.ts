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
  _selectSource,
  makeIterator,
  makeStream,
  NullLoader,
  _fetchProgress,
  _BrowserFileSystem,
  _unregisterLoaders,
  NullWorkerLoader
} from '@loaders.gl/core';
export {
  setPathPrefix,
  getPathPrefix,
  resolvePath,
  RequestScheduler,
  JSONLoader,
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
} from '@loaders.gl/core/loader-utils';
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
export {
  NetCDFReader,
  NetCDFFormat,
  NetCDFLoader,
  NetCDFSourceLoader
} from '@loaders.gl/scientific/netcdf';
export type {
  NetCDF,
  NetCDFLoaderOptions,
  NetCDFRasterQueryOptions,
  NetCDFSourceOptions
} from '@loaders.gl/scientific/netcdf';
