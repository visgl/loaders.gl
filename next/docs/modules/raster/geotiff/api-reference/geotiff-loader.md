GeoTIFF loader

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF

# GeoTIFFLoader

GeoTIFFLoader is the entry point for TIFF imagery whose tags describe scale, bounds, and coordinate reference. Use the source APIs when a cloud query needs selective ranges or windows.

[GeoTIFF format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFF module](https://loaders.gl/next/docs/modules/raster/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff.md)

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF[Try GeoTIFF](https://loaders.gl/next/examples/geospatial/geotiff)[Try OME-TIFF](https://loaders.gl/next/examples/bioimaging/ome-tiff)[Overview](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFFLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)[GeoTIFFRasterLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md)[GeoTIFFSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)[OMETiffSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md)

Loader or source?

## Load a complete image, or query a remote raster.

The loader is the simple complete-file path. GeoTIFFSourceLoader adds metadata discovery, range reads, windows, overview selection, and cancellation for cloud-native access.

01

Loader

Complete TIFF image and metadata

02

Source

Bounded windows and HTTP ranges

03

Output

Typed image data with dimensions

04

Metadata

Tags, transform, bounds, and CRS

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

Detailed guide

## GeoTIFF loader details

The reference below covers complete-file loading, the returned raster shape, metadata, and the boundary between GeoTIFFLoader and GeoTIFFSourceLoader.

`GeoTIFFLoader` parses a complete GeoTIFF from an `ArrayBuffer` and reads the first image in the file. It is the straightforward path for local files or applications that already have the complete file in memory. For remote windows, overviews, or band-selective reads, use [`GeoTIFFSourceLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md).

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {GeoTIFFLoader} from '@loaders.gl/raster';



const image = await load('example.tif', GeoTIFFLoader);



console.log(image.width, image.height);

console.log(image.bounds, image.crs);
```

## Returned data[​](#returned-data "Direct link to Returned data")

The loader returns an object containing:

| Field             | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `data`            | An RGBA or RGB `Uint8ClampedArray` containing decoded pixel values. |
| `width`, `height` | Dimensions of the first image in pixels.                            |
| `bounds`          | The image bounding box from GeoTIFF georeferencing metadata.        |
| `crs`             | The projected EPSG identifier when it is present in the GeoKeys.    |
| `metadata`        | The raw GeoTIFF GeoKeys returned by the parser.                     |

## Options[​](#options "Direct link to Options")

| Option                | Type      | Default | Description                                                 |
| --------------------- | --------- | ------- | ----------------------------------------------------------- |
| `geotiff.enableAlpha` | `boolean` | `true`  | Include an alpha channel when the source image supports it. |

`GeoTIFFLoader` currently reads only the first image and uses `readRGB()`. It does not provide windowed reads, overview selection, or reprojection. Those operations belong to the source API.

For original numeric samples, nodata, and per-band scale/offset metadata, use [`GeoTIFFRasterLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md).
