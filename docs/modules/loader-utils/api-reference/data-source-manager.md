# DataSourceManager

`DataSourceManager` owns a set of shared `DataSource` instances and lets consumers subscribe to them by stable ids. It is useful when an application or integration layer needs to create `DataSource` objects once, pass lightweight references through props or configuration, and release the underlying resources when those references are no longer used.

The manager is intentionally format-agnostic. It can hold any `DataSource` subclass created by a `SourceLoader`, including tile, image, raster, vector, SQL, archive-backed, and in-memory sources.

## Usage

### Create and register a DataSource

Most applications should create runtime sources with `createDataSource()` from `@loaders.gl/core`. `createDataSource()` selects a matching `SourceLoader`, calls that loader's `createDataSource()` factory, and injects the core loading hooks that many `DataSource` subclasses need for follow-up requests.

```ts
import {createDataSource} from '@loaders.gl/core';
import {DataSourceManager} from '@loaders.gl/loader-utils';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';

const dataSourceManager = new DataSourceManager();

const tiles = createDataSource('https://example.com/world.pmtiles', [PMTilesSourceLoader], {
  pmtiles: {
    // PMTiles-specific options
  }
});

dataSourceManager.add({
  dataSourceId: 'world-tiles',
  dataSource: tiles
});
```

The manager stores the `DataSource` under `dataSourceId`. Consumers can later subscribe to that id instead of receiving the concrete `DataSource` object directly.

### Subscribe from a consumer

`subscribe()` registers a callback and immediately returns the current `DataSource` if it is available.

```ts
const currentTiles = dataSourceManager.subscribe({
  dataSourceId: 'world-tiles',
  consumerId: 'map-layer',
  requestId: 'data',
  onChange: nextTiles => {
    // Called when the DataSource is replaced or resolves from a promise.
    layer.setProps({data: nextTiles});
  }
});

if (currentTiles) {
  layer.setProps({data: currentTiles});
}
```

`consumerId` identifies the owner of one or more subscriptions. `requestId` is scoped to that consumer and defaults to `'default'`. Reusing the same `consumerId` and `requestId` replaces the old subscription with the new one.

### Use deferred DataSource ids

When a consumer subscribes to an id prefixed by the manager protocol, the manager creates a non-persistent placeholder if the `DataSource` has not been registered yet. The default protocol is `datasource://`.

```ts
const pendingTiles = dataSourceManager.subscribe({
  dataSourceId: 'datasource://world-tiles',
  consumerId: 'map-layer',
  onChange: nextTiles => {
    layer.setProps({data: nextTiles});
  }
});

// pendingTiles is null until the source is registered.

dataSourceManager.add({
  dataSourceId: 'world-tiles',
  dataSource: createDataSource('https://example.com/world.pmtiles', [PMTilesSourceLoader])
});
```

Deferred ids are useful when layer configuration is created before data sources are available, or when serialized configuration needs to refer to shared sources without embedding live objects.

### Replace a DataSource

Calling `add()` with an existing `dataSourceId` replaces the current `DataSource`, notifies subscribers, and releases the previous instance through its lifecycle method.

```ts
const updatedTiles = createDataSource('https://example.com/world-v2.pmtiles', [PMTilesSourceLoader]);

dataSourceManager.add({
  dataSourceId: 'world-tiles',
  dataSource: updatedTiles
});
```

If the new value is the same object and subscribers still need to be notified, set `forceUpdate: true`.

```ts
dataSourceManager.add({
  dataSourceId: 'world-tiles',
  dataSource: updatedTiles,
  forceUpdate: true
});
```

### Manage persistent and temporary sources

DataSources are persistent by default. A persistent source remains in the manager until `remove()` or `finalize()` is called.

```ts
dataSourceManager.add({
  dataSourceId: 'catalog',
  dataSource: catalogSource,
  persistent: true
});
```

A non-persistent source can be pruned once no consumer is subscribed to it.

```ts
dataSourceManager.add({
  dataSourceId: 'preview',
  dataSource: previewSource,
  persistent: false
});

dataSourceManager.unsubscribe({consumerId: 'preview-layer'});
```

`unsubscribe()` schedules pruning with a short timeout so multiple subscription updates in the same event loop turn are batched.

### Clean up

Use `remove()` when a specific source is no longer needed.

```ts
await dataSourceManager.remove('world-tiles');
```

