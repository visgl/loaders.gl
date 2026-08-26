// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ScanFragment,
  ScanFragmentProvider,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  TableScanSource,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {createScanQueryMetadata, DataSource} from '@loaders.gl/loader-utils';
import {ParquetDatasetSource} from './parquet-dataset-source';
import {PARQUET_TABLE_QUERY_CAPABILITIES} from './parquet-source-capabilities';
import type {DeltaAction, DeltaScanOptions, DeltaSourceOptions} from './delta-types';
import type {
  ParquetDatasetBatch,
  ParquetDatasetExplain,
  ParquetPredicate
} from './parquet-source-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const DeltaFormat = {
  name: 'Delta Lake',
  id: 'delta',
  module: 'parquet',
  version: VERSION,
  extensions: ['json', 'checkpoint.parquet'],
  mimeTypes: ['application/json']
};

/** Lightweight Delta Lake snapshot source backed by a newline-delimited commit log. */
export class DeltaTableSource
  extends DataSource<string | Blob, DeltaSourceOptions>
  implements
    TableScanSource<ParquetDatasetBatch, ParquetPredicate>,
    ScanFragmentProvider<ParquetPredicate>
{
  private actionsPromise: Promise<readonly DeltaAction[]> | null = null;

  /** Creates a source from a Delta commit JSON URL or Blob. */
  constructor(data: string | Blob, options: DeltaSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers the active Parquet files represented by the commit log. */
  async getScanFragments(options: DeltaScanOptions = {}): Promise<readonly ScanFragment[]> {
    const actions = await this.getActions(options.signal);
    const activeFiles = selectActiveDeltaFiles(actions);
    return Object.freeze(
      activeFiles.map(file =>
        Object.freeze({
          id: file.path,
          uri: this.resolveDataFile(file.path),
          partitionValues: file.partitionValues,
          byteLength: file.size,
          metadata: {stats: file.stats}
        })
      )
    );
  }

  /** Discovers schema and snapshot statistics without decoding all rows. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const fragments = await this.getScanFragments(options);
    if (!fragments.length) {
      throw new Error('Delta snapshot contains no active Parquet files');
    }
    const dataset = this.createDataset(fragments);
    const schema = await dataset.getSchema({signal: options.signal});
    return createScanQueryMetadata({
      sourceType: 'delta',
      queryType: 'table',
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

  /** Explains the Delta snapshot and delegated Parquet physical plans. */
  async getScanPlan(options: DeltaScanOptions = {}): Promise<ParquetDatasetExplain> {
    return this.createDataset(await this.getScanFragments(options)).getScanPlan(options);
  }

  /** Reads the active snapshot through the shared Parquet dataset executor. */
  read(options: DeltaScanOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    return this.createDatasetFromOptions(options).read(options);
  }

  /** Alias for `read()` used by scan-aware consumers. */
  scan(options: DeltaScanOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    return this.read(options);
  }

  private async getActions(signal?: AbortSignal): Promise<readonly DeltaAction[]> {
    if (!this.actionsPromise) {
      this.actionsPromise = (async () => {
        const text =
          typeof this.data === 'string'
            ? await this.readResponse(await this.fetch(this.url, {signal}))
            : await this.data.text();
        return Object.freeze(
          text
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => JSON.parse(line) as DeltaAction)
        );
      })();
    }
    return this.actionsPromise;
  }

  private async readResponse(response: Response): Promise<string> {
    if (!response.ok)
      throw new Error(`Delta commit log request failed with status ${response.status}`);
    return response.text();
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

  private createDatasetFromOptions(options: DeltaScanOptions): ParquetDatasetSource {
    return new ParquetDatasetSource(
      () =>
        this.getScanFragments(options).then(fragments =>
          fragments.map(fragment => ({
            data: fragment.uri!,
            id: fragment.id,
            partitions: fragment.partitionValues as never
          }))
        ),
      this.options
    );
  }

  private resolveDataFile(path: string): string {
    if (this.options.delta?.baseUrl) return new URL(path, this.options.delta.baseUrl).toString();
    if (typeof this.data === 'string') return new URL(path, this.data).toString();
    return path;
  }
}

/** Metadata loader for a Delta commit-log-backed table source. */
export const DeltaSourceLoader = {
  ...DeltaFormat,
  dataType: null as unknown as DeltaTableSource,
  batchType: null as never,
  name: 'DeltaSourceLoader',
  version: VERSION,
  type: 'delta',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /(?:_delta_log|\.jsonl?)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: DeltaSourceOptions = {}): DeltaTableSource =>
    new DeltaTableSource(data, options)
} as const satisfies SourceLoader<DeltaTableSource>;

function selectActiveDeltaFiles(
  actions: readonly DeltaAction[]
): Array<NonNullable<DeltaAction['add']>> {
  const files = new Map<string, NonNullable<DeltaAction['add']>>();
  for (const action of actions) {
    if (action.add) files.set(action.add.path, action.add);
    if (action.remove) files.delete(action.remove.path);
  }
  return [...files.values()];
}
