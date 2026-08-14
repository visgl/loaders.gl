// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {hydrateArrowTable} from '@loaders.gl/arrow';
import type {CoreAPI, ReadableFile, SourceLoader} from '@loaders.gl/loader-utils';
import {BlobFile, DataSource, isBrowser} from '@loaders.gl/loader-utils';
import type {ArrayType, ArrowTable, Schema} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {getSchemaFromParquetReader} from './lib/parsers/get-parquet-schema';
import {
  canDecodeParquetSourceOnWorker,
  decodeParquetSourceRowGroupOnWorker
} from './lib/parquet-source-worker-client';
import {
  type ParquetSourceWorkerColumnChunk,
  type ParquetSourceWorkerOptions,
  type ParquetSourceWorkerResult
} from './lib/parquet-source-worker-types';
import {ParquetRangeFile} from './lib/sources/parquet-range-file';
import {
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';
import {ParquetSourceLoader as ParquetSourceLoaderMetadata} from './parquet-source-loader-types';
import type {
  ParquetBatch,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetTelemetry,
  ParquetTelemetryEvent
} from './parquet-source-types';
export {
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';
import {preloadCompressions} from './parquetjs/compression';
import {
  CompressionCodec,
  Encoding,
  type ColumnChunk,
  type FileMetaData,
  type Statistics as ParquetThriftStatistics
} from './parquetjs/parquet-thrift/index';
import {ParquetReader} from './parquetjs/parser/parquet-reader';
import type {ParquetField} from './parquetjs/schema/declare';
import type {ParquetSchema} from './parquetjs/schema/schema';
import * as Types from './parquetjs/schema/types';
import {
  copyUint8Array,
  readDoubleLE,
  readFloatLE,
  readInt32LE,
  readInt64LE,
  toUint8Array
} from './parquetjs/utils/binary-utils';
import {fieldIndexOf} from './parquetjs/utils/read-utils';

export type {
  ParquetBatch,
  ParquetBatchMetadata,
  ParquetBatchProvenance,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetRangeRequestOptions,
  ParquetReadOptions,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetTelemetry,
  ParquetTelemetryEvent
} from './parquet-source-types';

type ParquetSourceInitialization = {
  /** Random-access file shared by all reads. */
  file: ReadableFile;
  /** TypeScript Parquet reader with a cached footer. */
  reader: ParquetReader;
  /** loaders.gl logical schema. */
  schema: Schema;
  /** TypeScript Parquet decoder schema. */
  parquetSchema: ParquetSchema;
  /** Decoded Thrift footer. */
  fileMetadata: FileMetaData;
  /** Normalized public source metadata. */
  metadata: ParquetSourceMetadata;
};

type ParquetRowGroupReadResult = {
  /** Zero-based source row-group index. */
  rowGroupIndex: number;
  /** Number of logical rows in the decoded row group. */
  rowCount: number;
  /** Caller-thread columns when worker decoding is unavailable or disabled. */
  columns?: Record<string, ArrayType>;
  /** Directly transferable Arrow batches when worker decoding is enabled. */
  workerResult?: ParquetSourceWorkerResult;
};

type SettledParquetRowGroupRead =
  | {
      /** Successfully decoded row group. */
      result: ParquetRowGroupReadResult;
      /** No error occurred. */
      error?: never;
    }
  | {
      /** Row-group read failed. */
      error: unknown;
      /** No result was decoded. */
      result?: never;
    };

const {
  preload: _preloadParquetSourceLoader,
  createDataSource: _createMetadataDataSource,
  ...ParquetSourceLoaderBase
} = ParquetSourceLoaderMetadata;

/** Runtime source factory for reusable, range-backed Parquet access. */
export const ParquetSourceLoaderWithParser = {
  ...ParquetSourceLoaderBase,
  createDataSource: (
    data: string | Blob,
    options: ParquetSourceLoaderOptions,
    coreApi?: CoreAPI
  ): ParquetSource => new ParquetSource(data, options, coreApi)
} as const satisfies SourceLoader<ParquetSource>;

/** Runtime Parquet source loader exposed by the explicit package subpath. */
export {ParquetSourceLoaderWithParser as ParquetSourceLoader};

/** Reusable Parquet source that caches footer/schema state and selectively reads byte ranges. */
export class ParquetSource extends DataSource<string | Blob, ParquetSourceLoaderOptions> {
  /** Immutable feature support for the current range-backed source implementation. */
  readonly capabilities: ParquetSourceCapabilities = PARQUET_SOURCE_CAPABILITIES;
  /** Shared initialization for this source instance. */
  private initializationPromise: Promise<ParquetSourceInitialization> | null = null;
  /** File allocated during source initialization, including while it is opening. */
  private readableFile: ReadableFile | null = null;
  /** Whether this source has been permanently closed. */
  private closed = false;
  /** Compression module preload shared by all selective reads. */
  private compressionPromise: Promise<void> | null = null;
  /** Read abort controllers used to cancel active iterators when the source closes. */
  private activeReadControllers = new Set<AbortController>();
  /** Cumulative source telemetry counters. */
  private telemetry = createParquetTelemetry();

  /** Creates a Parquet source backed by strict URL ranges or Blob slices. */
  constructor(data: string | Blob, options: ParquetSourceLoaderOptions, coreApi?: CoreAPI) {
    const wasmUrl = options.parquet?.wasmUrl;
    super(data, options, ParquetSourceLoaderWithParser.defaultOptions, coreApi);
    if (wasmUrl !== undefined) {
      this.options.parquet.wasmUrl = wasmUrl;
    }
  }

  /** Returns the cached logical schema decoded from the Parquet footer. */
  async getSchema(options: {signal?: AbortSignal} = {}): Promise<Schema> {
    const initialization = await this.getInitialization(options.signal);
    return initialization.schema;
  }

  /** Returns normalized dataset, row-group, and column-chunk metadata. */
  async getMetadata(options: ParquetMetadataRequestOptions = {}): Promise<ParquetSourceMetadata> {
    const initialization = await this.getInitialization(options.signal);
    if (!options.formatSpecificMetadata) {
      return initialization.metadata;
    }
    return {
      ...initialization.metadata,
      formatSpecificMetadata: initialization.fileMetadata
    };
  }

  /** Returns a copy of cumulative transport, decode, conversion, and pruning telemetry. */
  getTelemetry(): ParquetTelemetry {
    return Object.freeze({...this.telemetry});
  }

  /** Selectively fetches row groups and columns as ordered Arrow batches with source provenance. */
  async *read(options: ParquetSourceReadOptions = {}): AsyncIterable<ParquetSourceBatch> {
    const readOptions = this.getReadOptions(options);
    const readContext = createReadAbortContext(readOptions.signal);
    const inFlightReads = new Set<Promise<SettledParquetRowGroupRead>>();
    let completed = false;
    let readError: unknown;
    this.activeReadControllers.add(readContext.abortController);

    try {
      const initialization = await this.getInitialization(readContext.abortController.signal);
      await this.getCompressionInitialization();
      throwIfAborted(readContext.abortController.signal);

      const candidateRowGroupIndices = normalizeRowGroupIndices(
        readOptions.rowGroups,
        initialization.fileMetadata.row_groups.length
      );
      const rowGroupIndices = readOptions.rowGroupFilter
        ? candidateRowGroupIndices.filter(rowGroupIndex =>
            readOptions.rowGroupFilter!(initialization.metadata.rowGroups[rowGroupIndex])
          )
        : candidateRowGroupIndices;
      this.recordTelemetry(
        'row-group-prune',
        {
          rowGroupsRequested: candidateRowGroupIndices.length,
          rowGroupsPruned: candidateRowGroupIndices.length - rowGroupIndices.length
        },
        {}
      );
      const columns = normalizeColumns(readOptions.columns, initialization.schema);
      const columnList = columns.map(column => [column]);
      const batchSize = normalizeBatchSize(readOptions.batchSize);
      const concurrency = normalizeConcurrency(readOptions.concurrency);
      const projectedSchema = projectSchema(initialization.schema, columns);
      const workerOptions = this.getWorkerOptions(concurrency, readContext.abortController.signal);
      const decodeOnWorker = canDecodeParquetSourceOnWorker(workerOptions);
      const scheduledReads = new Map<number, Promise<SettledParquetRowGroupRead>>();
      let nextPositionToSchedule = 0;

      const scheduleReads = (): void => {
        while (
          nextPositionToSchedule < rowGroupIndices.length &&
          scheduledReads.size < concurrency
        ) {
          const position = nextPositionToSchedule++;
          const rowGroupIndex = rowGroupIndices[position];
          const read: Promise<SettledParquetRowGroupRead> = this.readRowGroup(
            initialization,
            rowGroupIndex,
            columnList,
            projectedSchema,
            batchSize,
            decodeOnWorker ? workerOptions : undefined,
            readContext.abortController.signal
          ).then(
            result => ({result}) as SettledParquetRowGroupRead,
            error => ({error}) as SettledParquetRowGroupRead
          );
          scheduledReads.set(position, read);
          inFlightReads.add(read);
          void read.then(() => inFlightReads.delete(read));
        }
      };

      scheduleReads();
      for (let position = 0; position < rowGroupIndices.length; position++) {
        const settledRead = await scheduledReads.get(position)!;
        scheduledReads.delete(position);
        scheduleReads();
        if ('error' in settledRead) {
          throw settledRead.error;
        }

        const {rowGroupIndex, columns: decodedColumns, rowCount, workerResult} = settledRead.result;
        if (workerResult) {
          for (const workerBatch of workerResult.batches) {
            throwIfAborted(readContext.abortController.signal);
            const deserializationStartTime = getCurrentTime();
            const arrowTable = hydrateArrowTable(workerBatch.arrowTable);
            const deserializationDurationMs = getCurrentTime() - deserializationStartTime;
            this.recordTelemetry(
              'arrow-conversion',
              {arrowConversionDurationMs: deserializationDurationMs},
              {rowGroupIndex, durationMs: deserializationDurationMs}
            );
            const batch = createParquetBatchFromArrow(
              initialization.metadata,
              projectedSchema,
              rowGroupIndex,
              workerBatch.rowGroupRowOffset,
              arrowTable,
              workerBatch.rowCount
            );
            this.recordTelemetry(
              'batch',
              {batchesEmitted: 1, rowsEmitted: workerBatch.rowCount},
              {rowGroupIndex, rowCount: workerBatch.rowCount}
            );
            yield batch;
          }
          continue;
        }

        const outputBatchSize = batchSize || Math.max(rowCount, 1);
        for (
          let rowGroupRowOffset = 0;
          rowGroupRowOffset < rowCount;
          rowGroupRowOffset += outputBatchSize
        ) {
          throwIfAborted(readContext.abortController.signal);
          const batchRowCount = Math.min(outputBatchSize, rowCount - rowGroupRowOffset);
          const columns = sliceColumns(
            decodedColumns!,
            rowGroupRowOffset,
            rowGroupRowOffset + batchRowCount
          );
          const conversionStartTime = getCurrentTime();
          const batch = createParquetBatch(
            initialization.metadata,
            projectedSchema,
            rowGroupIndex,
            rowGroupRowOffset,
            columns,
            batchRowCount
          );
          const conversionDurationMs = getCurrentTime() - conversionStartTime;
          this.recordTelemetry(
            'arrow-conversion',
            {arrowConversionDurationMs: conversionDurationMs},
            {rowGroupIndex, durationMs: conversionDurationMs}
          );
          this.recordTelemetry(
            'batch',
            {batchesEmitted: 1, rowsEmitted: batchRowCount},
            {rowGroupIndex, rowCount: batchRowCount}
          );
          yield batch;
        }
      }
      completed = true;
    } catch (error) {
      readError = error;
      if (readContext.abortController.signal.aborted) {
        this.recordTelemetry('cancel', {cancellationCount: 1}, {error});
      } else {
        this.recordTelemetry('read-error', {failedReadCount: 1}, {error});
      }
      throw error;
    } finally {
      if (!completed && readError === undefined) {
        this.recordTelemetry('cancel', {cancellationCount: 1}, {});
      }
      readContext.abortController.abort();
      readContext.removeSignalListener();
      this.activeReadControllers.delete(readContext.abortController);
      await Promise.allSettled([...inFlightReads]);
    }
  }

  /** Closes the underlying readable file and aborts active remote requests. */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (const abortController of this.activeReadControllers) {
      abortController.abort();
    }
    await this.readableFile?.close();
    const initialization = await this.initializationPromise?.catch(() => null);
    if (initialization?.file !== this.readableFile) {
      await initialization?.file.close();
    }
  }

  /** Returns cached initialization, resetting the cache when initialization fails. */
  private getInitialization(signal?: AbortSignal): Promise<ParquetSourceInitialization> {
    if (this.closed) {
      return Promise.reject(new Error('ParquetSource is closed'));
    }
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize(signal).catch(error => {
        this.initializationPromise = null;
        throw error;
      });
    }
    return this.initializationPromise;
  }

  /** Preloads TypeScript decoder compression modules once and permits retry after failure. */
  private getCompressionInitialization(): Promise<void> {
    if (!this.compressionPromise) {
      this.compressionPromise = preloadCompressions()
        .then(() => undefined)
        .catch(error => {
          this.compressionPromise = null;
          throw error;
        });
    }
    return this.compressionPromise;
  }

  /** Snapshots source defaults and per-read overrides before asynchronous iteration begins. */
  private getReadOptions(options: ParquetSourceReadOptions): ParquetSourceReadOptions {
    const rowGroups = options.rowGroups ?? this.options.parquet?.rowGroups;
    const columns = options.columns ?? this.options.parquet?.columns;
    return {
      rowGroups: rowGroups && [...rowGroups],
      columns: columns && [...columns],
      rowGroupFilter: options.rowGroupFilter ?? this.options.parquet?.rowGroupFilter,
      batchSize: options.batchSize ?? this.options.parquet?.batchSize,
      concurrency: options.concurrency ?? this.options.parquet?.concurrency,
      signal: options.signal
    };
  }

  /** Creates loader-utils worker options for one selective source read. */
  private getWorkerOptions(concurrency: number, signal: AbortSignal): ParquetSourceWorkerOptions {
    return {
      core: {
        worker: this.options.core?.worker ?? true,
        maxConcurrency: concurrency,
        maxMobileConcurrency: this.options.core?.maxMobileConcurrency ?? concurrency,
        reuseWorkers: this.options.core?.reuseWorkers ?? isBrowser,
        _workerType: this.options.core?._workerType
      },
      'parquet-source': {
        workerUrl: this.options.parquet?.workerUrl
      },
      parquet: {
        signal
      }
    };
  }

  /** Fetches and decodes one selected row group using the cached footer and schema. */
  private async readRowGroup(
    initialization: ParquetSourceInitialization,
    rowGroupIndex: number,
    columnList: string[][],
    projectedSchema: Schema,
    batchSize: number | undefined,
    workerOptions: ParquetSourceWorkerOptions | undefined,
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    if (workerOptions) {
      return await this.readRowGroupOnWorker(
        initialization,
        rowGroupIndex,
        columnList,
        projectedSchema,
        batchSize,
        workerOptions,
        signal
      );
    }

    const decodeStartTime = getCurrentTime();
    const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
    const decodedRowGroup = await initialization.reader.readRowGroup(
      initialization.parquetSchema,
      rowGroup,
      columnList,
      signal
    );
    throwIfAborted(signal);
    const columns = initialization.parquetSchema.materializeColumns(decodedRowGroup);
    const decodeDurationMs = getCurrentTime() - decodeStartTime;
    this.recordTelemetry(
      'decode',
      {decodeDurationMs, rowGroupsDecoded: 1},
      {rowGroupIndex, durationMs: decodeDurationMs}
    );
    return {rowGroupIndex, columns, rowCount: decodedRowGroup.rowCount};
  }

  /** Fetches selected chunks and transfers their decompression and Arrow conversion to a worker. */
  private async readRowGroupOnWorker(
    initialization: ParquetSourceInitialization,
    rowGroupIndex: number,
    columnList: string[][],
    projectedSchema: Schema,
    batchSize: number | undefined,
    workerOptions: ParquetSourceWorkerOptions,
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
    const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
      const path = columnChunk.meta_data?.path_in_schema;
      return Boolean(path && (columnList.length === 0 || fieldIndexOf(columnList, path) >= 0));
    });
    const ranges = await Promise.all(
      selectedColumnChunks.map(async columnChunk => {
        const {offset, length} = getColumnChunkRange(columnChunk);
        return {offset, data: await initialization.file.read(offset, length, signal)};
      })
    );
    throwIfAborted(signal);

    let workerResult: ParquetSourceWorkerResult;
    try {
      workerResult = await decodeParquetSourceRowGroupOnWorker(
        {
          fileByteLength: initialization.file.size,
          rowCount: Number(rowGroup.num_rows),
          uncompressedByteLength: Number(rowGroup.total_byte_size),
          schemaDefinition: initialization.parquetSchema.schema,
          projectedSchema,
          columnChunks: selectedColumnChunks.map(createParquetSourceWorkerColumnChunk),
          ranges,
          batchSize: batchSize || Math.max(Number(rowGroup.num_rows), 1),
          preserveBinary: Boolean(this.options.parquet?.preserveBinary)
        },
        workerOptions
      );
    } catch (error) {
      throwIfAborted(signal);
      throw error;
    }
    throwIfAborted(signal);
    this.recordTelemetry(
      'decode',
      {decodeDurationMs: workerResult.decodeDurationMs, rowGroupsDecoded: 1},
      {rowGroupIndex, durationMs: workerResult.decodeDurationMs}
    );
    this.recordTelemetry(
      'arrow-conversion',
      {arrowConversionDurationMs: workerResult.arrowConversionDurationMs},
      {rowGroupIndex, durationMs: workerResult.arrowConversionDurationMs}
    );
    return {rowGroupIndex, rowCount: workerResult.rowCount, workerResult};
  }

  /** Opens the readable file and decodes its footer and schema once. */
  private async initialize(signal?: AbortSignal): Promise<ParquetSourceInitialization> {
    const file = await this.openFile(signal);
    try {
      const reader = new ParquetReader(file, {
        preserveBinary: this.options.parquet?.preserveBinary,
        signal
      });
      const fileMetadata = await reader.getFileMetadata();
      const parquetSchema = await reader.getSchema();
      const schema = deepFreeze(await getSchemaFromParquetReader(reader));
      const metadata = createParquetSourceMetadata(
        this.data,
        this.url,
        file,
        fileMetadata,
        schema,
        parquetSchema,
        file instanceof ParquetRangeFile ? file.objectVersion : undefined
      );
      reader.props.signal = undefined;
      return {file, reader, schema, parquetSchema, fileMetadata, metadata};
    } catch (error) {
      await file.close();
      throw error;
    }
  }

  /** Opens a Blob file or probes a remote object with one bounded range request. */
  private async openFile(signal?: AbortSignal): Promise<ReadableFile> {
    if (typeof this.data !== 'string') {
      this.readableFile = new BlobFile(this.data);
      return this.readableFile;
    }
    const file = new ParquetRangeFile(this.url, {
      fetch: this.fetch,
      headers: this.options.parquet?.headers,
      rangeRequests: this.options.rangeRequests,
      onTelemetry: event =>
        this.recordTelemetry(
          event.type,
          {
            rangeRequestCount: event.rangeRequestCount,
            requestedBytes: event.requestedBytes,
            downloadedBytes: event.downloadedBytes,
            cacheHits: event.cacheHits,
            networkDurationMs: event.networkDurationMs,
            failedRangeRequestCount: event.failedRangeRequestCount,
            abortedRangeRequestCount: event.abortedRangeRequestCount
          },
          {durationMs: event.networkDurationMs, error: event.error}
        )
    });
    this.readableFile = file;
    return await file.open(signal);
  }

  /** Applies telemetry deltas and emits a callback with the resulting cumulative snapshot. */
  private recordTelemetry(
    type: ParquetTelemetryEvent['type'],
    delta: Partial<ParquetTelemetry>,
    details: Omit<ParquetTelemetryEvent, 'type' | 'telemetry'>
  ): void {
    for (const [key, value] of Object.entries(delta) as Array<
      [keyof ParquetTelemetry, number | undefined]
    >) {
      if (value !== undefined) {
        this.telemetry[key] += value;
      }
    }
    try {
      this.options.parquet?.onTelemetry?.({type, telemetry: this.getTelemetry(), ...details});
    } catch {
      // Telemetry must never change source read behavior.
    }
  }
}

