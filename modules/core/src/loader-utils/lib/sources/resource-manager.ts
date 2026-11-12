// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../log-utils/log';

/** Lifecycle state reported for one managed DataSource registration. */
export type ResourceManagerEntryStatus = 'ready' | 'pending' | 'placeholder' | 'error';

/** Read-only discovery information for one managed DataSource registration. */
export type ResourceManagerEntryInfo = Readonly<{
  /** Stable id used to retrieve or subscribe to the DataSource. */
  dataSourceId: string;
  /** Current lifecycle state without exposing the owned DataSource instance. */
  status: ResourceManagerEntryStatus;
  /** Whether the manager keeps the entry after its last consumer and retain are released. */
  persistent: boolean;
  /** Number of consumers currently subscribed to this entry. */
  subscriberCount: number;
  /** Number of callers currently retaining this entry through getOrCreate(). */
  retainCount: number;
  /** Resolution failure when status is `error`. */
  error?: Error;
}>;

/** Configures the protocol, ownership and error reporting for a shared resource manager. */
export type ResourceManagerOptions<T> = {
  protocol?: string;
  dispose?: (value: T) => void | Promise<void>;
  onError?: (error: Error) => void;
};

/** Describes a resource without creating it. Keep the adapter identity stable. */
export type ResourceDescription<T> = Readonly<{
  dataSourceId: string;
  data?: unknown;
  options?: unknown;
  adapter: {
    create(data: unknown, options: unknown, signal: AbortSignal): T | Promise<T>;
    /** Applies complete options. Return false to replace the current value. */
    update?(value: T, options: unknown, previousOptions: unknown): boolean;
  };
}>;

/** Callback notified when a registration is added, replaced or explicitly refreshed. */
export type ResourceSubscriber<DataSourceT> = {
  /** Receives the current DataSource, a pending DataSource promise, or null for placeholders. */
  onChange: (dataSource: DataSourceT | Promise<DataSourceT> | null) => void;
};

