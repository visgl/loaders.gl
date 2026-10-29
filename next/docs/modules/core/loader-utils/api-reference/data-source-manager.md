Loader utilities / source lifecycle

# Share a source without sharing every implementation detail.

DataSourceManager owns source instances by stable ids and lets consumers subscribe, inspect, and release them through a small lifecycle boundary. It works with tile, image, raster, vector, SQL, archive-backed, and in-memory sources.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[Source selection](https://loaders.gl/next/docs/modules/core/api-reference/select-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/select-source.md)

Managed source path

## Create once, observe intentionally, release cleanly.

A manager is useful when application components need a lightweight reference to a shared source. Read-only discovery methods expose registrations and metadata without requiring consumers to hold the concrete source object.

01

Create

Build a concrete DataSource through the core source API.

02

Register

Store it under an application-chosen stable id.

03

Subscribe

Observe one source without passing it through every component.

04

Release

Remove the registration and underlying source resources together.

Detailed guide

## DataSourceManager reference

The detailed reference covers registration, subscriptions, discovery, diagnostics, replacement, and resource release.

`DataSourceManager` owns a set of shared `DataSource` instances and lets consumers subscribe to them by stable ids. It is useful when an application or integration layer needs to create `DataSource` objects once, pass lightweight references through props or configuration, and release the underlying resources when those references are no longer used.

The manager is intentionally format-agnostic. It can hold any `DataSource` subclass created by a `SourceLoader`, including tile, image, raster, vector, SQL, archive-backed, and in-memory sources.

Picker and diagnostics UI should use `listDataSources()` or `discoverDataSources()` rather than subscribing merely to inspect registrations. These read-only methods expose lifecycle information and common query metadata without returning the managed source object or changing retention.

## Usage[​](#usage "Direct link to Usage")

### Create and register a DataSource[​](#create-and-register-a-datasource "Direct link to Create and register a DataSource")

Most applications should create runtime sources with `createDataSource()` from `@loaders.gl/core`. `createDataSource()` selects a matching `SourceLoader`, calls that loader's `createDataSource()` factory, and injects the core loading hooks that many `DataSource` subclasses need for follow-up requests.

```
import {createDataSource} from '@loaders.gl/core';

import {DataSourceManager} from '@loaders.gl/core/loader-utils';

import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';



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

### Deduplicate DataSources[​](#deduplicate-datasources "Direct link to Deduplicate DataSources")

Use `getOrCreate()` when multiple callers may ask for the same source. The first call creates and retains the `DataSource`; later calls with the same key return the existing instance and increment the retain count.

```
const firstTiles = dataSourceManager.getOrCreate({

  dataSourceId: 'world-tiles',

  data: 'https://example.com/world.pmtiles',

  createDataSource: data =>

    createDataSource(data as string, [PMTilesSourceLoader], {

      pmtiles: {

        // PMTiles-specific options

      }

    })

});



const secondTiles = dataSourceManager.getOrCreate({

  dataSourceId: 'world-tiles',

  data: 'https://example.com/world.pmtiles',

  createDataSource: data => createDataSource(data as string, [PMTilesSourceLoader])

});



// firstTiles and secondTiles reference the same DataSource.
```

`dataSourceId` is the preferred dedupe key because it is explicit and can later be passed to `release()`. If `dataSourceId` is omitted, string `data` values are used as the key.

```
const tiles = dataSourceManager.getOrCreate({

  data: 'https://example.com/world.pmtiles',

  createDataSource: data => createDataSource(data as string, [PMTilesSourceLoader])

});
```

For `Blob` and object inputs, the manager deduplicates by object identity. Two different objects with the same contents create two different `DataSource` instances.

```
const blob = new Blob([arrayBuffer]);



const firstSource = dataSourceManager.getOrCreate({

  data: blob,

  createDataSource: data => createDataSource(data as Blob, [GeoPackageSource])

});



const secondSource = dataSourceManager.getOrCreate({

  data: blob,

  createDataSource: data => createDataSource(data as Blob, [GeoPackageSource])

});



// firstSource and secondSource are deduplicated because they use the same Blob object.
```

When using object-identity dedupe, provide a `dataSourceId` if the caller will need to release the source later.

`getOrCreate()` also deduplicates pending asynchronous creation. If a factory returns a `Promise<DataSource>`, concurrent callers receive the same pending promise and the factory is called once.

### Subscribe from a consumer[​](#subscribe-from-a-consumer "Direct link to Subscribe from a consumer")

`subscribe()` registers a callback and immediately returns the current `DataSource` if it is available.

```
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

### Use deferred DataSource ids[​](#use-deferred-datasource-ids "Direct link to Use deferred DataSource ids")

When a consumer subscribes to an id prefixed by the manager protocol, the manager creates a non-persistent placeholder if the `DataSource` has not been registered yet. The default protocol is `datasource://`.

```
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

### Replace a DataSource[​](#replace-a-datasource "Direct link to Replace a DataSource")

Calling `add()` with an existing `dataSourceId` replaces the current `DataSource`, notifies subscribers, and releases the previous instance through its lifecycle method.

```
const updatedTiles = createDataSource('https://example.com/world-v2.pmtiles', [PMTilesSourceLoader]);



dataSourceManager.add({

  dataSourceId: 'world-tiles',

  dataSource: updatedTiles

});
```

If the new value is the same object and subscribers still need to be notified, set `forceUpdate: true`.

```
dataSourceManager.add({

  dataSourceId: 'world-tiles',

  dataSource: updatedTiles,

  forceUpdate: true

});
```

### Manage persistent and temporary sources[​](#manage-persistent-and-temporary-sources "Direct link to Manage persistent and temporary sources")

DataSources are persistent by default. A persistent source remains in the manager until `remove()` or `finalize()` is called.

```
dataSourceManager.add({

  dataSourceId: 'catalog',

  dataSource: catalogSource,

  persistent: true

});
```

A non-persistent source can be pruned once no consumer is subscribed to it.

```
dataSourceManager.add({

  dataSourceId: 'preview',

  dataSource: previewSource,

  persistent: false

});



dataSourceManager.unsubscribe({consumerId: 'preview-layer'});
```

`unsubscribe()` schedules pruning with a short timeout so multiple subscription updates in the same event loop turn are batched.

### Clean up[​](#clean-up "Direct link to Clean up")

Use `release()` to release one retained reference created by `getOrCreate()`.

```
await dataSourceManager.release('world-tiles');
```

The manager closes and removes the `DataSource` when the retain count reaches zero and there are no active subscribers. If subscribers are still using the source, it stays registered until they unsubscribe and normal pruning can remove it.

Use `remove()` when a specific source is no longer needed.

```
await dataSourceManager.remove('world-tiles');
```

Use `finalize()` when shutting down the owner of the manager.

```
await dataSourceManager.finalize();
```

When a managed `DataSource` is released, the manager calls the first lifecycle method it finds in this order:

1. `close()`
2. `finalize()`
3. `destroy()`

This lets `DataSource` subclasses release database handles, network sessions, tile caches, worker state, or other owned resources without forcing every subclass to use the same method name.

### Integrate with SourceLoaders[​](#integrate-with-sourceloaders "Direct link to Integrate with SourceLoaders")

A `SourceLoader` is metadata plus a `createDataSource()` method. The manager does not select source loaders itself; selection stays with `createDataSource()`, `selectSource()`, or application code.

```
import {createDataSource} from '@loaders.gl/core';

import {DataSourceManager} from '@loaders.gl/core/loader-utils';

import {MVTSourceLoader} from '@loaders.gl/tiles/mvt';

import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';



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

* `SourceLoader` describes a source format and creates the correct runtime `DataSource`.
* `DataSource` subclasses implement format-specific query APIs such as `getMetadata()`, `getTile()`, `getRaster()`, or SQL methods.
* `DataSourceManager` handles object identity, subscriptions, replacement, and cleanup.

### Use the manager for scan federation[​](#use-the-manager-for-scan-federation "Direct link to Use the manager for scan federation")

`@loaders.gl/core/scan` reuses this manager rather than defining a scan-only registry. Register each `TableScanSource` under a stable id, then reference those ids from `FederatedTableScanSource`:

```
import {DataSourceManager} from '@loaders.gl/core/loader-utils';

import {FederatedTableScanSource} from '@loaders.gl/core/scan';



const dataSourceManager = new DataSourceManager();

dataSourceManager.add({dataSourceId: 'today', dataSource: todaySource});

dataSourceManager.add({dataSourceId: 'archive', dataSource: archiveSource});



const source = new FederatedTableScanSource(dataSourceManager, {

  sources: [{dataSourceId: 'today'}, {dataSourceId: 'archive'}]

});
```

The federated source owns no child source resources. It creates operation-scoped subscriptions for metadata discovery, explanation, and iteration, then releases them on completion, error, cancellation, a global-limit stop, or early iterator return. Non-persistent sources therefore keep the same pruning and lifecycle behavior they have for any other manager consumer.

The dependency direction is intentional: `DataSourceManager` remains a lightweight, format-agnostic resource manager in `@loaders.gl/core/loader-utils`; the optional scan package adds schema reconciliation and ordered query execution on top.

### Integrate with DataSource subclasses[​](#integrate-with-datasource-subclasses "Direct link to Integrate with DataSource subclasses")

Any subclass of `DataSource` can be managed. Subclasses do not need to know that a manager exists.

```
import {DataSource, DataSourceManager, type DataSourceOptions} from '@loaders.gl/core/loader-utils';



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

## Constructor[​](#constructor "Direct link to Constructor")

```
new DataSourceManager(props?: {protocol?: string});
```

* `protocol`: Prefix used for deferred DataSource ids. Defaults to `'datasource://'`.

## Methods[​](#methods "Direct link to Methods")

### contains()[​](#contains "Direct link to contains()")

```
contains(dataSourceId: string): boolean;
```

Returns `true` when the normalized id is registered, or when the id starts with the manager protocol.

### add()[​](#add "Direct link to add()")

```
add<DataSourceT extends ManageableDataSource>({

  dataSourceId,

  dataSource,

  forceUpdate,

  persistent

}: DataSourceManagerAddParameters<DataSourceT>): void;
```

Adds or replaces a managed `DataSource`.

* `dataSourceId`: Stable id used for lookup and subscriptions.
* `dataSource`: `DataSource`, `Promise<DataSource>`, or `null` placeholder.
* `forceUpdate`: Notify subscribers even when the object identity did not change.
* `persistent`: Keep the source until explicit removal. Defaults to `true`.

### getOrCreate()[​](#getorcreate "Direct link to getOrCreate()")

```
getOrCreate<DataSourceT extends ManageableDataSource>({

  dataSourceId,

  data,

  createDataSource,

  persistent

}: DataSourceManagerGetOrCreateParameters<DataSourceT>): DataSourceT | Promise<DataSourceT>;
```

Returns an existing managed `DataSource` for the same key, or creates and retains a new one.

* `dataSourceId`: Explicit dedupe key. Preferred when the caller will later call `release()`.
* `data`: Optional input passed to `createDataSource`. Used as the dedupe key when `dataSourceId` is omitted.
* `createDataSource`: Factory called only when no matching source exists.
* `persistent`: If false, the source may be pruned after all retains and subscribers are gone. Defaults to `true`.

### subscribe()[​](#subscribe "Direct link to subscribe()")

```
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

### listDataSources()[​](#listdatasources "Direct link to listDataSources()")

```
listDataSources(): readonly DataSourceManagerEntryInfo[];
```

Returns stable ids, lifecycle status, persistence, retain count, and subscription count for every registration. It does not resolve pending sources or expose source objects.

### discoverDataSources()[​](#discoverdatasources "Direct link to discoverDataSources()")

```
discoverDataSources(options?: {

  queryType?: 'table' | 'raster' | 'point-cloud';

  signal?: AbortSignal;

}): Promise<readonly DataSourceManagerDiscoveryInfo[]>;
```

Calls `getQueryMetadata()` only on ready metadata providers and reports whether each source has a supported common executor for the requested query family. Discovery errors are retained on the corresponding result so one broken source does not hide the remaining picker choices. Aborts are propagated immediately. The result contains metadata and lifecycle information, never the managed source instance.

### unsubscribe()[​](#unsubscribe "Direct link to unsubscribe()")

```
unsubscribe({consumerId}: {consumerId: string}): void;
```

Removes all subscriptions for a consumer and schedules pruning of unused non-persistent sources.

### release()[​](#release "Direct link to release()")

```
release(dataSourceId: string): Promise<void>;
```

Releases one retained reference created by `getOrCreate()`. When the retain count reaches zero and there are no active subscribers, the manager removes and closes the source.

### remove()[​](#remove "Direct link to remove()")

```
remove(dataSourceId: string): Promise<void>;
```

Removes one source and releases its lifecycle resources.

### prune()[​](#prune "Direct link to prune()")

```
prune(): void;
```

Schedules removal of unused non-persistent sources.

### finalize()[​](#finalize "Direct link to finalize()")

```
finalize(): Promise<void>;
```

Releases every managed source and clears all subscriptions.