/** Normalizes a decoded Parquet footer into source metadata. */
function createParquetSourceMetadata(
  data: string | Blob,
  url: string,
  file: ReadableFile,
  fileMetadata: FileMetaData,
  schema: Schema,
  parquetSchema: ParquetSchema,
  objectVersion?: ParquetObjectVersion
): ParquetSourceMetadata {
  let rowOffset = 0;
  const rowGroups = fileMetadata.row_groups.map((rowGroup, index) => {
    const columns = rowGroup.columns
      .filter(columnChunk => Boolean(columnChunk.meta_data))
      .map(columnChunk => createColumnChunkMetadata(columnChunk, parquetSchema));
    const normalizedRowGroup = createRowGroupMetadata(
      index,
      rowOffset,
      Number(rowGroup.num_rows),
      Number(rowGroup.total_byte_size),
      columns
    );
    rowOffset += normalizedRowGroup.rowCount;
    return normalizedRowGroup;
  });

  return Object.freeze({
    schema,
    name: getSourceName(data, url),
    url: url || undefined,
    fileByteLength: file.size,
    version: fileMetadata.version,
    formatVersion: fileMetadata.version,
    createdBy: fileMetadata.created_by,
    rowCount: Number(fileMetadata.num_rows),
    rowGroupCount: rowGroups.length,
    keyValueMetadata: Object.freeze(getKeyValueMetadata(fileMetadata)),
    rowGroups: Object.freeze(rowGroups),
    objectVersion: hasObjectVersion(objectVersion) ? Object.freeze({...objectVersion}) : undefined
  });
}

