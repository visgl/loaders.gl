OGC coverage service

![](/next/images/format-logos/ogc-mark.svg)OGCWCS

# Request the coverage data behind the map.

WCS provides analytical raster coverages rather than server-rendered map images. The source discovers the service, builds version-aware subset requests, and preserves binary responses for the appropriate decoder.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[WCS source](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)[GeoTIFF format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

The WCS request path

## Read the coverage metadata. Select a subset. Decode the result.

WCS keeps coverage values and request dimensions explicit. Use the source to form the service request, then choose whether the returned representation should remain binary or become analysis-ready pixels.

01

Discover

Coverages, bounds, formats, axes, and CRS

02

Subset

Bounding boxes, dimensions, and explicit axes

03

Request

Version-aware \`GetCoverage\` parameters

04

Decode

GeoTIFF, LERC, or another binary coverage loader

![](/next/images/format-logos/ogc-mark.svg)OGCWCS[WCS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)

WCS provides analytical geospatial coverages rather than server-rendered map images. `WCSCoverageSourceLoader` supports focused discovery and read-only coverage retrieval.

Detailed guide

## Coverage request and decoding details

The reference below covers capabilities, subsets, CRS selection, binary responses, LERC decoding, and request customization.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                       | Support         | API and behavior                                                  |
| -------------------------------- | --------------- | ----------------------------------------------------------------- |
| `GetCapabilities`                | ✅ Supported    | Parses service metadata and advertised coverage summaries         |
| Normalized metadata              | ✅ Supported    | `getMetadata()` returns title, identifiers, formats, and bounds   |
| `GetCoverage`                    | ✅ Supported    | Returns the requested binary coverage representation              |
| WCS 2.x subsets                  | ✅ Supported    | `bbox` is converted to repeated axis subset expressions           |
| WCS 1.x bounding boxes           | ✅ Supported    | Legacy `bbox`, `crs`, and `responseCRS` parameters are generated  |
| Explicit subset expressions      | ✅ Supported    | Pass one or more server-specific `subset` values                  |
| Output dimensions                | ✅ Supported    | Width and height are forwarded when accepted by the service       |
| CRS selection                    | ✅ Supported    | Request and response CRS parameters are version-aware             |
| GeoTIFF and other binary formats | ✅ Preserved    | Returned as `ArrayBuffer` for decoding by the appropriate loader  |
| LERC                             | ✅ Decoded      | Returns typed per-band arrays, masks, NoData, and statistics      |
| `DescribeCoverage`               | ❌ Not exposed  | Use a custom request when detailed range metadata is required     |
| Coverage processing              | ❌ Not provided | Resampling, algebra, and colorization remain application concerns |
| deck.gl rendering                | ⚠️ Explicit     | Decode the format and choose a raster visualization policy first  |

## Retrieve a coverage[​](#retrieve-a-coverage "Direct link to Retrieve a coverage")

```
import {createDataSource} from '@loaders.gl/core';

import {WCSCoverageSourceLoader} from '@loaders.gl/ogc/wms';



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

Binary formats are intentionally preserved. For example, pass a GeoTIFF `ArrayBuffer` to the TIFF loader when decoded pixels are required.

## Analytical LERC[​](#analytical-lerc "Direct link to Analytical LERC")

When the requested format contains `lerc`, the response is decoded through `@loaders.gl/raster/lerc`:

```
const raster = await source.getCoverage({

  coverageId: 'temperature',

  bbox: [-10, 40, 10, 50],

  format: 'image/lerc'

});



if (!(raster instanceof ArrayBuffer)) {

  console.log(raster.width, raster.height, raster.pixels, raster.mask);

}
```

The returned values are analysis-ready. loaders.gl does not infer a color ramp or alter numerical values merely to make them displayable.

## Request customization[​](#request-customization "Direct link to Request customization")

Use `wcs.parameters` for source-wide vendor defaults and `parameters` on `getCoverage()` for one request. Repeated `subset` values are encoded separately, as required by WCS 2.x.

## References[​](#references "Direct link to References")

* [OGC Web Coverage Service standard](https://www.ogc.org/standard/wcs/)
