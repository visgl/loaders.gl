---
title: OGC API services
description: Use focused HTTP source adapters for OGC API Features, Tiles, Coverages, and EDR resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC API services"
  title="Use the service path that matches the data."
  description="The OGC API family exposes linked JSON resources and focused HTTP operations. loaders.gl provides small source adapters for the common read paths, with the protocol boundaries kept visible."
  tone="cyan"
  meta={['Features', 'Tiles and coverages', 'EDR observations']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Service discovery', to: '/docs/modules/wms/services/capability-discovery'}
  ]}
/>

<DocOrientation
  eyebrow="A focused service client"
  title="Discover, request, and keep the response shape explicit."
  description="Each OGC API source follows the links and operations it understands, then returns a documented result. Applications can add service-specific parameters without adopting a universal abstraction."
  tone="cyan"
  items={[
    {label: 'Features', value: 'Collections and items with bounding boxes, CRS, and preserved paging links.'},
    {label: 'Tiles', value: 'Known tile links and templates returned as raw tile bytes.'},
    {label: 'Coverages', value: 'Collection subsets returned as JSON or binary coverage data.'},
    {label: 'EDR', value: 'Position, area, trajectory, corridor, cube, and radius queries.'}
  ]}
/>

<ReferenceBoundary
  title="OGC API service details"
  description="The reference below compares the supported APIs, source loaders, response paths, and intentional conformance boundaries."
  tone="cyan"
/>

The OGC API family replaces monolithic XML web-service protocols with linked JSON resources and
focused HTTP APIs. `@loaders.gl/wms` provides deliberately small, interoperable adapters for the
common read paths. They are useful compatibility clients, not claims of complete conformance to
every optional OGC API building block.

## Family overview

| API | Source loader | Discovery | Data path | Output | Scope |
| --- | --- | --- | --- | --- | --- |
| OGC API Features | `OGCAPIFeaturesSourceLoader` | Landing page and collections | Collection items with bbox and CRS | GeoJSON, binary, Arrow | Minimal read client |
| OGC API Tiles | `OGCAPITilesSourceLoader` | Landing-page tile link and tileset tile matrix set | Explicit tile template | Raw tile bytes | Minimal template client |
| OGC API Coverages | `OGCAPICoveragesSourceLoader` | Landing page and collections | Collection coverage with subsets | JSON object or binary bytes | Minimal read client |
| OGC API EDR | `OGCAPIEDRSourceLoader` | Landing page and collections | Six spatiotemporal query shapes | JSON object or binary bytes | Focused query client |

All four sources support standard loaders.gl fetch options for headers, credentials, proxies,
cancellation, and custom transports.

## OGC API Features

The Features path shares the vector-source, Arrow, managed-loading, and local-query integrations
used by WFS. The table distinguishes implemented read operations from optional protocol classes.

| Area | Capability | Status | API, guarantee, or boundary |
| --- | --- | --- | --- |
| Discovery | Landing page and collections | ✅ Supported | `getLandingPage()` and `getCollections()` |
| Discovery | Collection URL or service URL | ✅ Supported | Collection inferred from URL or selected by `collectionId`/layers |
| Discovery | Normalized metadata | ✅ Supported | Collection title, description, advertised CRSs, and first spatial extent |
| Discovery | Automatic queryables/schema negotiation | ❌ Not implemented | Source schema is currently empty; materialized Arrow schemas are inferred |
| Requests | Collection items | ✅ Supported | `/collections/{id}/items` and GeoJSON `Accept` negotiation |
| Requests | Bounding box | ✅ Supported | Standard `bbox`, with canonical XY input and wire axis normalization |
| Requests | Independent bounds and output CRSs | ✅ Supported | `requestCrs` sends `bbox-crs`; `crs` controls the requested response CRS |
| Requests | Feature request cancellation | ✅ Supported | `AbortSignal` forwarded to the items fetch |
| Requests | Credentials and custom transport | ✅ Supported | Common source fetch options |
| Requests | Portable attribute predicate pushdown / CQL2 | ❌ Not implemented | Relational adapter evaluates predicates locally; custom HTTP requests remain possible |
| Requests | Automatic next-link pagination | ⚠️ Supported with limits | Opt-in `ogc-api.pagination` gathers same-origin body/HTTP-header next links, with bounded requests and cancellation |
| Requests | Page-size control | ✅ Supported | `pagination.pageSize` requests `limit`; services may cap it |
| Requests | Item-by-ID and datetime convenience methods | ❌ Not implemented | Current normalized API focuses on bounding-box item requests |
| Output | GeoJSON validation and foreign members | ✅ Supported | Requires FeatureCollection and a features array; single-page responses preserve links/counts |
| Output | Binary feature collections | ✅ Supported | `format: 'binary'` |
| Output | Arrow and GeoArrow encoding preferences | ✅ Supported | `format: 'arrow'`, WKB/native/mixed union preferences |
| Loading | Complete extent reuse and uncovered rectangles | ✅ Supported via wrapper | `ManagedVectorSource` requires verified complete results and explicit equivalent CRSs |
| Loading | Shared requests and independent cancellation | ✅ Supported via wrapper | Last waiting consumer can abort the underlying request |
| Loading | Retry, invalidation, and bounded retention | ✅ Supported via wrapper | Failed, incomplete, and unknown-completeness pages do not establish coverage |
| Loading | Stable-ID deduplication | ⚠️ Partial | Typed IDs or custom accessor; features without stable IDs are retained separately |
| Queries | Common scan/query interface | ✅ Supported via adapter | `VectorFeatureTableScanSource` evaluates one materialized bounded result |
| Queries | ID, bounds, exact intersection, nearest geometry | ✅ Supported locally | `GeoArrowSpatialIndex` includes offscreen loaded rows |
| Rendering | deck.gl integration | ✅ Supported | Implements `VectorSource`; direct or managed source works with `SourceLayer` |
| Mutation | Transactions and mutable feature-store events | ❌ Not implemented | Read-only adapter; explicit cache invalidation after external changes |
| Conformance | All optional OGC API Features classes | ❌ Not implemented | Focused read client; no blanket standards certification claim |