/** Normalizes a decoded Parquet column chunk. */
function createColumnChunkMetadata(
  columnChunk: FileMetaData['row_groups'][number]['columns'][number],
  parquetSchema: ParquetSchema
): ParquetColumnChunkMetadata {
  const columnMetadata = columnChunk.meta_data!;
  const dataPageOffset = Number(columnMetadata.data_page_offset);
  const dictionaryPageOffset =
    columnMetadata.dictionary_page_offset === undefined
      ? undefined
      : Number(columnMetadata.dictionary_page_offset);
  const statistics = createColumnChunkStatistics(
    columnMetadata.statistics,
    parquetSchema.findField(columnMetadata.path_in_schema)
  );
  const compressedByteLength = Number(columnMetadata.total_compressed_size);
  const uncompressedByteLength = Number(columnMetadata.total_uncompressed_size);
  return Object.freeze({
    path: Object.freeze([...columnMetadata.path_in_schema]),
    filePath: columnChunk.file_path || undefined,
    compression: CompressionCodec[columnMetadata.codec] || String(columnMetadata.codec),
    encodings: Object.freeze(
      columnMetadata.encodings.map(encoding => Encoding[encoding] || String(encoding))
    ),
    valueCount: Number(columnMetadata.num_values),
    fileOffset: Math.min(
      dataPageOffset,
      dictionaryPageOffset && dictionaryPageOffset > 0 ? dictionaryPageOffset : dataPageOffset
    ),
    compressedByteLength,
    compressedSize: compressedByteLength,
    uncompressedByteLength,
    uncompressedSize: uncompressedByteLength,
    dataPageOffset,
    dictionaryPageOffset,
    statistics
  });
}

