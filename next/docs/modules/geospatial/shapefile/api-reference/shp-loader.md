Shapefile module · geometry loader

SHP

# SHPLoader

Decode the `.shp` geometry component of a Shapefile dataset into WKB or Arrow geometry columns. Use ShapefileLoader when attributes and sidecars are needed too.

[Shapefile format](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[Shapefile module](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

SHP[Try It](https://loaders.gl/next/examples/geospatial/shapefile)[Overview](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[Format](https://loaders.gl/next/docs/modules/geospatial/shapefile/format.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[SHPLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[DBFLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/dbf-loader.md)

What it reads

## Decode geometry when the attributes are handled elsewhere.

SHPLoader focuses on the binary geometry file and can emit compact WKB or an Arrow geometry column, making it useful as a lower-level building block.

01

Input

A \`.shp\` geometry file

02

Default

An Arrow geometry table

03

Arrow

WKB or typed GeoArrow geometry

04

Dimensions

X, Y, Z, and M where present

Detailed guide

## SHPLoader reference

The sections below document the lower-level loader, installation, usage, output, and geometry options.

A "sub loader" for the `.shp` (geometries) file component of a shapefile.

Note: Most applications will want to use the `ShapefileLoader` instead of this loader.

## Usage[​](#usage "Direct link to Usage")

```
import {SHPLoader} from '@loaders.gl/geospatial/shapefile';

import {load} from '@loaders.gl/core';



const table = await load(url, SHPLoader);

const legacy = await load(url, SHPLoader, {shp: {shape: 'wkb'}});
```

## Options[​](#options "Direct link to Options")

| Option                       | Type    | Default          | Description                                                                                                                                                                                                                                                                |
| ---------------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shp.shape                    | String  | `'arrow-table'`  | Output shape: `'arrow-table'` for an Arrow geometry column, or `'wkb'` for an array of WKB geometries.                                                                                                                                                                     |
| shp.geoarrowEncoding         | String  | `'geoarrow.wkb'` | Legacy Arrow geometry encoding when `shp.shape` is `'arrow-table'`: `'geoarrow.wkb'` or `'geoarrow'`. `'geoarrow'` maps to the adaptive `optimized` preference and infers a geometry-specific GeoArrow encoding from the SHP header.                                       |
| geoarrow\.encodingPreference | String  | `'geoarrow.wkb'` | Arrow geometry preference: `'geoarrow.wkb'` for compact compatibility, `'geoarrow.geometry'` for a stable dense union, or `'optimized'` for concrete native encoding when possible.                                                                                        |
| shp.\_maxDimensions          | Integer | `4`              | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |

## Output[​](#output "Direct link to Output")

The legacy `wkb` output looks like the following. `geometries` holds an array of WKB byte arrays, with `null` entries for Null Shape records. `header` contains the Shapefile's header values, including a bounding box of the data and the file's geometry type. Consult the [Shapefile specification](https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8) for the meaning of the numeric types.

```
{

  geometries: [Uint8Array(29)],

  header: {

    magic: 9994,

    length: 136,

    version: 1000,

    type: 11,

    bbox: {

      minX: 1,

      minY: 2,

      minZ: 3,

      minM: 0,

      maxX: 1,

      maxY: 2,

      maxZ: 3,

      maxM: 0

    }

  },

  progress: { bytesUsed: 0, bytesTotal: 136, rows: 1 },

  currentIndex: 2

}
```

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`SHPLoader` supports browser worker parsing and `parseInBatches`. Arrow output uses owned Arrow column buffers; WKB output transfers binary geometry buffers and a small header envelope. Streaming WKB preserves the initial SHP header followed by geometry arrays. No Arrow IPC is used. Split input headers and records are supported.

Set `core.worker: true` to enable workers and `core.worker: false` to use the main thread. An abort signal or iterator closure releases the worker; already transferred input buffers remain detached. These prebuilt bundles target browser workers.
