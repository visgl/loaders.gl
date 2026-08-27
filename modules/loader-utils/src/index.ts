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

export type {Format, FormatEncoding} from './format-types';

// loaders

export type {
  Loader,
  LoaderWithParser,
  LoaderContext,
  StrictLoaderOptions,
  LoaderOptions,
  LoaderShapeType,
  LoaderOptionsWithShape,
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
export {BinaryChunkReader} from './lib/binary-utils/binary-chunk-reader';
export type {
  BinaryChunkReaderCheckpoint,
  BinaryChunkReaderOptions
} from './lib/binary-utils/binary-chunk-reader';
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
export {RequestCache} from './lib/request-utils/request-cache';
export type {
  RequestCacheProps,
  RequestCacheRemovalReason
} from './lib/request-utils/request-cache';
export {parseContentType} from './lib/request-utils/parse-content-type';
export {
  RangeRequestScheduler,
  createRangeStats,
  fetchHttpRange,
  getRangeStats
} from './lib/request-utils/range-request-scheduler';
export type {
  RangeFetchRequest,
  RangeRequest,
  RangeRequestEvent,
  RangeRequestSchedulerProps,
  RangeRequestTransportResult,
  RangeStats
} from './lib/request-utils/range-request-scheduler';
export {RangeRequestCache} from './lib/request-utils/range-request-cache';
export type {
  CachedRangeRequest,
  RangeRequestCacheEvent,
  RangeRequestCacheProps
} from './lib/request-utils/range-request-cache';

// LAZ DECODER UTILS
export {
  NeedsMoreData,
  createLAZChunkDecoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunkTable,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  getLAZChunkByteLength,
  getLAZChunkDeclaredByteLength,
  getLAZChunkHeaderByteLength
} from './lib/laz/laz-chunk-decoder';
export type {
  FeedableLAZChunkDecoder,
  LAZChunkDecoderCursor,
  LAZChunkDecoderOptions,
  LAZChunkMetadata,
  LAZChunkTableEntry,
  LAZPointDataTarget
} from './lib/laz/laz-chunk-decoder';
export {
  createLAZChunkEncoder,
  encodeLASzipVLR,
  encodeLAZChunk,
  encodeLAZChunkTable
} from './lib/laz/laz-chunk-encoder';
export type {FeedableLAZChunkEncoder} from './lib/laz/laz-chunk-encoder';

// PATH HELPERS
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/path-utils/file-aliases';
export {CachedUriResolver} from './lib/path-utils/cached-uri-resolver';
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
export {ArrayBufferFile} from './lib/files/array-buffer-file';
export {BlobFile} from './lib/files/blob-file';
export {HttpFile} from './lib/files/http-file';
export type {
  HttpFileConsistency,
  HttpFileFetch,
  HttpFileIdentity,
  HttpFileOptions,
  HttpFileTelemetry
} from './lib/files/http-file';
export {NodeFileFacade as NodeFile} from './lib/files/node-file-facade';

export type {FileSystem, RandomAccessFileSystem} from './lib/filesystems/filesystem';
export {NodeFileSystemFacade as NodeFilesystem} from './lib/filesystems/node-filesystem-facade';

// EXPERIMENTAL: DATA SOURCES
export type {SourceLoader, SourceArrayOptionsType, SourceArrayDataSourceType} from './source-types';
export {isSourceLoader} from './source-types';

export type {CoreAPI, DataSourceOptions} from './lib/sources/data-source';
export {DataSource} from './lib/sources/data-source';
export type {
  ManageableDataSource,
  DataSourceManagerAddParameters,
  DataSourceManagerGetOrCreateParameters,
  DataSourceManagerSubscribeParameters,
  DataSourceSubscriber
} from './lib/sources/data-source-manager';
export {DataSourceManager} from './lib/sources/data-source-manager';
export {
  bindColumnarPredicateParameters,
  copyColumnarPredicate,
  filterColumnarRowIndices,
  gatherColumnarColumns,
  getColumnarPredicateColumns,
  getColumnarPredicateParameterNames,
  getColumnarPredicatePath,
  getColumnarPredicatePaths,
  isColumnarPredicateParameter,
  isColumnarPredicateValue,
  validateColumnarPredicate
} from './lib/scan-utils/columnar-predicate';
export {executeScanTasks} from './lib/scan-utils/scan-executor';
export {validateRasterQueryOptions} from './lib/scan-utils/raster-query';
export type {RasterQueryOptions, RasterQueryCapabilities} from './lib/scan-utils/raster-query';
export {planRelationalQuery} from './lib/scan-utils/relational-query';
export type {
  RelationalAggregate,
  RelationalChildQuery,
  RelationalExpression,
  RelationalOrderKey,
  RelationalPlanStep,
  RelationalQueryOptions
} from './lib/scan-utils/relational-query';
export {createScanQueryMetadata} from './lib/scan-utils/scan-query-metadata';
export {validatePointCloudQueryOptions} from './lib/scan-utils/point-cloud-query';
export {
  planTableQuery,
  validateTableQueryLimit,
  validateTableQueryOptions
} from './lib/scan-utils/table-query';
export {explainTableQuery} from './lib/scan-utils/table-query-explain';
export type {ScanExecutorOptions, ScanTask} from './lib/scan-utils/scan-executor';
export type {ScanFragment, ScanFragmentProvider} from './lib/scan-utils/scan-fragments';
export type {
  CreateScanQueryMetadataOptions,
  ScanBounds,
  ScanColumnMetadata,
  ScanColumnRole,
  ScanExecutionMethod,
  ScanExecutionSupport,
  ScanQueryCapabilities,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanQueryMetadataProvider,
  TableScanReadOptions,
  TableScanSource,
  ScanRasterLevel,
  ScanSourceStatistics,
  ScanSpatialMetadata
} from './lib/scan-utils/scan-query-metadata';
export type {
  PointCloudQueryBounds,
  PointCloudQueryCapabilities,
  PointCloudQueryOptions
} from './lib/scan-utils/point-cloud-query';
export type {
  ColumnarComparisonPredicate,
  ColumnarInPredicate,
  ColumnarLogicalPredicate,
  ColumnarNotPredicate,
  ColumnarNullPredicate,
  ColumnarPredicate,
  ColumnarPredicateInputValue,
  ColumnarPredicateParameter,
  ColumnarPredicateParameterValues,
  ColumnarPredicateProperty,
  ColumnarPredicateValue,
  ParameterizedColumnarPredicate
} from './lib/scan-utils/columnar-predicate';
export type {
  TableQueryCapabilities,
  TableQueryFilterStep,
  TableQueryLimitStep,
  TableQueryOperatorSupport,
  TableQueryOptions,
  TableQueryPlan,
  TableQueryPlanStep,
  TableQueryProjectStep,
  TableQueryScanStep
} from './lib/scan-utils/table-query';
export type {
  TableQueryExplain,
  TableQueryExplainOperator
} from './lib/scan-utils/table-query-explain';

export type {CatalogSource, CatalogSourceCapabilities} from './lib/sources/catalog-source';
export type {GeoServiceType, ServiceCapabilities} from './lib/sources/service-capabilities';

export {ImageSource} from './lib/sources/image-source';
export type {ImageType} from './lib/sources/utils/image-type';
export type {ImageSourceMetadata} from './lib/sources/image-source';
export type {GetImageParameters} from './lib/sources/image-source';

export type {
  GetFeaturesParameters,
  VectorSource,
  VectorSourceData,
  VectorSourceLayer,
  VectorSourceMetadata
} from './lib/sources/vector-source';

export type {TileSource, TileGrid} from './lib/sources/tile-source';
export type {TileSourceMetadata, GetTileParameters} from './lib/sources/tile-source';
export type {GetTileDataBatchResult, GetTileDataParameters} from './lib/sources/tile-source';
export {getTileDataBatch} from './lib/sources/tile-source-utils';

export type {ImageTileSource} from './lib/sources/image-tile-source';

export type {VectorTileSource} from './lib/sources/vector-tile-source';
export type {VectorTile} from './lib/sources/vector-tile-source';

export {RasterSource, getRasterViewportBoundingBox} from './lib/sources/raster-source';
export type {
  RasterChannelDataType,
  RasterBoundingBox,
  RasterViewport,
  RasterData,
  RasterSelection,
  GetRasterParameters,
  RasterOverview,
  RasterSourceMetadata
} from './lib/sources/raster-source';