/** Decodes optional footer statistics into the column's logical value representation. */
function createColumnChunkStatistics(
  statistics: ParquetThriftStatistics | undefined,
  field: ParquetField
): ParquetColumnChunkStatistics | undefined {
  if (!statistics) {
    return undefined;
  }
  const minBytes = statistics.min_value ?? statistics.min;
  const maxBytes = statistics.max_value ?? statistics.max;
  const result: ParquetColumnChunkStatistics = {
    nullCount: statistics.null_count === undefined ? undefined : Number(statistics.null_count),
    distinctCount:
      statistics.distinct_count === undefined ? undefined : Number(statistics.distinct_count)
  };
  if (minBytes) {
    result.min = decodeStatisticsValueSafely(toUint8Array(minBytes), field);
  }
  if (maxBytes) {
    result.max = decodeStatisticsValueSafely(toUint8Array(maxBytes), field);
  }
  if (
    result.min === undefined &&
    result.max === undefined &&
    result.nullCount === undefined &&
    result.distinctCount === undefined
  ) {
    return undefined;
  }
  return Object.freeze(result);
}

/** Decodes one footer statistic and returns undefined for malformed or unsupported values. */
function decodeStatisticsValueSafely(bytes: Uint8Array, field: ParquetField): unknown {
  try {
    let primitiveValue: unknown;
    switch (field.primitiveType) {
      case 'BOOLEAN':
        primitiveValue = Boolean(bytes[0]);
        break;
      case 'INT32':
        primitiveValue = readInt32LE(bytes, 0);
        break;
      case 'INT64':
        primitiveValue = readInt64LE(bytes, 0);
        break;
      case 'FLOAT':
        primitiveValue = readFloatLE(bytes, 0);
        break;
      case 'DOUBLE':
        primitiveValue = readDoubleLE(bytes, 0);
        break;
      case 'INT96':
      case 'BYTE_ARRAY':
      case 'FIXED_LEN_BYTE_ARRAY':
        primitiveValue = copyUint8Array(bytes);
        break;
      default:
        return undefined;
    }
    return Types.fromPrimitive(field.originalType || field.primitiveType, primitiveValue, field);
  } catch {
    return undefined;
  }
}

