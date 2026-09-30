# @loaders.gl/arcgis

Framework-independent ArcGIS REST data sources for geospatial visualization.

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(featureLayerUrl, ArcGISFeatureServerSourceLoader);
const features = await source.getFeatures({format: 'geojson'});
```

Import lightweight service loaders from `@loaders.gl/arcgis` and `ArcGISAuthentication` from
`@loaders.gl/arcgis/authentication`. The auth object accepts an application-managed token callback
and provides `createFetch()` for scoped requests; sign-in SDKs remain application dependencies.
Authentication and discovery helpers have dedicated `/authentication` and `/discovery` entrypoints.
Async `load()` and deck.gl `SourceLayer` import the selected service implementation on demand.
For synchronous `createDataSource()` or direct source classes, import the same names from
`@loaders.gl/arcgis/bundled`. Service requests remain asynchronous.

FeatureServer, MapServer, ImageServer, VectorTileServer and SceneServer adapters implement specific
read operations, not full ArcGIS API parity. Feature queries currently issue one request; automatic
paging is not implemented. ImageServer tiles use dynamic exports, not native cached tiles.

- [Developer guide](https://loaders.gl/docs/developer-guide/arcgis)
- [Service inventory and limitations](https://loaders.gl/docs/modules/arcgis/services)
- [Authentication](https://loaders.gl/docs/developer-guide/arcgis/authentication)
- [Examples](https://loaders.gl/examples/arcgis)
