Raster compression format

# Set the error budget instead of pretending every pixel is RGB.

LERC is designed for analytical rasters: arbitrary numeric pixel types, masks, NoData values, and a caller-selected maximum error. It keeps decoded values useful for analysis while reducing storage and transfer cost.

[LERC module](https://loaders.gl/next/docs/modules/raster/lerc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/lerc.md)[LERC loader](https://loaders.gl/next/docs/modules/raster/lerc/api-reference/lerc-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/lerc/api-reference/lerc-loader.md)[WCS coverage services](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)

The LERC path

## Choose the numeric type. Set the tolerance. Decode the raster.

LERC is a value-oriented raster codec, not a display-only image format. The decoded result can retain masks, NoData information, and statistics for downstream analysis.

01

Input

Raster bands with arbitrary numeric pixel types

02

Budget

Maximum permitted error per pixel

03

Encode

Compact blocks with masks and NoData handling

04

Output

Typed pixels suitable for analysis or visualization

* *[`loaders.gl/wms`](https://loaders.gl/next/docs/modules/ogc/wms.md)*
* *[LERC specification](http://esri.github.io/lerc/)*

LERC is an open-source image or raster format which supports rapid encoding and decoding for any pixel type (not just RGB or Byte). Users set the maximum compression error per pixel while encoding, so the precision of the original input image is preserved (within user defined error bounds).

Detailed guide

## LERC encoding and raster details

The reference below covers value types, error bounds, masks, NoData handling, the loaders.gl entry points, and service integration.
