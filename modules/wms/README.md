# @loaders.gl/wms

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for the WMS format.

For documentation please visit the [website](https://loaders.gl).

## WMTS and ArcGIS map tiles

WMTS and cached ArcGIS MapServer services are available through the shared `TileSource` API:

```ts
import {ArcGISMapTileSource, WMTSImageTileSource} from '@loaders.gl/wms';

const wmts = new WMTSImageTileSource('https://example.com/wmts', {
  wmts: {
    layer: 'basemap',
    tileMatrixSet: 'GoogleMapsCompatible',
    urlTemplate: 'https://example.com/wmts/{TileMatrix}/{TileRow}/{TileCol}.png'
  }
});

const arcgis = new ArcGISMapTileSource(
  'https://example.com/arcgis/rest/services/Basemap/MapServer'
);
```

Both sources provide `getTile`, `getTileData`, and `getTileURL`. WMTS supports REST templates and
KVP `GetTile` requests; ArcGIS uses the cached `/tile/{z}/{y}/{x}` endpoint by default.
