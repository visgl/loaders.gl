---
title: COPCWriter
description: Write cloud-optimized point clouds as range-readable COPC data.
hide_title: true
page_style: designed
---

import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="COPC module · writer API"
  title="COPCWriter"
  description="Write mesh and Arrow point clouds as COPC 1.0-compatible LAZ, organized for spatially selective, range-readable access from cloud storage."
  tone="cyan"
  meta={['From v5.0', 'COPC 1.0', 'Cloud-optimized']}
  links={[
    {label: 'COPC format', to: '/docs/modules/copc/formats/copc'},
    {label: 'COPC module', to: '/docs/modules/copc'},
    {label: 'LASWriter', to: '/docs/modules/las/api-reference/las-writer'}
  ]}
/>

<CopcDocsTabs active="writer" />

<DocOrientation
  eyebrow="What it writes"
  title="Package a point cloud for selective reads."
  description="COPCWriter builds a sparse octree, keeps level-of-detail samples at parent nodes, and stores point chunks and hierarchy pages so clients can fetch only the regions they need."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table'},
    {label: 'Hierarchy', value: 'Sparse octree with LOD samples'},
    {label: 'Storage', value: 'LAZ chunks and range-readable pages'},
    {label: 'Records', value: 'LAS 1.4 PDRF 6, 7, or 8'}
  ]}
/>

<ReferenceBoundary
  title="COPCWriter reference"
  description="The sections below document usage, node organization, supported attributes, options, and interoperability."
  tone="cyan"
/>

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

The writer first converts supported mesh attributes to LAS 1.4 point records, then assigns every point to exactly one octree level. Parent nodes retain a deterministic level-of-detail sample and remaining points are partitioned into child octants. Each point-bearing node is encoded as an independent LAZ chunk. The hierarchy EVLR is divided into range-readable pages, with absolute child-page references from each parent page.

The writer emits PDRF 6, 7, or 8 with LASzip layered compressor 3, arithmetic coder 0, and item version 3. `POSITION` is required. Represented LAS attributes such as RGB, NIR, GPS time, intensity, classification, return fields, scanner metadata, and classification flags are written when present; missing fields are zero-filled. A coordinate reference system is emitted only when `copc.wkt` is supplied.

Generated files are exercised through both the native TypeScript reader and the independent `copc` implementation. PDRF 6, 7, and 8 node chunks are covered, including NIR, GPS bounds, deep sparse octrees, and recursively range-loaded hierarchy pages.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.nodePointLimit` | `number` | `50000` | Target maximum number of points retained at each octree node. A node at `maximumDepth` may exceed the target. |
| `copc.maximumDepth` | `number` | `16` | Maximum octree depth, from 0 through 30. |
| `copc.hierarchyPageDepth` | `number` | `3` | Number of octree levels represented in each hierarchy page. Smaller values produce more, smaller range requests. |
| `copc.pointDataRecordFormat` | `6 \| 7 \| 8` | Derived | LAS 1.4 point layout. The default is 7 when `COLOR_0` is present and 6 otherwise. |
| `copc.scale` | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate quantization scale factors. |
| `copc.offset` | `[number, number, number]` | Data minimum | Coordinate quantization offsets. |
| `copc.spacing` | `number` | Cube width divided by 128 | Root point spacing stored in the COPC info VLR. |
| `copc.wkt` | `string` | - | Optional OGC WKT coordinate reference system. |
| `copc.colorDepth` | `number \| string` | - | Declares the source color component depth. |

The COPC info VLR records the finite minimum and maximum GPS times written to the point records. Inputs without finite GPS times use `[0, 0]`.
