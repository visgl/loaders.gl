// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as parquetWasm from 'parquet-wasm/esm/parquet_wasm.js';
import * as arrow from 'apache-arrow';

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {Schema} from '@loaders.gl/schema';

import {PARQUET_WASM_URL} from './lib/constants';
import {normalizeArrowTableGeoMetadata} from './lib/geo/geospatial-metadata';
import {loadWasm} from './lib/utils/load-wasm';
import {makeStreamIterator} from './lib/utils/make-stream-iterator';
import {ParquetSourceLoader as ParquetSourceLoaderMetadata} from './parquet-source-loader-types';
import type {
  ParquetColumnChunkMetadata,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions
} from './parquet-source-types';

export type {
  ParquetBatchMetadata,
  ParquetColumnChunkMetadata,
  ParquetRowGroupMetadata,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions
} from './parquet-source-types';

/** Snapshotted options used internally for one read. */
type ResolvedParquetSourceReadOptions = {
  rowGroups?: number[];
  columns?: string[];
  batchSize?: number;
  concurrency?: number;
};

type ParquetSourceState = {
  parquetFile: parquetWasm.ParquetFile;
  metadata: ParquetSourceMetadata;
  schemaMetadata: Map<string, string>;
};

const {
  preload: _preloadParquetSourceLoader,
  createDataSource: _createMetadataDataSource,
  ...ParquetSourceLoaderBase
} = ParquetSourceLoaderMetadata;

/** Runtime source factory for reusable, selective access to Parquet files. */
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

/** Reusable Parquet file handle with cached footer/schema and selective Arrow reads. */
export class ParquetSource extends DataSource<string | Blob, ParquetSourceLoaderOptions> {
  /** Shared lazy initialization for the source file and its copied metadata. */
  private initializationPromise: Promise<ParquetSourceState> | null = null;
  /** Opaque WASM input preserved outside recursive option merging. */
  private readonly wasmUrl: parquetWasm.InitInput | Promise<parquetWasm.InitInput>;
  /** Shared promise for idempotent asynchronous cleanup. */
  private closePromise: Promise<void> | null = null;
  /** Whether a caller currently owns the source's single read stream. */
  private readActive = false;
  /** Whether this source has stopped accepting new operations. */
  private closed = false;
  /** Whether the cached WASM file handle has been released. */
  private freed = false;

  /** Creates a lazy Parquet source without performing I/O. */
  constructor(data: string | Blob, options: ParquetSourceLoaderOptions, coreApi?: CoreAPI) {
    const wasmUrl = options.parquet?.wasmUrl;
    super(data, options, ParquetSourceLoaderWithParser.defaultOptions, coreApi);

    // mergeOptions recursively treats opaque Promise, URL, module, and buffer inputs as option
    // bags. Preserve the caller's wasm input by identity instead.
    this.wasmUrl = wasmUrl ?? PARQUET_WASM_URL;
    this.options.parquet.wasmUrl = this.wasmUrl;
  }

  /** Returns the cached Arrow-compatible schema. */
  async getSchema(): Promise<Schema> {
    const state = await this.getState();
    return state.metadata.schema;
  }

  /** Returns cached plain file, row-group, and column-chunk metadata. */
  async getMetadata(): Promise<ParquetSourceMetadata> {
    const state = await this.getState();
    return state.metadata;
  }