### Progressive pages and complete collection

Configure `{'ogc-api': {pagination: {pageSize: 1000, maxPages: 100, maxFeatures: 100000}}}`
to gather service pages in `getFeatures()` before converting to the requested encoding. Omit
`pagination` to retain one-page behavior. The three positive-integer bounds default to those
values. Exhausting a bound throws instead of returning a silently truncated aggregate.

```ts
import {OGCAPIFeaturesSource} from '@loaders.gl/wms';

const source = new OGCAPIFeaturesSource(serviceUrl, {'ogc-api': {collectionId: 'roads'}});
for await (const page of source.getFeaturesInPages({
  layers: 'roads', boundingBox: [[-10, -5], [10, 5]], format: 'geojson', signal
}, {pageSize: 500, maxPages: 20})) {
  // Every yield is a normalized GeoJSON table, without fetching the next page ahead.
  processFeatures(page.features);
}
```

Traversal follows relative or absolute `rel: 'next'` links from the body or HTTP `Link` header,
resolving against the response URL. It does not invent an offset parameter. Links must use the
original origin and HTTP(S), without embedded credentials. Initial endpoint parameters are
preserved, and opaque next URLs are followed as supplied by the service. A numeric total that
exceeds the collected count without a next link is an error. An empty terminal page is allowed;
an empty page with another continuation is rejected.

Cancellation, failed later pages, inconsistent counts, repeated URLs/pages/IDs, and exhausted
limits fail the traversal and prevent managed coverage from being established. Early loop exit
stops further requests. Pages already yielded remain partial until traversal finishes. Stable
paging depends on the service; concurrent dataset changes are not a transactional snapshot.