/** Parameters for adding or updating a managed DataSource. */
export type ResourceManagerAddParameters<DataSourceT> = {
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
export type ResourceManagerSubscribeParameters<DataSourceT> = {
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
export type ResourceManagerGetOrCreateParameters<DataSourceT> = {
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
type Consumer<T> = Record<string, ResourceSubscriber<T> & {dataSourceId: string}>;

/**
 * Shares values and pending loads with named consumers.
 */
export class ResourceManager<T = unknown> {
  /** Protocol used to refer to deferred DataSource ids. */
  readonly protocol: string;

  /** Managed DataSource entries keyed by normalized DataSource id. */
  protected dataSources: Record<string, ManagedDataSourceEntry<T>> = Object.create(null);
  /** Consumer subscriptions keyed by consumer id. */
  private consumers: Record<string, Consumer<T>> = Object.create(null);
  /** Last applied descriptions for declaratively owned registrations. */
  private descriptions = new Map<string, ResourceDescription<T>>();
  /** Generated DataSource ids keyed by object identity for non-string inputs. */
  private dataSourceIds = new WeakMap<object, string>();
  /** Monotonic counter used to create stable object-identity DataSource ids. */
  private nextDataSourceId: number = 0;
  /** Pending prune timer used to batch unsubscribe cleanup. */
  private pruneRequest: ReturnType<typeof setTimeout> | null = null;

  private readonly dispose?: ResourceManagerOptions<T>['dispose'];
  private readonly onError: (error: Error) => void;

  /** Creates a manager with an optional deferred resource protocol. */
  constructor(props: ResourceManagerOptions<T> = {}) {
    this.protocol = props.protocol || 'datasource://';
    this.dispose = props.dispose;
    this.onError = props.onError ?? (error => log.warn(error.message)());
  }

  /** Returns true if the id is registered or uses the deferred DataSource protocol. */
  contains(dataSourceId: string): boolean {
    if (dataSourceId.startsWith(this.protocol)) {
      return true;
    }
    return dataSourceId in this.dataSources;
  }

  /** Lists managed registrations in insertion order for source discovery and diagnostics. */
  listDataSources(): readonly ResourceManagerEntryInfo[] {
    return Object.freeze(
      Object.values(this.dataSources).map(dataSourceEntry => dataSourceEntry.getInfo())
    );
  }

  /** Adds or replaces a managed DataSource. */
  add<DataSourceT extends T = T>({
    dataSourceId,
    dataSource,
    forceUpdate = false,
    persistent = true
  }: ResourceManagerAddParameters<DataSourceT>): void {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);
    if (this.descriptions.has(normalizedDataSourceId))
      throw new Error('Cannot add over a declarative resource');
    let dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (dataSourceEntry) {
      dataSourceEntry.setDataSource(dataSource, forceUpdate);
    } else {
      dataSourceEntry = new ManagedDataSourceEntry<T>(
        this.dispose,
        this.onError,
        normalizedDataSourceId,
        dataSource
      );
      this.dataSources[normalizedDataSourceId] = dataSourceEntry;
    }

    dataSourceEntry.persistent = persistent;
    dataSourceEntry.isDeferred = false;
  }

  /** Reconciles the complete declarative resource list when supplied. */
  setProps({dataSources}: {dataSources?: readonly ResourceDescription<T>[]}): void {
    if (!dataSources) return;
    const next = new Map<string, ResourceDescription<T>>();
    for (const description of dataSources) {
      const id = this.normalizeDataSourceId(description.dataSourceId);
      const entry = this.dataSources[id];
      if (
        !id.trim() ||
        next.has(id) ||
        (entry && !this.descriptions.has(id) && !entry.isDeferred)
      ) {
        throw new Error(`Invalid or conflicting resource id "${id}".`);
      }
      next.set(id, {...description, options: snapshotOptions(description.options)});
    }
    for (const [id, description] of next) {
      const previous = this.descriptions.get(id);
      const entry = this.dataSources[id];
      if (
        previous &&
        previous.adapter === description.adapter &&
        Object.is(previous.data, description.data)
      ) {
        if (equalOptions(previous.options, description.options)) continue;
        if (entry.getInfo().status === 'ready') {
          const current = entry.getDataSource() as T;
          if (description.adapter.update?.(current, description.options, previous.options)) {
            this.descriptions.set(id, description);
            entry.setDataSource(current, true);
            continue;
          }
        }
      }
      this.createResource(id, description);
    }
    for (const id of this.descriptions.keys()) {
      if (!next.has(id)) void this.remove(id).catch(error => this.onError(normalizeError(error)));
    }
  }

  /** Recreates a declarative resource, including a failed registration. */
  refresh(dataSourceId: string): void {
    const id = this.normalizeDataSourceId(dataSourceId);
    const description = this.descriptions.get(id);
    if (description) this.createResource(id, description);
  }

  private createResource(id: string, description: ResourceDescription<T>): void {
    const controller = new AbortController();
    let value: T | Promise<T>;
    try {
      value = description.adapter.create(description.data, description.options, controller.signal);
    } catch (error) {
      value = Promise.reject(error);
    }
    const entry =
      this.dataSources[id] ?? new ManagedDataSourceEntry<T>(this.dispose, this.onError, id, null);
    this.dataSources[id] = entry;
    this.descriptions.set(id, description);
    entry.persistent = true;
    entry.isDeferred = false;
    entry.setDataSource(value, false, controller);
  }

  /** Returns an existing DataSource for the same key, or creates and retains a new one. */
  getOrCreate<DataSourceT extends T = T>({
    dataSourceId,
    data,
    createDataSource,
    persistent = true
  }: ResourceManagerGetOrCreateParameters<DataSourceT>): DataSourceT | Promise<DataSourceT> {
    const normalizedDataSourceId = this.resolveDataSourceId(dataSourceId, data);
    let dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (!dataSourceEntry) {
      dataSourceEntry = new ManagedDataSourceEntry<T>(
        this.dispose,
        this.onError,
        normalizedDataSourceId,
        createDataSource(data)
      );
      dataSourceEntry.persistent = persistent;
      this.dataSources[normalizedDataSourceId] = dataSourceEntry;
    } else if (dataSourceEntry.isPlaceholder() && !this.descriptions.has(normalizedDataSourceId)) {
      dataSourceEntry.isDeferred = false;
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
      this.descriptions.delete(normalizedDataSourceId);
      delete this.dataSources[normalizedDataSourceId];
      for (const [consumerId, requests] of Object.entries(this.consumers)) {
        for (const [requestId, request] of Object.entries(requests)) {
          if (request.dataSourceId === normalizedDataSourceId) delete requests[requestId];
        }
        if (!Object.keys(requests).length) delete this.consumers[consumerId];
      }
      await dataSourceEntry.delete();
    }
  }

  /** Releases one retained DataSource reference created by getOrCreate(). */
  async release(dataSourceId: string): Promise<void> {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);
    const dataSourceEntry = this.dataSources[normalizedDataSourceId];

    if (dataSourceEntry) {
      dataSourceEntry.release();
      if (
        !dataSourceEntry.isRetained() &&
        !dataSourceEntry.inUse() &&
        !this.descriptions.has(normalizedDataSourceId)
      ) {
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
  subscribe<DataSourceT extends T = T>({
    dataSourceId,
    onChange,
    consumerId,
    requestId = 'default'
  }: ResourceManagerSubscribeParameters<DataSourceT>):
    | DataSourceT
    | Promise<DataSourceT>
    | null
    | undefined {
    const normalizedDataSourceId = this.normalizeDataSourceId(dataSourceId);

    if (dataSourceId.startsWith(this.protocol) && !this.dataSources[normalizedDataSourceId]) {
      const placeholder = new ManagedDataSourceEntry<T>(
        this.dispose,
        this.onError,
        normalizedDataSourceId,
        null
      );
      placeholder.persistent = false;
      placeholder.isDeferred = true;
      this.dataSources[normalizedDataSourceId] = placeholder;
    }

    const dataSourceEntry = this.dataSources[normalizedDataSourceId];
    this.track(
      consumerId,
      requestId,
      dataSourceEntry,
      onChange as ResourceSubscriber<T>['onChange']
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
      this.pruneRequest = setTimeout(
        () => void this.pruneNow().catch(error => this.onError(normalizeError(error))),
        0
      );
    }
  }

  /** Releases all managed DataSources and clears all subscriptions. */
  async finalize(): Promise<void> {
    if (this.pruneRequest) {
      clearTimeout(this.pruneRequest);
      this.pruneRequest = null;
    }

    this.descriptions.clear();
    const dataSources = this.dataSources;
    this.dataSources = Object.create(null);
    this.consumers = Object.create(null);
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
    dataSourceEntry: ManagedDataSourceEntry<T> | undefined,
    onChange: ResourceSubscriber<T>['onChange']
  ): void {
    this.consumers[consumerId] = this.consumers[consumerId] || Object.create(null);
    const consumer = this.consumers[consumerId];
    let request = consumer[requestId];
    const oldDataSourceEntry = request?.dataSourceId && this.dataSources[request.dataSourceId];

    if (oldDataSourceEntry) {
      oldDataSourceEntry.unsubscribe(request);
      this.prune();
    }

    if (!dataSourceEntry) delete consumer[requestId];
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
class ManagedDataSourceEntry<T> {
  /** Stable DataSource id used by subscribers. */
  id: string;
  /** Whether the DataSource currently has a resolved value or error. */
  isLoaded: boolean = false;
  /** If false, the manager may prune the DataSource after all subscribers leave. */
  persistent?: boolean;
  /** Number of retained callers currently using this DataSource. */
  retainCount: number = 0;
  isDeferred = false;
  private controller?: AbortController;

  /** Monotonic counter used to ignore stale promise resolutions. */
  private loadCount: number = 0;
  /** Subscribers currently using this DataSource entry. */
  private subscribers = new Set<ResourceSubscriber<T>>();
  /** Last DataSource value provided to this entry. */
  private dataSource: T | Promise<T> | null | undefined;
  /** Promise that tracks the active asynchronous DataSource resolution. */
  private loader?: Promise<T>;
  /** Error from the latest asynchronous DataSource resolution. */
  private error?: Error;
  /** Resolved DataSource instance, or null for an unresolved placeholder. */
  private content: T | null = null;

  /** Creates a managed DataSource entry. */
  constructor(
    private readonly dispose: ResourceManagerOptions<T>['dispose'],
    private readonly onError: (error: Error) => void,
    id: string,
    dataSource: T | Promise<T> | null
  ) {
    this.id = id;
    this.setDataSource(dataSource);
  }

  /** Adds a subscriber to this DataSource. */
  subscribe(consumer: ResourceSubscriber<T>): void {
    this.subscribers.add(consumer);
  }

  /** Removes a subscriber from this DataSource. */
  unsubscribe(consumer: ResourceSubscriber<T>): void {
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

  /** Returns an immutable public snapshot of this entry's lifecycle state. */
  getInfo(): ResourceManagerEntryInfo {
    const status: ResourceManagerEntryStatus = !this.isLoaded
      ? 'pending'
      : this.error
        ? 'error'
        : this.isPlaceholder()
          ? 'placeholder'
          : 'ready';
    return Object.freeze({
      dataSourceId: this.id,
      status,
      persistent: this.persistent !== false,
      subscriberCount: this.subscribers.size,
      retainCount: this.retainCount,
      ...(this.error ? {error: this.error} : {})
    });
  }

  /** Releases this DataSource and clears its subscribers. */
  async delete(): Promise<void> {
    this.loadCount++;
    this.controller?.abort();
    this.subscribers.clear();
    const content = this.content;
    this.content = null;
    this.dataSource = null;
    if (content !== null) {
      await this.dispose?.(content);
    }
  }

  /** Returns the current DataSource, placeholder, or pending DataSource promise. */
  getDataSource(): T | Promise<T> | null {
    if (this.isLoaded) {
      return this.error ? this.loader! : this.content;
    }
    return this.loader!;
  }

  /** Returns true when this entry is an unresolved placeholder. */
  isPlaceholder(): boolean {
    return this.isLoaded && this.content === null && this.dataSource === null && !this.error;
  }

  /** Replaces the underlying DataSource and notifies subscribers. */
  setDataSource(
    dataSource: T | Promise<T> | null,
    forceUpdate?: boolean,
    controller?: AbortController
  ): void {
    if (
      !controller &&
      (dataSource === this.dataSource || (dataSource !== null && dataSource === this.content))
    ) {
      if (forceUpdate) this.notifySubscribers();
      return;
    }

    const oldContent = this.content;
    this.dataSource = dataSource;
    this.content = null;
    const loadCount = ++this.loadCount;
    const previousController = this.controller;
    this.controller = controller;
    previousController?.abort();

    if (oldContent !== null && oldContent !== dataSource) {
      this.disposeDetached(oldContent);
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
            if (result !== this.content) this.disposeDetached(result);
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
      void this.loader.catch(() => {});
      this.notifySubscribers();
    } else {
      this.isLoaded = true;
      this.loader = undefined;
      this.error = undefined;
      this.content = dataSource;
      this.notifySubscribers();
    }
  }

  private disposeDetached(value: T): void {
    void this.disposeValue(value).catch(error => this.onError(normalizeError(error)));
  }

  /** Converts synchronous disposal failures to promise rejections. */
  private async disposeValue(value: T): Promise<void> {
    await this.dispose?.(value);
  }

  /** Notifies all subscribers with the current DataSource value. */
  private notifySubscribers(): void {
    const value = this.getDataSource();
    for (const subscriber of [...this.subscribers]) {
      if (this.subscribers.has(subscriber)) subscriber.onChange(value);
    }
  }
}

/** Converts thrown values to Error instances. */
function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Returns the structural part of a configuration. */
function optionRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value) || prototype === Object.prototype || prototype === null) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

/** Copies structural options while keeping opaque values by identity. */
function snapshotOptions(value: unknown, seen = new Map<object, unknown>()): unknown {
  const record = optionRecord(value);
  if (!record) return value;
  if (seen.has(record)) return seen.get(record);
  const result = Array.isArray(value)
    ? new Array(value.length)
    : Object.create(Object.getPrototypeOf(record));
  seen.set(record, result);
  for (const key of Object.keys(record)) {
    Object.defineProperty(result, key, {
      value: snapshotOptions(record[key], seen),
      enumerable: true
    });
  }
  return Object.freeze(result);
}

/** Compares structural options by value and other inputs by identity. */
function equalOptions(
  left: unknown,
  right: unknown,
  seen = new Map<object, Set<object>>()
): boolean {
  if (Object.is(left, right)) return true;
  const leftRecord = optionRecord(left);
  const rightRecord = optionRecord(right);
  if (!leftRecord || !rightRecord || Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left) && left.length !== (right as unknown[]).length) return false;
  const matches = seen.get(leftRecord) ?? new Set<object>();
  if (matches.has(rightRecord)) return true;
  matches.add(rightRecord);
  seen.set(leftRecord, matches);
  const keys = Object.keys(leftRecord);
  return (
    keys.length === Object.keys(rightRecord).length &&
    keys.every(
      key =>
        Object.prototype.hasOwnProperty.call(rightRecord, key) &&
        equalOptions(leftRecord[key], rightRecord[key], seen)
    )
  );
}
