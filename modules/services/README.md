# @loaders.gl/services

Framework-independent sources for geospatial service APIs.

This package is the home for ArcGIS REST service integrations including FeatureServer, ImageServer,
MapServer, and VectorTileServer sources. OGC protocol implementations remain in `@loaders.gl/wms`.

ArcGIS sources are owned and exported exclusively by this package. OGC protocol implementations, including WMS, WMTS, WFS, GML, and CSW, are exported by `@loaders.gl/wms`.

```ts
import {createDataSource, load} from '@loaders.gl/core';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const featureSource = createDataSource(
  'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
  SERVICE_LOADERS,
  {}
);

const imageSource = createDataSource(
  'https://example.com/arcgis/rest/services/Elevation/ImageServer',
  SERVICE_LOADERS,
  {}
);

const mapTileSource = createDataSource(
  'https://example.com/arcgis/rest/services/World/MapServer',
  SERVICE_LOADERS,
  {}
);

// `load` accepts the same registry and returns the selected runtime source.
const source = await load(serviceUrl, SERVICE_LOADERS, {
  core: {type: 'arcgis-feature-server'}
});
```

| Service | Generic contract | Output |
| --- | --- | --- |
| FeatureServer | `VectorSource` | GeoJSON, binary, or Arrow features |
| ImageServer | `ImageSource` | Rendered images or decoded LERC rasters |
| ImageServer tiles | `TileSource` | Image or LERC tiles |
| MapServer | `TileSource` | Cached or dynamically exported image tiles |
| VectorTileServer | `VectorTileSource` | Raw MVT or decoded WGS84 features |

The same source adapters provide normalized metadata and the generic vector, image, and tile APIs
used by loaders.gl and deck.gl integrations. `SourceLayer` from `@loaders.gl/deck-layers` accepts
`SERVICE_LOADERS` directly.

See the [complete service guide](https://loaders.gl/docs/modules/services) and the feature table on
each service page.