/** Normalizes one decoded row group and derives its compressed byte length. */
function createRowGroupMetadata(
  index: number,
  rowOffset: number,
  rowCount: number,
  uncompressedByteLength: number,
  columns: ParquetColumnChunkMetadata[]
): ParquetRowGroupMetadata {
  const compressedByteLength = columns.reduce(
    (sum, column) => sum + column.compressedByteLength,
    0
  );
  return Object.freeze({
    index,
    rowOffset,
    rowCount,
    uncompressedByteLength,
    uncompressedSize: uncompressedByteLength,
    compressedByteLength,
    compressedSize: compressedByteLength,
    columns: Object.freeze(columns)
  });
}

/** Returns the complete contiguous byte range occupied by one Parquet column chunk. */
function getColumnChunkRange(columnChunk: ColumnChunk): {offset: number; length: number} {
  if (columnChunk.file_path) {
    throw new Error('Parquet worker decoding does not support external column chunk files');
  }
  const columnMetadata = columnChunk.meta_data;
  if (!columnMetadata) {
    throw new Error('Parquet column chunk is missing metadata');
  }
  const dataPageOffset = Number(columnMetadata.data_page_offset);
  const dictionaryPageOffset =
    columnMetadata.dictionary_page_offset === undefined
      ? undefined
      : Number(columnMetadata.dictionary_page_offset);
  const offset = Math.min(
    dataPageOffset,
    dictionaryPageOffset && dictionaryPageOffset > 0 ? dictionaryPageOffset : dataPageOffset
  );
  const length = Number(columnMetadata.total_compressed_size);
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
    throw new Error('Parquet column chunk range must use non-negative safe integers');
  }
  return {offset, length};
}

