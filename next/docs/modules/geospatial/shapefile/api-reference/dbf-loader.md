Shapefile module · attribute loader

SHP

# DBFLoader

Decode the legacy dBase attribute table that accompanies Shapefile geometry, with control over the text encoding used for field values.

[Shapefile format](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[Shapefile module](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

SHP[Try It](https://loaders.gl/next/examples/geospatial/shapefile)[Overview](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[Format](https://loaders.gl/next/docs/modules/geospatial/shapefile/format.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[SHPLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[DBFLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/dbf-loader.md)

What it reads

## Keep the attribute table separate when you need it.

DBFLoader handles the fields stored alongside Shapefile geometry. Applications can use it directly for attribute inspection or let ShapefileLoader join it with the geometry component.

01

Input

A \`.dbf\` dBase attribute file

02

Output

An Arrow attribute table

03

Encoding

CPG-guided or explicitly selected

04

Boundary

Attributes only, without geometry

Detailed guide

## DBFLoader reference

The sections below document installation, usage, encoding options, and the relationship to the full Shapefile dataset.

A sub loader for the `.dbf` (attributes/properties) file component of a shapefile. This is essentially a loader for the legacy dBase 7 database format.

Note: Most applications will want to use the `ShapefileLoader` instead of this loader.

## Usage[​](#usage "Direct link to Usage")

The `DBFLoader` parses feature attributes from the Shapefile format.

```
import {DBFLoader} from '@loaders.gl/geospatial/shapefile';

import {load} from '@loaders.gl/core';



const table = await load(url, DBFLoader, {dbf: {encoding: 'utf8'}});

const rows = await load(url, DBFLoader, {dbf: {encoding: 'utf8', shape: 'rows'}});
```

## Options[​](#options "Direct link to Options")

* `encoding`: text encoding of DBF file: usually either `utf8`, or `ascii`/`windows-1252`. For Shapefiles, there's often a `.cpg` file designating the encoding used.
* `shape`: defaults to `'arrow-table'`; set `'rows'`, `'table'`, or `'object-row-table'` for legacy row-oriented output.

## Format Summary[​](#format-summary "Direct link to Format Summary")

ESRI Shapefiles are a popular file format for storing geospatial vector data. The format consists of a number of files that must be stored together and with the same file name. Files with extensions `.shp`, `.shx`, `.dbf` must exist; additional files with other extensions such as `.prj` and `.cpg` may exist.

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`DBFLoader` supports browser worker parsing and `parseInBatches`. The worker decodes attributes into Arrow columns for every requested shape. `rows`, `table`, and `object-row-table` conversion runs on the caller after hydration. Legacy batches retain the initial DBF header followed by row arrays. Dates remain millisecond timestamps. No Arrow IPC or decoded row objects are returned by the worker.

Set `core.worker: true` to enable workers and `core.worker: false` to use the main thread. An abort signal or iterator closure releases the worker; already transferred input buffers remain detached. These prebuilt bundles target browser workers.
