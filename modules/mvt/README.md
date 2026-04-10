# @loaders.gl/mvt

This module contains a geometry loader for Mapbox Vector Tiles (MVT) and a writer for generating MVT tiles from GeoJSON.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent visualization-focused loaders (parsers).

## Writing

Use the `MVTWriter` with `@loaders.gl/core`'s `encode` helper to serialize GeoJSON into a Mapbox Vector Tile `ArrayBuffer`.

```typescript
import {encode} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/mvt';

const arrayBuffer = await encode(geojson, MVTWriter, {
  mvt: {layerName: 'my-layer', version: 2, extent: 4096}
});
```