/** Copies one selected Thrift column chunk into a structured-cloneable worker descriptor. */
function createParquetSourceWorkerColumnChunk(
  columnChunk: ColumnChunk
): ParquetSourceWorkerColumnChunk {
  const columnMetadata = columnChunk.meta_data;
  if (!columnMetadata) {
    throw new Error('Parquet column chunk is missing metadata');
  }
  return {
    filePath: columnChunk.file_path || undefined,
    physicalType: columnMetadata.type,
    compressionCodec: columnMetadata.codec,
    path: [...columnMetadata.path_in_schema],
    valueCount: Number(columnMetadata.num_values),
    compressedByteLength: Number(columnMetadata.total_compressed_size),
    uncompressedByteLength: Number(columnMetadata.total_uncompressed_size),
    dataPageOffset: Number(columnMetadata.data_page_offset),
    dictionaryPageOffset:
      columnMetadata.dictionary_page_offset === undefined
        ? undefined
        : Number(columnMetadata.dictionary_page_offset)
  };
}

/** Converts decoded columns into one Arrow batch and attaches stable source provenance. */
function createParquetBatch(
  metadata: ParquetSourceMetadata,
  schema: Schema,
  rowGroupIndex: number,
  rowGroupRowOffset: number,
  columns: Record<string, ArrayType>,
  rowCount: number
): ParquetBatch {
  const arrowTable = convertTable({shape: 'columnar-table', schema, data: columns}, 'arrow-table');
  return createParquetBatchFromArrow(
    metadata,
    schema,
    rowGroupIndex,
    rowGroupRowOffset,
    arrowTable.data,
    rowCount
  );
}

