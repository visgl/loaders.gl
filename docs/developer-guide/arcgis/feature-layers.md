---
title: Query ArcGIS feature layers
description: Select fields, filter features, choose output formats and understand query limits.
---

# Query feature layers

Use the URL of a particular layer, such as `/FeatureServer/3`, rather than a portal item page.
Inspect the layer's metadata for fields, spatial reference and query capabilities before deciding
how to visualize it.

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(featureLayerUrl, ArcGISFeatureServerSourceLoader, {
  'arcgis-feature-server': {
    queryParameters: {
      where: "CATEGORY = 'Bicycle'",
      outFields: ['OBJECTID', 'CATEGORY'],
      returnGeometry: true
    }
  }
});

const metadata = await source.getMetadata({formatSpecificMetadata: true});
const schema = await source.getSchema();
const controller = new AbortController();
const features = await source.getFeatures({
  boundingBox: [[-85.9, 37.6], [-85.6, 37.9]],
  crs: 'EPSG:4326',
  format: 'geojson',
  signal: controller.signal
});
```

Replace the example field names and predicate with fields from your layer. Abort obsolete requests
when the viewport changes. Filter on the server and request only fields needed for rendering and
interaction. Bounds use the coordinate system requested through `crs`; requesting an output CRS
uses the service's reprojection capabilities rather than a local general-purpose projection engine.

## Choose an output

| Output | Result | Typical use |
| --- | --- | --- |
| `geojson` | GeoJSON table / FeatureCollection | Explicit GeoJsonLayer data, inspection and simple applications |
| `binary` | Binary feature collection | Compatible binary geometry renderers; check the selected layer's contract |
| `arrow` (default) | Arrow table with WKB geometry | Columnar workflows and compatible GeoArrow adapters |

These are client-side conversions of a GeoJSON service response. They are not ArcGIS PBF feature
query support, nor does every deck.gl layer accept every output. Keep `f: 'geojson'`; the legacy
query-options type also lists JSON/PJSON, but this source does not decode Esri JSON feature sets.

## Record limits and completeness

`getFeatures()` makes **one query per call**. It does not automatically page, and its converted
output does not retain the service's transfer-limit flag. Do not use its returned length as the
count of all matching records unless you have independently established completeness.

For complete datasets, use an ArcGIS query client with pagination and inspect the service's
`maxRecordCount` and pagination capabilities. Convert or load its results for visualization.
Automatic paging and a page-result API are planned follow-ups, not available methods in this
module. See Esri's [query features guide](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/feature-services/query-features/).

For large visualizations, prefer bounded viewport queries, vector tiles, or a scene service when
those representations fit the data. Avoid repeated full-dataset downloads during map interaction.

## Current boundaries

| Capability | Status |
| --- | --- |
| Spatial bounds, `where`, field selection | Implemented |
| Layer metadata and common field types | Implemented subset; preserve raw metadata when exact ArcGIS field semantics matter |
| GeoJSON / binary / Arrow conversion | Implemented from supported GeoJSON geometry |
| Automatic pagination or completeness reporting | Not implemented |
| Nonspatial tables and Esri JSON/PBF feature sets | Not verified / not implemented as dedicated result paths |
| Counts, grouped statistics, attachments and related-record APIs | No first-class API |
| Editing, replicas, offline synchronization | Not implemented |

[Explore the feature example](/examples/tiles/arcgis-feature-server) and
[operation reference](/docs/modules/arcgis/arcgis-feature-server).
