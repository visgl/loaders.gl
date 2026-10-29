MVT module · source API

# TableTileSourceLoader

Create simplified vector tiles from a table with geometry, so a browser can render a larger in-memory dataset without drawing every feature on every frame.

[MVT format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[MVTLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)[Tile sources](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)

[Try MVT](https://loaders.gl/next/examples/tiles/mvt)[Try PMTiles](https://loaders.gl/next/examples/tiles/pmtiles)[Create PMTiles](https://loaders.gl/next/examples/tiles/pmtiles-authoring)[Try Arrow Tiler](https://loaders.gl/next/examples/tiles/table-tiler)[Try MLT](https://loaders.gl/next/examples/tiles/mlt)[MVT](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)[Arrow Table Tiler](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md)[TableTileSourceLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/table-tile-source-loader.md)[MLT](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

What it does

## Use tiles as a rendering boundary, even without a tile server.

The source indexes an in-memory table, simplifies geometry for each zoom level, and serves tile-shaped results compatible with MVT workflows.

01

Input

A table containing geometry columns

02

Index

An in-browser zoom and tile index

03

Geometry

Clipped and simplified per zoom

04

Output

GeoJSON-compatible vector tile data

Detailed guide

## TableTileSourceLoader reference

The sections below cover use cases, installation, source creation, and output format.

The `TableTileSourceLoader` slices a GeoJSON table into small vector tiles on the fly. This can enable rendering and interaction with a larger in-browser dataset without requiring the data to be pre-tiled or served from a tile server.

For Arrow input and consistent Arrow tile output, use the separate [`ArrowTableTileSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md). This source's GeoJSON behavior is unchanged.

| Source         | Characteristic                                                                            |
| -------------- | ----------------------------------------------------------------------------------------- |
| File Extension | N/A - Any table with geometries                                                           |
| File Type      | In-memory table                                                                           |
| File Format    | [Mapbox Vector Tiles](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md) |
| Data Format    | GeoJSON table                                                                             |

Features:

* **Visualize bigger datasets** - Useful for datasets in the "mid-size" range (perhaps from 100MB-1GB), where the dataset is "small" enough to be fully loaded into the browser, but is big enough that rendering the entire dataset every frame is too slow.
* **`MVTLoader` compatibility\*** - The resulting tiles conform to the output of the [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md) (which loads pre-tiled tiles into GeoJSON format).
* **Geometry simplification** - The geometry content in the generated tiles is cut out from the larger input GeoJSON, and optimized further to only retain the minimum level of detail appropriate for each zoom level (shapes are simplified and tiny polygons and line segments are filtered out).

<!-- -->

### Install[​](#install "Direct link to Install")

```
npm install @loaders.gl/tiles
```

Or just import via a browser script tag:

```
<script src="https://unpkg.com/@loaders.gl/tiles/mvt/dist/dist.min.js"></script>
```

### Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {TableTileSourceLoader} from '@loaders.gl/tiles/mvt';

import {GeoJSONLoader} from '@loaders.gl/tables/json';



// Build an initial index of tiles.

const tileSource = createDataSource(url, [TableTileSourceLoader], {

  core: {

    loaders: [GeoJSONLoader]

  }

});



// Request a particular tile.

const tile = await tileSource.getTile({z: 5, x: 10, y: 12});

const features = tile?.features || [];
```

## Output Format[​](#output-format "Direct link to Output Format")

The tiles are in geojson table format.

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

You can fine-tune the results with an options object, although the defaults are sensible and work well for most use cases.

| Option                   | Default     | Description                                                          |
| ------------------------ | ----------- | -------------------------------------------------------------------- |
| `table.coordinates`      | `'local'`   | Set to `'wgs84'` to return longitude/latitude coordinates.           |
| `table.maxZoom`          | `14`        | Max zoom to preserve detail on; can't be higher than 24              |
| `table.generateId`       | `undefined` | Whether to generate feature ids.                                     |
| `table.promoteId`        | `undefined` | Name of a feature property to use for feature.id.                    |
| `table.tolerance`        | `3`         | Simplification tolerance (higher means simpler)                      |
| `table.indexMaxZoom`     | `5`         | Max zoom in the initial tile index                                   |
| `table.maxPointsPerTile` | `10000`     | Max number of points per tile in the index                           |
| `table.debug`            | `undefined` | Logging level (0 to disable, 1 or 2)                                 |
| `table.lineMetrics`      | `false`     | Enable line metrics tracking for LineString/MultiLineString features |
| `table.extent`           | `4096`      | tile extent (both width and height)                                  |
| `table.buffer`           | `64`        | Tile buffer on each side                                             |

```
import {createDataSource} from '@loaders.gl/core';

import {TableTileSourceLoader} from '@loaders.gl/tiles/mvt';



const tileSource = createDataSource(parsedGeojson, [TableTileSourceLoader], {

  table: {

    coordinates: 'local',

    maxZoom: 14,

    tolerance: 3,

    lineMetrics: false,

    indexMaxZoom: 5,

    maxPointsPerTile: 10000,

    extent: 4096,

    buffer: 64

  }

});
```

Remarks:

* `generateId` and `promoteId` options cannot both be specified at the same time.
* `generateId` and `promoteId` options ignore existing `id` values on the feature objects.
* By default, tiles at zoom levels above `indexMaxZoom` are generated on the fly, but you can pre-generate all possible tiles for `data` by setting `indexMaxZoom` and `maxZoom` to the same value, setting `maxPointsPerTile` to `0`.
* `TableTileSourceLoader` only generates tiles zoom levels up to 24.

## Source creation[​](#source-creation "Direct link to Source creation")

Create a source directly from an already parsed GeoJSON table when the application does not need core's source auto-selection:

```
const tileSource = TableTileSourceLoader.createDataSource(parsedGeojson, {

  table: {coordinates: 'local'}

});



await tileSource.ready;
```

## Attribution[​](#attribution "Direct link to Attribution")

Includes a fork of Mapbox / Vladimir Agafonkin's [geojson-vt](https://github.com/mapbox/geojson-vt) module which is under ISC License.