/** Wraps a worker-transferred or locally converted Arrow table with source provenance. */
function createParquetBatchFromArrow(
  metadata: ParquetSourceMetadata,
  schema: Schema,
  rowGroupIndex: number,
  rowGroupRowOffset: number,
  data: ArrowTable['data'],
  rowCount: number
): ParquetBatch {
  const rowGroup = metadata.rowGroups[rowGroupIndex];
  const sourceId = metadata.url || metadata.name;
  const provenance = Object.freeze({
    sourceId,
    sourceUrl: metadata.url,
    source: sourceId,
    rowGroupIndex,
    rowOffset: rowGroup.rowOffset + rowGroupRowOffset,
    rowGroupRowOffset,
    rowCount
  });
  return {
    batchType: 'data',
    shape: 'arrow-table',
    schemaType: 'explicit',
    schema,
    data,
    length: rowCount,
    metadata: provenance,
    ...provenance
  };
}

/** Returns a row slice of every decoded column without constructing row objects. */
function sliceColumns(
  columns: Record<string, ArrayType>,
  start: number,
  end: number
): Record<string, ArrayType> {
  const slicedColumns: Record<string, ArrayType> = {};
  for (const [name, column] of Object.entries(columns)) {
    const slice = (column as ArrayType & {slice?: (start: number, end: number) => ArrayType}).slice;
    slicedColumns[name] = slice
      ? slice.call(column, start, end)
      : Array.prototype.slice.call(column, start, end);
  }
  return slicedColumns;
}

