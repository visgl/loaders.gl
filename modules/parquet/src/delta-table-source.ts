// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetDatasetSource} from './parquet-dataset-source';
import type {
  ParquetDatasetBatch,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions
} from './parquet-source-types';

/** Options for the first read-only Delta Lake adapter. */
export type DeltaTableSourceOptions = ParquetDatasetSourceOptions & {
  delta?: {
    /** Explicit table version. Listing object storage is intentionally out of scope. */
    readonly version: number;
    /** Headers sent to Delta log requests. */
    readonly headers?: HeadersInit;
    /** Fetch implementation used for log requests. */
    readonly fetch?: (url: string, options?: RequestInit) => Promise<Response>;
  };
};

/** Read options for a Delta table snapshot. */
export type DeltaTableReadOptions = ParquetDatasetReadOptions;

/** Active Delta add-file descriptor exposed for planning and diagnostics. */
export type DeltaDataFile = {
  readonly path: string;
  readonly size?: number;
  readonly partitionValues?: Readonly<Record<string, string | null>>;
  readonly stats?: unknown;
};

/**
 * Minimal read-only Delta Lake snapshot adapter.
 *
 * It replays commit JSON from version zero through an explicit version and delegates active
 * Parquet files to `ParquetDatasetSource`. Deletion vectors, CDC, writes, and automatic latest
 * version discovery are intentionally left for a later Delta-specific tranche.
 */
export class DeltaTableSource {
  /** Table root URL without a trailing slash. */
  readonly tableUrl: string;
  /** Adapter and Parquet source options. */
  readonly options: DeltaTableSourceOptions;

  private readonly fetchImplementation: (url: string, options?: RequestInit) => Promise<Response>;
  private filesPromise: Promise<readonly DeltaDataFile[]> | null = null;

  constructor(tableUrl: string, options: DeltaTableSourceOptions) {
    if (!options.delta || !Number.isInteger(options.delta.version) || options.delta.version < 0) {
      throw new Error('DeltaTableSource requires a non-negative delta.version');
    }
    this.tableUrl = tableUrl.replace(/\/$/, '');
    this.options = options;
    this.fetchImplementation = options.delta.fetch ?? fetch;
  }

  /** Returns active Parquet files in the requested Delta snapshot. */
  async getParquetFiles(signal?: AbortSignal): Promise<readonly DeltaDataFile[]> {
    if (!this.filesPromise) this.filesPromise = this.loadFiles(signal);
    return this.filesPromise;
  }

  /** Reads the requested Delta snapshot as Arrow batches through the shared Parquet dataset source. */
  async *scan(options: DeltaTableReadOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    const files = await this.getParquetFiles(options.signal);
    const source = new ParquetDatasetSource(
      files.map(file => ({
        data: this.resolveTablePath(file.path),
        id: file.path,
        partitions: file.partitionValues
          ? Object.fromEntries(
              Object.entries(file.partitionValues).map(([key, value]) => [
                key,
                value === null ? null : value
              ])
            )
          : undefined,
        metadata: {delta: {path: file.path, stats: file.stats, size: file.size}}
      })),
      this.getParquetOptions()
    );
    try {
      yield* source.read(options);
    } finally {
      await source.close();
    }
  }

  /** Replays Delta commit actions through the requested snapshot version. */
  private async loadFiles(signal?: AbortSignal): Promise<readonly DeltaDataFile[]> {
    const files = new Map<string, DeltaDataFile>();
    const version = this.options.delta!.version;
    for (let currentVersion = 0; currentVersion <= version; currentVersion++) {
      const response = await this.fetchImplementation(
        `${this.tableUrl}/_delta_log/${String(currentVersion).padStart(20, '0')}.json`,
        {headers: this.options.delta!.headers, signal}
      );
      if (!response.ok) {
        throw new Error(
          `Delta log request failed for version ${currentVersion}: ${response.status}`
        );
      }
      const text = await response.text();
      for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const action = JSON.parse(line) as Record<string, unknown>;
        const add = getDeltaFile(action.add);
        if (add) files.set(add.path, add);
        const remove = action.remove;
        if (
          remove &&
          typeof remove === 'object' &&
          typeof (remove as {path?: unknown}).path === 'string'
        ) {
          files.delete((remove as {path: string}).path);
        }
      }
    }
    return [...files.values()];
  }

  /** Forwards the configured Delta fetch implementation to Parquet range requests. */
  private getParquetOptions(): ParquetDatasetSourceOptions {
    const options: ParquetDatasetSourceOptions = {...this.options};
    if (this.options.delta?.fetch) {
      options.core = {
        ...this.options.core,
        loadOptions: {core: {fetch: this.options.delta.fetch}}
      };
    }
    return options;
  }

  /** Resolves a Delta add-file path relative to the table root. */
  private resolveTablePath(path: string): string {
    if (/^[a-z][a-z\d+.-]*:/i.test(path)) return path;
    return `${this.tableUrl}/${path.replace(/^\//, '')}`;
  }
}

function getDeltaFile(value: unknown): DeltaDataFile | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const add = value as Record<string, unknown>;
  if (typeof add.path !== 'string') return undefined;
  const partitionValues =
    add.partitionValues && typeof add.partitionValues === 'object'
      ? (add.partitionValues as Readonly<Record<string, string | null>>)
      : undefined;
  return {
    path: add.path,
    size: typeof add.size === 'number' ? add.size : undefined,
    partitionValues,
    stats: add.stats
  };
}
