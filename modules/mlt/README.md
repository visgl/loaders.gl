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

// Parse as an Arrow table with WKB-compatible GeoArrow geometry
const arrowTable = await parse(arrayBuffer, MLTLoader);

// Parse as an Arrow table with WGS84 (lng/lat) coordinates
const arrowTableWgs84 = await parse(arrayBuffer, MLTLoader, {
  mlt: {
    coordinates: 'wgs84',
    tileIndex: {x: 0, y: 0, z: 0}
  }
});

// Opt into the legacy GeoJSON table shape when needed
const geojsonTable = await parse(arrayBuffer, MLTLoader, {
  mlt: {shape: 'geojson-table'}
});
```

## Loaders and Writers

| Loader                                                    |
| --------------------------------------------------------- |
| [`MLTLoader`](/docs/modules/mlt/api-reference/mlt-loader) |

## Sources

| Source                                                    |
| --------------------------------------------------------- |
| [`MLTSourceLoader`](/docs/modules/mlt/api-reference/mlt-source-loader) |

## About MLT

The MapLibre Tile format is a column-oriented vector tile format that offers:

- Significantly higher compression ratios compared to MVT (up to 6x on large tiles)
- Optimized decoding performance
- Support for the 2D geometry surface exposed by the current JavaScript decoder
- Advanced encoding (run-length, FastPFor, FSST)
- Additional MLT types remain decoder-dependent and are documented in the format reference

## Attribution

This loader uses the [`@maplibre/mlt`](https://www.npmjs.com/package/@maplibre/mlt) package to decode MLT tiles.
