# @loaders.gl/wms

Framework-independent sources and response loaders for OGC geospatial services.

| Service or format | Source or loader | Primary output |
| --- | --- | --- |
| WMS | `WMSSourceLoader` | Rendered map images |
| WMTS | `WMTSSourceLoader` | Capability-driven image tiles |
| WFS | `WFSSourceLoader` | GeoJSON, binary, Arrow, or streaming GML features |
| WCS | `WCSCoverageSourceLoader` | Binary coverages or decoded LERC |
| CSW | `CSWSourceLoader` | Catalog records and referenced services |
| GML | `GMLLoader` | GeoJSON feature collections and streaming batches |
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

ArcGIS REST source loaders are provided by `@loaders.gl/services`.

See the [complete OGC service guide](https://loaders.gl/docs/modules/wms) and the feature table on
each service page.
