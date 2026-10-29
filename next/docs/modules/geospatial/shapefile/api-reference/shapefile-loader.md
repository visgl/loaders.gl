Shapefile module · loader API

SHP

# ShapefileLoader

Load a Shapefile dataset as one geospatial table, coordinating its geometry, attributes, index, projection, and optional text-encoding sidecars.

[Shapefile format](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[SHP sub-loader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[Shapefile module](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

SHP[Try It](https://loaders.gl/next/examples/geospatial/shapefile)[Overview](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[Format](https://loaders.gl/next/docs/modules/geospatial/shapefile/format.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[SHPLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[DBFLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/dbf-loader.md)

What it assembles

## Treat the sidecars as one dataset.

ShapefileLoader joins geometry and attributes, then carries projection and encoding information through the result so applications do not have to coordinate the files themselves.

01

Geometry

SHP records and multipart shapes

02

Attributes

DBF fields and text encoding

03

Metadata

SHX index and PRJ coordinate system

04

Output

Legacy, GeoJSON, or Arrow table shapes

Detailed guide

## ShapefileLoader reference

The sections below document usage, output shapes, options, and the structure of the assembled result.

The `ShapefileLoader` parses Shapefile datasets into loaders.gl geometry tables.

## Usage[​](#usage "Direct link to Usage")

```
import {ShapefileLoader} from '@loaders.gl/geospatial/shapefile';

import {load} from '@loaders.gl/core';



const table = await load(url, ShapefileLoader);

const legacy = await load(url, ShapefileLoader, {shapefile: {shape: 'v3'}});
```

## Shapes[​](#shapes "Direct link to Shapes")

`ShapefileLoader` returns an Apache Arrow table with GeoArrow-compatible geometry by default. Set `shapefile.shape: 'v3'` or `shapefile.shape: 'geojson-table'` for legacy representations.

| Shape           | Output                                                      |
| --------------- | ----------------------------------------------------------- |
| `v3`            | legacy Shapefile output object                              |
| `geojson-table` | loaders.gl GeoJSON table                                    |
| `arrow-table`   | loaders.gl `ArrowTable` with WKB or typed GeoArrow geometry |

## Options[​](#options "Direct link to Options")

| Option                     | Type            | Default                                | Description                                                                                                                                                                                                                                                                |
| -------------------------- | --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shapefile.shape            | String          | `'arrow-table'`                        | Output shape: `'arrow-table'`, `'v3'`, or `'geojson-table'`.                                                                                                                                                                                                               |
| shapefile.geoarrowEncoding | String          | `'geoarrow.wkb'`                       | Arrow geometry encoding when `shapefile.shape` is `'arrow-table'`: `'geoarrow.wkb'` or `'geoarrow'`. `'geoarrow'` infers a geometry-specific GeoArrow encoding from the SHP header.                                                                                        |
| shp.\_maxDimensions        | Integer         | `4`                                    | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |
| gis.reproject              | boolean         | `false`                                | Opt-in coordinate transformation; missing source CRS or unsupported transformations throw `CRSReprojectionError`.                                                                                                                                                          |
| gis.targetCrs              | `CRSDefinition` | `'WGS84'` when reprojection is enabled | Output CRS for transformed coordinates.                                                                                                                                                                                                                                    |

## Output[​](#output "Direct link to Output")

The default `ShapefileLoader` output is an `ArrowTable` whose property columns come from DBF and whose `geometry` column uses WKB or typed GeoArrow encoding. The table schema carries geospatial metadata and preserves the projection used for reprojection. When `shapefile.shape: 'v3'` is selected, the legacy output below is returned instead. Consult the [Shapefile specification](https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8) for the meaning of the numeric types.

```
{

  encoding: 'ISO-8859-1',

  prj: null,

  shx: {

    offsets: Int32Array(8) [

      50, 0, 0, 0,

       0, 0, 0, 0

    ],

    lengths: Int32Array(8) [

      14, 0, 0, 0,

       0, 0, 0, 0

    ]

  },

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

  data: [ { type: 'Feature', geometry: [Object], properties: [Object] } ]

}
```

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`ShapefileLoader` supports browser worker parsing and `loadInBatches` / `parseInBatches`. The worker joins streamed SHP geometry with DBF attributes and fetches available `.shx`, `.cpg`, and `.prj` sidecars using the source URL. Request options in `core.fetch` are forwarded to those requests. An application-supplied fetch function keeps parsing on the caller.

Worker results use owned Arrow column buffers. Requests for `geojson-table` or `v3` use WKB geometry columns in transit; feature and property objects are constructed only on the caller. Reprojection still runs during geometry decoding. Typed GeoArrow output retains its existing atomic-only restriction; batched Arrow output uses WKB geometry. No Arrow IPC is used.

Set `core.worker: true` to enable workers and `core.worker: false` to use the main thread. An abort signal or iterator closure releases the worker; already transferred input buffers remain detached. These prebuilt bundles target browser workers.
