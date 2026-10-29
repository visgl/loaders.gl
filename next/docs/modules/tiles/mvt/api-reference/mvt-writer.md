MVT module · writer API

# MVTWriter

Encode GeoJSON-style geometry as a compact Mapbox Vector Tile, with control over layer naming, tile extent, version, and coordinate projection.

[MVT format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[MVTLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)[MVT module](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)

What it writes

## Package geometry for tile delivery.

MVTWriter turns feature geometry and properties into the protobuf tile payload expected by vector-tile clients and tile sources.

01

Input

GeoJSON-style geometry data

02

Output

Binary Mapbox Vector Tile

03

Layer

A named layer in the tile

04

Projection

Optional WGS84 to tile-space conversion

Detailed guide

## MVTWriter reference

The sections below document format metadata, installation, usage, and encoding options.

Writer for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

| MVTWriter      |                                                                              |
| -------------- | ---------------------------------------------------------------------------- |
| File Extension | `.mvt`,                                                                      |
| File Type      | Binary                                                                       |
| File Format    | [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/)    |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md) |
| Supported APIs | `encode`, `encodeSync`                                                       |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/tiles

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import {MVTWriter} from '@loaders.gl/tiles/mvt';



const arrayBuffer = await encode(geojson, MVTWriter, {

  mvt: {

    layerName: 'my-layer',

    version: 2,

    extent: 4096

  }

});
```

## Options[​](#options "Direct link to Options")

| Option        | Type                                | Default          | Description                                                          |
| ------------- | ----------------------------------- | ---------------- | -------------------------------------------------------------------- |
| mvt.layerName | `string`                            | `'geojsonLayer'` | Name of the single layer that will be written into the tile          |
| mvt.version   | `number`                            | `1`              | Vector tile specification version                                    |
| mvt.extent    | `number`                            | `4096`           | Extent of the vector tile grid                                       |
| mvt.tileIndex | `{x: number, y: number, z: number}` | `undefined`      | Optional tile index for projecting WGS84 coordinates into tile space |

## GeoArrow WKB tiles (from v5.0)[​](#geoarrow-wkb-tiles-from-v50 "Direct link to GeoArrow WKB tiles (from v5.0)")

`MVTWriter` also accepts a loaders.gl ArrowTable or Apache Arrow Table with a GeoArrow WKB geometry column. Attributes are read directly from Arrow vectors at the protobuf boundary, including sliced and multi-batch tables and dictionaries. It does not construct GeoJSON property rows.

Use the [Arrow tiler](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md) for geographic, native GeoArrow or WKT input. Its normalized local WKB tiles can be encoded directly:

```
const tile = await arrowTileSource.getTile({z: 1, x: 0, y: 0});

const bytes = tile && MVTWriter.encodeSync(tile, {mvt: {layerName: 'places', idColumn: 'id'}});
```

| Arrow option          | Default                                              | Meaning                                                                                                         |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `mvt.geometryColumn`  | GeoParquet primary column or sole GeoArrow WKB field | Geometry selection                                                                                              |
| `mvt.coordinates`     | `'local'`                                            | Explicit normalized local XY, extent-unit `'tile'`, or longitude/latitude `'wgs84'` requiring a valid tileIndex |
| `mvt.propertyColumns` | Non-geometry columns                                 | Select supported scalar attributes                                                                              |
| `mvt.idColumn`        | None                                                 | Nonnegative JavaScript-safe integer feature IDs                                                                 |
| `mvt.maxFeatures`     | `100000`                                             | Maximum Arrow rows before encoding                                                                              |
| `mvt.version`         | `2` for Arrow                                        | MVT version 1 or 2; legacy GeoJSON defaults remain unchanged                                                    |
| `mvt.extent`          | `4096`                                               | Integer extent from 1 through 65536 for Arrow                                                                   |

Arrow coordinate mode is explicit, with no coordinate-magnitude heuristic. Local coordinates may extend outside 0–1 to retain the clipping buffer. Declared geographic CRS requires explicit geographic coordinate mode; projected CRS must be reprojected first. Geographic projection clamps polar latitude to the Web Mercator limit. Geometry must be finite XY; polygons are closed and oriented according to MVT v2, and quantization-collapsed paths are omitted. A tile with no remaining features returns an empty ArrayBuffer, which export orchestration skips.

Supported attributes are nullable booleans, UTF-8 strings, finite numbers, and dictionaries of these scalars. Null properties are omitted. Arrow integer values outside the JavaScript safe integer range fail explicitly; supported negative integer extrema use exact double storage when signed zigzag cannot preserve them. Unsupported nested, date, binary and other column types fail rather than being stringified. This writer profile is in-memory and its row limit is not a vertex or peak-memory cap.

See [GeoArrow to PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/geoarrow-pmtiles.md) for a complete bounded export and browser download example.
