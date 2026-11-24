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
export {Compressor, Decompressor} from '@loaders.gl/compression/codec';
export {NoCompressor, NoDecompressor} from '@loaders.gl/compression/none';
export {DeflateCompressor, DeflateDecompressor} from '@loaders.gl/compression/deflate';
export {GZipCompressor, GZipDecompressor} from '@loaders.gl/compression/gzip';
export {BrotliCompressor, BrotliDecompressor} from '@loaders.gl/compression/brotli';
export {SnappyCompressor, SnappyDecompressor} from '@loaders.gl/compression/snappy';
export {LZ4Compressor, LZ4Decompressor} from '@loaders.gl/compression/lz4';
export {LzoDecompressor} from '@loaders.gl/compression/lzo';
export {ZstdCompressor, ZstdDecompressor} from '@loaders.gl/compression/zstd';
export {BZip2Compressor, BZip2Decompressor} from '@loaders.gl/compression/bzip2';
export {XZCompressor, XZDecompressor} from '@loaders.gl/compression/xz';
export {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from '@loaders.gl/compression/native-compression';
export {CompressionWorker, compressOnWorker} from '@loaders.gl/compression/worker';
export type {CompressionOptions} from '@loaders.gl/compression/codec';
export type {LzoDecompressorOptions} from '@loaders.gl/compression/lzo';
export type {
  BrotliCompressorOptions,
  BrotliDecompressorOptions
} from '@loaders.gl/compression/brotli';
export type {
  DeflateCompressorOptions,
  DeflateDecompressorOptions
} from '@loaders.gl/compression/deflate';
export type {GZipCompressorOptions, GZipDecompressorOptions} from '@loaders.gl/compression/gzip';
export type {ZstdCompressorOptions, ZstdDecompressorOptions} from '@loaders.gl/compression/zstd';
export type {CompressionWorkerOptions} from '@loaders.gl/compression/worker';
