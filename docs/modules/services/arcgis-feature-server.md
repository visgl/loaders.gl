import {ClientExample} from '@site/src/components';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# ArcGIS FeatureServer

<WmsDocsTabs active="arcgis-feature-server" />

ArcGIS FeatureServer endpoints expose queryable vector feature layers through the ArcGIS REST API.
`ArcGISFeatureServerSourceLoader` adapts a service or layer endpoint to the loaders.gl
`VectorSource` contract.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| Service and layer endpoints | Supported | Accepts both `/FeatureServer` and `/FeatureServer/{layerId}` URLs |
| Metadata and layer discovery | Supported | `getMetadata()` normalizes names, titles, bounds, CRS, and child layers |
| Schema discovery | Supported | `getSchema()` maps ArcGIS fields to loaders.gl schema types |
| Spatial queries | Supported | `getFeatures()` sends viewport bounds through the ArcGIS `query` operation |
| Layer selection | Supported | Select with `layers`; a root service URL can target an explicit layer ID |
| Server-side query parameters | Supported | Configure `where`, output fields, geometry filters, spatial relationship, and precision |
| GeoJSON output | Supported | ArcGIS GeoJSON responses are parsed as vector-source data |
| Binary and Arrow output | Supported | Select through the standard vector source `format` option |
| Authentication | Supported | URL tokens, fetch headers, credentials, and custom fetch functions are preserved |
| Pagination | Not automated | The source performs one ArcGIS query per `getFeatures()` call |
| Editing and attachments | Not supported | The source is a read-only query client |
| deck.gl rendering | First class | Pass the source loader or `SERVICE_LOADERS` to `SourceLayer` |

## Create and query a source

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/services';

const source = createDataSource(
  'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
  [ArcGISFeatureServerSourceLoader]
);

const metadata = await source.getMetadata();
const features = await source.getFeatures({
  layers: ['0'],
  boundingBox: [[-86, 36], [-84, 39]]
});
```

When the URL points to the FeatureServer root, `layers` chooses the layer used for the query:

```ts
const source = createDataSource(featureServerUrl, [ArcGISFeatureServerSourceLoader]);
const trails = await source.getFeatures({layers: ['3']});
```

## Request options

ArcGIS query defaults live under `arcgis-feature-server`. Per-request viewport and layer values are
combined with these parameters.

```ts
const source = createDataSource(featureServerUrl, [ArcGISFeatureServerSourceLoader], {
  'arcgis-feature-server': {
    queryParameters: {
      where: 'status = 1',
      outFields: ['name', 'category'],
      returnGeometry: true,
      maxAllowableOffset: 2
    }
  }
});
```

Use the standard `fetch` option for bearer tokens or gateways. Tokens already encoded in the URL
are forwarded to metadata and query requests.

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const layer = new SourceLayer({
  id: 'bicycle-routes',
  data: featureServerUrl,
  loaders: SERVICE_LOADERS,
  layers: ['0'],
  pickable: true,
  getLineColor: [0, 80, 255],
  lineWidthMinPixels: 3
});
```

The generic layer chooses a vector renderer and refreshes the query as the viewport changes.

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS Feature Server" />
</div>

## References

- [ArcGIS REST API Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
- [ArcGIS REST API Query](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/)
