// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSource, DataSourceOptions} from './data-source';

/** DataSource instances that can be owned by a DataSourceManager. */
export type ManageableDataSource = DataSource<unknown, DataSourceOptions> & {
  /** Releases underlying resources, such as database connections. */
  close?: () => Promise<void> | void;
  /** Releases source-owned caches or child resources. */
  finalize?: () => Promise<void> | void;
  /** Releases source-owned resources. */
  destroy?: () => Promise<void> | void;
};

/** Callback notified whenever a managed DataSource is replaced or resolves. */
export type DataSourceSubscriber<DataSourceT extends ManageableDataSource = ManageableDataSource> =
  {
    /** Receives the current DataSource, a pending DataSource promise, or null for placeholders. */
    onChange: (dataSource: DataSourceT | Promise<DataSourceT> | null) => void;
  };

/** Parameters for adding or updating a managed DataSource. */
export type DataSourceManagerAddParameters<
  DataSourceT extends ManageableDataSource = ManageableDataSource
> = {
  /** Stable id used to register and retrieve the DataSource. */
  dataSourceId: string;
  /** DataSource instance, placeholder, or promise resolving to a DataSource. */
  dataSource: DataSourceT | Promise<DataSourceT> | null;
  /** Notify subscribers even if the DataSource object is unchanged. */
  forceUpdate?: boolean;
  /** If false, the DataSource may be pruned once it has no subscribers. */
  persistent?: boolean;
};

/** Parameters for subscribing a consumer to a managed DataSource. */
export type DataSourceManagerSubscribeParameters<
  DataSourceT extends ManageableDataSource = ManageableDataSource
> = {
  /** DataSource id, optionally prefixed with the manager protocol for deferred lookup. */
  dataSourceId: string;
  /** Callback invoked when the DataSource changes. */
  onChange: (dataSource: DataSourceT | Promise<DataSourceT> | null) => void;
  /** Stable consumer id used to replace or remove all requests by a consumer. */
  consumerId: string;
  /** Stable request id scoped to the consumer id. */
  requestId?: string;
};

/** Parameters for deduplicated DataSource creation. */
export type DataSourceManagerGetOrCreateParameters<
  DataSourceT extends ManageableDataSource = ManageableDataSource
> = {
  /** Stable id used to deduplicate and later release the DataSource. */
  dataSourceId?: string;
  /** Input data used to derive a dedupe id when dataSourceId is not provided. */
  data?: string | Blob | object;
  /** Factory called only when the manager does not already have a matching DataSource. */
  createDataSource: (data?: string | Blob | object) => DataSourceT | Promise<DataSourceT>;
  /** If false, the DataSource may be pruned once it has no subscribers or retains. */
  persistent?: boolean;
};

/** Subscription state for one consumer, keyed by request id. */
type Consumer = Record<string, DataSourceSubscriber & {dataSourceId: string}>;

/**
 * Manages shared DataSource instances and notifies consumers when they become available or change.
 */
export class DataSourceManager {
  /** Protocol used to refer to deferred DataSource ids. */
  readonly protocol: string;

  /** Managed DataSource entries keyed by normalized DataSource id. */
  private dataSources: Record<string, ManagedDataSourceEntry> = {};
  /** Consumer subscriptions keyed by consumer id. */
  private consumers: Record<string, Consumer> = {};
  /** Generated DataSource ids keyed by object identity for non-string inputs. */
  private dataSourceIds = new WeakMap<object, string>();
  /** Monotonic counter used to create stable object-identity DataSource ids. */
  private nextDataSourceId: number = 0;
  /** Pending prune timer used to batch unsubscribe cleanup. */
  private pruneRequest: ReturnType<typeof setTimeout> | null = null;

  /** Creates a DataSourceManager with an optional deferred DataSource URL protocol. */
  constructor(props: {protocol?: string} = {}) {
    this.protocol = props.protocol || 'datasource://';
  }

