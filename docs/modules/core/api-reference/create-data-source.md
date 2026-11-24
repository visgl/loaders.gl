Core source API

# Keep the dataset open when one request is not enough.

`createDataSource()` turns a URL or loaded resource into a source object with an API for metadata, tiles, windows, searches, or other repeated requests.

[Core module](https://loaders.gl/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/core.md)[Using sources](https://loaders.gl/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/docs/developer-guide/using-sources.md)

The source boundary

## Open once. Discover and request many times.

A source keeps format-specific state behind a common interface. That is useful for tiled archives, catalogs, image services, and cloud datasets where a single parse call cannot express the workflow.

01

Open

URL, Blob, Response, or source-supported resource

02

Select

One source loader or best-effort matching

03

Discover

Metadata, schema, bounds, layers, or assets

04

Request

Tiles, windows, features, scans, or pages

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

Use `createDataSource()` to construct a runtime source from a URL, Blob, or another input supported by the loader. The function preloads the loader implementation and invokes its synchronous source factory. The resulting source can request metadata, tiles, windows, or other data on demand.

Use `createDataSourceSync()` when the implementation is already available. Use `load()` to fetch and parse data.

Detailed guide

## Data source construction and options

The sections below document source selection, runtime construction, flat options, and examples using tiled data sources.

## Usage[​](#usage "Direct link to Usage")

Pass a loader with a source factory and an input it supports:

```
import {createDataSource} from '@loaders.gl/core';

import {PMTilesLoader} from '@loaders.gl/tiles/pmtiles';



const source = await createDataSource(url, [PMTilesLoader]);

const metadata = await source.getMetadata();
```

Automatic selection is performed with best-effort heuristics.

```
import {createDataSource} from '@loaders.gl/core';

import {PMTilesLoader} from '@loaders.gl/tiles/pmtiles';

import {MVTLoader} from '@loaders.gl/tiles/mvt';



const dataSource = await createDataSource(url, [PMTilesLoader, MVTLoader]);

const metadata = await dataSource.getMetadata();
```

## Functions[​](#functions "Direct link to Functions")

### createDataSource()[​](#createdatasource "Direct link to createDataSource()")

```
createDataSource(data: unknown, loaders: Loader | Loader[], options?: DataSourceOptions): Promise<DataSource>

createDataSourceSync(data: unknown, loaders: Loader | Loader[], options?: DataSourceOptions): DataSource
```

Creates a runtime `DataSource` using the selected loader.

* `data`: The resource that the selected source will use. Supported inputs depend on the source.
* `loaders`: A loader or array of loaders with source factories. A one-element array uses that loader directly; multiple candidates use `core.type` or best-effort selection.
* `options`: One flat options object, with shared `core` controls beside source and parser namespaces. Options and the returned source type are inferred from the supplied factories.

Returns:

* A valid runtime data source.

## Options[​](#options "Direct link to Options")

See [Source options](https://loaders.gl/docs/developer-guide/using-sources.md#options) for the shared options convention, loading controls, parser options, precedence, and TypeScript behavior. Source-specific settings are documented on each loader’s reference page.
