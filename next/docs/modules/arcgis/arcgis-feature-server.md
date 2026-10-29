ArcGIS module · ArcGIS vector source

![](/next/images/format-logos/arcgis-logo.jpg)Feature

# ArcGIS FeatureServer

Query geometries and attributes from your published ArcGIS feature layers and tables, with bounded pagination and GeoJSON, binary, or Arrow output.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-feature-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-feature-server.md)[ArcGIS service API](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/arcgis-logo.jpg)Feature[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-feature-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-feature-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Have a portal item instead of a service URL? Use the [item explorer and sign-in example](https://loaders.gl/next/docs/developer-guide/arcgis/items.md).

Remote data, explicit steps

## Discover once. Request only what the application needs.

Service sources keep endpoint metadata, request construction, and decoded results separate. That makes a remote dataset behave like a predictable part of the data path.

01 · discover

### ArcGIS REST endpoint

A service directory exposes layers, operations, and formats.

FeatureServerImageServerSceneServer

pla&#x6E;**→**

02 · request

### Request the useful subset

Choose features, images, tiles, or scene content for this view.

wherebboxoutFieldssize

normaliz&#x65;**→**

[03 · application result](https://loaders.gl/next/docs/modules/arcgis.md)

### [VectorSource · ImageSource · Tileset3DSource](https://loaders.gl/next/docs/modules/arcgis.md)

[The application receives a source contract rather than a vendor-specific client.<!-- --> ↗](https://loaders.gl/next/docs/modules/arcgis.md)

The source owns protocol details; the application owns how returned features, pixels, tiles, or tables are used.

[![Optional scan table view](https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square)](https://loaders.gl/next/docs/modules/core/scan#vector-table-views)

What it provides

## Ask a feature service for the data your view needs.

The source handles service discovery and query construction while the application chooses the output shape and any residual table operations.

01

Metadata

Layers, bounds, CRS, and capabilities

02

Schema

ArcGIS fields mapped to loaders.gl types

03

Query

Bounds, predicates, fields, and precision

04

Output

GeoJSON, binary, or Arrow feature data

Detailed guide

## FeatureServer reference

The sections below cover support, scan table views, authentication, request options, and source behavior.

ArcGIS FeatureServer endpoints expose queryable vector feature layers through the ArcGIS REST API. `ArcGISFeatureServerSourceLoader` adapts a service or layer endpoint to the loaders.gl `VectorSource` contract.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                     | Support             | API and behavior                                                                        |
| ------------------------------ | ------------------- | --------------------------------------------------------------------------------------- |
| Service and layer endpoints    | ✅ Supported        | Accepts both `/FeatureServer` and `/FeatureServer/{layerId}` URLs                       |
| Metadata and layer discovery   | ✅ Supported        | `getMetadata()` normalizes names, titles, bounds, CRS, and child layers                 |
| Schema discovery               | ✅ Supported        | `getSchema()` maps ArcGIS fields to loaders.gl schema types                             |
| Spatial queries                | ✅ Supported        | `getFeatures()` sends viewport bounds through the ArcGIS `query` operation              |
| Layer selection                | ✅ Supported        | Select with `layers`; a root service URL can target an explicit layer ID                |
| Server-side query parameters   | ✅ Supported        | Configure `where`, output fields, geometry filters, spatial relationship, and precision |
| GeoJSON output                 | ✅ Supported        | ArcGIS GeoJSON responses are parsed as vector-source data                               |
| Binary and Arrow output        | ✅ Supported        | Select through the standard vector source `format` option                               |
| Authentication                 | ✅ Supported        | URL tokens, fetch headers, credentials, and custom fetch functions are preserved        |
| Complete queries and streaming | ⚠️ Supported subset | Ordered offset or ID batches, progress, cancellation, caps, and completeness evidence   |
| Counts, IDs and extents        | ✅ Supported        | `queryCount()`, `queryObjectIds()`, `queryExtent()`                                     |
| Nonspatial tables              | ⚠️ Supported subset | JSON attributes retained as null-geometry records; GeoJSON or Arrow output              |
| Queryable MapServer layers     | ⚠️ Supported subset | Same query source; spatial layers require GeoJSON support                               |
| Editing and attachments        | ❌ Not supported    | The source is a read-only query client                                                  |
| deck.gl rendering              | ✅ First class      | Pass the source loader or `ARCGIS_LOADERS` to `SourceLayer`                             |

## Optional scan table view[​](#optional-scan-table-view "Direct link to Optional scan table view")

`VectorFeatureTableScanSource` can bind one bounded FeatureServer request that returns Arrow data. The ArcGIS source continues to own service discovery, layer ids, bounds, CRS, paging, and request parameters; the table view owns the relational operations over the returned feature rows.

| Capability                                                          | Support                                       |
| ------------------------------------------------------------------- | --------------------------------------------- |
| Layer metadata and service request                                  | ✅ ArcGIS source                              |
| Bound request schema                                                | ✅ Discovered from the Arrow result           |
| Predicate, projection, expressions, ordering, aggregates, and limit | ✅ Residual Arrow execution                   |
| Cancellation                                                        | ✅ Covers the service request and table query |
| Automatic ArcGIS SQL translation                                    | ❌ Not provided by the table-view adapter     |
| Multi-layer or unbounded service federation                         | ❌ Not provided                               |

Use ArcGIS request parameters for server-side reduction whenever possible. The table view provides a common client-side query contract after the service has returned the bounded feature set.

## Create and query a source[​](#create-and-query-a-source "Direct link to Create and query a source")

```
import {load} from '@loaders.gl/core';

import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';



const source = await load(

  'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',

  [ArcGISFeatureServerSourceLoader]

);



const metadata = await source.getMetadata();

const features = await source.getFeatures({

  layers: ['0'],

  boundingBox: [[-86, 36], [-84, 39]]

});
```

Feature coordinates and `boundingBox` use canonical `xy` order. Set `requestCrs` when the bounding box is expressed in a different CRS. Spatial output must use EPSG:4326; unsupported CRS forms and projected GeoJSON output produce actionable errors.

When the URL points to the FeatureServer root, `layers` chooses the layer used for the query:

```
const source = await load(featureServerUrl, [ArcGISFeatureServerSourceLoader]);

const trails = await source.getFeatures({layers: ['3']});
```

## Complete queries, pages and summaries[​](#complete-queries-pages-and-summaries "Direct link to Complete queries, pages and summaries")

`getFeatures()` retrieves the complete filtered query up to a 100,000-record default cap. It throws if completeness cannot be established, so incomplete data does not silently reach a renderer. Use the explicit query API to inspect partial results or customize the cap:

```
const result = await source.queryFeatures({

  query: {where: '1=1'},

  pageSize: 500,

  maxFeatures: 20000,

  onProgress: ({loaded, expectedCount}) => console.log(loaded, expectedCount)

});

console.log(result.complete, result.reason, result.data);



const count = await source.queryCount({query: {where: '1=1'}});

const identifiers = await source.queryObjectIds();

const bounds = await source.queryExtent();

const page = await source.queryFeaturePage({query: {resultOffset: 0}, pageSize: 100});
```

`queryFeaturePages()` is the corresponding async iterator. Every yielded page includes `data`, `loaded`, `expectedCount`, `pages`, `duplicates`, `scope`, `strategy`, `complete`, and `reason`. `queryFeaturePage()` always labels its result as a single page, not a complete dataset. All query methods accept `signal`. Metadata, counts and page requests use the same authenticated transport. Public summary methods retain the selected filters.

The [feature query guide](https://loaders.gl/next/docs/developer-guide/arcgis/feature-layers.md) specifies controls, termination conditions, table/date behavior, supported coordinate references, and concurrent-edit limitations. The embedded example above uses this API directly and retains a visible partial-result label on cancellation or when the selected record cap is reached.

## Request options[​](#request-options "Direct link to Request options")

ArcGIS query defaults live under `arcgis-feature-server`. Per-request viewport and layer values are combined with these parameters.

```
const source = await load(featureServerUrl, [ArcGISFeatureServerSourceLoader], {

  'arcgis-feature-server': {

    queryParameters: {

      where: 'status = 1',

      outFields: ['name', 'category'],

      returnGeometry: true

    }

  }

});
```

For a scoped query token, pass `createArcGISCredential` through `core.credentials`. Tokens already encoded in the URL win and are forwarded to metadata and query requests. Bearer gateways and cookies continue to use `core.fetch`. See [authentication](https://loaders.gl/next/docs/developer-guide/authentication.md).

## deck.gl integration[​](#deckgl-integration "Direct link to deck.gl integration")

```
import {SourceLayer} from '@loaders.gl/deck-layers';

import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';



const layer = new SourceLayer({

  id: 'bicycle-routes',

  data: featureServerUrl,

  loaders: ARCGIS_LOADERS,

  crs: 'EPSG:4326',

  requestCrs: 'EPSG:4326',

  layers: ['0'],

  pickable: true,

  format: 'geojson',

  geoJsonLayerProps: {

    getLineColor: [0, 80, 255],

    lineWidthMinPixels: 3

  }

});
```

The generic layer chooses a vector renderer and refreshes the query as the viewport changes.

## References[​](#references "Direct link to References")

* [ArcGIS REST API Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
* [ArcGIS REST API Query](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/)
