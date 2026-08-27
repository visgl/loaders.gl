import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# WCS - Web Coverage Service

<WmsDocsTabs active="wcs" />

![ogc-logo](../../../images/logos/ogc-logo-60.png)

WCS provides access to analytical geospatial coverages rather than rendered map images. The
`@loaders.gl/wms` module exposes a focused source for capabilities discovery and `GetCoverage`
requests.

```js
import {WCSCoverageSourceLoader} from '@loaders.gl/wms';

const source = WCSCoverageSourceLoader.createDataSource('https://example.com/wcs', {
  wcs: {
    coverageId: 'elevation',
    format: 'image/tiff'
  }
});

const metadata = await source.getMetadata();
const coverage = await source.getCoverage({
  bbox: [-10, 40, 10, 50],
  crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
});
```

Binary responses are returned as `ArrayBuffer`. When `format` is a LERC media type and the source
was created with a loaders.gl Core API, the response is decoded through `@loaders.gl/lerc` and
returned as typed per-band arrays with statistics and masks preserved.
