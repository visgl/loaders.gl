# ArcGIS VectorTileServer

`ArcGISVectorTileServerSourceLoader` provides a source adapter for ArcGIS vector tile services.
It loads service metadata, exposes the ArcGIS tile grid, constructs PBF tile URLs, and exposes the
published Mapbox style and sprite resources.

```js
import {ArcGISVectorTileServerSourceLoader} from '@loaders.gl/services';
import {createDataSource} from '@loaders.gl/core';

const source = createDataSource(
  'https://example.com/arcgis/rest/services/World/VectorTileServer',
  [ArcGISVectorTileServerSourceLoader]
);

const metadata = await source.getMetadata();
const tileBytes = await source.getTile({z: 4, x: 6, y: 7});
```

The adapter returns raw PBF bytes so applications can decode them with the existing
`@loaders.gl/mvt` loader. Authentication and request overrides are supplied through the normal
load-options mechanism.

ArcGIS documents the service resource at
[Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/).