  /** Streams selected row groups and columns as Arrow batches with source-row provenance. */
  async *read(options: ParquetSourceReadOptions = {}): AsyncIterable<ParquetSourceBatch> {
    if (this.readActive) {
      throw new Error('ParquetSource already has an active read');
    }
    this.readActive = true;

    try {
      const readOptions = this.getReadOptions(options);
      const state = await this.getState();
      const rowGroupIndexes = getRowGroupIndexes(readOptions.rowGroups, state.metadata.rowGroups);

      for (const rowGroupIndex of rowGroupIndexes) {
        const rowGroupMetadata = state.metadata.rowGroups[rowGroupIndex];
        const stream = await state.parquetFile.stream({
          rowGroups: [rowGroupIndex],
          columns: readOptions.columns,
          batchSize: readOptions.batchSize,
          concurrency: readOptions.concurrency
        });

        let rowGroupRowOffset = 0;
        for await (const wasmRecordBatch of makeStreamIterator<parquetWasm.RecordBatch>(stream)) {
          const arrowTable = arrow.tableFromIPC(wasmRecordBatch.intoIPCStream());
          const normalizedArrowTable = normalizeArrowTableGeoMetadata(
            {shape: 'arrow-table', data: arrowTable},
            state.schemaMetadata
          );
          const length = normalizedArrowTable.data.numRows;

          yield {
            batchType: 'data',
            shape: 'arrow-table',
            schema: normalizedArrowTable.schema,
            data: normalizedArrowTable.data,
            length,
            metadata: {
              sourceId: getSourceId(this.data, this.url),
              rowGroupIndex,
              rowOffset: rowGroupMetadata.rowOffset + rowGroupRowOffset,
              rowGroupRowOffset
            }
          };

          rowGroupRowOffset += length;
        }
      }
    } finally {
      this.readActive = false;
    }
  }

  /** Releases the cached WASM file and prevents further operations. */
  close(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }

    if (this.readActive) {
      return Promise.reject(
        new Error('ParquetSource cannot close while a read is active; finish or cancel it first')
      );
    }
    this.closed = true;
    this.closePromise = this.releaseResources();
    return this.closePromise;
  }

  /** Waits for initialization, if any, and releases the cached WASM file once. */
  private async releaseResources(): Promise<void> {
    if (this.freed) {
      return;
    }

    const state = await this.initializationPromise?.catch(() => null);
    state?.parquetFile.free();
    this.freed = true;
  }

  /** Lazily opens the Parquet file and copies its schema/footer into JavaScript memory. */
  private getState(): Promise<ParquetSourceState> {
    if (this.closed) {
      throw new Error('ParquetSource is closed');
    }

    if (!this.initializationPromise) {
      const initializationPromise = this.initialize();
      const cachedInitializationPromise = initializationPromise.catch(error => {
        if (this.initializationPromise === cachedInitializationPromise) {
          this.initializationPromise = null;
        }
        throw error;
      });
      this.initializationPromise = cachedInitializationPromise;
    }

    return this.initializationPromise;
  }

  /** Opens parquet-wasm and prepares plain metadata owned by this source. */
  private async initialize(): Promise<ParquetSourceState> {
    const wasm = await loadWasm(this.wasmUrl);
    const parquetFile =
      typeof this.data === 'string'
        ? await wasm.ParquetFile.fromUrl(this.url)
        : await wasm.ParquetFile.fromFile(this.data);

    try {
      const copiedMetadata = copyParquetMetadata(parquetFile, wasm);
      const wasmSchema = parquetFile.schema();
      const arrowSchemaTable = arrow.tableFromIPC(wasmSchema.intoIPCStream());
      const normalizedArrowTable = normalizeArrowTableGeoMetadata(
        {shape: 'arrow-table', data: arrowSchemaTable},
        copiedMetadata.schemaMetadata
      );

      return {
        parquetFile,
        schemaMetadata: copiedMetadata.schemaMetadata,
        metadata: Object.freeze({
          ...copiedMetadata.metadata,
          schema: normalizedArrowTable.schema
        }) satisfies ParquetSourceMetadata
      };
    } catch (error) {
      parquetFile.free();
      throw error;
    }
  }

  /** Merges source defaults with per-read options. */
  private getReadOptions(options: ParquetSourceReadOptions): ResolvedParquetSourceReadOptions {
    const rowGroups = options.rowGroups ?? this.options.parquet?.rowGroups;
    const columns = options.columns ?? this.options.parquet?.columns;
    return {
      rowGroups: rowGroups && [...rowGroups],
      columns: columns && [...columns],
      batchSize: options.batchSize ?? this.options.parquet?.batchSize,
      concurrency: options.concurrency ?? this.options.parquet?.concurrency
    };
  }
}

