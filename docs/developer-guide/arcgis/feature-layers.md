---
title: Query ArcGIS feature layers
description: Retrieve complete bounded queries, stream pages, inspect completeness, and retain nonspatial records.
---

# Query feature layers and tables

Use a layer URL such as `/FeatureServer/3` or a queryable `/MapServer/3`. A service root requires
one explicit `layers` selection. Nonspatial table endpoints use the same source. Item URLs are not
yet resolved automatically.

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(featureLayerUrl, ArcGISFeatureServerSourceLoader);
const controller = new AbortController();
const result = await source.queryFeatures({
  query: {where: "CATEGORY = 'Bicycle'", outFields: ['OBJECTID', 'CATEGORY']},
  boundingBox: [[-85.9, 37.6], [-85.6, 37.9]],
  requestCrs: 'EPSG:4326',
  pageSize: 500,
  maxFeatures: 20000,
  signal: controller.signal,
  onProgress: ({loaded, expectedCount}) => console.log(loaded, expectedCount)
});

if (!result.complete) {
  console.warn(`Partial query: ${result.reason}`, result.loaded, result.expectedCount);
}
// result.data is a GeoJSON table. Display incomplete results only with an explicit label.
```

Replace field names and predicates with those from your layer. Source-wide defaults remain under
`arcgis-feature-server.queryParameters`; per-request `query` values override them. The stable object
ID field is added to selected output fields during complete retrieval and is retained as `feature.id`.

## Choose the retrieval contract

| Method | Contract |
| --- | --- |
| `queryFeaturePage(options)` | One page, always marked `complete: false`, `reason: 'single-page'` |
| `queryFeaturePages(options)` | Async iterator yielding pages of unique records and cumulative progress |
| `queryFeatures(options)` | Collects the iterator into one result with explicit completeness evidence |
| `getFeatures(parameters)` | Complete-query convenience for VectorSource; throws if retrieval is incomplete, then converts to GeoJSON, binary, or Arrow |
| `queryCount(parameters)` | Current count for the same filters |
| `queryObjectIds(parameters)` | IDs, their field name, and the explicit transfer-limit flag; not a completeness guarantee |
| `queryExtent(parameters)` | Bounds with an explicit spatial reference, or null |

A viewport query can be complete **for its bounds and filters** without containing the whole dataset.
`scope` distinguishes `viewport` from a general `query`. `expectedCount` is the initial server count;
`loaded` counts unique retained records. `pages` counts data pages, excluding metadata and summary
requests. `duplicates` reports discarded repeat records.

## Stream data into a visualization

```ts
const features = [];
for await (const page of source.queryFeaturePages({
  query: {where: '1=1'},
  pageSize: 500,
  maxFeatures: 20000,
  signal: controller.signal
})) {
  features.push(...page.data.features);
  // Update your GeoJsonLayer with a new data array and display page.loaded/page.expectedCount.
  // Only page.complete permits labeling the selected query complete.
}
```

Abort obsolete queries when filters change. Cancellation rejects with the signal's abort reason;
it does not return a successful result. Pages already consumed remain partial data. Breaking out of
the iterator closes it and prevents subsequent requests. ID batches can prefetch up to `concurrency`
pages; offset pages are serial. The embedded [feature example](/examples/tiles/arcgis-feature-server)
shows progressive rendering, cancellation, filters, and a deliberately selectable record cap.

## Pagination and completeness

`strategy: 'auto'` selects ordered offset pagination only when the layer advertises both
`supportsPagination` and `supportsOrderBy`. Otherwise it enumerates object IDs and retrieves batches.
Applications may explicitly select `offset` or `object-ids`. Query parameters switch to a form-encoded
POST body when the generated URL exceeds 2,000 characters; endpoint credentials stay in the URL. Spatial layers must advertise GeoJSON
support when their supported formats are present; older JSON-only MapServer layers are rejected.

| Control | Default | Meaning |
| --- | ---: | --- |
| `pageSize` | 1000 | Capped by `maxRecordCount`; must be a positive safe integer |
| `maxFeatures` | 100000 | Maximum unique records retained; controls memory and query scope |
| `concurrency` | 4 | Parallel ID batches; 1–8; does not parallelize offsets |

Complete queries control ordering and offsets. Use `queryFeaturePage({query: {resultOffset: 100}})`
for explicit pages. `getFeatures()` uses the complete-query defaults above; use `queryFeatures()`
when you need different bounds or want to consume a labeled partial result.

| Final reason | Interpretation |
| --- | --- |
| `complete` | Traversal finished and unique records matched the initial count |
| `feature-limit` | The application cap stopped retrieval |
| `id-limit` | ID enumeration was truncated or disagreed with the initial count |
| `count-mismatch` | Returned records did not match the expected set/count |
| `no-progress` | An offset page added no new records without establishing completion |
| `single-page` | The caller requested only a page |

`loading` describes intermediate pages. ID responses are checked against the initial count rather
than assuming IDs-only requests are unlimited. Missing records and repeated pages never silently
become a complete result. These checks do **not** establish a transactional snapshot: concurrent
inserts, edits and deletes can change membership even when counts agree. Use immutable data or a
service-specific snapshot workflow when strict temporal consistency matters. Token-based pagination,
newer unique-ID query protocols, PBF feature responses, and snapshot/version management are outside
this implementation. See Esri's [feature query reference](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/).

## Spatial references and record types

Spatial output is GeoJSON in EPSG:4326, also used for subsequent binary/Arrow conversion.
Use `requestCrs` for projected bounding boxes; the service performs reprojection. Numeric WKIDs and
`EPSG:<number>` identifiers are accepted. Other CRS forms and projected GeoJSON output fail with an
explicit message. Bounds use x/y order; split a bounding box that crosses the antimeridian.

Nonspatial ArcGIS tables use JSON attribute records normalized to features with `geometry: null`.
Null attributes and raw date values are preserved. No timezone conversion or domain-label substitution
is performed. `getSchema()` describes ArcGIS field types; Arrow conversion infers the actual returned
values, so an epoch-millisecond attribute remains numeric unless the application converts it.
Numeric identities outside JavaScript's safe integer range are rejected rather than rounded for
deduplication. The separate newer ArcGIS unique-ID protocol is not implemented.

| Output | Use and limits |
| --- | --- |
| `geojson` | GeoJSON table / FeatureCollection, including null-geometry records |
| `binary` | Binary geometry collection; rejects null geometries rather than dropping their rows |
| `arrow` (default for `getFeatures`) | Arrow table with WKB geometry, retaining null-geometry rows |

GeoJSON service responses supply spatial features; ArcGIS JSON geometry and PBF decoding are not
implemented by this source. Its format hint cannot force a spatial JSON response. Grouped statistics,
attachments, related records, editing and synchronization remain outside this tranche.

## Errors and authentication

Metadata and query operations recognize both HTTP failures and ArcGIS `error` objects delivered
with HTTP 200. `ArcGISFeatureQueryError` exposes `code` and `details`; import its runtime class from
`@loaders.gl/arcgis/bundled` or the feature implementation subpath when using `instanceof`.
JSON authentication errors are surfaced, not automatically refreshed by this feature client.
See the [authentication guide](/docs/developer-guide/arcgis/authentication) for scoped credentials
and application-managed session renewal.
