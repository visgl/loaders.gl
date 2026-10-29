GeoTIFF API / bioimaging

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF

# Read an OME-TIFF pyramid as selected raster data.

OMETiffSourceLoader discovers OME image metadata and reads chosen channels, dimensions, and pyramid levels from a multi-image TIFF without forcing the application to decode every plane.

[GeoTIFF module](https://loaders.gl/next/docs/modules/raster/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff.md)[OME-TIFF example](https://loaders.gl/next/examples/bioimaging/ome-tiff)

<!-- -->

[ ↗](https://loaders.gl/next/examples/bioimaging/ome-tiff)[OME-Zarr source](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/ome-zarr-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/ome-zarr-source-loader.md)

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF[Try GeoTIFF](https://loaders.gl/next/examples/geospatial/geotiff)[Try OME-TIFF](https://loaders.gl/next/examples/bioimaging/ome-tiff)[Overview](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFFLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)[GeoTIFFRasterLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md)[GeoTIFFSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)[OMETiffSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md)

Multichannel raster source

## Discover the image, then request a plane.

OME-TIFF stores image dimensions, channel descriptions, and pyramid levels alongside TIFF data. The source turns those dimensions into explicit metadata and raster requests.

01

Discover

Read channel count, dtype, levels, and OME dimensions.

02

Select

Choose channels, time, depth, and pyramid level.

03

Read

Decode the selected raster plane from the TIFF structure.

04

Compare

Use the same source shape as OME-Zarr image pyramids.

Detailed guide

## OMETiffSourceLoader reference

The detailed reference covers source creation, metadata, raster parameters, image selection, and the relationship to the underlying GeoTIFF loader.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`OMETiffSourceLoader` creates a non-geospatial source for OME-TIFF image pyramids.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {OMETiffSourceLoader} from '@loaders.gl/raster/geotiff/ometiff-source-loader';



const source = createDataSource('multi-channel.ome.tif', [OMETiffSourceLoader], {

  core: {type: 'ometiff'},

  ometiff: {}

});



const metadata = await source.getMetadata();

const raster = await source.getRaster({

  channels: [0, 1, 2],

  level: 0,

  t: 0,

  z: 0

});
```

## API[​](#api "Direct link to API")

### `getMetadata(): Promise<OMETiffSourceLoaderMetadata>`[​](#getmetadata-promiseometiffsourceloadermetadata "Direct link to getmetadata-promiseometiffsourceloadermetadata")

Returns normalized OME image metadata for the first image in the file, including channel count, dtype, pyramid levels, and OME dimension sizes.

### `getRaster(parameters?: GetOMETiffParameters): Promise<RasterData>`[​](#getrasterparameters-getometiffparameters-promiserasterdata "Direct link to getrasterparameters-getometiffparameters-promiserasterdata")

Loads one 2D OME-TIFF plane or a multi-channel composite.

* `level?: number` selects the pyramid level.
* `t?: number` selects the time index.
* `z?: number` selects the z slice.
* `channels?: number[]` selects one or more channels.
* `interleaved?: boolean` returns one interleaved typed array for multi-channel reads.
