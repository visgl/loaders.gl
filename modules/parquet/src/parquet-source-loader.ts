// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, ReadableFile, SourceLoader} from '@loaders.gl/loader-utils';
import {BlobFile, DataSource} from '@loaders.gl/loader-utils';
import type {ArrayType, Schema} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {getSchemaFromParquetReader} from './lib/parsers/get-parquet-schema';
import {ParquetRangeFile} from './lib/sources/parquet-range-file';
import {ParquetSourceLoader as ParquetSourceLoaderMetadata} from './parquet-source-loader-types';
import type {
  ParquetBatch,
  ParquetColumnChunkMetadata,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions
} from './parquet-source-types';
import {preloadCompressions} from './parquetjs/compression';
import {CompressionCodec, Encoding, type FileMetaData} from './parquetjs/parquet-thrift/index';
import {ParquetReader} from './parquetjs/parser/parquet-reader';
import type {ParquetSchema} from './parquetjs/schema/schema';

export type {
  ParquetBatch,
  ParquetBatchMetadata,
  ParquetBatchProvenance,
  ParquetColumnChunkMetadata,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetRangeRequestOptions,
  ParquetReadOptions,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions
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
  /** Materialized columns for the selected fields. */
  columns: Record<string, ArrayType>;
  /** Number of logical rows in the decoded row group. */
  rowCount: number;
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

  /** Selectively fetches row groups and columns as ordered Arrow batches with source provenance. */
  async *read(options: ParquetSourceReadOptions = {}): AsyncIterable<ParquetSourceBatch> {
    const readOptions = this.getReadOptions(options);
    const readContext = createReadAbortContext(readOptions.signal);
    const inFlightReads = new Set<Promise<SettledParquetRowGroupRead>>();
    this.activeReadControllers.add(readContext.abortController);

    try {
      const initialization = await this.getInitialization(readContext.abortController.signal);
      await this.getCompressionInitialization();
      throwIfAborted(readContext.abortController.signal);

      const rowGroupIndices = normalizeRowGroupIndices(
        readOptions.rowGroups,
        initialization.fileMetadata.row_groups.length
      );
      const columns = normalizeColumns(readOptions.columns, initialization.schema);
      const columnList = columns.map(column => [column]);
      const batchSize = normalizeBatchSize(readOptions.batchSize);
      const concurrency = normalizeConcurrency(readOptions.concurrency);
      const projectedSchema = projectSchema(initialization.schema, columns);
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

        const {rowGroupIndex, columns: decodedColumns, rowCount} = settledRead.result;
        const outputBatchSize = batchSize || Math.max(rowCount, 1);
        for (
          let rowGroupRowOffset = 0;
          rowGroupRowOffset < rowCount;
          rowGroupRowOffset += outputBatchSize
        ) {
          throwIfAborted(readContext.abortController.signal);
          const batchRowCount = Math.min(outputBatchSize, rowCount - rowGroupRowOffset);
          const columns = sliceColumns(
            decodedColumns,
            rowGroupRowOffset,
            rowGroupRowOffset + batchRowCount
          );
          yield createParquetBatch(
            initialization.metadata,
            projectedSchema,
            rowGroupIndex,
            rowGroupRowOffset,
            columns,
            batchRowCount
          );
        }
      }
    } finally {
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
      batchSize: options.batchSize ?? this.options.parquet?.batchSize,
      concurrency: options.concurrency ?? this.options.parquet?.concurrency,
      signal: options.signal
    };
  }

  /** Fetches and decodes one selected row group using the cached footer and schema. */
  private async readRowGroup(
    initialization: ParquetSourceInitialization,
    rowGroupIndex: number,
    columnList: string[][],
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
    const decodedRowGroup = await initialization.reader.readRowGroup(
      initialization.parquetSchema,
      rowGroup,
      columnList,
      signal
    );
    throwIfAborted(signal);
    const columns = initialization.parquetSchema.materializeColumns(decodedRowGroup);
    return {rowGroupIndex, columns, rowCount: decodedRowGroup.rowCount};
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
      const schema = await getSchemaFromParquetReader(reader);
      const metadata = createParquetSourceMetadata(
        this.data,
        this.url,
        file,
        fileMetadata,
        schema,
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
      rangeRequests: this.options.rangeRequests
    });
    this.readableFile = file;
    return await file.open(signal);
  }
}

/** Normalizes a decoded Parquet footer into source metadata. */
function createParquetSourceMetadata(
  data: string | Blob,
  url: string,
  file: ReadableFile,
  fileMetadata: FileMetaData,
  schema: Schema,
  objectVersion?: ParquetObjectVersion
): ParquetSourceMetadata {
  let rowOffset = 0;
  const rowGroups = fileMetadata.row_groups.map((rowGroup, index) => {
    const columns = rowGroup.columns
      .filter(columnChunk => Boolean(columnChunk.meta_data))
      .map(columnChunk => createColumnChunkMetadata(columnChunk));
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
  columnChunk: FileMetaData['row_groups'][number]['columns'][number]
): ParquetColumnChunkMetadata {
  const columnMetadata = columnChunk.meta_data!;
  const dataPageOffset = Number(columnMetadata.data_page_offset);
  const dictionaryPageOffset =
    columnMetadata.dictionary_page_offset === undefined
      ? undefined
      : Number(columnMetadata.dictionary_page_offset);
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
    dictionaryPageOffset
  });
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
  const rowGroup = metadata.rowGroups[rowGroupIndex];
  const sourceId = metadata.url || metadata.name;
  const provenance = {
    sourceId,
    sourceUrl: metadata.url,
    source: sourceId,
    rowGroupIndex,
    rowOffset: rowGroup.rowOffset + rowGroupRowOffset,
    rowGroupRowOffset,
    rowCount
  };
  return {
    batchType: 'data',
    shape: 'arrow-table',
    schemaType: 'explicit',
    schema,
    data: arrowTable.data,
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

/** Creates a read-scoped abort controller linked to the caller signal. */
function createReadAbortContext(signal?: AbortSignal): {
  /** Controller owned by the source read operation. */
  abortController: AbortController;
  /** Removes the caller-signal listener after the read settles. */
  removeSignalListener: () => void;
} {
  const abortController = new AbortController();
  const abortRead = (): void => abortController.abort();
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
  const error = new Error('Parquet read aborted');
  error.name = 'AbortError';
  throw error;
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
