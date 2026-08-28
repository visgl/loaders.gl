import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ClientExample} from '@site/src/components';

# WFS - Web Feature Service

<WmsDocsTabs active="wfs" />

<p class="badges">
  <a href="/docs/modules/scan#vector-table-views">
    <img src="https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square" alt="Optional scan table view" />
  </a>
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

WFS serves vector features and properties over HTTP. `WFSSourceLoader` provides a read-only
`VectorSource` with GeoJSON and streaming GML ingestion.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| WFS 2.0.0 | Supported | Default request version |
| WFS 1.1.0 | Supported | Version-aware parameter names and axis handling |
| `GetCapabilities` | Supported | Parses service and feature-type metadata |
| `GetFeature` GeoJSON | Supported | Default response path when available |
| `GetFeature` GML 2/3 | Supported | SAX-based parsing of common feature and geometry structures |
| Streaming GML | Supported | `getFeaturesInBatches()` emits bounded batches without buffering the document |
| GeoJSON output | Supported | Standard vector-source feature table |
| Binary and Arrow output | Supported | Select with the standard `format` parameter |
| Bounding-box queries | Supported | Builds a version- and CRS-aware `bbox` request |
| Paging | Supported | WFS 2 uses `count`/`startIndex`; WFS 1.1 maps count to `maxFeatures` |
| Property selection and sorting | Supported | `propertyName` and `sortBy` are forwarded |
| FES XML filters | Pass through | Caller supplies filter XML appropriate for the server version |
| Count-only queries | Supported | Use `resultType: 'hits'` when the server advertises it |
| Schema type hints | Supported | GML property types can be supplied from application schema knowledge |
| Transactions and locking | Not supported | WFS-T mutation APIs are outside the read-only source |
| deck.gl rendering | First class | Pass `WFSSourceLoader` to `SourceLayer` |

## Optional scan table view

WFS remains a service protocol. Layers, request bounds, CRS, paging, and output format stay in the
WFS request. `VectorFeatureTableScanSource` can bind one bounded request that returns an Arrow table
and apply portable relational operations to the returned feature rows.

| Capability | Support |
| --- | --- |
| Layer, bounds, CRS, paging, and service filters | WFS source parameters |
| Table schema | Discovered from the bounded result |
| Predicate, projection, expressions, ordering, aggregates, and limit | Residual Arrow execution |
| Cancellation | Covers the service request and table query |
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
