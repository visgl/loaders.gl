COPC module · writer API

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)

# COPCWriter

Write mesh and Arrow point clouds as COPC 1.0-compatible LAZ, organized for spatially selective, range-readable access from cloud storage.

[COPC format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[COPC module](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)[Try It](https://loaders.gl/next/examples/pointclouds/copc-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[COPCSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)[COPCWriter](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)

What it writes

## Package a point cloud for selective reads.

COPCWriter builds a sparse octree, keeps level-of-detail samples at parent nodes, and stores point chunks and hierarchy pages so clients can fetch only the regions they need.

01

Input

Mesh or Mesh Arrow table

02

Hierarchy

Sparse octree with LOD samples

03

Storage

LAZ chunks and range-readable pages

04

Records

LAS 1.4 PDRF 6, 7, or 8

Detailed guide

## COPCWriter reference

The sections below document usage, node organization, supported attributes, options, and interoperability.

`COPCWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) point clouds as COPC 1.0-compatible LAZ data.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import {COPCWriter} from '@loaders.gl/tiles-3d/copc';



const arrayBuffer = await encode(pointCloud, COPCWriter, {

  copc: {

    nodePointLimit: 50000,

    pointDataRecordFormat: 7,

    scale: [0.001, 0.001, 0.001]

  }

});
```

## Data Organization[​](#data-organization "Direct link to Data Organization")

The writer first converts supported mesh attributes to LAS 1.4 point records, then assigns every point to exactly one octree level. Parent nodes retain a deterministic level-of-detail sample and remaining points are partitioned into child octants. Each point-bearing node is encoded as an independent LAZ chunk. The hierarchy EVLR is divided into range-readable pages, with absolute child-page references from each parent page.

The writer emits PDRF 6, 7, or 8 with LASzip layered compressor 3, arithmetic coder 0, and item version 3. `POSITION` is required. Represented LAS attributes such as RGB, NIR, GPS time, intensity, classification, return fields, scanner metadata, and classification flags are written when present; missing fields are zero-filled. A coordinate reference system is emitted only when `copc.wkt` is supplied.

Generated files are exercised through both the native TypeScript reader and the independent `copc` implementation. PDRF 6, 7, and 8 node chunks are covered, including NIR, GPS bounds, deep sparse octrees, and recursively range-loaded hierarchy pages.

## Options[​](#options "Direct link to Options")

| Option                       | Type                       | Default                   | Description                                                                                                      |
| ---------------------------- | -------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `copc.nodePointLimit`        | `number`                   | `50000`                   | Target maximum number of points retained at each octree node. A node at `maximumDepth` may exceed the target.    |
| `copc.maximumDepth`          | `number`                   | `16`                      | Maximum octree depth, from 0 through 30.                                                                         |
| `copc.hierarchyPageDepth`    | `number`                   | `3`                       | Number of octree levels represented in each hierarchy page. Smaller values produce more, smaller range requests. |
| `copc.pointDataRecordFormat` | `6 \| 7 \| 8`              | Derived                   | LAS 1.4 point layout. The default is 7 when `COLOR_0` is present and 6 otherwise.                                |
| `copc.scale`                 | `[number, number, number]` | `[0.001, 0.001, 0.001]`   | Coordinate quantization scale factors.                                                                           |
| `copc.offset`                | `[number, number, number]` | Data minimum              | Coordinate quantization offsets.                                                                                 |
| `copc.spacing`               | `number`                   | Cube width divided by 128 | Root point spacing stored in the COPC info VLR.                                                                  |
| `copc.wkt`                   | `string`                   | -                         | Optional OGC WKT coordinate reference system.                                                                    |
| `copc.colorDepth`            | `number \| string`         | -                         | Declares the source color component depth.                                                                       |

The COPC info VLR records the finite minimum and maximum GPS times written to the point records. Inputs without finite GPS times use `[0, 0]`.

## Custom attributes[​](#custom-attributes "Direct link to Custom attributes")

`copc.extraBytes` forwards explicit `{attribute, name?, description?}` mappings to `LASWriter`. COPC preserves the generated LAS Extra Bytes VLR and extended records through octree sampling and LAZ compression. One- or three-component typed attributes retain their scalar widths, including exact signed and unsigned 64-bit identifiers. See the LAS writer for supported types and descriptors.
