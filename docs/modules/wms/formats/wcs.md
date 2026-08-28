import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# WCS - Web Coverage Service

<WmsDocsTabs active="wcs" />

![ogc-logo](../../../images/logos/ogc-logo-60.png)

WCS provides analytical geospatial coverages rather than server-rendered map images.
`WCSCoverageSourceLoader` supports focused discovery and read-only coverage retrieval.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| `GetCapabilities` | Supported | Parses service metadata and advertised coverage summaries |
| Normalized metadata | Supported | `getMetadata()` returns title, identifiers, formats, and bounds |
| `GetCoverage` | Supported | Returns the requested binary coverage representation |
| WCS 2.x subsets | Supported | `bbox` is converted to repeated axis subset expressions |
| WCS 1.x bounding boxes | Supported | Legacy `bbox`, `crs`, and `responseCRS` parameters are generated |
| Explicit subset expressions | Supported | Pass one or more server-specific `subset` values |
| Output dimensions | Supported | Width and height are forwarded when accepted by the service |
| CRS selection | Supported | Request and response CRS parameters are version-aware |
| GeoTIFF and other binary formats | Preserved | Returned as `ArrayBuffer` for decoding by the appropriate loader |
| LERC | Decoded | Returns typed per-band arrays, masks, NoData, and statistics |
| `DescribeCoverage` | Not exposed | Use a custom request when detailed range metadata is required |
| Coverage processing | Not provided | Resampling, algebra, and colorization remain application concerns |
| deck.gl rendering | Explicit | Decode the format and choose a raster visualization policy first |

## Retrieve a coverage

```ts
import {createDataSource} from '@loaders.gl/core';
import {WCSCoverageSourceLoader} from '@loaders.gl/wms';

const source = createDataSource('https://example.com/wcs', [WCSCoverageSourceLoader], {
  wcs: {
    version: '2.0.1',
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

Binary formats are intentionally preserved. For example, pass a GeoTIFF `ArrayBuffer` to the TIFF
loader when decoded pixels are required.

## Analytical LERC

When the requested format contains `lerc`, the response is decoded through `@loaders.gl/lerc`:

```ts
const raster = await source.getCoverage({
  coverageId: 'temperature',
  bbox: [-10, 40, 10, 50],
  format: 'image/lerc'
});

if (!(raster instanceof ArrayBuffer)) {
  console.log(raster.width, raster.height, raster.pixels, raster.mask);
}
```

The returned values are analysis-ready. loaders.gl does not infer a color ramp or alter numerical
values merely to make them displayable.

## Request customization

Use `wcs.parameters` for source-wide vendor defaults and `parameters` on `getCoverage()` for one
request. Repeated `subset` values are encoded separately, as required by WCS 2.x.

## References

- [OGC Web Coverage Service standard](https://www.ogc.org/standard/wcs/)
