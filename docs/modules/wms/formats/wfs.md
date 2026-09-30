---
title: WFS - Web Feature Service
description: Query vector features and stream them into geospatial or Arrow pipelines.
hide_title: true
page_style: designed
---

import {ClientExample} from '@site/src/components';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

<DocPageHeader
  eyebrow="OGC vector service"
  title="Query features without taking ownership of the whole service response."
  description="WFS exposes vector features over HTTP. The loaders.gl source handles capabilities, bounds, CRS, paging, GeoJSON, and streaming GML while keeping the result usable as features, binary data, or Arrow tables."
  tone="mint"
  meta={['WFS 2.0 and 1.1', 'GeoJSON and GML', 'Vector and Arrow output']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WFS source', to: '/docs/modules/wms/formats/wfs'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The WFS request path"
  title="Discover the layer. Bound the request. Stream the features."
  description="A WFS response can be large and service-specific. Keep the request explicit, then normalize the response at the source boundary for map layers and table processing."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Feature types, CRS, formats, and service limits'},
    {label: 'Bound', value: 'Layer, extent, properties, paging, and filters'},
    {label: 'Stream', value: 'GML features in bounded batches'},
    {label: 'Return', value: 'Vector features, binary data, or Arrow tables'}
  ]}
/>

<WmsDocsTabs active="wfs" />

<p className="badges">
  <a href="/docs/modules/scan#vector-table-views">
    <img src="https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square" alt="Optional scan table view" />
  </a>
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

WFS serves vector features and properties over HTTP. `WFSSourceLoader` provides a read-only
`VectorSource` with GeoJSON and streaming GML ingestion.

<ReferenceBoundary
  title="WFS protocol and source details"
  description="The reference below covers version differences, feature requests, output formats, paging, CRS handling, filters, and the optional scan table view."
  tone="mint"
/>

## Feature support

The source combines service discovery, protocol-aware requests, streaming GML, three feature
representations, and optional table and spatial-query integrations. **Supported** means implemented
in the named API; **Partial** identifies a narrower path; **Not implemented** identifies a gap.
These are implementation capabilities, not certification of every optional WFS conformance class.

| Area | Capability | Status | API, guarantee, or boundary |
| --- | --- | --- | --- |
| Discovery | WFS 2.0.0 | Supported | Default request version; `TYPENAMES`, `COUNT`, and standard operation URLs |
| Discovery | WFS 1.1.0 | Supported | Version-aware `TYPENAME`, `MAXFEATURES`, and axis handling |
| Discovery | Capabilities and feature types | Supported | `getCapabilities()` and normalized `getMetadata()` layers, titles, CRSs, and WGS84 bounds |
| Discovery | Original service metadata | Supported | Parsed capabilities retained in `formatSpecificMetadata` |
| Discovery | Automatic `DescribeFeatureType` schema discovery | Not implemented | `getSchema()` currently returns an empty schema; result-table schemas are inferred separately |
| Requests | Extent filtering | Supported | `getFeatures()` sends canonical XY bounds with protocol-aware wire axis order |
| Requests | Separate bounds and output CRSs | Supported | `requestCrs` for the bounding box, `crs` for returned coordinates; server performs transformation |
| Requests | CRS aliases | Supported | Common EPSG names, URNs, and URLs are normalized |
| Requests | Paging controls | Partial | Low-level `count`, `startIndex`, and `sortBy`; WFS 1.1 offset support is server dependent |
| Requests | Automatic pagination to complete an extent | Not implemented | One response may be truncated; applications must fetch remaining pages explicitly |
| Requests | Property projection and sorting | Supported | Low-level `propertyName` and `sortBy` controls |
| Requests | FES XML filters | Partial | Caller-authored XML passes through; no portable predicate-to-FES translator |
| Requests | Count-only request URLs | Supported | `resultType: 'hits'`; count parsing/planning remains application controlled |
| Requests | Endpoint parameters and cancellation | Supported | Preserves endpoint parameters; `getFeatures()` forwards `AbortSignal` to fetch |
| Ingestion | GeoJSON FeatureCollection | Supported | Validates the response shape and preserves count/paging foreign members in GeoJSON output |
| Ingestion | Common GML 2/3 features and geometry | Supported | SAX-based parsing; see the [GML support matrix](./gml) for geometry boundaries |
| Ingestion | Network-streamed GML batches | Supported | `getFeaturesInBatches()` decodes chunk boundaries into bounded batches |
| Ingestion | Network-streamed GeoJSON batches | Not implemented | GeoJSON feature responses are materialized before conversion |
| Ingestion | GML property type hints | Supported | Application-supplied hints guide typed properties |
| Output | GeoJSON, binary features, and Arrow | Supported | Standard `format` parameter; Arrow is the WFS source default |
| Output | GeoArrow encoding preferences | Supported | WKB, native optimization, or mixed geometry union through `geoarrow.encodingPreference` |
| Loading | Coverage reuse and uncovered strips | Supported via wrapper | `ManagedVectorSource` caches verified complete responses with explicit equivalent input/output CRSs |
| Loading | Shared requests, retry, invalidation, bounded retention | Supported via wrapper | Independent caller cancellation; failed/unknown/truncated responses never establish coverage |
| Loading | Feature deduplication | Partial | Wrapper uses stable typed IDs or a custom ID accessor; unidentified features remain separate |
| Queries | Portable scan/query interface | Supported via adapter | `VectorFeatureTableScanSource` applies relational operations to one materialized bounded request |
| Queries | Exact coordinate/extent selection and nearest geometry | Supported locally | `GeoArrowSpatialIndex` queries loaded rows, including offscreen data; independent of picking |
| Rendering | deck.gl source integration | Supported | `SourceLayer` consumes the vector source; a managed source can be supplied as `data` |
| Mutation | WFS-T transactions, locks, and mutable feature store | Not implemented | Read-only protocol adapter; invalidate managed coverage after external edits |

