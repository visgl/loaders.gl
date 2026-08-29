---
title: TableTileSourceLoader
description: Build vector tiles on demand from a large in-browser table.
hide_title: true
page_style: designed
---

import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MVT module · source API"
  title="TableTileSourceLoader"
  description="Create simplified vector tiles from a table with geometry, so a browser can render a larger in-memory dataset without drawing every feature on every frame."
  tone="blue"
  meta={['From v5.0', 'Table to tiles', 'On-demand simplification']}
  links={[
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'},
    {label: 'MVTLoader', to: '/docs/modules/mvt/api-reference/mvt-loader'},
    {label: 'Tile sources', to: '/docs/modules/mvt'}
  ]}
/>

<TileDocsTabs active="table-tile-source-loader" />

<DocOrientation
  eyebrow="What it does"
  title="Use tiles as a rendering boundary, even without a tile server."
  description="The source indexes an in-memory table, simplifies geometry for each zoom level, and serves tile-shaped results compatible with MVT workflows."
  tone="blue"
  items={[
    {label: 'Input', value: 'A table containing geometry columns'},
    {label: 'Index', value: 'An in-browser zoom and tile index'},
    {label: 'Geometry', value: 'Clipped and simplified per zoom'},
    {label: 'Output', value: 'GeoJSON-compatible vector tile data'}
  ]}
/>

<ReferenceBoundary
  title="TableTileSourceLoader reference"
  description="The sections below cover use cases, installation, source creation, and output format."
  tone="blue"
/>

The `TableTileSourceLoader` slices large GeoJSON datasets into small vector tiles on the fly.
Can enable rendering and interacting with large geospatial datasets
in the browser without requiring data to be pre-tiled and tiles to be served from a server.

| Source         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | N/A - Any table with geometries                      |
| File Type      | Binary Archive                                       |
| File Format    | [Mapbox Vector Tiles](/docs/modules/mvt/formats/mvt) |
| Data Format    | GeoJSON                                              |

Features:

- **Visualize bigger datasets** - Useful for datasets in the "mid-size" range (perhaps from 100MB-1GB), where the dataset is "small" enough to be fully loaded into the browser,
  but is big enough that rendering the entire dataset every frame is too slow.
- **`MVTLoader` compatibility\*** - The resulting tiles conform to the output of the [`MVTLoader`](./mvt-loader)
  (which loads pre-tiled tiles into GeoJSON format).
- **Geometry simplification** - The geometry content in the generated tiles
  is cut out from the larger input GeoJSON, and optimized further to only
  retain the minimum level of detail appropriate for each zoom level
  (shapes are simplified and tiny polygons and line segments are filtered out).

{/*
There's a convenient [example](http://mapbox.github.io/geojson-vt/debug/) to test out **TableTileSourceLoader** on different data. Just drag any GeoJSON on the page, watching the console.
*/}

### Install

```sh
npm install @loaders.gl/mvt
```

Or just import via a browser script tag:

```html
<script src="https://unpkg.com/@loaders.gl/mvt/dist/dist.min.js"></script>
```

### Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {TableTileSourceLoader} from '@loaders.gl/mvt';
import {GeoJSONLoader} from '@loaders.gl/json';

// build an initial index of tiles.,
const tileSource = createDataSource(url, [TableTileSourceLoader], {
	core: {
		loaders: [GeoJSONLoader]
	}
};

// request a particular tile
const features = tileSource.getTile(z, x, y).features;
```

## Output Format

The tiles are in geojson table format.

## Options

You can fine-tune the results with an options object,
although the defaults are sensible and work well for most use cases.

| Option                 | Default   | Description                                                          |
| ---------------------- | --------- | -------------------------------------------------------------------- |
| `table.coordinates`    | `'wgs84'` | Set to`'local'` to return tile-relative coordinates [`0-1`].         |
| `table.maxZoom`        | `14`      | Max zoom to preserve detail on; can't be higher than 24              |
| `table.generateId`     | `false`   | Whether to generate feature ids.                                     |
| `table.promoteId`      | N/A       | Name of a feature property to use for feature.id.                    |
| `table.tolerance`      | `3`       | Simplification tolerance (higher means simpler)                      |
| `table.indexMaxZoom`   | `5`       | Max zoom in the initial tile index                                   |
| `table.indexMaxPoints` | `100000`  | Max number of points per tile in the index                           |
| `table.debug`          | `0`       | Logging level (0 to disable, 1 or 2)                                 |
| `table.lineMetrics`    | `false`   | Enable line metrics tracking for LineString/MultiLineString features |
| `table.extent`         | `4096`    | tile extent (both width and height)                                  |
| `table.buffer`         | `64`      | Tile buffer on each side                                             |

```typescript
import {createDataSource} from '@loaders.gl/core';
import {TableTileSourceLoader} from '@loaders.gl/mvt`
const tileSource = createDataSource(parsedGeojson, [TableTileSourceLoader], {
	maxZoom: 14,      // max zoom to preserve detail on; can't be higher than 24
	tolerance: 3,     // simplification tolerance (higher means simpler)
	debug: 0,     // logging level (0 to disable, 1 or 2)
	lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
	promoteId: null,    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
	generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
	indexMaxZoom: 5,  // max zoom in the initial tile index
	indexMaxPoints: 100000, // max number of points per tile in the index
	extent: 4096,     // tile extent (both width and height)
	buffer: 64,   // tile buffer on each side
});
```

Remarks:

- `generateId` and `promoteId` options cannot both be specified at the same time.
- `generateId` and `promoteId` options ignore existing `id` values on the feature objects.
- By default, tiles at zoom levels above `indexMaxZoom` are generated on the fly, but you can pre-generate all possible tiles for `data` by setting `indexMaxZoom` and `maxZoom` to the same value, setting `indexMaxPoints` to `0`.
- `TableTileSourceLoader` only generates tiles zoom levels up to 24.

## Methods

### constructor

```ts
new TableTileSourceLoader(geojson: GeoJSONTable | Promise<GeoJSONTable>);
```

## Attribution

Includes a fork of Mapbox / Vladimir Agafonkin's [geojson-vt](https://github.com/mapbox/geojson-vt) module which is under ISC License.