/** Validates and normalizes requested row-group indexes. */
function normalizeRowGroupIndices(
  rowGroups: readonly number[] | undefined,
  rowGroupCount: number
): number[] {
  const rowGroupIndices = rowGroups || Array.from({length: rowGroupCount}, (_, index) => index);
  const seenIndices = new Set<number>();
  for (const rowGroupIndex of rowGroupIndices) {
    if (!Number.isInteger(rowGroupIndex) || rowGroupIndex < 0 || rowGroupIndex >= rowGroupCount) {
      throw new Error(`Invalid Parquet row-group index ${rowGroupIndex}`);
    }
    if (seenIndices.has(rowGroupIndex)) {
      throw new Error(`Duplicate Parquet row-group index ${rowGroupIndex}`);
    }
    seenIndices.add(rowGroupIndex);
  }
  return [...rowGroupIndices];
}

/** Validates selected top-level columns against the source schema. */
function normalizeColumns(columns: readonly string[] | undefined, schema: Schema): string[] {
  if (!columns?.length) {
    return [];
  }
  const availableColumns = new Set(schema.fields.map(field => field.name));
  const normalizedColumns: string[] = [];
  for (const column of columns) {
    if (!availableColumns.has(column)) {
      throw new Error(`Parquet column not found: ${column}`);
    }
    if (!normalizedColumns.includes(column)) {
      normalizedColumns.push(column);
    }
  }
  return normalizedColumns;
}

/** Returns a schema containing only explicitly selected top-level fields. */
function projectSchema(schema: Schema, columns: string[]): Schema {
  if (columns.length === 0) {
    return schema;
  }
  const selectedColumns = new Set(columns);
  return {...schema, fields: schema.fields.filter(field => selectedColumns.has(field.name))};
}

/** Validates an optional output batch size. */
function normalizeBatchSize(batchSize?: number): number | undefined {
  if (batchSize === undefined) {
    return undefined;
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(`Invalid Parquet batch size ${batchSize}`);
  }
  return batchSize;
}

/** Validates the row-group decode concurrency limit. */
function normalizeConcurrency(concurrency = 1): number {
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error(`Invalid Parquet concurrency ${concurrency}`);
  }
  return concurrency;
}

/** Creates a zero-filled telemetry snapshot for one Parquet source. */
function createParquetTelemetry(): ParquetTelemetry {
  return {
    rangeRequestCount: 0,
    requestedBytes: 0,
    downloadedBytes: 0,
    cacheHits: 0,
    networkDurationMs: 0,
    failedRangeRequestCount: 0,
    abortedRangeRequestCount: 0,
    retryCount: 0,
    decodeDurationMs: 0,
    arrowConversionDurationMs: 0,
    rowGroupsRequested: 0,
    rowGroupsPruned: 0,
    rowGroupsDecoded: 0,
    batchesEmitted: 0,
    rowsEmitted: 0,
    cancellationCount: 0,
    failedReadCount: 0
  };
}

/** Returns a monotonic timestamp when available and falls back to wall-clock time. */
function getCurrentTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** Creates a read-scoped abort controller linked to the caller signal. */
function createReadAbortContext(signal?: AbortSignal): {
  /** Controller owned by the source read operation. */
  abortController: AbortController;
  /** Removes the caller-signal listener after the read settles. */
  removeSignalListener: () => void;
} {
  const abortController = new AbortController();
  const abortRead = (): void => abortController.abort(signal?.reason);
  if (signal?.aborted) {
    abortRead();
  } else {
    signal?.addEventListener('abort', abortRead, {once: true});
  }
  return {
    abortController,
    removeSignalListener: () => signal?.removeEventListener('abort', abortRead)
  };
}

/** Throws a cross-runtime AbortError when a signal has been aborted. */
function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) {
    return;
  }
  if (signal.reason !== undefined) {
    throw signal.reason;
  }
  const error = new Error('Parquet read aborted');
  error.name = 'AbortError';
  throw error;
}

/** Recursively freezes the plain schema tree cached by a source. */
function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}

/** Converts footer key/value pairs into an object. */
function getKeyValueMetadata(fileMetadata: FileMetaData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of fileMetadata.key_value_metadata || []) {
    if (entry.value !== undefined) {
      result[entry.key] = entry.value;
    }
  }
  return result;
}

/** Infers a stable display name from URL or File input. */
function getSourceName(data: string | Blob, url: string): string {
  const sourceName =
    typeof data !== 'string' && 'name' in data && typeof data.name === 'string'
      ? data.name
      : typeof data === 'string'
        ? url.split(/[?#]/)[0].split('/').pop() || 'parquet'
        : 'parquet';
  return sourceName.replace(/\.parquet$/i, '') || 'parquet';
}

/** Returns true when at least one HTTP object validator was captured. */
function hasObjectVersion(version?: ParquetObjectVersion): version is ParquetObjectVersion {
  return Boolean(version?.etag || version?.lastModified);
}
