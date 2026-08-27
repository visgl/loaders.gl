# @loaders.gl/wms

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for the WMS format.

For documentation please visit the [website](https://loaders.gl).

## WMTS tile sources

WMTS services are available through the shared `TileSource` API:

```ts
import {WMTSImageTileSource} from '@loaders.gl/wms';

const wmts = new WMTSImageTileSource('https://example.com/wmts', {
  wmts: {
    layer: 'basemap',
    tileMatrixSet: 'GoogleMapsCompatible',
    urlTemplate: 'https://example.com/wmts/{TileMatrix}/{TileRow}/{TileCol}.png'
  }
});

```

The source provides `getTile`, `getTileData`, and `getTileURL`, and supports REST templates and KVP
`GetTile` requests. ArcGIS tile sources are provided by `@loaders.gl/services`.
