<!-- -->

<!-- -->

scientific format

# VTK — scientific meshes and fields

Preserve cell topology and field associations before choosing a visualization.

[scientific module](https://loaders.gl/next/docs/modules/scientific.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific.md)

Format feature card

## Read VTK as data.

Extends existing scientific/vtk readers; no universal VTK coverage

01

Input

Legacy ASCII; XML ASCII and uncompressed inline base64

02

Output

Legacy VTKDataset or VTKXMLDataset pieces and arrays

03

Loader

VTKLoader · @loaders.gl/scientific

04

Parser

@loaders.gl/scientific/vtk

:::note Availability

This page documents the initial implementation in [PR #4414](https://github.com/visgl/loaders.gl/pull/4414). Use a version containing that change; this guide does not imply availability in older published versions.

:::

Detailed guide

## Format, usage and output reference

Understand the source data, load it through the public entry point, and check the supported subset before integrating it.

## What is VTK?[​](#what-is-vtk "Direct link to What is VTK?")

VTK datasets describe scientific geometry, topology, and associated values. A scalar can belong to each point or each cell; those associations change its interpretation. Structured grids encode regular indexing, while unstructured grids explicitly record cell connectivity and types. Triangulating everything would discard part of this information.

There are two file families: legacy .vtk files and XML datasets such as .vti, .vtu, .vtp, .vtr, and .vts. A recognized extension does not imply support for every storage or compression encoding in that family.

## Use the standard loader[​](#use-the-standard-loader "Direct link to Use the standard loader")

```
import {load} from '@loaders.gl/core';

import {VTKLoader} from '@loaders.gl/scientific';



const dataset = await load('flow.vtu', VTKLoader);

console.log(dataset); // Inspect the legacy or XML dataset contract before conversion.
```

This descriptor wraps the existing `@loaders.gl/scientific/vtk` readers. It does not introduce a second renderer-oriented VTK implementation. Code already using `parseVTKLegacy` or `parseVTKXML` can continue to use those direct functions.

## Support matrix[​](#support-matrix "Direct link to Support matrix")

| Family            | Supported                                                               | Not implemented                               |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| Legacy            | ASCII POLYDATA, STRUCTURED\_POINTS, UNSTRUCTURED\_GRID                  | Binary legacy files                           |
| Legacy geometry   | Points; dimensions, origin, spacing; one connectivity block; cell types | Multiple POLYDATA topology blocks             |
| Legacy fields     | SCALARS, VECTORS, NORMALS                                               | FIELD, TENSORS                                |
| XML dataset types | ImageData, UnstructuredGrid, PolyData, RectilinearGrid, StructuredGrid  | Parallel manifest files such as .pvtu         |
| XML DataArray     | ASCII and uncompressed inline base64                                    | Appended arrays and zlib/LZ4/LZMA compression |

## Output and precision[​](#output-and-precision "Direct link to Output and precision")

The legacy result is a VTKDataset. It retains dataset type, geometry/connectivity, and scientific attribute arrays, converting legacy numeric data to float32. That conversion can round integer or high-precision floating-point values.

The XML result is a VTKXMLDataset containing pieces and their typed DataArray groups. PointData, CellData, Points, Cells, and coordinate/topology associations remain distinct. XML numeric storage preserves its supported declared precision, including Int64/UInt64 typed arrays. Handle 64-bit integer arrays explicitly when passing them to APIs that only accept JavaScript numbers.

The two results are not one normalized mesh schema. Applications select arrays, combine pieces, interpret cell types, construct geometry, and choose interpolation or field sampling. No volume triangulation, resampling, color map, or render object is applied.

## Validation and limits[​](#validation-and-limits "Direct link to Validation and limits")

Structured cell counts derive from point dimensions, preserving nonzero cells for one- and two-dimensional grids with singleton axes.

The standard loader validates legacy connectivity and point/cell attribute counts and rejects malformed or float32-overflowing legacy values. XML topology validation remains incomplete. XML documents are fully materialized in memory; streaming and random access are not implemented. Use representative files from the actual producer to establish compatibility with this experimental subset.

## Direct and synchronous APIs[​](#direct-and-synchronous-apis "Direct link to Direct and synchronous APIs")

```
import {parseSync} from '@loaders.gl/core';

import {VTKLoaderWithParser} from '@loaders.gl/scientific/vtk';

import {parseVTKLegacy, parseVTKXML} from '@loaders.gl/scientific/vtk';



const dataset = parseSync(text, VTKLoaderWithParser);

// Or choose a file family explicitly:

const legacyDataset = parseVTKLegacy(legacyText);

const xmlDataset = parseVTKXML(xmlText);
```

There are no VTK-specific loader options. For an attached sampled raster without cell topology, compare NRRD.
