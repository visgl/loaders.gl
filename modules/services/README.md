# @loaders.gl/services

Framework-independent sources for geospatial service APIs.

This package is the home for ArcGIS REST service integrations including FeatureServer, ImageServer, MapServer, and VectorTileServer sources. OGC protocol implementations remain in `@loaders.gl/wms`; STAC and other catalog services are intentionally out of scope for this initial package.

ArcGIS sources are owned and exported exclusively by this package. OGC protocol implementations, including WMS, WMTS, WFS, GML, and CSW, are exported by `@loaders.gl/wms`.

```ts
import {createDataSource} from '@loaders.gl/core';
import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISMapTileSourceLoader
} from '@loaders.gl/services';

const features = await createDataSource(
  'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
  [ArcGISFeatureServerSourceLoader]
);

const imagery = await createDataSource(
  'https://example.com/arcgis/rest/services/Elevation/ImageServer',
  [ArcGISImageServerSourceLoader]
);

const mapTiles = await createDataSource(
  'https://example.com/arcgis/rest/services/World/MapServer',
  [ArcGISMapTileSourceLoader]
);
```

The same source adapters provide normalized metadata and the generic vector, image, and tile APIs used by loaders.gl and deck.gl integrations.

For documentation, visit the [loaders.gl website](https://loaders.gl/docs).
