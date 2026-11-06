---
title: "VTK — scientific meshes and fields"
description: "Preserve cell topology and field associations before choosing a visualization."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="scientific format"
  title="VTK — scientific meshes and fields"
  description="Preserve cell topology and field associations before choosing a visualization."
  tone="cyan"
  meta={["VTKLoader","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'scientific module', to: '/docs/modules/scientific'}]}
/>

<DocOrientation
  eyebrow="Format feature card"
  title="Read VTK as data."
  description="Extends existing scientific/vtk readers; no universal VTK coverage"
  tone="cyan"
  items={[{"label":"Input","value":"Legacy ASCII; XML ASCII and uncompressed inline base64"},{"label":"Output","value":"Legacy VTKDataset or VTKXMLDataset pieces and arrays"},{"label":"Loader","value":"VTKLoader · @loaders.gl/scientific"},{"label":"Parser","value":"@loaders.gl/scientific/vtk-loader"}]}
/>

:::note Availability

This page documents the initial implementation in [PR #4414](https://github.com/visgl/loaders.gl/pull/4414). Use a version containing that change; this guide does not imply availability in older published versions.

:::

<ReferenceBoundary
  title="Format, usage and output reference"
  description="Understand the source data, load it through the public entry point, and check the supported subset before integrating it."
  tone="cyan"
/>

## What is VTK?

VTK datasets describe scientific geometry, topology, and associated values. A scalar can belong to each point or each cell; those associations change its interpretation. Structured grids encode regular indexing, while unstructured grids explicitly record cell connectivity and types. Triangulating everything would discard part of this information.

There are two file families: legacy .vtk files and XML datasets such as .vti, .vtu, .vtp, .vtr, and .vts. A recognized extension does not imply support for every storage or compression encoding in that family.

## Use the standard loader

```typescript
import {load} from '@loaders.gl/core';
import {VTKLoader} from '@loaders.gl/scientific';

const dataset = await load('flow.vtu', VTKLoader);
console.log(dataset); // Inspect the legacy or XML dataset contract before conversion.
```

This descriptor wraps the existing `@loaders.gl/scientific/vtk` readers. It does not introduce a second renderer-oriented VTK implementation. Code already using `parseVTKLegacy` or `parseVTKXML` can continue to use those direct functions.

## Support matrix

| Family | Supported | Not implemented |
| --- | --- | --- |
| Legacy | ASCII POLYDATA, STRUCTURED_POINTS, UNSTRUCTURED_GRID | Binary legacy files |
| Legacy geometry | Points; dimensions, origin, spacing; one connectivity block; cell types | Multiple POLYDATA topology blocks |
| Legacy fields | SCALARS, VECTORS, NORMALS | FIELD, TENSORS |
| XML dataset types | ImageData, UnstructuredGrid, PolyData, RectilinearGrid, StructuredGrid | Parallel manifest files such as .pvtu |
| XML DataArray | ASCII and uncompressed inline base64 | Appended arrays and zlib/LZ4/LZMA compression |

## Output and precision

The legacy result is a VTKDataset. It retains dataset type, geometry/connectivity, and scientific attribute arrays, converting legacy numeric data to float32. That conversion can round integer or high-precision floating-point values.

The XML result is a VTKXMLDataset containing pieces and their typed DataArray groups. PointData, CellData, Points, Cells, and coordinate/topology associations remain distinct. XML numeric storage preserves its supported declared precision, including Int64/UInt64 typed arrays. Handle 64-bit integer arrays explicitly when passing them to APIs that only accept JavaScript numbers.

The two results are not one normalized mesh schema. Applications select arrays, combine pieces, interpret cell types, construct geometry, and choose interpolation or field sampling. No volume triangulation, resampling, color map, or render object is applied.

## Validation and limits

Structured cell counts derive from point dimensions, preserving nonzero cells for
one- and two-dimensional grids with singleton axes.

The standard loader validates legacy connectivity and point/cell attribute counts and rejects malformed or float32-overflowing legacy values. XML topology validation remains incomplete. XML documents are fully materialized in memory; streaming and random access are not implemented. Use representative files from the actual producer to establish compatibility with this experimental subset.

## Direct and synchronous APIs

```typescript
import {parseSync} from '@loaders.gl/core';
import {VTKLoaderWithParser} from '@loaders.gl/scientific/vtk-loader';
import {parseVTKLegacy, parseVTKXML} from '@loaders.gl/scientific/vtk';

const dataset = parseSync(text, VTKLoaderWithParser);
// Or choose a file family explicitly:
const legacyDataset = parseVTKLegacy(legacyText);
const xmlDataset = parseVTKXML(xmlText);
```

There are no VTK-specific loader options. For an attached sampled raster without cell topology, compare NRRD.
