---
title: ArcGIS FeatureServer
description: Query ArcGIS feature layers through the loaders.gl vector source contract.
hide_title: true
page_style: designed
---

import {ClientExample} from '@site/src/components';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Services module · ArcGIS vector source"
  title="ArcGIS FeatureServer"
  description="Query ArcGIS feature layers through the loaders.gl VectorSource contract, with normalized metadata, schemas, spatial requests, and GeoJSON, binary, or Arrow output."
  tone="violet"
  meta={['FeatureServer', 'VectorSource', 'GeoJSON / binary / Arrow']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'ArcGIS service API', to: '/docs/modules/services/api-reference/arcgis'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<WmsDocsTabs active="arcgis-feature-server" />

<ServiceSourceGraphic kind="arcgis" />

<p className="badges">
  <a href="/docs/modules/scan#vector-table-views">
    <img src="https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square" alt="Optional scan table view" />
  </a>
</p>

<DocOrientation
  eyebrow="What it provides"
  title="Ask a feature service for the data your view needs."
  description="The source handles service discovery and query construction while the application chooses the output shape and any residual table operations."
  tone="violet"
  items={[
    {label: 'Metadata', value: 'Layers, bounds, CRS, and capabilities'},
    {label: 'Schema', value: 'ArcGIS fields mapped to loaders.gl types'},
    {label: 'Query', value: 'Bounds, predicates, fields, and precision'},
    {label: 'Output', value: 'GeoJSON, binary, or Arrow feature data'}
  ]}
/>

<ReferenceBoundary
  title="FeatureServer reference"
  description="The sections below cover support, scan table views, authentication, request options, and source behavior."
  tone="violet"
/>

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

## Optional scan table view

`VectorFeatureTableScanSource` can bind one bounded FeatureServer request that returns Arrow data.
The ArcGIS source continues to own service discovery, layer ids, bounds, CRS, paging, and request
parameters; the table view owns the relational operations over the returned feature rows.

| Capability | Support |
| --- | --- |
| Layer metadata and service request | ArcGIS source |
| Bound request schema | Discovered from the Arrow result |
| Predicate, projection, expressions, ordering, aggregates, and limit | Residual Arrow execution |
| Cancellation | Covers the service request and table query |
| Automatic ArcGIS SQL translation | Not provided by the table-view adapter |
| Multi-layer or unbounded service federation | Not provided |

Use ArcGIS request parameters for server-side reduction whenever possible. The table view provides a
common client-side query contract after the service has returned the bounded feature set.

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

For a scoped query token, pass `createArcGISCredential` through `core.credentials`. Tokens already
encoded in the URL win and are forwarded to metadata and query requests. Bearer gateways and
cookies continue to use `core.fetch`. See [authentication](/docs/developer-guide/authentication).

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
