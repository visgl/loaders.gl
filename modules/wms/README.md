# @loaders.gl/wms

Framework-independent sources and response loaders for OGC geospatial services.

| Service or format | Source or loader | Primary output |
| --- | --- | --- |
| WMS | `WMSSourceLoader` | Rendered map images |
| WMTS | `WMTSSourceLoader` | Capability-driven image tiles |
| WFS | `WFSSourceLoader` | GeoJSON, binary, Arrow, or streaming GML features |
| WCS | `WCSCoverageSourceLoader` | Binary coverages or decoded LERC |
| CSW | `CSWSourceLoader` | Catalog records and referenced services |
| GML | `GMLLoader` | Arrow feature tables and streaming batches; explicit GeoJSON output |
| OGC API Features | `OGCAPIFeaturesSourceLoader` | GeoJSON, binary, or Arrow features |
| OGC API Tiles | `OGCAPITilesSourceLoader` | Raw tile bytes from a template |
| OGC API Coverages | `OGCAPICoveragesSourceLoader` | JSON or binary coverages |
| OGC API EDR | `OGCAPIEDRSourceLoader` | Environmental observation responses |

Create services through the standard loaders.gl source API:

```ts
import {createDataSource} from '@loaders.gl/core';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const source = createDataSource('https://example.com/wmts', [WMTSSourceLoader], {
  wmts: {
    layer: 'basemap',
    tileMatrixSet: 'GoogleMapsCompatible'
  }
});

const metadata = await source.getMetadata();
const image = await source.getTile({z: 3, x: 4, y: 2});
```

WMS, WMTS, WFS, and OGC API Features implement visual source contracts understood by
`@loaders.gl/deck-layers`. Analytical coverage and observation outputs remain explicit data until an
application chooses a visual representation.

ArcGIS REST source loaders are provided by `@loaders.gl/arcgis`.

See the [complete OGC service guide](https://loaders.gl/docs/modules/wms) and the feature table on
each service page.

## Manage feature coverage

`ManagedVectorSource` wraps GeoJSON-capable vector sources with verified extent coverage,
uncovered-rectangle loading, shared cancelable requests, stable-ID deduplication, bounded
retention, and explicit invalidation. Unknown or truncated responses are never marked complete.
Reuse requires explicit equivalent request/output CRSs. Enable `wfs.pagination` or
`ogc-api.pagination` to gather service pages before establishing coverage. `getFeaturesInPages()`
exposes progressive GeoJSON pages with bounded traversal, cancellation, and count/loop guards;
omitting pagination preserves single-page `getFeatures()` behavior. Unknown totals stay uncertified.

See [spatial queries beyond picking](https://loaders.gl/docs/developer-guide/spatial-queries)
for completeness policies and integration with map layers, scan/query, and exact local selection.
