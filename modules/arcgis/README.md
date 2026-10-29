# @loaders.gl/arcgis

ArcGIS REST sources for feature, map, imagery, vector tile, and scene services.

Supported formats: ArcGIS, FeatureServer, MapServer, ImageServer, VectorTileServer, SceneServer, PBF, JSON, GeoJSON.

Use data already published in ArcGIS Online or ArcGIS Enterprise from your own JavaScript
application. Connect to existing feature, map, imagery, vector tile and scene services without
exporting or republishing the data.

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

// Copy your layer's REST URL from its ArcGIS item page or Services Directory.
const source = await load(featureLayerUrl, ArcGISFeatureServerSourceLoader);
const features = await source.getFeatures({format: 'geojson'});
```

Feature queries automatically retrieve bounded pages: ordered offsets when the layer advertises
pagination and ordering, otherwise object-ID batches. `getFeatures()` uses a 100,000-record default
cap and throws if it cannot establish completeness. Use `queryFeatures()` to configure the cap and
inspect partial results, `queryFeaturePages()` to consume pages progressively, or
`queryFeaturePage()` to request just one page. These checks do not provide a snapshot of a service
being edited. See the [feature query guide](https://loaders.gl/docs/developer-guide/arcgis/feature-layers).

## Connect to your organization

Public services need no credential. For secured layers, obtain a token through your application's
ArcGIS sign-in/session library and pass it through `ArcGISAuthentication` from
`@loaders.gl/arcgis/authentication`. It supports application-managed token renewal and exact trusted
origins; loaders.gl does not implement sign-in. Portal and service hosts may differ. Confirm item
sharing, service privileges and browser CORS access before deploying.

See [authentication](https://loaders.gl/docs/developer-guide/arcgis/authentication) and
[connection troubleshooting](https://loaders.gl/docs/developer-guide/arcgis/troubleshooting).

## Choose imports and outputs

The root exports lightweight service loaders. Async `load()` and deck.gl `SourceLayer` import the
selected implementation on demand. For synchronous `createDataSource()` or direct source classes,
use `@loaders.gl/arcgis/bundled`; network requests remain asynchronous. Authentication, discovery,
item resolution and scene aggregation have dedicated subpaths.

The clients implement selected read operations, not full ArcGIS API parity. ImageServer tiles use
dynamic exports rather than native cached tiles. Map images preserve server rendering; feature
and vector tile outputs need application styling. Web map symbology, popups and editing tools are
not reproduced automatically.

- [Use your existing ArcGIS data](https://loaders.gl/docs/developer-guide/arcgis)
- [Service protocols, formats and support](https://loaders.gl/docs/modules/arcgis)
- [Complete service inventory and limitations](https://loaders.gl/docs/modules/arcgis/services)
- [Examples](https://loaders.gl/examples/arcgis)

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
