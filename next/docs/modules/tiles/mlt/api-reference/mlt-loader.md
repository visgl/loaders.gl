MLT API · vector tiles

# Decode a compact tile into application data.

MLTLoader parses a MapLibre Tile payload and exposes its feature tables as an Arrow table with GeoArrow geometry by default, with GeoJSON and binary geometry available when requested.

[MLT module](https://loaders.gl/next/docs/modules/tiles/mlt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt.md)[MLT format](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)[MLT source](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md)

The MLT loader path

## Decode bytes first. Choose coordinates at the edge.

MLTLoader keeps binary tile decoding separate from tile addressing. The same payload can stay in local tile space for rendering or be converted to WGS84 when the tile index is available.

01

Input

One MapLibre Tile binary payload

02

Tables

Named feature tables with geometry and attributes

03

Output

Arrow table with GeoArrow geometry by default

04

Coordinates

Local tile space by default; WGS84 is optional

Detailed guide

## MLTLoader reference

The sections below document installation, output shapes, coordinate options, tile indexes, and parser behavior.

![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)

Loader for the [MapLibre Tile (MLT)](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md) geospatial tile format.

| MLTLoader      |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| File Extension | `.mlt`                                                                              |
| File Type      | Binary                                                                              |
| File Format    | [MapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md) |
| MIME Types     | `application/vnd.maplibre-tile`                                                     |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)        |
| Supported APIs | `load`, `parse`, `parseSync`                                                        |
| Worker Thread  | Not available for this loader                                                       |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/tiles

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {MLTLoader} from '@loaders.gl/tiles/mlt';

import {load} from '@loaders.gl/core';



const tileFeatures = await load(url, MLTLoader);
```

### Geometry in local tile space[​](#geometry-in-local-tile-space "Direct link to Geometry in local tile space")

By default, `MLTLoader` returns an Arrow table with a WKB-compatible GeoArrow geometry column using local tile coordinates in `[0, 1]` space:

```
import {MLTLoader} from '@loaders.gl/tiles/mlt';

import {load} from '@loaders.gl/core';



const arrowTable = await load(url, MLTLoader);
```

### Geometry in WGS84[​](#geometry-in-wgs84 "Direct link to Geometry in WGS84")

Set `coordinates: 'wgs84'` and provide the tile index to get longitude / latitude coordinates:

```
import {MLTLoader} from '@loaders.gl/tiles/mlt';

import {load} from '@loaders.gl/core';



const geoJSONfeatures = await load(url, MLTLoader, {

  mlt: {

    coordinates: 'wgs84',

    tileIndex: {

      x: tileX,

      y: tileY,

      z: tileZ

    }

  }

});
```

### Output shapes[​](#output-shapes "Direct link to Output shapes")

| `shape` option            | Output                             |
| ------------------------- | ---------------------------------- |
| `'arrow-table'` (default) | Arrow table with GeoArrow geometry |
| `'binary-geometry'`       | binary feature collection          |
| `'geojson-table'`         | `GeoJSONTable`                     |

## Options[​](#options "Direct link to Options")

| Option                        | Type                                                    | Default                         | Description                                        |
| ----------------------------- | ------------------------------------------------------- | ------------------------------- | -------------------------------------------------- |
| `mlt.shape`                   | `'geojson-table' \| 'binary-geometry' \| 'arrow-table'` | `arrow-table`                   | Output shape                                       |
| `geoarrow.encodingPreference` | `'geoarrow.wkb' \| 'geoarrow.geometry' \| 'optimized'`  | `geoarrow.wkb` for Arrow output | Arrow geometry encoding preference                 |
| `mlt.coordinates`             | `'local' \| 'wgs84'`                                    | `local`                         | Coordinate system for returned geometries          |
| `mlt.tileIndex`               | `{x: number, y: number, z: number}`                     | N/A                             | Required when `coordinates` is `wgs84`             |
| `mlt.layerProperty`           | `string`                                                | `layerName`                     | Name of layer property added to feature properties |
| `mlt.layers`                  | `string[]`                                              | N/A                             | Restrict parsing to specific tile layers           |

`mlt.tileIndex` is required for WGS84 output.

When `mlt.shape` is `'arrow-table'` (the default), the decoder writes directly from MLT's decoded geometry and property columns. It does not materialize an intermediate GeoJSON feature collection. Use `geoarrow.encodingPreference` to select WKB, dense-union GeoArrow, or the optimized native GeoArrow encoding.

To preserve the legacy GeoJSON default, set `mlt.shape: 'geojson-table'` explicitly.

## Additional examples[​](#additional-examples "Direct link to Additional examples")

* [Loaders.gl MLT website example](https://loaders.gl/next/examples/tiles/mlt).
* [MLTSourceLoader](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md) for URL tile sets.

## Attribution[​](#attribution "Direct link to Attribution")

`MLTLoader` implements loaders.gl integration, GeoJSON table and binary geometry shaping, and coordinate projection around the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder and the [MapLibre Tile specification](https://github.com/maplibre/maplibre-tile-spec).