  /** Returns true if the id is registered or uses the deferred DataSource protocol. */
  contains(dataSourceId: string): boolean {
    if (dataSourceId.startsWith(this.protocol)) {
      return true;
    }
    return dataSourceId in this.dataSources;
  }

  /** Adds or replaces a managed DataSource. */
  add<DataSourceT extends ManageableDataSource = ManageableDataSource>({
    dataSourceId,
    dataSource,
    forceUpdate = false,
    persistent = true
  }: DataSourceManagerAddParameters<DataSourceT>): void {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);
    let dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (dataSourceEntry) {
      dataSourceEntry.setDataSource(dataSource, forceUpdate);
    } else {
      dataSourceEntry = new ManagedDataSourceEntry(normalizedDataSourceId, dataSource);
      this.dataSources[normalizedDataSourceId] = dataSourceEntry;
    }

    dataSourceEntry.persistent = persistent;
  }

  /** Returns an existing DataSource for the same key, or creates and retains a new one. */
  getOrCreate<DataSourceT extends ManageableDataSource = ManageableDataSource>({
    dataSourceId,
    data,
    createDataSource,
    persistent = true
  }: DataSourceManagerGetOrCreateParameters<DataSourceT>): DataSourceT | Promise<DataSourceT> {
    const normalizedDataSourceId = this.resolveDataSourceId(dataSourceId, data);
    let dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (!dataSourceEntry) {
      dataSourceEntry = new ManagedDataSourceEntry(normalizedDataSourceId, createDataSource(data));
      dataSourceEntry.persistent = persistent;
      this.dataSources[normalizedDataSourceId] = dataSourceEntry;
    } else if (dataSourceEntry.isPlaceholder()) {
      dataSourceEntry.setDataSource(createDataSource(data));
      dataSourceEntry.persistent = persistent;
    }

    dataSourceEntry.retain();
    return dataSourceEntry.getDataSource() as DataSourceT | Promise<DataSourceT>;
  }

  /** Removes a managed DataSource and releases its lifecycle resources. */
  async remove(dataSourceId: string): Promise<void> {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);
    const dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (dataSourceEntry) {
      delete this.dataSources[normalizedDataSourceId];
      await dataSourceEntry.delete();
    }
  }

  /** Releases one retained DataSource reference created by getOrCreate(). */
  async release(dataSourceId: string): Promise<void> {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);
    const dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (dataSourceEntry) {
      dataSourceEntry.release();
      if (!dataSourceEntry.isRetained() && !dataSourceEntry.inUse()) {
        delete this.dataSources[normalizedDataSourceId];
        await dataSourceEntry.delete();
      }
    }
  }

  /** Unsubscribes all requests made by one consumer. */
  unsubscribe({consumerId}: {consumerId: string}): void {
    const consumer = this.consumers[consumerId];
    if (consumer) {
      for (const requestId in consumer) {
        const request = consumer[requestId];
        const dataSourceEntry = this.dataSources[request.dataSourceId];
        dataSourceEntry?.unsubscribe(request);
      }
      delete this.consumers[consumerId];
      this.prune();
    }
  }

  /** Subscribes a consumer to a managed DataSource. */
  subscribe<DataSourceT extends ManageableDataSource = ManageableDataSource>({
    dataSourceId,
    onChange,
    consumerId,
    requestId = 'default'
  }: DataSourceManagerSubscribeParameters<DataSourceT>):
    | DataSourceT
    | Promise<DataSourceT>
    | null
    | undefined {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);

    if (dataSourceId.startsWith(this.protocol) && !this.dataSources[normalizedDataSourceId]) {
      this.add({dataSourceId: normalizedDataSourceId, dataSource: null, persistent: false});
    }

    const dataSourceEntry = this.dataSources[normalizedDataSourceId];
    this.track(
      consumerId,
      requestId,
      dataSourceEntry,
      onChange as DataSourceSubscriber<ManageableDataSource>['onChange']
    );

    return dataSourceEntry?.getDataSource() as
      | DataSourceT
      | Promise<DataSourceT>
      | null
      | undefined;
  }

  /** Schedules pruning of unused non-persistent DataSources. */
  prune(): void {
    if (!this.pruneRequest) {
      this.pruneRequest = setTimeout(() => void this.pruneNow(), 0);
    }
  }

  /** Releases all managed DataSources and clears all subscriptions. */
  async finalize(): Promise<void> {
    if (this.pruneRequest) {
      clearTimeout(this.pruneRequest);
      this.pruneRequest = null;
    }

    const dataSources = this.dataSources;
    this.dataSources = {};
    this.consumers = {};
    await Promise.all(Object.values(dataSources).map(dataSourceEntry => dataSourceEntry.delete()));
  }

  /** Removes the deferred DataSource protocol prefix from a DataSource id. */
  private normalizeDataSourceId(dataSourceId: string): string {
    return dataSourceId.startsWith(this.protocol)
      ? dataSourceId.slice(this.protocol.length)
      : dataSourceId;
  }

  /** Resolves an explicit or data-derived DataSource id for deduplicated creation. */
  private resolveDataSourceId(dataSourceId?: string, data?: string | Blob | object): string {
    if (dataSourceId) {
      return this.normalizeDataSourceId(dataSourceId);
    }
    if (typeof data === 'string') {
      return this.normalizeDataSourceId(data);
    }
    if (data && typeof data === 'object') {
      let objectDataSourceId = this.dataSourceIds.get(data);
      if (!objectDataSourceId) {
        objectDataSourceId = `object:${this.nextDataSourceId++}`;
        this.dataSourceIds.set(data, objectDataSourceId);
      }
      return objectDataSourceId;
    }
    throw new Error('DataSourceManager.getOrCreate requires dataSourceId or data.');
  }

  /** Tracks one consumer request against one managed DataSource entry. */
  private track(
    consumerId: string,
    requestId: string,
    dataSourceEntry: ManagedDataSourceEntry | undefined,
    onChange: DataSourceSubscriber['onChange']
  ): void {
    this.consumers[consumerId] = this.consumers[consumerId] || {};
    const consumer = this.consumers[consumerId];
    let request = consumer[requestId];
    const oldDataSourceEntry = request?.dataSourceId && this.dataSources[request.dataSourceId];

    if (oldDataSourceEntry) {
      oldDataSourceEntry.unsubscribe(request);
      this.prune();
    }

    if (dataSourceEntry) {
      if (request) {
        request.onChange = onChange;
        request.dataSourceId = dataSourceEntry.id;
      } else {
        request = {onChange, dataSourceId: dataSourceEntry.id};
      }
      consumer[requestId] = request;
      dataSourceEntry.subscribe(request);
    }
  }

  /** Prunes unused non-persistent DataSources immediately. */
  private async pruneNow(): Promise<void> {
    this.pruneRequest = null;

    const deletedDataSources: Promise<void>[] = [];
    for (const dataSourceId of Object.keys(this.dataSources)) {
      const dataSourceEntry = this.dataSources[dataSourceId];
      if (
        !dataSourceEntry.persistent &&
        !dataSourceEntry.inUse() &&
        !dataSourceEntry.isRetained()
      ) {
        delete this.dataSources[dataSourceId];
        deletedDataSources.push(dataSourceEntry.delete());
      }
    }

    await Promise.all(deletedDataSources);
  }
}

