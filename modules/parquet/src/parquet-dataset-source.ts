// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI} from '@loaders.gl/loader-utils';
import type {Schema} from '@loaders.gl/schema';

import {SingleBatchQueue} from './lib/sources/single-batch-queue';
import {ParquetSource} from './parquet-source-loader';
import type {
  ParquetDatasetBatch,
  ParquetDatasetBatchProvenance,
  ParquetDatasetBoundingBox,
  ParquetDatasetFile,
  ParquetDatasetFileCollection,
  ParquetDatasetFileQuery,
  ParquetDatasetFiles,
  ParquetDatasetPartitionValue,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions,
  ParquetDatasetTelemetry,
  ParquetSourceBatch,
  ParquetTelemetry
} from './parquet-source-types';

export type {
  ParquetDatasetBatch,
  ParquetDatasetBatchProvenance,
  ParquetDatasetBoundingBox,
  ParquetDatasetFile,
  ParquetDatasetFileCollection,
  ParquetDatasetFileProvider,
  ParquetDatasetFileQuery,
  ParquetDatasetFiles,
  ParquetDatasetPartitionValue,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions,
  ParquetDatasetTelemetry
} from './parquet-source-types';

const DEFAULT_FILE_CONCURRENCY = 4;

type IndexedParquetDatasetFile = {
  /** Descriptor returned by the provider. */
  file: ParquetDatasetFile;
  /** Position in provider output before local pruning. */
  index: number;
};

type ScheduledFileRead = {
  /** Bounded batch queue for this file. */
  queue: SingleBatchQueue<ParquetDatasetBatch>;
  /** File task used for deterministic cleanup. */
  task: Promise<void>;
};

/**
 * Multi-file Parquet source that composes catalog discovery with selective `ParquetSource` reads.
 *
 * The source accepts static descriptors or a lazy provider, allowing STAC and other catalogs to be
 * injected without coupling `@loaders.gl/parquet` to a catalog protocol.
 */
export class ParquetDatasetSource {
  /** Static descriptors or lazy catalog-backed file provider. */
  readonly files: ParquetDatasetFiles;
  /** Child-source and dataset orchestration options. */
  readonly options: ParquetDatasetSourceOptions;
  /** Runtime hooks forwarded to child Parquet sources. */
  readonly coreApi?: CoreAPI;

  /** Abort controllers for active dataset reads. */
  private readonly activeReadControllers = new Set<AbortController>();
  /** Whether the dataset source has been permanently closed. */
  private closed = false;
  /** Cumulative dataset and child-source telemetry. */
  private readonly telemetry = createParquetDatasetTelemetry();

  /** Creates a logical dataset over static or lazily discovered Parquet files. */
  constructor(
    files: ParquetDatasetFiles,
    options: ParquetDatasetSourceOptions = {},
    coreApi?: CoreAPI
  ) {
    if (!Array.isArray(files) && typeof files !== 'function') {
      throw new Error(
        'ParquetDatasetSource files must be a reusable descriptor array or a provider function'
      );
    }
    this.files = files;
    this.options = options;
    this.coreApi = coreApi;
  }

  /** Returns the schema of the first selected file, closing its temporary child source afterward. */
  async getSchema(query: ParquetDatasetFileQuery = {}): Promise<Schema> {
    this.assertOpen();
    const iterator = this.getSelectedFiles(query)[Symbol.asyncIterator]();
    try {
      const first = await iterator.next();
      if (first.done) {
        throw new Error('ParquetDatasetSource query selected no files');
      }
      const source = this.createSource(first.value.file);
      this.telemetry.filesOpened++;
      try {
        return await source.getSchema({signal: query.signal});
      } finally {
        await source.close();
        this.addParquetTelemetry(source.getTelemetry());
      }
    } finally {
      await iterator.return?.();
    }
  }

  /** Returns an immutable snapshot of cumulative dataset and child-source telemetry. */
  getTelemetry(): ParquetDatasetTelemetry {
    return Object.freeze({
      ...this.telemetry,
      parquet: Object.freeze({...this.telemetry.parquet})
    });
  }

