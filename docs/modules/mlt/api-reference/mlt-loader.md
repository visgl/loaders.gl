# MLTLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Loader for the [MapLibre Tile (MLT)](/docs/modules/mlt/formats/mlt) geospatial tile format.

| Loader         | Characteristic                                 |
| -------------- | ---------------------------------------------- |
| File Extension | `.mlt`                                         |
| File Type      | Binary                                         |
| File Format    | [MapLibre Tile](/docs/modules/mlt/formats/mlt) |
| MIME Types     | `application/vnd.maplibre-tile`                |
| Data Format    | [Geometry](/docs/specifications/category-gis)  |
| Supported APIs | `load`, `parse`, `parseSync`                   |
| Worker Thread  | Not available for this loader                  |

## Installation

```bash
npm install @loaders.gl/mlt
npm install @loaders.gl/core
```

## Usage

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {load} from '@loaders.gl/core';

const tileFeatures = await load(url, MLTLoader);
```

### Geometry in local tile space

By default, `MLTLoader` returns GeoJSON features using local tile coordinates in `[0, 1]` space:

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MLTLoader);
```

### Geometry in WGS84

Set `coordinates: 'wgs84'` and provide the tile index to get longitude / latitude coordinates:

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
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

### Output shapes

| `shape` option        | Output                    |
| --------------------- | ------------------------- |
| `'geojson'` (default) | `Feature[]`               |
| `'geojson-table'`     | `GeoJSONTable`            |
| `'binary'`            | binary feature collection |

## Options

| Option              | Type                                       | Default     | Description                                                    |
| ------------------- | ------------------------------------------ | ----------- | -------------------------------------------------------------- |
| `mlt.shape`         | `'geojson-table' \| 'geojson' \| 'binary'` | `geojson`   | Output shape: GeoJSON array, GeoJSON table, or binary features |
| `mlt.coordinates`   | `'local' \| 'wgs84'`                       | `local`     | Coordinate system for returned geometries                      |
| `mlt.tileIndex`     | `{x: number, y: number, z: number}`        | N/A         | Required when `coordinates` is `wgs84`                         |
| `mlt.layerProperty` | `string`                                   | `layerName` | Name of layer property added to feature properties             |
| `mlt.layers`        | `string[]`                                 | N/A         | Restrict parsing to specific tile layers                       |

`mlt.tileIndex` is required for WGS84 output.

## Additional examples

- [Loaders.gl MLT website example](/examples/tiles/mlt).
- [MLTSource](/docs/modules/mlt/api-reference/mlt-source) for URL tile sets.

## Attribution

`MLTLoader` implements loaders.gl integration, GeoJSON/binary shaping, and coordinate projection around the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder and the [MapLibre Tile specification](https://github.com/maplibre/maplibre-tile-spec).
