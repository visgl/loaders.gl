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
import {DeltaFormat} from './delta-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Lightweight Delta Lake snapshot source backed by a newline-delimited commit log. */
export class DeltaTableSource
  extends DataSource<string | Blob, DeltaSourceOptions>
  implements
    TableScanSource<ParquetDatasetBatch, ParquetPredicate>,
    ScanFragmentProvider<ParquetPredicate>
{
  private readonly actionsPromises = new Map<string, Promise<readonly DeltaAction[]>>();

  /** Creates a source from a Delta commit JSON URL or Blob. */
  constructor(data: string | Blob, options: DeltaSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers the active Parquet files represented by the commit log. */
  async getScanFragments(options: DeltaScanOptions = {}): Promise<readonly ScanFragment[]> {
    const actions = await this.getActions(options.version, options.signal);
    const activeFiles = selectActiveDeltaFiles(actions);
    return Object.freeze(
      activeFiles.map(file =>
        Object.freeze({
          id: file.path,
          uri: this.resolveDataFile(file.path),
          partitionValues: file.partitionValues,
          byteLength: file.size,
          rowCount: getDeltaRecordCount(file.stats),
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

  private async getActions(
    requestedVersion?: number,
    signal?: AbortSignal
  ): Promise<readonly DeltaAction[]> {
    const version = this.getSnapshotVersion(requestedVersion);
    const cacheKey = version === undefined ? 'single-commit' : String(version);
    let actionsPromise = this.actionsPromises.get(cacheKey);
    if (!actionsPromise) {
      actionsPromise = this.loadActions(version, signal);
      this.actionsPromises.set(cacheKey, actionsPromise);
    }
    return actionsPromise;
  }

  /** Returns the configured or URL-derived snapshot version, when available. */
  private getSnapshotVersion(version?: number): number | undefined {
    const selectedVersion = version ?? this.options.delta?.version;
    if (selectedVersion !== undefined) {
      if (!Number.isSafeInteger(selectedVersion) || selectedVersion < 0) {
        throw new Error('Delta snapshot version must be a non-negative safe integer');
      }
      return selectedVersion;
    }
    if (typeof this.data !== 'string') return undefined;
    const match = /\/_delta_log\/(\d{20})\.json(?:$|[?#])/i.exec(this.data);
    return match ? Number(match[1]) : undefined;
  }

  /** Reads one commit log or replays all commits through the requested version. */
  private async loadActions(
    version: number | undefined,
    signal?: AbortSignal
  ): Promise<readonly DeltaAction[]> {
    if (typeof this.data !== 'string' || version === undefined) {
      const text =
        typeof this.data === 'string'
          ? await this.readResponse(
              await this.fetch(this.url, {
                headers: this.options.delta?.headers,
                signal
              })
            )
          : await this.data.text();
      const actions = parseDeltaActions(text);
      validateDeltaActions(actions);
      return actions;
    }

    const tableRoot = this.data.replace(/\/_delta_log\/[^/?#]+(?:[?#].*)?$/i, '');
    const actions: DeltaAction[] = [];
    for (let currentVersion = 0; currentVersion <= version; currentVersion++) {
      const commitURL = `${tableRoot}/_delta_log/${String(currentVersion).padStart(20, '0')}.json`;
      const text = await this.readResponse(
        await this.fetch(commitURL, {
          headers: this.options.delta?.headers,
          signal
        })
      );
      actions.push(...parseDeltaActions(text));
    }
    const replayedActions = Object.freeze(actions);
    validateDeltaActions(replayedActions);
    return replayedActions;
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
    if (typeof this.data === 'string') {
      const tableRoot = this.data.replace(/\/_delta_log\/[^/]*$/i, '/');
      return new URL(path, tableRoot).toString();
    }
    return path;
  }
}

/** Parser-bearing Delta source loader exposed through the explicit source subpath. */
export const DeltaSourceLoaderWithParser = {
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
  testURL: (url: string): boolean =>
    /\/_delta_log\/(?:\d{20}\.json|_last_checkpoint)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: DeltaSourceOptions = {}): DeltaTableSource =>
    new DeltaTableSource(data, options)
} as const satisfies SourceLoader<DeltaTableSource>;

/** Extracts Delta's optional `numRecords` statistic from an add action. */
function getDeltaRecordCount(
  stats: string | Readonly<Record<string, unknown>> | undefined
): number | undefined {
  const parsed = typeof stats === 'string' ? parseDeltaStats(stats) : stats;
  const value = parsed?.numRecords;
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : undefined;
}

function parseDeltaStats(stats: string): Readonly<Record<string, unknown>> | undefined {
  try {
    const value: unknown = JSON.parse(stats);
    return value && typeof value === 'object'
      ? (value as Readonly<Record<string, unknown>>)
      : undefined;
  } catch {
    return undefined;
  }
}

function selectActiveDeltaFiles(
  actions: readonly DeltaAction[]
): Array<NonNullable<DeltaAction['add']>> {
  const files = new Map<string, NonNullable<DeltaAction['add']>>();
  for (const action of actions) {
    if (action.add) {
      files.set(action.add.path, action.add);
    }
    if (action.remove) files.delete(action.remove.path);
  }
  const activeFiles = [...files.values()];
  const deletionVectorFile = activeFiles.find(file => file.deletionVector !== undefined);
  if (deletionVectorFile) {
    throw new Error(
      `Delta deletion vectors are not supported for active file ${deletionVectorFile.path}`
    );
  }
  return activeFiles;
}

/** Parses a newline-delimited Delta commit into typed actions. */
function parseDeltaActions(text: string): readonly DeltaAction[] {
  return Object.freeze(
    text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line) as DeltaAction)
  );
}

/** Rejects Delta protocol features that this Parquet snapshot adapter cannot interpret safely. */
function validateDeltaActions(actions: readonly DeltaAction[]): void {
  for (const action of actions) {
    const protocol = action.protocol;
    if (protocol) {
      if (
        protocol.minReaderVersion !== undefined &&
        (!Number.isSafeInteger(protocol.minReaderVersion) || protocol.minReaderVersion < 1)
      ) {
        throw new Error('Delta protocol has an invalid minReaderVersion');
      }
      if ((protocol.minReaderVersion ?? 1) > 1) {
        throw new Error(
          `Delta reader protocol ${protocol.minReaderVersion} is not supported by this source`
        );
      }
      if (protocol.readerFeatures?.length) {
        throw new Error(
          `Delta reader features are not supported: ${protocol.readerFeatures.join(', ')}`
        );
      }
    }

    const columnMappingMode = action.metaData?.configuration?.['delta.columnMapping.mode'];
    if (columnMappingMode && columnMappingMode !== 'none') {
      throw new Error(
        `Delta column mapping mode "${columnMappingMode}" is not supported by this source`
      );
    }
  }
}