  /**
   * Reads selected files as deterministic, file-ordered Arrow batches.
   *
   * Files are decoded concurrently. Each later file is limited to one buffered batch until all
   * earlier files have been yielded, bounding memory while retaining stable provider order.
   */
  async *read(options: ParquetDatasetReadOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    this.assertOpen();
    const readContext = createDatasetAbortContext(options.signal);
    this.activeReadControllers.add(readContext.abortController);
    const selectedFiles = this.getSelectedFiles({
      ...options,
      signal: readContext.abortController.signal
    });
    const iterator = selectedFiles[Symbol.asyncIterator]();
    const scheduledReads = new Map<number, ScheduledFileRead>();
    let nextSchedulePosition = 0;
    let nextYieldPosition = 0;
    let providerComplete = false;
    let discoveryError: unknown;
    const fileConcurrency = normalizeFileConcurrency(
      options.fileConcurrency ?? this.options.parquetDataset?.fileConcurrency
    );

    const scheduleNext = async (): Promise<void> => {
      if (providerComplete) {
        return;
      }
      const next = await iterator.next();
      if (next.done) {
        providerComplete = true;
        return;
      }
      const position = nextSchedulePosition++;
      const queue = new SingleBatchQueue<ParquetDatasetBatch>();
      const task = this.readFile(next.value, options, queue, readContext.abortController.signal);
      scheduledReads.set(position, {queue, task});
    };

    const fillAvailableSlots = async (): Promise<void> => {
      try {
        while (scheduledReads.size < fileConcurrency && !providerComplete) {
          await scheduleNext();
        }
      } catch (error) {
        discoveryError = error;
        providerComplete = true;
      }
    };

    try {
      await scheduleNext();
      let discoveryPromise = fillAvailableSlots();

      while (scheduledReads.size > 0) {
        const scheduledRead = scheduledReads.get(nextYieldPosition);
        if (!scheduledRead) {
          throw new Error('ParquetDatasetSource internal file ordering error');
        }
        for await (const batch of scheduledRead.queue) {
          throwIfAborted(readContext.abortController.signal);
          this.telemetry.batchesEmitted++;
          this.telemetry.rowsEmitted += batch.length;
          yield batch;
        }
        await scheduledRead.task;
        scheduledReads.delete(nextYieldPosition++);
        await discoveryPromise;
        if (discoveryError !== undefined) {
          throw discoveryError;
        }
        discoveryPromise = fillAvailableSlots();
      }
      await discoveryPromise;
      if (discoveryError !== undefined) {
        throw discoveryError;
      }
    } finally {
      readContext.abortController.abort();
      readContext.removeSignalListener();
      this.activeReadControllers.delete(readContext.abortController);
      await iterator.return?.();
      await Promise.allSettled([...scheduledReads.values()].map(read => read.task));
    }
  }

  /** Permanently closes this dataset source and aborts every active read. */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (const abortController of this.activeReadControllers) {
      abortController.abort();
    }
  }

  /** Reads one child source into its bounded file-order queue. */
  private async readFile(
    indexedFile: IndexedParquetDatasetFile,
    options: ParquetDatasetReadOptions,
    queue: SingleBatchQueue<ParquetDatasetBatch>,
    signal: AbortSignal
  ): Promise<void> {
    const source = this.createSource(indexedFile.file);
    this.telemetry.filesOpened++;
    try {
      if (this.options.parquetDataset?.validateSchema !== false) {
        await this.validateFileSchema(source, indexedFile, signal);
      }
      for await (const batch of source.read({
        columns: options.columns,
        batchSize: options.batchSize,
        concurrency: options.concurrency,
        rowGroupFilter: options.rowGroupFilter,
        predicate: options.predicate,
        signal
      })) {
        await queue.push(createDatasetBatch(batch, indexedFile), signal);
      }
      queue.finish();
    } catch (error) {
      queue.fail(error);
    } finally {
      await source.close();
      this.addParquetTelemetry(source.getTelemetry());
    }
  }

  /** Establishes and validates a stable field schema for concurrently opened files. */
  private schemaFingerprintPromise: Promise<string> | null = null;

  /** Validates one child schema against the first file schema observed by this source. */
  private async validateFileSchema(
    source: ParquetSource,
    indexedFile: IndexedParquetDatasetFile,
    signal: AbortSignal
  ): Promise<void> {
    const schema = await source.getSchema({signal});
    const fingerprint = getSchemaFingerprint(schema);
    if (!this.schemaFingerprintPromise) {
      this.schemaFingerprintPromise = Promise.resolve(fingerprint);
      return;
    }
    const expectedFingerprint = await this.schemaFingerprintPromise;
    if (fingerprint !== expectedFingerprint) {
      throw new Error(
        `Parquet dataset file ${getDatasetFileId(indexedFile.file, indexedFile.index)} has an incompatible schema`
      );
    }
  }

  /** Creates a child source while preserving caller fetch, worker, range, and decode options. */
  private createSource(file: ParquetDatasetFile): ParquetSource {
    return new ParquetSource(file.data, this.options, this.coreApi);
  }

  /** Lazily discovers descriptors and applies conservative local pruning. */
  private async *getSelectedFiles(
    query: ParquetDatasetFileQuery
  ): AsyncIterable<IndexedParquetDatasetFile> {
    throwIfAborted(query.signal);
    const collection = await getFileCollection(this.files, query);
    let index = 0;
    for await (const file of collection) {
      throwIfAborted(query.signal);
      validateDatasetFile(file, index);
      this.telemetry.filesDiscovered++;
      if (query.bbox && file.bbox && !doBoundingBoxesIntersect(query.bbox, file.bbox)) {
        this.telemetry.filesPrunedByBoundingBox++;
        index++;
        continue;
      }
      if (query.partitions && !matchesPartitions(file.partitions, query.partitions)) {
        this.telemetry.filesPrunedByPartitions++;
        index++;
        continue;
      }
      this.telemetry.filesSelected++;
      yield {file, index: index++};
    }
  }

  /** Adds a final child-source telemetry snapshot exactly once. */
  private addParquetTelemetry(telemetry: ParquetTelemetry): void {
    for (const key of Object.keys(telemetry) as Array<keyof ParquetTelemetry>) {
      this.telemetry.parquet[key] += telemetry[key];
    }
  }

  /** Throws when an operation is attempted after `close()`. */
  private assertOpen(): void {
    if (this.closed) {
      throw new Error('ParquetDatasetSource is closed');
    }
  }
}

