// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ResourceManager} from './resource-manager';
import type {
  ResourceManagerOptions,
  ResourceManagerEntryInfo,
  ResourceManagerEntryStatus,
  ResourceManagerAddParameters,
  ResourceManagerGetOrCreateParameters,
  ResourceManagerSubscribeParameters,
  ResourceSubscriber
} from './resource-manager';
import type {DataSource, DataSourceOptions} from './data-source';
import type {ScanQueryMetadata, ScanQueryMetadataProvider} from '../scan-utils/scan-query-metadata';

/** DataSource instances that can be owned by a DataSourceManager. */
export type ManageableDataSource = DataSource<unknown, DataSourceOptions> & {
  /** Releases underlying resources, such as database connections. */
  close?: () => Promise<void> | void;
  /** Releases source-owned caches or child resources. */
  finalize?: () => Promise<void> | void;
  /** Releases source-owned resources. */
  destroy?: () => Promise<void> | void;
};

export type DataSourceManagerEntryInfo = ResourceManagerEntryInfo;
export type DataSourceManagerEntryStatus = ResourceManagerEntryStatus;
export type DataSourceManagerAddParameters<T extends ManageableDataSource = ManageableDataSource> =
  ResourceManagerAddParameters<T>;
export type DataSourceManagerGetOrCreateParameters<
  T extends ManageableDataSource = ManageableDataSource
> = ResourceManagerGetOrCreateParameters<T>;
export type DataSourceManagerSubscribeParameters<
  T extends ManageableDataSource = ManageableDataSource
> = ResourceManagerSubscribeParameters<T>;
export type DataSourceSubscriber<T extends ManageableDataSource = ManageableDataSource> =
  ResourceSubscriber<T>;

/** Filters and cancellation accepted by read-only DataSource discovery. */
export type DataSourceManagerDiscoveryOptions = Readonly<{
  /** Limits compatible results to one common scan family. */
  queryType?: ScanQueryMetadata['queryType'];
  /** Aborts metadata discovery without modifying manager registrations. */
  signal?: AbortSignal;
}>;

/** Picker-ready metadata for one managed registration. */
export type DataSourceManagerDiscoveryInfo = DataSourceManagerEntryInfo &
  Readonly<{
    /** Whether the ready source implements the requested executable scan contract. */
    compatible: boolean;
    /** Common scan metadata returned by a compatible or metadata-only source. */
    queryMetadata?: ScanQueryMetadata;
    /** Metadata discovery failure without changing the registration lifecycle state. */
    discoveryError?: unknown;
  }>;

/** Manages owned DataSource instances and discovers scan capabilities. */
export class DataSourceManager extends ResourceManager<ManageableDataSource> {
  /** Creates a manager that disposes owned DataSource instances. */
  constructor(props: Omit<ResourceManagerOptions<ManageableDataSource>, 'dispose'> = {}) {
    super({...props, dispose: closeDataSource});
  }

  /** Discovers picker-ready scan metadata without exposing or retaining owned source instances. */
  async discoverDataSources(
    options: DataSourceManagerDiscoveryOptions = {}
  ): Promise<readonly DataSourceManagerDiscoveryInfo[]> {
    const discoveries = await Promise.all(
      Object.values(this.dataSources).map(async dataSourceEntry => {
        const info = dataSourceEntry.getInfo();
        if (info.status !== 'ready') {
          return Object.freeze({...info, compatible: false});
        }
        const dataSource = dataSourceEntry.getDataSource() as ManageableDataSource &
          Partial<ScanQueryMetadataProvider> & {read?: unknown};
        if (typeof dataSource.getQueryMetadata !== 'function') {
          return Object.freeze({...info, compatible: false});
        }
        try {
          const queryMetadata = await dataSource.getQueryMetadata({signal: options.signal});
          const executionMethod =
            queryMetadata.execution.status === 'supported'
              ? queryMetadata.execution.method
              : undefined;
          const compatible =
            (!options.queryType || queryMetadata.queryType === options.queryType) &&
            executionMethod !== undefined &&
            typeof (dataSource as unknown as Record<string, unknown>)[executionMethod] ===
              'function';
          return Object.freeze({...info, compatible, queryMetadata});
        } catch (discoveryError) {
          if (options.signal?.aborted) {
            throw options.signal.reason || new DOMException('Aborted', 'AbortError');
          }
          return Object.freeze({...info, compatible: false, discoveryError});
        }
      })
    );
    return Object.freeze(discoveries);
  }
}

/** Releases a DataSource through the lifecycle method it implements. */
async function closeDataSource(dataSource: ManageableDataSource): Promise<void> {
  if (typeof dataSource.close === 'function') {
    await dataSource.close();
  } else if (typeof dataSource.finalize === 'function') {
    await dataSource.finalize();
  } else if (typeof dataSource.destroy === 'function') {
    await dataSource.destroy();
  }
}