/** Internal state for one managed DataSource. */
class ManagedDataSourceEntry {
  /** Stable DataSource id used by subscribers. */
  id: string;
  /** Whether the DataSource currently has a resolved value or error. */
  isLoaded: boolean = false;
  /** If false, the manager may prune the DataSource after all subscribers leave. */
  persistent?: boolean;
  /** Number of retained callers currently using this DataSource. */
  retainCount: number = 0;

  /** Monotonic counter used to ignore stale promise resolutions. */
  private loadCount: number = 0;
  /** Subscribers currently using this DataSource entry. */
  private subscribers = new Set<DataSourceSubscriber<ManageableDataSource>>();
  /** Last DataSource value provided to this entry. */
  private dataSource: ManageableDataSource | Promise<ManageableDataSource> | null | undefined;
  /** Promise that tracks the active asynchronous DataSource resolution. */
  private loader?: Promise<ManageableDataSource>;
  /** Error from the latest asynchronous DataSource resolution. */
  private error?: Error;
  /** Resolved DataSource instance, or null for an unresolved placeholder. */
  private content: ManageableDataSource | null = null;

  /** Creates a managed DataSource entry. */
  constructor(id: string, dataSource: ManageableDataSource | Promise<ManageableDataSource> | null) {
    this.id = id;
    this.setDataSource(dataSource);
  }

