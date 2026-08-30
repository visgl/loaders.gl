// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  ScanFragment,
  ScanFragmentProvider,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import {createScanQueryMetadata, DataSource} from '@loaders.gl/loader-utils';
import {ParquetDatasetSource} from '@loaders.gl/parquet/parquet-dataset-source';
import {PARQUET_TABLE_QUERY_CAPABILITIES} from '@loaders.gl/parquet/parquet-source-capabilities';
import type {
  ParquetDatasetBatch,
  ParquetDatasetExplain,
  ParquetDatasetReadOptions,
  ParquetPredicate,
  ParquetDatasetSourceOptions
} from '@loaders.gl/parquet/parquet-source-types';

/** A physical Parquet base file recorded by a Hudi snapshot descriptor. */
export type HudiBaseFile = Readonly<{
  /** Path or URL of the Parquet base file. */
  path: string;
  /** Compressed file size in bytes, when recorded by the descriptor. */
  size?: number;
  /** Number of records in the base file, when recorded by the descriptor. */
  numRecords?: number;
  /** Partition column values associated with the base file. */
  partitionValues?: Readonly<Record<string, unknown>>;
}>;

/** Minimal, portable descriptor used by the Hudi proof of concept. */
export type HudiSnapshotDescriptor = Readonly<{
  tableType?: 'COPY_ON_WRITE' | 'MERGE_ON_READ';
  basePath?: string;
  completedInstant?: string;
  files: readonly HudiBaseFile[];
}>;

/** Options for reading a Hudi snapshot descriptor and its Parquet base files. */
export type HudiSourceOptions = ParquetDatasetSourceOptions & {
  hudi?: {
    baseUrl?: string;
    headers?: HeadersInit;
  };
};

/** Query options accepted by a Hudi snapshot scan. */
export type HudiScanOptions = ParquetDatasetReadOptions;

/**
 * Minimal read-only Hudi Copy-on-Write source.
 *
 * The POC consumes a small JSON snapshot descriptor containing the selected base files. It does
 * not claim to decode Hudi log files, merge-on-read records, or incremental timeline queries.
 */