/** Normalizes static descriptors and lazy providers into one file collection. */
async function getFileCollection(
  files: ParquetDatasetFiles,
  query: ParquetDatasetFileQuery
): Promise<ParquetDatasetFileCollection> {
  return typeof files === 'function' ? await files(query) : files;
}

/** Attaches dataset-level descriptor provenance without copying Arrow buffers. */
function createDatasetBatch(
  batch: ParquetSourceBatch,
  indexedFile: IndexedParquetDatasetFile
): ParquetDatasetBatch {
  const datasetProvenance = {
    datasetFileIndex: indexedFile.index,
    datasetFileId: getDatasetFileId(indexedFile.file, indexedFile.index),
    datasetPartitions: indexedFile.file.partitions,
    datasetFileMetadata: indexedFile.file.metadata
  };
  const provenance: ParquetDatasetBatchProvenance = Object.freeze({
    sourceId: batch.sourceId,
    sourceUrl: batch.sourceUrl,
    source: batch.source,
    rowGroupIndex: batch.rowGroupIndex,
    rowOffset: batch.rowOffset,
    rowGroupRowOffset: batch.rowGroupRowOffset,
    rowCount: batch.rowCount,
    rowGroupRowIndices: batch.rowGroupRowIndices,
    rowIndices: batch.rowIndices,
    ...datasetProvenance
  });
  return {...batch, metadata: provenance, ...datasetProvenance};
}

/** Returns a stable descriptor identity for batch provenance and diagnostics. */
function getDatasetFileId(file: ParquetDatasetFile, index: number): string {
  if (file.id) {
    return file.id;
  }
  if (typeof file.data === 'string') {
    return file.data;
  }
  return typeof File !== 'undefined' && file.data instanceof File && file.data.name
    ? file.data.name
    : `blob-${index}`;
}

/** Validates a provider descriptor before opening a child source. */
function validateDatasetFile(file: ParquetDatasetFile, index: number): void {
  if (!file || (typeof file.data !== 'string' && !(file.data instanceof Blob))) {
    throw new Error(`Invalid Parquet dataset file descriptor at index ${index}`);
  }
}

/** Tests 2D intersection while conservatively accepting additional dimensions. */
function doBoundingBoxesIntersect(
  left: ParquetDatasetBoundingBox,
  right: ParquetDatasetBoundingBox
): boolean {
  const leftMaximumX = left.length === 6 ? left[3] : left[2];
  const leftMaximumY = left.length === 6 ? left[4] : left[3];
  const rightMaximumX = right.length === 6 ? right[3] : right[2];
  const rightMaximumY = right.length === 6 ? right[4] : right[3];
  return (
    left[0] <= rightMaximumX &&
    leftMaximumX >= right[0] &&
    left[1] <= rightMaximumY &&
    leftMaximumY >= right[1]
  );
}

/** Tests exact partition constraints without rejecting files that omit a requested key. */
function matchesPartitions(
  partitions: Readonly<Record<string, ParquetDatasetPartitionValue>> | undefined,
  query: NonNullable<ParquetDatasetFileQuery['partitions']>
): boolean {
  for (const [key, requested] of Object.entries(query)) {
    const actual = partitions?.[key];
    if (actual === undefined) {
      continue;
    }
    const accepted = Array.isArray(requested) ? requested : [requested];
    if (!accepted.includes(actual)) {
      return false;
    }
  }
  return true;
}

/** Creates a deterministic field-only schema fingerprint for cross-file validation. */
function getSchemaFingerprint(schema: Schema): string {
  return JSON.stringify(schema.fields);
}

/** Validates and normalizes dataset-level file concurrency. */
function normalizeFileConcurrency(value: number | undefined): number {
  const concurrency = value ?? DEFAULT_FILE_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`parquetDataset.fileConcurrency must be a positive integer, received ${value}`);
  }
  return concurrency;
}

/** Creates linked cancellation for one dataset read. */
function createDatasetAbortContext(signal?: AbortSignal): {
  abortController: AbortController;
  removeSignalListener: () => void;
} {
  const abortController = new AbortController();
  const abort = (): void => abortController.abort(signal?.reason);
  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener('abort', abort, {once: true});
  }
  return {
    abortController,
    removeSignalListener: () => signal?.removeEventListener('abort', abort)
  };
}

/** Throws a standard abort failure when a dataset read has been cancelled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason || new DOMException('Aborted', 'AbortError');
  }
}

/** Creates zeroed cumulative dataset and child-source telemetry. */
function createParquetDatasetTelemetry(): ParquetDatasetTelemetry {
  return {
    filesDiscovered: 0,
    filesSelected: 0,
    filesPrunedByBoundingBox: 0,
    filesPrunedByPartitions: 0,
    filesOpened: 0,
    batchesEmitted: 0,
    rowsEmitted: 0,
    parquet: {
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
    }
  };
}
