# GeoJSONTileSource

The `GeoJSONTileSource` slices large GeoJSON datasets into small vector tiles on the fly.
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
- **`MVTLoader` compatibility*** - The resulting tiles conform to the output of the [`MVTLoader`](./mvt-loader)
(which loads pre-tiled tiles into GeoJSON format).
- **Geometry simplification** - The geometry content in the generated tiles
is cut out from the larger input GeoJSON, and optimized further to only
retain the minimum level of detail appropriate for each zoom level
(shapes are simplified and tiny polygons and line segments are filtered out). 

<!--
There's a convenient [example](http://mapbox.github.io/geojson-vt/debug/) to test out **GeoJSONTileSource** on different data. Just drag any GeoJSON on the page, watching the console.
--->

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
import {GeoJSONTileSource} from '@loaders.gl/mvt';
import {GeoJSONLoader} from '@loaders.gl/json';

// build an initial index of tiles. Convieniently, 
const tileSource = new GeoJSONTileSource(load(url, GeoJSONLoader));

// request a particular tile
const features = tileSource.getTile(z, x, y).features;
```

## Output Format

The tiles are in geojson table format.

## Options

You can fine-tune the results with an options object,
although the defaults are sensible and work well for most use cases.

| Option           | Default   | Description                                                          |
| ---------------- | --------- | -------------------------------------------------------------------- |
| `coordinates`    | `'wgs84'` | Set to`'local'` to return tile-relative coordinates [`0-1`].         |
| `maxZoom`        | `14`      | Max zoom to preserve detail on; can't be higher than 24              |
| `generateId`     | `false`   | Whether to generate feature ids.                                     |
| `promoteId`      | N/A       | Name of a feature property to use for feature.id.                    |
| `tolerance`      | `3`       | Simplification tolerance (higher means simpler)                      |
| `indexMaxZoom`   | `5`       | Max zoom in the initial tile index                                   |
| `indexMaxPoints` | `100000`  | Max number of points per tile in the index                           |
| `debug`          | `0`       | Logging level (0 to disable, 1 or 2)                                 |
| `lineMetrics`    | `false`   | Enable line metrics tracking for LineString/MultiLineString features |
| `extent`         | `4096`    | tile extent (both width and height)                                  |
| `buffer`         | `64`      | Tile buffer on each side                                             |


```typescript
import {GeoJSONTileSource} from '@loaders.gl/mvt`
const tileSource = new GeoJSONTileSource(parsedGeojson, {
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
- `GeoJSONTileSource` only generates tiles zoom levels up to 24.


## Methods

### constructor

```ts
new GeoJSONTileSource(geojson: GeoJSONTable | Promise<GeoJSONTable>);
```


## Attribution

Includes a fork of Mapbox / Vladimir Agafonkin's [geojson-vt](https://github.com/mapbox/geojson-vt) module which is under ISC License.
