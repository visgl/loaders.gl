import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';

# COPCWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

<CopcDocsTabs active="writer" />

`COPCWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) point clouds as COPC 1.0-compatible LAZ data.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {COPCWriter} from '@loaders.gl/copc';

const arrayBuffer = await encode(pointCloud, COPCWriter, {
  copc: {
    nodePointLimit: 50000,
    pointDataRecordFormat: 7,
    scale: [0.001, 0.001, 0.001]
  }
});
```

## Data Organization

The writer first converts supported mesh attributes to LAS 1.4 point records, then assigns every point to exactly one octree level. Parent nodes retain a deterministic level-of-detail sample and remaining points are partitioned into child octants. Each point-bearing node is encoded as an independent LAZ chunk and listed in a single hierarchy EVLR.

The writer emits PDRF 6, 7, or 8 with LASzip layered compressor 3, arithmetic coder 0, and item version 3. `POSITION` is required. `COLOR_0`, `intensity`, and `classification` are written when present; other LAS fields are zero-filled. A coordinate reference system is emitted only when `copc.wkt` is supplied.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.nodePointLimit` | `number` | `50000` | Target maximum number of points retained at each octree node. A node at `maximumDepth` may exceed the target. |
| `copc.maximumDepth` | `number` | `16` | Maximum octree depth, from 0 through 30. |
| `copc.pointDataRecordFormat` | `6 \| 7 \| 8` | Derived | LAS 1.4 point layout. The default is 7 when `COLOR_0` is present and 6 otherwise. |
| `copc.scale` | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate quantization scale factors. |
| `copc.offset` | `[number, number, number]` | Data minimum | Coordinate quantization offsets. |
| `copc.spacing` | `number` | Cube width divided by 128 | Root point spacing stored in the COPC info VLR. |
| `copc.wkt` | `string` | - | Optional OGC WKT coordinate reference system. |
| `copc.colorDepth` | `number \| string` | - | Declares the source color component depth. |