/** Copies footer wrappers into plain JavaScript values and releases their WASM handles. */
function copyParquetMetadata(
  parquetFile: parquetWasm.ParquetFile,
  wasm: typeof parquetWasm
): {
  metadata: Omit<ParquetSourceMetadata, 'schema'>;
  schemaMetadata: Map<string, string>;
} {
  const parquetMetadata = parquetFile.metadata();
  try {
    const fileMetadata = parquetMetadata.fileMetadata();
    let version: number;
    let rowCount: number;
    let createdBy: string | undefined;
    let schemaMetadata: Map<string, string>;
    try {
      version = fileMetadata.version();
      rowCount = fileMetadata.numRows();
      createdBy = fileMetadata.createdBy();
      schemaMetadata = new Map(fileMetadata.keyValueMetadata() as Map<string, string>);
    } finally {
      fileMetadata.free();
    }

    const wasmRowGroups = parquetMetadata.rowGroups();
    let rowOffset = 0;
    let rowGroups: ParquetRowGroupMetadata[];
    try {
      rowGroups = wasmRowGroups.map((rowGroup, index) => {
        const wasmColumns = rowGroup.columns();
        let columns: ParquetColumnChunkMetadata[];
        try {
          columns = wasmColumns.map(column =>
            Object.freeze({
              path: Object.freeze(column.columnPath()),
              filePath: column.filePath(),
              fileOffset: column.fileOffset(),
              valueCount: column.numValues(),
              compression: getEnumName(wasm.Compression, column.compression()),
              encodings: Object.freeze(
                column.encodings().map(encoding => getEnumName(wasm.Encoding, encoding))
              ),
              compressedSize: column.compressedSize(),
              uncompressedSize: column.uncompressedSize()
            })
          );
        } finally {
          freeWasmHandles(wasmColumns);
        }

        const rowCountForGroup = rowGroup.numRows();
        const metadata: ParquetRowGroupMetadata = Object.freeze({
          index,
          rowOffset,
          rowCount: rowCountForGroup,
          compressedSize: rowGroup.compressedSize(),
          uncompressedSize: rowGroup.totalByteSize(),
          columns: Object.freeze(columns)
        });
        rowOffset += rowCountForGroup;
        return metadata;
      });
    } finally {
      freeWasmHandles(wasmRowGroups);
    }

    return {
      schemaMetadata,
      metadata: {
        version,
        rowCount,
        createdBy,
        keyValueMetadata: Object.freeze(Object.fromEntries(schemaMetadata)),
        rowGroups: Object.freeze(rowGroups)
      }
    };
  } finally {
    parquetMetadata.free();
  }
}

/** Releases every WASM metadata wrapper, including entries not visited after an accessor error. */
function freeWasmHandles(handles: {free(): void}[]): void {
  for (const handle of handles) {
    handle.free();
  }
}

/** Converts a numeric WASM enum value into a stable string. */
function getEnumName(enumValues: object, value: unknown): string {
  const enumName = (enumValues as Record<number, string>)[Number(value)];
  return enumName || String(value);
}

/** Validates and resolves the row groups requested by one read. */
function getRowGroupIndexes(
  requestedRowGroups: readonly number[] | undefined,
  rowGroups: readonly ParquetRowGroupMetadata[]
): number[] {
  const rowGroupIndexes =
    requestedRowGroups !== undefined
      ? [...requestedRowGroups]
      : Array.from({length: rowGroups.length}, (_, index) => index);
  const uniqueIndexes = new Set<number>();

  for (const rowGroupIndex of rowGroupIndexes) {
    if (
      !Number.isInteger(rowGroupIndex) ||
      rowGroupIndex < 0 ||
      rowGroupIndex >= rowGroups.length
    ) {
      throw new Error(`ParquetSource row group index ${rowGroupIndex} is out of range`);
    }
    if (uniqueIndexes.has(rowGroupIndex)) {
      throw new Error(`ParquetSource row group index ${rowGroupIndex} is duplicated`);
    }
    uniqueIndexes.add(rowGroupIndex);
  }

  return rowGroupIndexes;
}

/** Returns a stable identifier used in batch provenance. */
function getSourceId(data: string | Blob, resolvedUrl: string): string {
  if (typeof data === 'string') {
    return resolvedUrl;
  }
  const namedBlob = data as Blob & {name?: string};
  return namedBlob.name || 'blob';
}
