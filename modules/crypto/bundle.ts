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
export {Hash} from '@loaders.gl/crypto/hash';
export {CRC32Hash} from '@loaders.gl/crypto/crc32';
export {CRC32CHash} from '@loaders.gl/crypto/crc32c';
export {MD5Hash} from '@loaders.gl/crypto/md5';
export {SHA256Hash} from '@loaders.gl/crypto/sha256';
export {CryptoHash} from '@loaders.gl/crypto/webcrypto';
export {NodeHash} from '@loaders.gl/crypto/node';
export {
  encodeNumber,
  encodeHex,
  encodeBase64,
  asciiToBase64,
  base64ToAscii
} from '@loaders.gl/crypto/encoding';
