# GeoJSONTileSource

The `GeoJSONTileSource` slices large GeoJSON data into small vector tiles on the fly.

The primary intended use case is to enable rendering and interacting with large geospatial datasets
in the browser (without requiring data to be pre-tiled and tiles to be served from a server).

The resulting tiles conform to the JSON output of the [`MVTLoader`](./mvt-loader)
(which loads pre-tiled tiles in the [vector tile specification](https://github.com/mapbox/vector-tile-spec/)
into GeoJSON format).

To make data rendering and interaction fast, the GeoJSON content in the generated tiles
is not only cut out from the larger input GeoJSON. It are also optimized further to only
retain the minimum level of detail appropriate for each zoom level
(shapes are simplified and tiny polygons and line segments are filtered out).

<!--
There's a convenient [example](http://mapbox.github.io/geojson-vt/debug/) to test out **GeoJSONTileSource** on different data. Just drag any GeoJSON on the page, watching the console.
--->

### Install

Install using NPM (`npm install @loaders.gl/mvt`) or Yarn (`yarn install @loaders.gl/mvt`).

TBD - Or use a browser build directly:

```html
<script src="https://unpkg.com/@loaders.gl/mvt/dist.min.js"></script>
```

### Usage

```typescript
import {GeoJSONTileSource} from '@loaders.gl/mvt';

// build an initial index of tiles
const tileSource = new GeoJSONTileSource(geoJSON);

// request a particular tile
const features = tileSource.getTile(z, x, y).features;

// show an array of tile coordinates created so far
console.log(tileSource.tileCoords); // [{z: 0, x: 0, y: 0}, ...]
```

### Options

You can fine-tune the results with an options object,
although the defaults are sensible and work well for most use cases.

| Option           | Default  | Description                                                          |
| ---------------- | -------- | -------------------------------------------------------------------- |
| `indexMaxZoom`   | `5`      | Max zoom in the initial tile index                                   |
| `indexMaxPoints` | `100000` | Max number of points per tile in the index                           |
| `maxZoom`        | `14`     | Max zoom to preserve detail on; can't be higher than 24              |
| `tolerance`      | `3`      | Simplification tolerance (higher means simpler)                      |
| `extent`         | `4096`   | tile extent (both width and height)                                  |
| `buffer`         | `64`     | Tile buffer on each side                                             |
| `promoteId`      | N/A      | Name of a feature property to use for feature.id.                    |
| `generateId`     | `false`  | Whether to generate feature ids.                                     |
| `debug`          | `0`      | Logging level (0 to disable, 1 or 2)                                 |
| `lineMetrics`    | `false`  | Enable line metrics tracking for LineString/MultiLineString features |


```typescript
import {GeoJSONTileSource} from '@loaders.gl/mvt`
const tileSource = new GeoJSONTileSource(parsedGeojson, {
	indexMaxZoom: 5,  // max zoom in the initial tile index
	maxZoom: 14,      // max zoom to preserve detail on; can't be higher than 24
	tolerance: 3,     // simplification tolerance (higher means simpler)
	extent: 4096,     // tile extent (both width and height)
	buffer: 64,   // tile buffer on each side
	debug: 0,     // logging level (0 to disable, 1 or 2)
	lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
	promoteId: null,    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
	generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
	indexMaxPoints: 100000 // max number of points per tile in the index
});
```

Remarks:

- GeoJSONTileSource only operates on zoom levels up to 24.
- `generateId` and `promoteId` cannot both be specified at the same time.
- The `promoteId` and `generateId` options ignore existing `id` values on the feature objects.
- By default, tiles at zoom levels above `indexMaxZoom` are generated on the fly, but you can pre-generate all possible tiles for `data` by setting `indexMaxZoom` and `maxZoom` to the same value, setting `indexMaxPoints` to `0`, and then accessing the resulting tile coordinates from the `tileCoords` property of `tileSource`.


## Attribution

This class is a fork of Mapbox / Vladimir Agafonkin's wonderful [geojson-vt](https://github.com/mapbox/geojson-vt) module.

This directory is forked from Mapbox's https://github.com/mapbox/geojson-vt under ISC License.
