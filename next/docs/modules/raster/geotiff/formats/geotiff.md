Georeferenced raster format

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF

# GeoTIFF

GeoTIFF combines TIFF image storage with tags that describe the raster’s coordinate system, bounds, scale, and placement. Cloud Optimized GeoTIFF adds a layout that makes bounded reads practical.

[GeoTIFF module](https://loaders.gl/next/docs/modules/raster/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF[Try GeoTIFF](https://loaders.gl/next/examples/geospatial/geotiff)[Try OME-TIFF](https://loaders.gl/next/examples/bioimaging/ome-tiff)[Overview](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFFLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)[GeoTIFFRasterLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md)[GeoTIFFSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)[OMETiffSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md)

Windowed raster access

## Read the window that answers the question.

Raster sources use metadata before pixels: discover the layout, choose the useful window, and decode only the ranges or chunks that cover it.

01 · discover

### GeoTIFF / Cloud Optimized GeoTIFF

TIFF pages and tiles carry georeferencing, bands, and overview metadata.

boundsbandsoverviews

pla&#x6E;**→**

02 · select

### Select a raster window

Use the coordinate system and resolution that match the request.

bboxoverviewband

rea&#x64;**→**

[03 · application result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

### [Typed raster result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[Pixels, dimensions, transform, and CRS stay available to the application.<!-- --> ↗](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[pixelstransformCRS](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

A local file may use direct offsets; a cloud source may use HTTP ranges or object-store chunks. The application-facing selection remains the same.

A raster has more than pixels

## Read the window, resolution, bands, and reference.

A raster request is naturally spatial. loaders.gl keeps bounds, overviews, bands, and CRS metadata together so a cloud read can select the relevant image ranges.

01

Image

Typed pixel values and dimensions

02

Location

Bounds, transform, and coordinate reference

03

Selection

Window, overview, and band choices

04

Delivery

Local files or HTTP range-readable COGs

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`@loaders.gl/raster`](https://loaders.gl/next/docs/modules/raster/geotiff.md)*
* *[OGC Standard](https://www.ogc.org/standard/geotiff/)*

## GeoTIFF Metadata[​](#geotiff-metadata "Direct link to GeoTIFF Metadata")

GeoTIFF is a public domain metadata standard that enables georeferencing information to be embedded within an image file. The GeoTIFF format embeds geospatial metadata into image files such as aerial photography, satellite imagery, and digitized maps so that they can be used in GIS applications.

<https://gis.stackexchange.com/questions/62837/understanding-geotiff-tags> <http://duff.ess.washington.edu/data/raster/drg/docs/geotiff.txt>

## TIFF[​](#tiff "Direct link to TIFF")

TIFF or TIF (Tagged Image Format) is an image file format for storing raster graphics images.

A TIFF file can contain multiple images, with tags pointing to each image.

The latest version is TIFF 6.0 was released on 3 June 1992.

## Scan support[​](#scan-support "Direct link to Scan support")

GeoTIFF and Cloud Optimized GeoTIFF participate through the raster side of the [common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md). Raster queries keep their natural window, resolution, and band vocabulary rather than pretending pixels are table rows.

| Capability                 | GeoTIFF / COG                                                                                                                                                                                           | OME-TIFF                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Entry point                | `getRaster()`                                                                                                                                                                                           | `getRaster()`                                  |
| Metadata discovery         | Bands, dtype, bounds, CRS, overviews                                                                                                                                                                    | Channels, dtype, dimensions, multiscale levels |
| Native TileMatrix geometry | Optional for tiled, axis-aligned overview hierarchies; see [source details](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md#native-tilematrix-geometry) | Not provided                                   |
| Spatial window             | Bounds pushdown in the source CRS                                                                                                                                                                       | Not geospatial                                 |
| Resolution                 | Overview/target-size selection                                                                                                                                                                          | Multiscale level selection                     |
| Components                 | Band selection                                                                                                                                                                                          | Channel selection plus time and z slices       |
| Output                     | Typed planar or interleaved raster data                                                                                                                                                                 | Typed image planes                             |
| Reprojection               | Not performed                                                                                                                                                                                           | Not applicable                                 |
| Cancellation               | Checked by the source, but not advertised as cooperative raster cancellation                                                                                                                            | Validated query execution                      |

COG range access is preserved: a bounded request can select the relevant image and byte ranges without first downloading the entire file. When a viewport CRS differs from the source CRS, the source rejects the request rather than silently returning misregistered pixels.

Detailed guide

## TIFF metadata and raster access

The sections below describe GeoTIFF metadata, TIFF structure, scan behavior, and the boundaries of the current source implementations.
