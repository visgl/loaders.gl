# @loaders.gl/mlt

Loader for the [MapLibre Tile (MLT)](https://maplibre.org/maplibre-tile-spec/) format, a next-generation vector tile format designed as a successor to Mapbox Vector Tiles (MVT).

## Installation

```bash
npm install @loaders.gl/mlt
npm install @loaders.gl/core
```

## Usage

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {parse} from '@loaders.gl/core';

const response = await fetch('https://example.com/tiles/0/0/0.mlt');
const arrayBuffer = await response.arrayBuffer();

// Parse as GeoJSON features (local tile coordinates)
const features = await parse(arrayBuffer, MLTLoader);

// Parse as GeoJSON features in WGS84 (lng/lat) coordinates
const featuresWgs84 = await parse(arrayBuffer, MLTLoader, {
  mlt: {
    coordinates: 'wgs84',
    tileIndex: {x: 0, y: 0, z: 0}
  }
});
```

## Loaders and Writers

| Loader                                                    |
| --------------------------------------------------------- |
| [`MLTLoader`](/docs/modules/mlt/api-reference/mlt-loader) |

## About MLT

The MapLibre Tile format is a column-oriented vector tile format that offers:

- Significantly higher compression ratios compared to MVT (up to 6x on large tiles)
- Optimized decoding performance
- Support for 3D coordinates (including elevation)
- Advanced encoding (run-length, FastPFor, FSST)
- Nested properties and complex data types

## Attribution

This loader uses the [`@maplibre/mlt`](https://www.npmjs.com/package/@maplibre/mlt) package to decode MLT tiles.
