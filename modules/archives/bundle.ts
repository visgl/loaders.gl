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
export {ZipFormat, ZipLoader} from '@loaders.gl/archives/zip';
export {ZipWriter} from '@loaders.gl/archives/zip-writer';
export {
  IndexedArchive,
  ZipFileSystem,
  ZipArchive,
  openZipArchive,
  encodeZip,
  encodeZipInBatches
} from '@loaders.gl/archives/api';
export type {
  ZipFileMap,
  ZipLoaderOptions,
  ZipWriterFiles,
  ZipWriterOptions,
  IndexedZipFiles,
  IndexedZipOptions,
  ZipFileStat,
  ZipArchiveInput,
  ZipArchiveOptions,
  ZipEntry,
  ZipReadOptions,
  ZipRangeOptions,
  ZipByteChunk,
  ZipByteSource,
  ZipEncodeEntry,
  ZipEncodeFiles,
  ZipEncodeOptions
} from '@loaders.gl/archives/zip';

export {encodeIndexedZip} from '@loaders.gl/archives/indexed-zip-writer';
export {encodeTar, readTarArchive} from '@loaders.gl/archives/api';
export {TarWriter} from '@loaders.gl/archives/tar-writer';
export {TarLoader} from '@loaders.gl/archives/tar';