## Optional scan table view

WFS remains a service protocol. Layers, request bounds, CRS, paging, and output format stay in the
WFS request. `VectorFeatureTableScanSource` can bind one bounded request that returns an Arrow table
and apply portable relational operations to the returned feature rows.

| Capability | Support |
| --- | --- |
| Layer, bounds, CRS, paging, and service filters | WFS source parameters |
| Table schema | Discovered from the bounded result |
| Predicate, projection, expressions, ordering, aggregates, and limit | Residual Arrow execution |
| Cancellation | Cancels a caller’s wait and table query; the shared initial fetch remains available to other callers |
| Automatic `DescribeFeatureType` planning | Not provided by the table-view adapter |
| Automatic translation of portable predicates to OGC filters | Not provided |

Prefer native WFS filters and paging when the service can reduce a large response. The table view is
most useful for normalizing and refining an already-bounded result.

## Query features

```ts
import {createDataSource} from '@loaders.gl/core';
import {WFSSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(wfsUrl, [WFSSourceLoader], {
  wfs: {wfsParameters: {version: '2.0.0'}}
});

const metadata = await source.getMetadata();
const features = await source.getFeatures({
  layers: ['workspace:roads'],
  boundingBox: [[-10, 35], [10, 55]],
  crs: 'EPSG:4326',
  format: 'arrow'
});
```

## Stream GML

Request GML explicitly when a service does not provide GeoJSON or when a large response should be
processed incrementally:

```ts
const source = createDataSource(wfsUrl, [WFSSourceLoader], {
  wfs: {wfsParameters: {outputFormat: 'application/vnd.ogc.gml'}}
});

for await (const batch of source.getFeaturesInBatches(
  {
    layers: ['roads'],
    boundingBox: [[-10, 35], [10, 55]],
    crs: 'EPSG:4326',
    format: 'arrow'
  },
  {batchSize: 1000}
)) {
  consume(batch);
}
```

The parser recognizes GML member structure across arbitrary network chunks and converts each batch
to the requested vector representation.

## Paging and filters

`getFeaturesURL()` exposes request controls when an application needs explicit pages or a
server-specific filter:

```ts
const requestUrl = source.getFeaturesURL({
  version: '2.0.0',
  typeName: 'roads',
  bbox: [-10, 35, 10, 55, 'EPSG:4326'],
  count: 1000,
  startIndex: 2000,
  propertyName: ['name', 'geometry'],
  filter: '<fes:Filter>...</fes:Filter>',
  sortBy: 'name A'
});
```

Filter XML is passed through. Escape user-controlled values and use the FES version supported by
the target server.

## CRS and axis order

The source normalizes common CRS spellings and applies the WFS version's axis-order rules to
bounding boxes. CRS transformation is not silently applied to returned feature coordinates; request
the desired output CRS from the server.

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {WFSSourceLoader} from '@loaders.gl/wms';

const layer = new SourceLayer({
  id: 'wfs-roads',
  data: wfsUrl,
  loaders: [WFSSourceLoader],
  layers: ['workspace:roads'],
  pickable: true
});
```

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="WFS" />
</div>

## References

- [OGC Web Feature Service standard](https://www.ogc.org/standard/wfs/)
- [GML support](./gml)

## Selection and offscreen analysis

See [Spatial queries beyond picking](/docs/developer-guide/spatial-queries) for cancelable extent
loading, managed coverage and retries, feature-ID lookup, exact coordinate/extent selection, and nearest
geometry queries on returned GeoArrow data. Local queries include offscreen loaded rows and do
not depend on deck.gl picking.

WFS 2.0 requests use `TYPENAMES` and `COUNT`; WFS 1.1 uses `TYPENAME` and `MAXFEATURES`.
Endpoint query parameters are preserved, request parameters replace matching keys without
regard to case, and zero-valued offsets are retained. A CRS supplied as the fifth `bbox` value
controls bounding-box axis order independently of the output `srsName`.

`getMetadata()` normalizes WFS 1.1/2.0 feature types into `layers`, including names, titles,
advertised CRSs, and WGS84 bounds. The parsed capabilities remain in `formatSpecificMetadata`.
