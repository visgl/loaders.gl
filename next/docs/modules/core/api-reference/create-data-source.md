Core source API

# Keep the dataset open when one request is not enough.

`createDataSource()` turns a URL or loaded resource into a source object with an API for metadata, tiles, windows, searches, or other repeated requests.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

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

This function synchronously creates a runtime `DataSource` from a source-supported input, such as a URL, Blob, or an already loaded table. The returned object offers methods for requesting metadata and additional data; construction does not imply that the entire dataset has been loaded.

Use `parse()` for parser loaders. `load()` can also accept a source loader and asynchronously return its runtime source, including resolving a lazy implementation when supported.

Detailed guide

## Data source construction and options

The sections below document source selection, runtime construction, flat options, and examples using tiled data sources.

## Usage[​](#usage "Direct link to Usage")

Provide a source loader with a runtime factory and an input it supports:

```
import {createDataSource} from '@loaders.gl/core';

import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';



const source = createDataSource(url, [PMTilesSourceLoader]);

const metadata = await source.getMetadata();
```

Automatic selection is performed with best-effort heuristics.

```
import {createDataSource} from '@loaders.gl/core';

import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';

import {MVTSourceLoader} from '@loaders.gl/tiles/mvt';



const dataSource = createDataSource(url, [PMTilesSourceLoader, MVTSourceLoader]);

const metadata = await dataSource.getMetadata();
```

## Functions[​](#functions "Direct link to Functions")

### createDataSource()[​](#createdatasource "Direct link to createDataSource()")

```
createDataSource(data: unknown, sources: SourceLoader[], options?: DataSourceOptions) : DataSource
```

Creates a runtime `DataSource` either using the provided source loader or source loaders.

* `data`: The resource that the selected source will use. Supported inputs depend on the source.
* `sources`: An array of source loaders with runtime factories. A one-element array uses that source directly; multiple candidates use `core.type` or best-effort selection.
* `options`: One flat options object, with shared `core` controls beside source and parser namespaces. Options and the returned source type are inferred from the supplied factories.

Returns:

* A valid runtime data source.

## Options[​](#options "Direct link to Options")

See [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options) for the shared options convention, loading controls, parser options, precedence, and TypeScript behavior. Source-specific settings are documented on each source loader’s reference page.