  /** Adds a subscriber to this DataSource. */
  subscribe(consumer: DataSourceSubscriber<ManageableDataSource>): void {
    this.subscribers.add(consumer);
  }

  /** Removes a subscriber from this DataSource. */
  unsubscribe(consumer: DataSourceSubscriber<ManageableDataSource>): void {
    this.subscribers.delete(consumer);
  }

  /** Returns true when at least one subscriber is using this DataSource. */
  inUse(): boolean {
    return this.subscribers.size > 0;
  }

  /** Increments the retained caller count. */
  retain(): void {
    this.retainCount++;
  }

  /** Decrements the retained caller count. */
  release(): void {
    this.retainCount = Math.max(this.retainCount - 1, 0);
  }

  /** Returns true when at least one caller retained this DataSource. */
  isRetained(): boolean {
    return this.retainCount > 0;
  }

  /** Releases this DataSource and clears its subscribers. */
  async delete(): Promise<void> {
    this.loadCount++;
    this.subscribers.clear();
    const content = this.content;
    this.content = null;
    this.dataSource = null;
    if (content) {
      await closeDataSource(content);
    }
  }

  /** Returns the current DataSource, placeholder, or pending DataSource promise. */
  getDataSource(): ManageableDataSource | Promise<ManageableDataSource> | null {
    if (this.isLoaded) {
      return this.error ? Promise.reject(this.error) : this.content;
    }
    return this.loader!;
  }

  /** Returns true when this entry is an unresolved placeholder. */
  isPlaceholder(): boolean {
    return this.isLoaded && this.content === null && this.dataSource === null && !this.error;
  }

  /** Replaces the underlying DataSource and notifies subscribers. */
  setDataSource(
    dataSource: ManageableDataSource | Promise<ManageableDataSource> | null,
    forceUpdate?: boolean
  ): void {
    if (dataSource === this.dataSource && !forceUpdate) {
      return;
    }

    const oldContent = this.content;
    this.dataSource = dataSource;
    this.content = null;
    const loadCount = ++this.loadCount;

    if (oldContent && oldContent !== dataSource) {
      void closeDataSource(oldContent);
    }

    if (dataSource instanceof Promise) {
      this.isLoaded = false;
      this.loader = dataSource
        .then(result => {
          if (this.loadCount === loadCount) {
            this.isLoaded = true;
            this.error = undefined;
            this.content = result;
          } else {
            void closeDataSource(result);
          }
          return result;
        })
        .catch(error => {
          const normalizedError = normalizeError(error);
          if (this.loadCount === loadCount) {
            this.isLoaded = true;
            this.error = normalizedError;
          }
          throw normalizedError;
        });
      this.notifySubscribers();
    } else {
      this.isLoaded = true;
      this.loader = undefined;
      this.error = undefined;
      this.content = dataSource;
      this.notifySubscribers();
    }
  }

  /** Notifies all subscribers with the current DataSource value. */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber.onChange(this.getDataSource());
    }
  }
}

/** Converts thrown values to Error instances. */
function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
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
