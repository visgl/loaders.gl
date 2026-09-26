# @loaders.gl/arcgis

Framework-independent ArcGIS REST data sources for geospatial visualization.

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(featureLayerUrl, ArcGISFeatureServerSourceLoader);
const features = await source.getFeatures({format: 'geojson'});
```

The root exports lightweight source descriptors and types. Async `load()` and deck.gl
`SourceLayer` load the selected implementation on demand. Direct synchronous construction uses
an explicit implementation subpath such as `@loaders.gl/arcgis/arcgis-feature-server-source-loader`.

FeatureServer, MapServer, ImageServer, VectorTileServer and SceneServer adapters implement specific
read operations, not full ArcGIS API parity. Feature queries currently issue one request; automatic
paging is not implemented. ImageServer tiles use dynamic exports, not native cached tiles.

- [Developer guide](https://loaders.gl/docs/developer-guide/arcgis)
- [Service inventory and limitations](https://loaders.gl/docs/modules/arcgis/services)
- [Authentication](https://loaders.gl/docs/developer-guide/arcgis/authentication)
- [Examples](https://loaders.gl/examples/arcgis)
