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
export {ImageFormat, ImageBitmapFormat} from './src/image-format';
export {ImageLoader} from './src/image-loader-types';
export {ImageWriter} from './src/image-writer';
export {getBinaryImageMetadata} from './src/lib/category-api/binary-image-api';
export {isImageTypeSupported, getDefaultImageType} from './src/lib/category-api/image-type';
export {
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from './src/lib/category-api/parsed-image-api';
export {
  getSupportedImageFormats,
  isImageFormatSupported
} from './src/lib/category-api/image-format';
export type {ImageDataType, ImageType, ImageTypeEnum} from './src/types';
export type {ImageLoaderOptions} from './src/image-loader-types';
