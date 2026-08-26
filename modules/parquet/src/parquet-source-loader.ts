// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dehydrateArrowTable, hydrateArrowTable, IndexedArrowTable} from '@loaders.gl/arrow';
import type {CoreAPI, ReadableFile, SourceLoader} from '@loaders.gl/loader-utils';
import {
  BlobFile,
  DataSource,
  createScanQueryMetadata,
  explainTableQuery,
  isBrowser,
  validateTableQueryLimit
} from '@loaders.gl/loader-utils';
import type {
  ScanColumnRole,
  ScanQueryMetadata,
  ScanQueryMetadataOptions
} from '@loaders.gl/loader-utils';
import type {ArrayType, ArrowTable, Schema} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {getSchemaFromParquetReader} from './lib/parsers/get-parquet-schema';
import {
  canGeoParquetRowGroupMatch,
  combineParquetPredicates,
  createGeoParquetBoundingBoxPredicate
} from './lib/geo/geoparquet-covering';
import {
  decodeParquetSplitBlockBloomFilter,
  encodeParquetBloomFilterValue,
  hashParquetBloomFilterValue,
  checkParquetSplitBlockBloomFilter
} from './lib/parquet-bloom-filter';
import {getParquetBloomFilterProbes} from './lib/parquet-bloom-filter-planner';
import {
  canParquetRowGroupMatch,
  copyParquetPredicate,
  filterParquetRowIndices,
  gatherParquetColumns,
  getParquetPredicateColumns,
  validateParquetPredicate
} from './lib/parquet-predicate';
import {
  createParquetPagePruningPlan,
  getParquetPageReadRanges,
  type ParquetPagePruningPlan
} from './lib/parquet-page-index';
import {
  canDecodeParquetSourceOnWorker,
  decodeParquetSourceRowGroupOnWorker
} from './lib/parquet-source-worker-client';
import {
  type ParquetSourceWorkerColumnChunk,
  type ParquetSourceWorkerOptions,
  type ParquetSourceWorkerResult
} from './lib/parquet-source-worker-types';
import {sliceParquetBatch} from './lib/slice-parquet-batch';
import {ParquetRangeFile} from './lib/sources/parquet-range-file';
import {toPrimitive} from './parquetjs/schema/types';
import type {ParquetType} from './parquetjs/schema/declare';
import {
  PARQUET_TABLE_QUERY_CAPABILITIES,
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';
import {ParquetSourceLoader as ParquetSourceLoaderMetadata} from './parquet-source-loader-types';
import type {
  ParquetBatch,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetGeospatialStatistics,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetPageScanPlan,
  ParquetPredicate,
  ParquetRowGroupMetadata,
  ParquetSortingColumn,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetSourceExplain,
  ParquetTelemetry,
  ParquetTelemetryEvent
} from './parquet-source-types';
export {
  PARQUET_TABLE_QUERY_CAPABILITIES,
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';
import {preloadCompressions} from './parquetjs/compression';
import {
  CompressionCodec,
  Encoding,
  type ColumnChunk,
  type FileMetaData,
  type GeospatialStatistics as ParquetThriftGeospatialStatistics,
  type RowGroup,
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
  readUInt32LE,
  readUInt64LE,
  toUint8Array
} from './parquetjs/utils/binary-utils';
import {fieldIndexOf} from './parquetjs/utils/read-utils';

export type {
  ParquetBatch,
  ParquetBatchMetadata,
  ParquetBatchProvenance,
  ParquetBoundingBox,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetGeospatialBoundingBox,
  ParquetGeospatialStatistics,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetPageScanPlan,
  ParquetComparisonPredicate,
  ParquetInPredicate,
  ParquetLogicalPredicate,
  ParquetNotPredicate,
  ParquetNullPredicate,
  ParquetPredicate,
  ParquetPredicateProperty,
  ParquetPredicateValue,
  ParquetRangeRequestOptions,
  ParquetReadOptions,
  ParquetRowGroupMetadata,
  ParquetSortingColumn,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetSourceExplain,
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
  /** Number of logical rows retained for output. */
  rowCount: number;
  /** Exact source row indexes retained by the predicate. */
  rowIndices?: number[];
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

type ParquetPhysicalRowGroupPlan = {
  /** Predicate including any GeoParquet covering predicate derived from a bounding box. */
  predicate?: ParquetPredicate;
  /** Row groups retained by all physical pruning stages. */
  rowGroupIndices: number[];
  /** Candidate row groups explicitly requested by the caller. */
  requested: number;
  /** Row groups rejected by the caller metadata callback. */
  prunedByCallback: number;
  /** Row groups rejected by native geospatial statistics. */
  prunedBySpatial: number;
  /** Row groups rejected by column or covering statistics. */
  prunedByStatistics: number;
  /** Row groups rejected by split-block Bloom filters. */
  prunedByBloomFilter: number;
  /** Bloom-filter payloads read while planning. */
  bloomFiltersRead: number;
  /** Bloom-filter bytes read while planning. */
  bloomFilterBytesRead: number;
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
  /** Common projection, predicate, limit, streaming, and cancellation capabilities. */
  readonly tableQueryCapabilities = PARQUET_TABLE_QUERY_CAPABILITIES;
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

  /** Discovers schema, capabilities, and footer statistics without decoding Parquet data pages. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const [schema, metadata] = await Promise.all([
      this.getSchema({signal: options.signal}),
      this.getMetadata({signal: options.signal})
    ]);
    return createScanQueryMetadata({
      sourceType: 'parquet',
      queryType: 'table',
      name: metadata.name,
      schema,
      capabilities: {table: this.tableQueryCapabilities},
      columnRoles: getParquetColumnRoles(schema.fields.map(field => field.name)),
      statistics: {rowCount: metadata.rowCount, byteLength: metadata.fileByteLength}
    });
  }

  /** Plans a portable query using Parquet metadata without decoding data pages. */
  async getScanPlan(options: ParquetSourceReadOptions = {}): Promise<ParquetSourceExplain> {
    const readOptions = this.getReadOptions(options);
    const initialization = await this.getInitialization(readOptions.signal);
    const sourceColumnNames = initialization.schema.fields.map(field => field.name);
    const signal = readOptions.signal ?? new AbortController().signal;
    const physicalPlan = await this.planRowGroups(initialization, readOptions, signal);
    const pagePlans = await this.planPages(initialization, readOptions, physicalPlan, signal);
    const explanation = explainTableQuery(
      sourceColumnNames,
      {
        columns: readOptions.columns,
        predicate: physicalPlan.predicate,
        limit: readOptions.limit
      },
      PARQUET_TABLE_QUERY_CAPABILITIES
    );
    return Object.freeze({
      ...explanation,
      source: 'parquet' as const,
      rowGroups: Object.freeze({
        indices: Object.freeze([...physicalPlan.rowGroupIndices]),
        requested: physicalPlan.requested,
        selected: physicalPlan.rowGroupIndices.length,
        prunedByCallback: physicalPlan.prunedByCallback,
        prunedBySpatial: physicalPlan.prunedBySpatial,
        prunedByStatistics: physicalPlan.prunedByStatistics,
        prunedByBloomFilter: physicalPlan.prunedByBloomFilter
      }),
      bloomFilters: Object.freeze({
        read: physicalPlan.bloomFiltersRead,
        bytesRead: physicalPlan.bloomFilterBytesRead
      }),
      pages: Object.freeze({
        rowGroupsPlanned: new Set(pagePlans.map(plan => plan.rowGroupIndex)).size,
        indexesRead: pagePlans.reduce((sum, plan) => sum + plan.indexesRead, 0),
        total: pagePlans.reduce((sum, plan) => sum + plan.totalPages, 0),
        selected: pagePlans.reduce((sum, plan) => sum + plan.selectedPages, 0),
        rowsPruned: pagePlans.reduce((sum, plan) => sum + plan.rowsPruned, 0),
        plans: Object.freeze(pagePlans)
      })
    });
  }

  /** Explains the common logical query and Parquet-specific physical scan plan. */
  async explain(options: ParquetSourceReadOptions = {}): Promise<ParquetSourceExplain> {
    return await this.getScanPlan(options);
  }

  /** Executes a previously computed physical plan while preserving its row-group decisions. */
  async *executeScanPlan(
    plan: ParquetSourceExplain,
    options: ParquetSourceReadOptions = {}
  ): AsyncIterable<ParquetSourceBatch> {
    if (plan.source !== 'parquet') {
      throw new Error('ParquetSource can only execute Parquet scan plans');
    }
    const predicateStep = plan.plan.find(step => step.kind === 'filter');
    const limitStep = plan.plan.find(step => step.kind === 'limit');
    yield* this.read({
      ...options,
      columns: options.columns ?? plan.outputColumns,
      predicate:
        options.predicate ??
        (predicateStep?.kind === 'filter' ? predicateStep.predicate : undefined),
      limit: options.limit ?? (limitStep?.kind === 'limit' ? limitStep.limit : undefined),
      rowGroups: plan.rowGroups.indices
    });
  }

  /** Common scan-architecture alias for selective Parquet reads. */
  scan(options: ParquetSourceReadOptions = {}): AsyncIterable<ParquetSourceBatch> {
    return this.read(options);
  }

  /** Returns a copy of cumulative transport, decode, conversion, and pruning telemetry. */
  getTelemetry(): ParquetTelemetry {
    return Object.freeze({...this.telemetry});
  }

  /** Selectively fetches row groups and columns as ordered Arrow batches with source provenance. */
  async *read(options: ParquetSourceReadOptions = {}): AsyncIterable<ParquetSourceBatch> {
    const readOptions = this.getReadOptions(options);
    if (readOptions.limit === 0) {
      return;
    }
    const readContext = createReadAbortContext(readOptions.signal);
    const inFlightReads = new Set<Promise<SettledParquetRowGroupRead>>();
    let completed = false;
    let readError: unknown;
    this.activeReadControllers.add(readContext.abortController);

    try {
      const initialization = await this.getInitialization(readContext.abortController.signal);
      await this.getCompressionInitialization();
      throwIfAborted(readContext.abortController.signal);

      const physicalPlan = await this.planRowGroups(
        initialization,
        readOptions,
        readContext.abortController.signal
      );
      const {predicate, rowGroupIndices} = physicalPlan;
      this.recordTelemetry(
        'row-group-prune',
        {
          rowGroupsRequested: physicalPlan.requested,
          rowGroupsPruned: physicalPlan.requested - rowGroupIndices.length,
          rowGroupsPrunedByStatistics: physicalPlan.prunedByStatistics,
          rowGroupsPrunedByBloomFilter: physicalPlan.prunedByBloomFilter,
          bloomFiltersRead: physicalPlan.bloomFiltersRead,
          bloomFilterBytesRead: physicalPlan.bloomFilterBytesRead
        },
        {}
      );
      const columns = normalizeColumns(readOptions.columns, initialization.schema);
      const predicateColumns = predicate ? getParquetPredicateColumns(predicate) : [];
      const decodedColumns =
        columns.length === 0 ? [] : [...new Set([...columns, ...predicateColumns])];
      const columnList = decodedColumns.map(column => [column]);
      const batchSize = normalizeBatchSize(readOptions.batchSize);
      const concurrency = normalizeConcurrency(readOptions.concurrency);
      const projectedSchema = projectSchema(initialization.schema, columns);
      const projectedColumnNames = columns.length ? new Set(columns) : undefined;
      const workerOptions = this.getWorkerOptions(concurrency, readContext.abortController.signal);
      const decodeOnWorker = canDecodeParquetSourceOnWorker(workerOptions);
      const scheduledReads = new Map<number, Promise<SettledParquetRowGroupRead>>();
      let nextPositionToSchedule = 0;
      let remainingRows = readOptions.limit ?? Number.POSITIVE_INFINITY;

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
            predicate,
            projectedColumnNames,
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

        const {
          rowGroupIndex,
          columns: materializedColumns,
          rowCount,
          rowIndices,
          workerResult
        } = settledRead.result;
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
            const batch = sliceParquetBatch(
              createParquetBatchFromArrow(
                initialization.metadata,
                projectedSchema,
                rowGroupIndex,
                workerBatch.rowGroupRowOffset,
                arrowTable,
                workerBatch.rowCount,
                workerBatch.rowGroupRowIndices
              ),
              Math.min(workerBatch.rowCount, remainingRows)
            );
            this.recordTelemetry(
              'batch',
              {batchesEmitted: 1, rowsEmitted: batch.length},
              {rowGroupIndex, rowCount: batch.length}
            );
            yield batch;
            remainingRows -= batch.length;
            if (remainingRows === 0) {
              completed = true;
              return;
            }
          }
          continue;
        }

        const outputRowCount = rowCount;
        const outputBatchSize = batchSize || Math.max(outputRowCount, 1);
        for (
          let outputRowOffset = 0;
          outputRowOffset < outputRowCount;
          outputRowOffset += outputBatchSize
        ) {
          throwIfAborted(readContext.abortController.signal);
          const batchRowCount = Math.min(
            outputBatchSize,
            outputRowCount - outputRowOffset,
            remainingRows
          );
          const batchRowIndices = rowIndices
            ? rowIndices!.slice(outputRowOffset, outputRowOffset + batchRowCount)
            : undefined;
          const rowGroupRowOffset = batchRowIndices?.[0] ?? outputRowOffset;
          const batchColumns = sliceColumns(
            materializedColumns!,
            outputRowOffset,
            outputRowOffset + batchRowCount
          );
          const conversionStartTime = getCurrentTime();
          const batch = createParquetBatch(
            initialization.metadata,
            projectedSchema,
            rowGroupIndex,
            rowGroupRowOffset,
            batchColumns,
            batchRowCount,
            batchRowIndices
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
          remainingRows -= batch.length;
          if (remainingRows === 0) {
            completed = true;
            return;
          }
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

  /** Produces the physical row-group plan shared by explain and execution. */
  private async planRowGroups(
    initialization: ParquetSourceInitialization,
    readOptions: ParquetSourceReadOptions,
    signal: AbortSignal
  ): Promise<ParquetPhysicalRowGroupPlan> {
    throwIfAborted(signal);
    const candidateRowGroupIndices = normalizeRowGroupIndices(
      readOptions.rowGroups,
      initialization.fileMetadata.row_groups.length
    );
    const callbackFilteredRowGroupIndices = readOptions.rowGroupFilter
      ? candidateRowGroupIndices.filter(rowGroupIndex =>
          readOptions.rowGroupFilter!(initialization.metadata.rowGroups[rowGroupIndex])
        )
      : candidateRowGroupIndices;
    const spatiallyFilteredRowGroupIndices = readOptions.bbox
      ? callbackFilteredRowGroupIndices.filter(rowGroupIndex =>
          canGeoParquetRowGroupMatch(
            initialization.metadata,
            initialization.metadata.rowGroups[rowGroupIndex],
            readOptions.bbox!,
            readOptions.geometryColumn
          )
        )
      : callbackFilteredRowGroupIndices;
    const spatialPredicate = readOptions.bbox
      ? createGeoParquetBoundingBoxPredicate(
          initialization.metadata,
          readOptions.bbox,
          readOptions.geometryColumn
        )
      : undefined;
    const predicate = combineParquetPredicates(readOptions.predicate, spatialPredicate);
    if (predicate) {
      validateParquetPredicate(
        predicate,
        new Set(initialization.schema.fields.map(field => field.name))
      );
    }
    const statisticsRowGroupIndices = predicate
      ? spatiallyFilteredRowGroupIndices.filter(rowGroupIndex =>
          canParquetRowGroupMatch(predicate, initialization.metadata.rowGroups[rowGroupIndex])
        )
      : spatiallyFilteredRowGroupIndices;
    const bloomFilterResult = predicate
      ? await filterParquetRowGroupsWithBloomFilters(
          initialization,
          statisticsRowGroupIndices,
          predicate,
          signal
        )
      : {rowGroupIndices: statisticsRowGroupIndices, filtersRead: 0, bytesRead: 0};
    return {
      predicate,
      rowGroupIndices: bloomFilterResult.rowGroupIndices,
      requested: candidateRowGroupIndices.length,
      prunedByCallback: candidateRowGroupIndices.length - callbackFilteredRowGroupIndices.length,
      prunedBySpatial:
        callbackFilteredRowGroupIndices.length - spatiallyFilteredRowGroupIndices.length,
      prunedByStatistics:
        spatiallyFilteredRowGroupIndices.length - statisticsRowGroupIndices.length,
      prunedByBloomFilter:
        statisticsRowGroupIndices.length - bloomFilterResult.rowGroupIndices.length,
      bloomFiltersRead: bloomFilterResult.filtersRead,
      bloomFilterBytesRead: bloomFilterResult.bytesRead
    };
  }

  /** Produces explainable page-index and byte-range plans for retained row groups. */
  private async planPages(
    initialization: ParquetSourceInitialization,
    readOptions: ParquetSourceReadOptions,
    rowGroupPlan: ParquetPhysicalRowGroupPlan,
    signal: AbortSignal
  ): Promise<ParquetPageScanPlan[]> {
    if (!rowGroupPlan.predicate) return [];
    const columns = normalizeColumns(readOptions.columns, initialization.schema);
    const predicateColumns = getParquetPredicateColumns(rowGroupPlan.predicate);
    const decodedColumns =
      columns.length === 0 ? [] : [...new Set([...columns, ...predicateColumns])];
    const hasHiddenPredicateColumns =
      columns.length > 0 && predicateColumns.some(column => !columns.includes(column));
    const phases = hasHiddenPredicateColumns
      ? [
          {
            phase: 'predicate' as const,
            columns: predicateColumns.map(column => [column]),
            predicate: rowGroupPlan.predicate
          },
          {
            phase: 'projection' as const,
            columns: columns.map(column => [column]),
            predicate: undefined
          }
        ]
      : [
          {
            phase: 'combined' as const,
            columns: decodedColumns.map(column => [column]),
            predicate: rowGroupPlan.predicate
          }
        ];
    const plans: ParquetPageScanPlan[] = [];
    for (const rowGroupIndex of rowGroupPlan.rowGroupIndices) {
      const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
      let predicateProvedEmpty = false;
      for (const phase of phases) {
        throwIfAborted(signal);
        if (phase.phase === 'projection' && predicateProvedEmpty) {
          continue;
        }
        const pagePlan = phase.predicate
          ? await createParquetPagePruningPlan(
              initialization.file,
              rowGroup,
              initialization.parquetSchema,
              phase.columns,
              phase.predicate,
              signal
            )
          : undefined;
        plans.push(
          pagePlan
            ? Object.freeze({
                rowGroupIndex,
                phase: phase.phase,
                columns: Object.freeze(phase.columns.map(column => Object.freeze([...column]))),
                rowRanges: Object.freeze(
                  pagePlan.rowRanges.map(rowRange => Object.freeze({...rowRange}))
                ),
                indexesRead: pagePlan.indexCount,
                totalPages: pagePlan.totalPageCount,
                selectedPages: pagePlan.selectedPageCount,
                rowsPruned: pagePlan.prunedRowCount,
                ranges: Object.freeze(
                  getParquetPageReadRanges(rowGroup, phase.columns, pagePlan).map(range =>
                    Object.freeze({...range})
                  )
                )
              })
            : createFullColumnScanPlan(rowGroup, rowGroupIndex, phase.phase, phase.columns)
        );
        if (phase.phase === 'predicate' && pagePlan?.rowRanges.length === 0) {
          predicateProvedEmpty = true;
        }
      }
    }
    return plans;
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
    const predicate = options.predicate ?? this.options.parquet?.predicate;
    const bbox = options.bbox ?? this.options.parquet?.bbox;
    const limit = options.limit ?? this.options.parquet?.limit;
    validateTableQueryLimit(limit);
    return {
      rowGroups: rowGroups && [...rowGroups],
      columns: columns && [...columns],
      rowGroupFilter: options.rowGroupFilter ?? this.options.parquet?.rowGroupFilter,
      predicate: predicate ? copyParquetPredicate(predicate) : undefined,
      limit,
      bbox: bbox ? ([...bbox] as ParquetSourceReadOptions['bbox']) : undefined,
      geometryColumn: options.geometryColumn ?? this.options.parquet?.geometryColumn,
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
    predicate: ParquetPredicate | undefined,
    projectedColumnNames: ReadonlySet<string> | undefined,
    workerOptions: ParquetSourceWorkerOptions | undefined,
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    if (
      predicate &&
      projectedColumnNames &&
      getParquetPredicateColumns(predicate).some(column => !projectedColumnNames.has(column))
    ) {
      return await this.readRowGroupWithLateMaterialization(
        initialization,
        rowGroupIndex,
        columnList,
        projectedSchema,
        batchSize,
        predicate,
        projectedColumnNames,
        workerOptions,
        signal
      );
    }
    const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
    const pagePlan = predicate
      ? await createParquetPagePruningPlan(
          initialization.file,
          rowGroup,
          initialization.parquetSchema,
          columnList,
          predicate,
          signal
        )
      : undefined;
    if (pagePlan) {
      this.recordPagePruningTelemetry(rowGroupIndex, pagePlan);
      if (pagePlan.rowRanges.length === 0) {
        return {rowGroupIndex, columns: {}, rowCount: 0, rowIndices: []};
      }
    }

    if (workerOptions) {
      return await this.readRowGroupOnWorker(
        initialization,
        rowGroupIndex,
        columnList,
        projectedSchema,
        batchSize,
        predicate,
        pagePlan,
        workerOptions,
        signal
      );
    }

    const decodeStartTime = getCurrentTime();
    const decodedRowGroups = pagePlan
      ? await Promise.all(
          pagePlan.rowRanges.map(rowRange =>
            initialization.reader.readRowGroupRange(
              initialization.parquetSchema,
              rowGroup,
              columnList,
              rowRange,
              pagePlan.pageLocations,
              signal
            )
          )
        )
      : [
          await initialization.reader.readRowGroup(
            initialization.parquetSchema,
            rowGroup,
            columnList,
            signal
          )
        ];
    throwIfAborted(signal);
    const columns = concatenateMaterializedColumns(
      decodedRowGroups.map(decodedRowGroup =>
        initialization.parquetSchema.materializeColumns(decodedRowGroup)
      )
    );
    const sourceRowIndices = pagePlan
      ? pagePlan.rowRanges.flatMap(rowRange =>
          Array.from({length: rowRange.end - rowRange.start}, (_, index) => rowRange.start + index)
        )
      : undefined;
    const localRowCount = sourceRowIndices?.length ?? Number(rowGroup.num_rows);
    const localRowIndices = predicate
      ? filterParquetRowIndices(predicate, columns, localRowCount)
      : undefined;
    const rowIndices = localRowIndices?.map(rowIndex => sourceRowIndices?.[rowIndex] ?? rowIndex);
    const outputColumns = localRowIndices
      ? gatherParquetColumns(columns, localRowIndices, projectedColumnNames)
      : columns;
    const decodeDurationMs = getCurrentTime() - decodeStartTime;
    this.recordTelemetry(
      'decode',
      {decodeDurationMs, rowGroupsDecoded: 1},
      {rowGroupIndex, durationMs: decodeDurationMs}
    );
    if (predicate) {
      this.recordTelemetry(
        'predicate-filter',
        {
          predicateRowsTested: localRowCount,
          predicateRowsMatched: rowIndices!.length
        },
        {rowGroupIndex, rowCount: rowIndices!.length}
      );
    }
    return {
      rowGroupIndex,
      columns: outputColumns,
      rowCount: rowIndices?.length ?? localRowCount,
      rowIndices
    };
  }

  /** Fetches selected chunks and transfers their decompression and Arrow conversion to a worker. */
  private async readRowGroupOnWorker(
    initialization: ParquetSourceInitialization,
    rowGroupIndex: number,
    columnList: string[][],
    projectedSchema: Schema,
    batchSize: number | undefined,
    predicate: ParquetPredicate | undefined,
    pagePlan: ParquetPagePruningPlan | undefined,
    workerOptions: ParquetSourceWorkerOptions,
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    const rowGroup = initialization.fileMetadata.row_groups[rowGroupIndex];
    const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
      const path = columnChunk.meta_data?.path_in_schema;
      return Boolean(path && (columnList.length === 0 || fieldIndexOf(columnList, path) >= 0));
    });
    const rangeDescriptors = pagePlan
      ? getParquetPageReadRanges(rowGroup, columnList, pagePlan)
      : selectedColumnChunks.map(getColumnChunkRange);
    const ranges = await Promise.all(
      rangeDescriptors.map(async ({offset, length}) => {
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
          predicate: predicate ? copyParquetPredicate(predicate) : undefined,
          pagePlan,
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
    if (predicate) {
      this.recordTelemetry(
        'predicate-filter',
        {
          predicateRowsTested: workerResult.sourceRowCount,
          predicateRowsMatched: workerResult.rowCount
        },
        {rowGroupIndex, rowCount: workerResult.rowCount}
      );
    }
    return {rowGroupIndex, rowCount: workerResult.rowCount, workerResult};
  }

  /** Decodes predicate columns first, avoiding projected-column decoding for empty matches. */
  private async readRowGroupWithLateMaterialization(
    initialization: ParquetSourceInitialization,
    rowGroupIndex: number,
    columnList: string[][],
    projectedSchema: Schema,
    batchSize: number | undefined,
    predicate: ParquetPredicate,
    projectedColumnNames: ReadonlySet<string>,
    workerOptions: ParquetSourceWorkerOptions | undefined,
    signal: AbortSignal
  ): Promise<ParquetRowGroupReadResult> {
    const predicateColumns = getParquetPredicateColumns(predicate);
    const predicateColumnList = predicateColumns.map(column => [column]);
    const filterResult = await this.readRowGroup(
      initialization,
      rowGroupIndex,
      predicateColumnList,
      projectSchema(initialization.schema, predicateColumns),
      batchSize,
      predicate,
      new Set(predicateColumns),
      workerOptions,
      signal
    );
    const rowIndices = filterResult.rowIndices;
    const selectedRowIndices = rowIndices || getWorkerRowIndices(filterResult.workerResult);
    if (!selectedRowIndices || selectedRowIndices.length === 0) {
      return {rowGroupIndex, rowCount: 0, columns: {}, rowIndices: []};
    }
    const projectedColumnList = columnList.filter(columnPath =>
      projectedColumnNames.has(columnPath[0])
    );
    const projectedResult = await this.readRowGroup(
      initialization,
      rowGroupIndex,
      projectedColumnList,
      projectedSchema,
      batchSize,
      undefined,
      projectedColumnNames,
      workerOptions,
      signal
    );
    if (workerOptions && projectedResult.workerResult) {
      return {
        rowGroupIndex,
        rowCount: selectedRowIndices.length,
        rowIndices: selectedRowIndices,
        workerResult: gatherWorkerProjectedRows(
          projectedResult.workerResult,
          selectedRowIndices,
          batchSize
        )
      };
    }
    return {
      rowGroupIndex,
      rowCount: selectedRowIndices.length,
      rowIndices: selectedRowIndices,
      columns: projectedResult.columns
        ? gatherParquetColumns(projectedResult.columns, selectedRowIndices, projectedColumnNames)
        : {}
    };
  }

  /** Records the rows and pages avoided by one conservative page-index plan. */
  private recordPagePruningTelemetry(rowGroupIndex: number, plan: ParquetPagePruningPlan): void {
    this.recordTelemetry(
      'page-index-prune',
      {
        pageIndexesRead: plan.indexCount,
        pagesRead: plan.selectedPageCount,
        pagesPruned: plan.totalPageCount - plan.selectedPageCount,
        rowsPrunedByPageIndex: plan.prunedRowCount,
        rowGroupsPrunedByPageIndex: plan.rowRanges.length === 0 ? 1 : 0,
        rowGroupsPruned: plan.rowRanges.length === 0 ? 1 : 0
      },
      {rowGroupIndex, rowCount: plan.prunedRowCount}
    );
  }

  /** Opens the readable file and decodes its footer and schema once. */
  private async initialize(signal?: AbortSignal): Promise<ParquetSourceInitialization> {
    const file = await this.openFile(signal);
    try {
      const reader = new ParquetReader(file, {
        preserveBinary: this.options.parquet?.preserveBinary,
        verifyPageChecksums: this.options.parquet?.verifyPageChecksums,
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

function getParquetColumnRoles(columnNames: readonly string[]): Record<string, ScanColumnRole> {
  const roles: Record<string, ScanColumnRole> = {};
  for (const columnName of columnNames) {
    const normalizedName = columnName.toLowerCase();
    if (normalizedName === 'geometry' || normalizedName === 'geom' || normalizedName === 'shape') {
      roles[columnName] = 'geometry';
    } else if (
      normalizedName === 'longitude' ||
      normalizedName === 'lon' ||
      normalizedName === 'x'
    ) {
      roles[columnName] = 'longitude';
    } else if (
      normalizedName === 'latitude' ||
      normalizedName === 'lat' ||
      normalizedName === 'y'
    ) {
      roles[columnName] = 'latitude';
    }
  }
  return roles;
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
      columns,
      rowGroup.sorting_columns
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
  const geospatialStatistics = createGeospatialStatistics(columnMetadata.geospatial_statistics);
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
    columnIndexOffset:
      columnChunk.column_index_offset === undefined
        ? undefined
        : Number(columnChunk.column_index_offset),
    columnIndexByteLength: columnChunk.column_index_length,
    offsetIndexOffset:
      columnChunk.offset_index_offset === undefined
        ? undefined
        : Number(columnChunk.offset_index_offset),
    offsetIndexByteLength: columnChunk.offset_index_length,
    bloomFilterOffset:
      columnMetadata.bloom_filter_offset === undefined
        ? undefined
        : Number(columnMetadata.bloom_filter_offset),
    bloomFilterByteLength: columnMetadata.bloom_filter_length,
    statistics,
    geospatialStatistics
  });
}

/** Normalizes native Parquet geospatial statistics from the decoded footer. */
function createGeospatialStatistics(
  statistics: ParquetThriftGeospatialStatistics | undefined
): ParquetGeospatialStatistics | undefined {
  if (!statistics) return undefined;
  const bbox = statistics.bbox
    ? Object.freeze({
        xmin: statistics.bbox.xmin,
        xmax: statistics.bbox.xmax,
        ymin: statistics.bbox.ymin,
        ymax: statistics.bbox.ymax,
        zmin: statistics.bbox.zmin,
        zmax: statistics.bbox.zmax,
        mmin: statistics.bbox.mmin,
        mmax: statistics.bbox.mmax
      })
    : undefined;
  return Object.freeze({
    bbox,
    geometryTypes: statistics.geospatial_types
      ? Object.freeze([...statistics.geospatial_types])
      : undefined
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
      statistics.distinct_count === undefined ? undefined : Number(statistics.distinct_count),
    minIsExact: statistics.is_min_value_exact,
    maxIsExact: statistics.is_max_value_exact
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
    result.distinctCount === undefined &&
    result.minIsExact === undefined &&
    result.maxIsExact === undefined
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
        primitiveValue =
          field.originalType === 'UINT_32' ? readUInt32LE(bytes, 0) : readInt32LE(bytes, 0);
        break;
      case 'INT64':
        primitiveValue =
          field.originalType === 'UINT_64' ? readUInt64LE(bytes, 0) : readInt64LE(bytes, 0);
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
  columns: ParquetColumnChunkMetadata[],
  sortingColumns: RowGroup['sorting_columns']
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
    columns: Object.freeze(columns),
    sortingColumns: Object.freeze(
      (sortingColumns || []).map(
        sortingColumn =>
          ({
            columnIndex: sortingColumn.column_idx,
            descending: sortingColumn.descending,
            nullsFirst: sortingColumn.nulls_first
          }) satisfies ParquetSortingColumn
      )
    )
  });
}

/** Describes a phase that reads complete column chunks because no page index is available. */
function createFullColumnScanPlan(
  rowGroup: RowGroup,
  rowGroupIndex: number,
  phase: ParquetPageScanPlan['phase'],
  columns: readonly string[][]
): ParquetPageScanPlan {
  const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
    const path = columnChunk.meta_data?.path_in_schema;
    return Boolean(
      path && (columns.length === 0 || columns.some(column => pathMatchesSelection(column, path)))
    );
  });
  const rowCount = Number(rowGroup.num_rows);
  return Object.freeze({
    rowGroupIndex,
    phase,
    columns: Object.freeze(columns.map(column => Object.freeze([...column]))),
    rowRanges: Object.freeze([Object.freeze({start: 0, end: rowCount})]),
    indexesRead: 0,
    totalPages: 0,
    selectedPages: 0,
    rowsPruned: 0,
    ranges: Object.freeze(
      selectedColumnChunks.map(columnChunk => Object.freeze(getColumnChunkRange(columnChunk)))
    )
  });
}

/** Returns whether a requested path selects a footer leaf or one of its nested children. */
function pathMatchesSelection(selection: readonly string[], path: readonly string[]): boolean {
  return selection.length <= path.length && selection.every((part, index) => part === path[index]);
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
  rowCount: number,
  rowGroupRowIndices?: readonly number[]
): ParquetBatch {
  const arrowTable = convertTable({shape: 'columnar-table', schema, data: columns}, 'arrow-table');
  return createParquetBatchFromArrow(
    metadata,
    schema,
    rowGroupIndex,
    rowGroupRowOffset,
    arrowTable.data,
    rowCount,
    rowGroupRowIndices
  );
}

/** Wraps a worker-transferred or locally converted Arrow table with source provenance. */
function createParquetBatchFromArrow(
  metadata: ParquetSourceMetadata,
  schema: Schema,
  rowGroupIndex: number,
  rowGroupRowOffset: number,
  data: ArrowTable['data'],
  rowCount: number,
  rowGroupRowIndices?: readonly number[]
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
    rowCount,
    rowGroupRowIndices: rowGroupRowIndices ? Object.freeze([...rowGroupRowIndices]) : undefined,
    rowIndices: rowGroupRowIndices
      ? Object.freeze(rowGroupRowIndices.map(rowIndex => rowGroup.rowOffset + rowIndex))
      : undefined
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

/** Returns a contiguous row slice of every decoded column without constructing row objects. */
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

/** Concatenates materialized page-range fragments without constructing row objects. */
function concatenateMaterializedColumns(
  fragments: readonly Record<string, ArrayType>[]
): Record<string, ArrayType> {
  const columns: Record<string, unknown[]> = {};
  for (const fragment of fragments) {
    for (const [name, values] of Object.entries(fragment)) {
      columns[name] ||= [];
      const destination = columns[name];
      for (let index = 0; index < values.length; index++) {
        destination.push(values[index]);
      }
    }
  }
  return columns as Record<string, ArrayType>;
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
    rowGroupsPrunedByStatistics: 0,
    rowGroupsPrunedByBloomFilter: 0,
    bloomFiltersRead: 0,
    bloomFilterBytesRead: 0,
    rowGroupsPrunedByPageIndex: 0,
    pageIndexesRead: 0,
    pagesRead: 0,
    pagesPruned: 0,
    rowsPrunedByPageIndex: 0,
    rowGroupsDecoded: 0,
    batchesEmitted: 0,
    rowsEmitted: 0,
    predicateRowsTested: 0,
    predicateRowsMatched: 0,
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

type ParquetBloomFilterReadResult = {
  rowGroupIndices: number[];
  filtersRead: number;
  bytesRead: number;
};

/** Reconstructs exact row-group indexes from worker predicate batches. */
function getWorkerRowIndices(workerResult?: ParquetSourceWorkerResult): number[] {
  if (!workerResult) return [];
  return workerResult.batches.flatMap(batch =>
    batch.rowGroupRowIndices
      ? [...batch.rowGroupRowIndices]
      : Array.from({length: batch.rowCount}, (_, index) => batch.rowGroupRowOffset + index)
  );
}

/** Gathers projected worker Arrow batches through the shared indexed Arrow table utility. */
function gatherWorkerProjectedRows(
  workerResult: ParquetSourceWorkerResult,
  rowIndices: readonly number[],
  batchSize: number | undefined
): ParquetSourceWorkerResult {
  const tables = workerResult.batches.map(batch => hydrateArrowTable(batch.arrowTable));
  if (tables.length === 0) {
    return {...workerResult, rowCount: 0, batches: []};
  }
  const table = tables.length === 1 ? tables[0] : tables[0].concat(...tables.slice(1));
  const indexedTable = new IndexedArrowTable(table, rowIndices);
  const outputBatchSize = batchSize || Math.max(rowIndices.length, 1);
  const batches: ParquetSourceWorkerResult['batches'] = [];
  for (let offset = 0; offset < rowIndices.length; offset += outputBatchSize) {
    const end = Math.min(offset + outputBatchSize, rowIndices.length);
    const batchIndexes = rowIndices.slice(offset, end);
    const batchTable = indexedTable.slice(offset, end).materializeArrowTable();
    batches.push({
      rowGroupRowOffset: batchIndexes[0],
      rowCount: batchIndexes.length,
      rowGroupRowIndices: [...batchIndexes],
      arrowTable: dehydrateArrowTable(batchTable)
    });
  }
  return {
    sourceRowCount: workerResult.sourceRowCount,
    rowCount: rowIndices.length,
    batches,
    decodeDurationMs: workerResult.decodeDurationMs,
    arrowConversionDurationMs: workerResult.arrowConversionDurationMs
  };
}

/** Applies only proven-negative Bloom-filter checks to candidate row groups. */
async function filterParquetRowGroupsWithBloomFilters(
  initialization: ParquetSourceInitialization,
  rowGroupIndices: readonly number[],
  predicate: ParquetPredicate,
  signal: AbortSignal
): Promise<ParquetBloomFilterReadResult> {
  const rowGroups: number[] = [];
  let filtersRead = 0;
  let bytesRead = 0;
  for (const rowGroupIndex of rowGroupIndices) {
    const rowGroup = initialization.metadata.rowGroups[rowGroupIndex];
    const probes = getParquetBloomFilterProbes(predicate, rowGroup);
    let keepRowGroup = true;
    for (const probe of probes) {
      if (
        probe.column.bloomFilterOffset === undefined ||
        probe.column.bloomFilterByteLength === undefined
      ) {
        continue;
      }
      let field: ParquetField;
      try {
        field = initialization.parquetSchema.findField([...probe.column.path]);
      } catch {
        throwIfAborted(signal);
        continue;
      }
      if (!field.primitiveType) continue;
      let filter: ReturnType<typeof decodeParquetSplitBlockBloomFilter>;
      try {
        const data = await initialization.file.read(
          probe.column.bloomFilterOffset,
          probe.column.bloomFilterByteLength,
          signal
        );
        filter = decodeParquetSplitBlockBloomFilter(toUint8Array(data));
        filtersRead++;
        bytesRead += data.byteLength;
      } catch {
        throwIfAborted(signal);
        continue;
      }
      if (
        filter.algorithm !== 'BLOCK' ||
        filter.hash !== 'XXHASH' ||
        filter.compression !== 'UNCOMPRESSED'
      ) {
        continue;
      }
      const mayContainValue = probe.values.some(value => {
        try {
          if (value instanceof Date) return true;
          const physicalValue = getParquetBloomFilterPhysicalValue(value, field);
          const encoded = encodeParquetBloomFilterValue(
            physicalValue,
            field.primitiveType as Parameters<typeof encodeParquetBloomFilterValue>[1],
            field.typeLength
          );
          return checkParquetSplitBlockBloomFilter(
            filter.bitset,
            hashParquetBloomFilterValue(encoded)
          );
        } catch {
          throwIfAborted(signal);
          return true;
        }
      });
      if (!mayContainValue) {
        keepRowGroup = false;
        break;
      }
    }
    if (keepRowGroup) rowGroups.push(rowGroupIndex);
  }
  return {rowGroupIndices: rowGroups, filtersRead, bytesRead};
}

/** Converts logical predicate values into the physical values stored in Bloom filters. */
function getParquetBloomFilterPhysicalValue(
  value: unknown,
  field: ParquetField
): boolean | number | bigint | string | Uint8Array {
  if (field.originalType?.startsWith('DECIMAL_')) {
    return toPrimitive(field.originalType as ParquetType, value, field) as
      | number
      | bigint
      | Uint8Array;
  }
  return value as boolean | number | bigint | string | Uint8Array;
}

/** Returns true when at least one HTTP object validator was captured. */
function hasObjectVersion(version?: ParquetObjectVersion): version is ParquetObjectVersion {
  return Boolean(version?.etag || version?.lastModified);
}