Use `finalize()` when shutting down the owner of the manager.

```ts
await dataSourceManager.finalize();
```

When a managed `DataSource` is released, the manager calls the first lifecycle method it finds in this order:

1. `close()`
2. `finalize()`
3. `destroy()`

This lets `DataSource` subclasses release database handles, network sessions, tile caches, worker state, or other owned resources without forcing every subclass to use the same method name.

### Integrate with SourceLoaders

A `SourceLoader` is metadata plus a `createDataSource()` method. The manager does not select source loaders itself; selection stays with `createDataSource()`, `selectSource()`, or application code.

```ts
import {createDataSource} from '@loaders.gl/core';
import {DataSourceManager} from '@loaders.gl/loader-utils';
import {MVTSourceLoader} from '@loaders.gl/mvt';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';

const dataSourceManager = new DataSourceManager();

const dataSource = createDataSource(
  url,
  [PMTilesSourceLoader, MVTSourceLoader],
  {
    core: {
      type: 'auto'
    }
  }
);

dataSourceManager.add({
  dataSourceId: 'basemap',
  dataSource
});
```

This split keeps responsibilities clear:

- `SourceLoader` describes a source format and creates the correct runtime `DataSource`.
- `DataSource` subclasses implement format-specific query APIs such as `getMetadata()`, `getTile()`, `getRaster()`, or SQL methods.
- `DataSourceManager` handles object identity, subscriptions, replacement, and cleanup.

### Integrate with DataSource subclasses

Any subclass of `DataSource` can be managed. Subclasses do not need to know that a manager exists.

```ts
import {DataSource, DataSourceManager, type DataSourceOptions} from '@loaders.gl/loader-utils';

class SessionDataSource extends DataSource<string, DataSourceOptions> {
  private session: {close: () => Promise<void>} | null = null;

  async connect(): Promise<void> {
    this.session = await openSession(this.url);
  }

  async close(): Promise<void> {
    await this.session?.close();
    this.session = null;
  }
}

const dataSourceManager = new DataSourceManager();
const sessionSource = new SessionDataSource('session://example', {});

dataSourceManager.add({
  dataSourceId: 'session',
  dataSource: sessionSource
});

await dataSourceManager.finalize();
```

If a subclass has no `close()`, `finalize()`, or `destroy()` method, the manager simply removes references to it. That is sufficient for stateless sources, but sources that own external resources should implement one lifecycle method.

## Constructor

```ts
new DataSourceManager(props?: {protocol?: string});
```

- `protocol`: Prefix used for deferred DataSource ids. Defaults to `'datasource://'`.

## Methods

### contains()

```ts
contains(dataSourceId: string): boolean;
```

Returns `true` when the normalized id is registered, or when the id starts with the manager protocol.

### add()

```ts
add<DataSourceT extends ManageableDataSource>({
  dataSourceId,
  dataSource,
  forceUpdate,
  persistent
}: DataSourceManagerAddParameters<DataSourceT>): void;
```

Adds or replaces a managed `DataSource`.

- `dataSourceId`: Stable id used for lookup and subscriptions.
- `dataSource`: `DataSource`, `Promise<DataSource>`, or `null` placeholder.
- `forceUpdate`: Notify subscribers even when the object identity did not change.
- `persistent`: Keep the source until explicit removal. Defaults to `true`.

### subscribe()

```ts
subscribe<DataSourceT extends ManageableDataSource>({
  dataSourceId,
  onChange,
  consumerId,
  requestId
}: DataSourceManagerSubscribeParameters<DataSourceT>):
  | DataSourceT
  | Promise<DataSourceT>
  | null
  | undefined;
```

Subscribes one consumer request to a managed source. Returns the current source if available, `null` for a deferred placeholder, or `undefined` if the id is not registered and does not use the manager protocol.

### unsubscribe()

```ts
unsubscribe({consumerId}: {consumerId: string}): void;
```

Removes all subscriptions for a consumer and schedules pruning of unused non-persistent sources.

### remove()

```ts
remove(dataSourceId: string): Promise<void>;
```

Removes one source and releases its lifecycle resources.

### prune()

```ts
prune(): void;
```

Schedules removal of unused non-persistent sources.

### finalize()

```ts
finalize(): Promise<void>;
```

Releases every managed source and clears all subscriptions.