Collected GeoJSON removes page-specific links/extents and updates `numberReturned`. Unknown
`numberMatched` stays unknown; it never becomes fabricated completeness evidence.
`ManagedVectorSource` can retain a collected result only when the service's numeric total matches
its rows. Arrow and binary conversion happens once after collection; per-page GeoJSON remains
materialized rather than a network-streamed feature parser. These rules follow
[OGC API Features Core](https://docs.ogc.org/is/17-069r4/17-069r4.html#fc-response).


```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPIFeaturesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(
  'https://demo.ldproxy.net/daraa',
  [OGCAPIFeaturesSourceLoader],
  {'ogc-api': {collectionId: 'VegetationSrf'}}
);

const features = await source.getFeatures({
  layers: ['VegetationSrf'],
  boundingBox: [[36.0, 32.5], [36.2, 32.7]],
  format: 'arrow'
});
```

## OGC API Tiles

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing-page metadata | ✅ Supported | Reads title and advertised tileset media type |
| Explicit tile template | ✅ Required | Configure `ogc-api.tileTemplate` |
| OGC placeholders | ✅ Supported | `{tileMatrix}`, `{tileRow}`, `{tileCol}`; `{tileMatrix}` is the configured or discovered matrix id for `z` |
| XYZ placeholders | ✅ Supported | `{z}`, `{y}`, `{x}` |
| Tile retrieval | ✅ Supported | `getTile()` returns the original `ArrayBuffer` |
| Tile matrix set | ✅ Supported | `ogc-api.tileMatrixSet` (a TileMatrixSet 2.0 document or URL) is reported as `tileGrid` |
| Tile matrix set discovery | ✅ Supported | Without `ogc-api.tileMatrixSet`, found from the tileset that `tileTemplate` belongs to |
| Tile matrix set endpoints | ✅ Supported | `getTileMatrixSets()` lists `/tileMatrixSets`; `getTileMatrixSet(id)` fetches `/tileMatrixSets/{id}` |
| Tile matrix set limits | ❌ Not interpreted | `tileMatrixSetLimits` is not applied; `TileGrid` has no field for it |
| Tile matrix set negotiation | ❌ Not implemented | The tileset is the one the configured template names; other tilesets are not compared |
| Tile decoding | ❌ Not automatic | Parse bytes with the loader matching the advertised media type |
| deck.gl | ⚠️ Foundation only | The generic tile contract is present; callers must provide the appropriate decoded tile type |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPITilesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(landingPageUrl, [OGCAPITilesSourceLoader], {
  'ogc-api': {
    tileTemplate: 'https://example.com/tiles/{tileMatrix}/{tileRow}/{tileCol}.png'
  }
});

const tileBytes = await source.getTile({z: 3, x: 4, y: 5});
```

### Tile matrix sets

`convertOGCTileMatrixSetToTileGrid()` converts an OGC TileMatrixSet 2.0 JSON document (OGC
17-083r4) to the shared `TileGrid` shape. Configuring `ogc-api.tileMatrixSet` on the tiles source
does the same conversion in `getMetadata()`, fetching the document once when it is a URL; a
relative URL resolves against the landing page.

- Origins are returned in XY order. Declared `orderedAxes` decide the swap (a first axis naming
  latitude, northing, southing, or Y); without them, only EPSG:4326 is swapped.
- A bottom-left origin is reported per level only; the grid-wide `tileGrid.origin` is top-left by
  definition and is omitted.
- `cornerOfOrigin: 'bottomLeft'` is preserved on each matrix; omitted means top-left.
- `cellSize` is used when present. A scale denominator alone becomes a resolution only for a known
  unit: EPSG:4326, CRS:84, Web Mercator, or the `metersPerUnit` option.
- A `crs` URI string or `{uri}` object is reported as `tileGrid.crs`; embedded WKT and PROJJSON
  definitions are not interpreted.
- `variableMatrixWidths` (coalesced rows) is not interpreted.
- Tile requests use the matrix identifier for `{tileMatrix}`: the matrix whose id equals `z`,
  otherwise the matrix at index `z`, as in WMTS. `{z}` stays numeric. `getTile()` loads a
  matrix set given by URL first; `getTileURL()` uses it once `getMetadata()` has loaded it.
- `setProps()` replaces an inline `tileMatrixSet` document as a whole rather than merging fields.

### Tile matrix set discovery

When `ogc-api.tileMatrixSet` is not set and `tileTemplate` contains `/{tileMatrix}`, the source
discovers the tile matrix set as OGC API - Tiles Part 1 describes it:

1. The tileset metadata is the template path before `/{tileMatrix}`, such as `/tiles/{tileMatrixSetId}`
   or `/collections/{collectionId}/tiles/{tileMatrixSetId}`. Query parameters other than the `f`
   format selector are kept.
2. Its `http://www.opengis.net/def/rel/ogc/1.0/tiling-scheme` link (or the older `tiling-scheme`)
   is followed, preferring a JSON link and resolving it against the tileset URL.
3. Without such a link, `tileMatrixSetId` is fetched from `/tileMatrixSets/{tileMatrixSetId}`, and a
   `tileMatrixSetURI` is looked up by `uri` in the `/tileMatrixSets` list. Registry URIs are not
   fetched, and no built-in tile matrix sets are used.

`/tileMatrixSets` paths resolve against the landing page, and every request uses the source's
fetch options. The discovered grid is used for `tileGrid` and for `{tileMatrix}`, like a configured
one, and is reused until `tileTemplate`, `tileMatrixSet` or `metersPerUnit` changes. `getTile()`
waits for discovery before its first request.

Discovery failure does not fail the source. `getMetadata()` resolves without `tileGrid`, tiles use
`z` for `{tileMatrix}`, and the error goes to `core.onError` (or a logged warning). Tile requests do
not repeat a failed discovery; the next `getMetadata()` call does. A configured `tileMatrixSet`
that fails to load still makes `getMetadata()` reject.

```ts
const source = createDataSource('https://example.com/ogcapi', [OGCAPITilesSourceLoader], {
  'ogc-api': {
    tileTemplate:
      'https://example.com/ogcapi/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}?f=mvt'
  }
});
// Reads /tiles/WebMercatorQuad, then the tile matrix set its tiling-scheme link names
const {tileGrid} = await source.getMetadata();
```

```ts
import {convertOGCTileMatrixSetToTileGrid} from '@loaders.gl/wms';

const response = await fetch('https://example.com/ogcapi/tileMatrixSets/UTM18N');
const tileGrid = convertOGCTileMatrixSetToTileGrid(await response.json(), {metersPerUnit: 1});
// tileGrid.matrices[i]: {id, resolution, origin, cornerOfOrigin?, tileSize, matrixSize}
```

## OGC API Coverages

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing page | ✅ Supported | `getLandingPage()` |
| Collections | ✅ Supported | `getCollections()` |
| Collection coverage | ✅ Supported | Requests `/collections/{id}/coverage` |
| Bounding box | ✅ Supported | Sends `bbox` |
| Dimension subsets | ✅ Supported | Sends repeated `subset` parameters |
| Time selection | ✅ Supported | Sends `datetime` |
| Format negotiation | ✅ Supported | Sends `f` and an `Accept` header |
| JSON representations | ✅ Supported | Returned as parsed objects |
| Binary representations | ✅ Preserved | Returned as `ArrayBuffer` |
| Coverage decoding | ⚠️ Application controlled | Pass binary output to GeoTIFF, LERC, or another appropriate loader |
| Processing and visualization | ❌ Not provided | Values are not resampled or colorized implicitly |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPICoveragesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(landingPageUrl, [OGCAPICoveragesSourceLoader], {
  'ogc-api-coverages': {collectionId: 'temperature'}
});

const coverage = await source.getCoverage({
  bbox: [-10, 40, 10, 50],
  subset: ['Lat(40,50)'],
  datetime: '2025-01-01/2025-01-31',
  format: 'application/json'
});
```

## OGC API EDR

EDR—Environmental Data Retrieval—queries multidimensional observations by space, time, vertical
level, and parameter.

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing page and collections | ✅ Supported | Common OGC API discovery methods |
| Position query | ✅ Supported | Point observations |
| Radius query | ✅ Supported | Observations around a position |
| Area query | ✅ Supported | Polygon or bounding-area observations |
| Cube query | ✅ Supported | Multidimensional bounding volume |
| Trajectory query | ✅ Supported | Observations along a path |
| Corridor query | ✅ Supported | Observations in a buffered path |
| Time, vertical, parameter, and CRS controls | ✅ Supported | Standard query parameters are generated |
| GeoJSON and CoverageJSON | ✅ Supported | JSON media types are returned as objects |
| Binary representations | ✅ Preserved | Non-JSON responses are returned as `ArrayBuffer` |
| Domain-specific interpretation | ⚠️ Application controlled | Unit conversion and scientific analysis remain explicit |
| deck.gl | ❌ Not direct | Convert the selected response representation into a visual source first |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPIEDRSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(edrUrl, [OGCAPIEDRSourceLoader], {
  'ogc-api-edr': {collectionId: 'weather'}
});

const observations = await source.query({
  queryType: 'position',
  coords: 'POINT(10 20)',
  datetime: '2025-01-01',
  parameterName: ['temperature', 'wind'],
  format: 'application/geo+json'
});
```

## Choosing OGC API or classic OGC Web Services

| Need | Prefer |
| --- | --- |
| Broad server compatibility and mature map rendering | WMS or WMTS |
| High-volume GML feature streaming | WFS |
| A straightforward GeoJSON collection endpoint | OGC API Features |
| Capability-driven tiled imagery with complex matrix sets | WMTS |
| A known modern tile template | OGC API Tiles |
| Established coverage servers and LERC decoding | WCS |
| A modern JSON coverage endpoint | OGC API Coverages |
| Environmental position, area, trajectory, or corridor queries | OGC API EDR |

## Scope boundary

The adapters intentionally avoid implementing optional conformance classes merely to check boxes.
Advanced CQL2 filters, transactions, schema extensions, process execution, and provider-specific
extensions should be added only when real service interoperability requires them. Standard fetch
APIs remain available for those escape hatches.

For a live Features endpoint, see the [ldproxy Daraa demonstration](https://demo.ldproxy.net/daraa).
Live services are not used by CI; deterministic repository fixtures remain the conformance source
of truth.