export class HudiTableSource
  extends DataSource<string | Blob, HudiSourceOptions>
  implements
    TableScanSource<ParquetDatasetBatch, ParquetPredicate>,
    ScanFragmentProvider<ParquetPredicate>
{
  private descriptorPromise: Promise<HudiSnapshotDescriptor> | null = null;

  /** Creates a source from a Hudi snapshot descriptor URL or Blob. */
  constructor(data: string | Blob, options: HudiSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Loads and validates the POC snapshot descriptor. */
  async getDescriptor(signal?: AbortSignal): Promise<HudiSnapshotDescriptor> {
    if (!this.descriptorPromise) {
      this.descriptorPromise = this.loadDescriptor(signal).catch(error => {
        this.descriptorPromise = null;
        throw error;
      });
    }
    return this.descriptorPromise;
  }

  /** Discovers the Copy-on-Write Parquet base files in the selected snapshot. */
  async getScanFragments(options: HudiScanOptions = {}): Promise<readonly ScanFragment[]> {
    const descriptor = await this.getDescriptor(options.signal);
    if (descriptor.tableType === 'MERGE_ON_READ') {
      throw new Error('Hudi Merge-on-Read snapshots are not supported by this POC');
    }
    return Object.freeze(
      descriptor.files.map(file =>
        Object.freeze({
          id: file.path,
          uri: this.resolveDataFile(file.path, descriptor.basePath),
          partitionValues: file.partitionValues,
          byteLength: file.size,
          rowCount: file.numRecords,
          metadata: {completedInstant: descriptor.completedInstant}
        })
      )
    );
  }

  /** Discovers schema and snapshot statistics without decoding every row. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const fragments = await this.getScanFragments(options);
    if (!fragments.length) throw new Error('Hudi snapshot contains no Parquet base files');
    const dataset = this.createDataset(fragments);
    const schema = await dataset.getSchema({signal: options.signal});
    return createScanQueryMetadata({
      sourceType: 'hudi',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      name: this.data instanceof Blob ? undefined : this.data,
      schema,
      capabilities: {table: PARQUET_TABLE_QUERY_CAPABILITIES},
      statistics: {
        rowCount: fragments.reduce((total, fragment) => total + Number(fragment.rowCount || 0), 0),
        byteLength: fragments.reduce(
          (total, fragment) => total + Number(fragment.byteLength || 0),
          0
        )
      }
    });
  }

  /** Explains the Hudi snapshot and delegated Parquet physical plan. */
  async getScanPlan(options: HudiScanOptions = {}): Promise<ParquetDatasetExplain> {
    return this.createDataset(await this.getScanFragments(options)).getScanPlan(options);
  }

  /** Reads the selected Hudi snapshot through the shared Parquet executor. */
  read(options: HudiScanOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    return this.createDatasetFromOptions(options).read(options);
  }

  /** Alias for `read()` used by scan-aware consumers. */
  scan(options: HudiScanOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    return this.read(options);
  }

  private async loadDescriptor(signal?: AbortSignal): Promise<HudiSnapshotDescriptor> {
    const text =
      typeof this.data === 'string'
        ? await (await this.fetch(this.url, {headers: this.options.hudi?.headers, signal})).text()
        : await this.data.text();
    let descriptor: unknown;
    try {
      descriptor = JSON.parse(text);
    } catch {
      throw new Error('Hudi snapshot descriptor must be valid JSON');
    }
    const files =
      descriptor && typeof descriptor === 'object'
        ? (descriptor as {files?: unknown}).files
        : undefined;
    if (!Array.isArray(files)) {
      throw new Error('Hudi snapshot descriptor must contain a files array');
    }
    files.forEach((file, index) => validateHudiBaseFile(file, index));
    const value = descriptor as HudiSnapshotDescriptor;
    if (
      value.tableType &&
      value.tableType !== 'COPY_ON_WRITE' &&
      value.tableType !== 'MERGE_ON_READ'
    ) {
      throw new Error(`Unsupported Hudi table type: ${String(value.tableType)}`);
    }
    return value;
  }

  private createDataset(fragments: readonly ScanFragment[]): ParquetDatasetSource {
    return new ParquetDatasetSource(
      fragments.map(fragment => ({
        data: fragment.uri!,
        id: fragment.id,
        partitions: fragment.partitionValues as never,
        metadata: fragment.metadata
      })),
      this.options
    );
  }

  private createDatasetFromOptions(options: HudiScanOptions): ParquetDatasetSource {
    return new ParquetDatasetSource(
      () =>
        this.getScanFragments(options).then(fragments =>
          fragments.map(fragment => ({
            data: fragment.uri!,
            id: fragment.id,
            partitions: fragment.partitionValues as never,
            metadata: fragment.metadata
          }))
        ),
      this.options
    );
  }

  private resolveDataFile(path: string, basePath?: string): string {
    const baseUrl = this.options.hudi?.baseUrl || basePath;
    if (baseUrl) return new URL(path, baseUrl).toString();
    return path;
  }
}

/** Validates one externally supplied Hudi base-file descriptor. */
function validateHudiBaseFile(file: unknown, index: number): asserts file is HudiBaseFile {
  if (!file || typeof file !== 'object' || Array.isArray(file)) {
    throw new Error(`Hudi snapshot file at index ${index} must be an object`);
  }
  const value = file as Record<string, unknown>;
  if (typeof value.path !== 'string' || !value.path) {
    throw new Error(`Hudi snapshot file at index ${index} must contain a non-empty string path`);
  }
  if (
    value.size !== undefined &&
    (typeof value.size !== 'number' || !Number.isFinite(value.size))
  ) {
    throw new Error(`Hudi snapshot file at index ${index} size must be a finite number`);
  }
  if (
    value.numRecords !== undefined &&
    (typeof value.numRecords !== 'number' || !Number.isFinite(value.numRecords))
  ) {
    throw new Error(`Hudi snapshot file at index ${index} numRecords must be a finite number`);
  }
  if (
    value.partitionValues !== undefined &&
    (!value.partitionValues ||
      typeof value.partitionValues !== 'object' ||
      Array.isArray(value.partitionValues))
  ) {
    throw new Error(`Hudi snapshot file at index ${index} partitionValues must be an object`);
  }
}
