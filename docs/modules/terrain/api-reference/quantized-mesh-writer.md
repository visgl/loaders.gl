---
title: QuantizedMeshWriter
description: Encode mesh and Arrow terrain data as quantized mesh tiles.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Terrain module · writer API"
  title="QuantizedMeshWriter"
  description="Encode loaders.gl mesh or Mesh Arrow table data as compact quantized mesh terrain tiles for tile-based terrain delivery."
  tone="orange"
  meta={['From v5.0', 'Quantized Mesh', 'Binary terrain output']}
  links={[
    {label: 'Terrain module', to: '/docs/modules/terrain'},
    {label: 'Terrain module', to: '/docs/modules/terrain'},
    {label: 'QuantizedMeshLoader', to: '/docs/modules/terrain/api-reference/quantized-mesh-loader'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Put a terrain surface into a tile-ready encoding."
  description="QuantizedMeshWriter normalizes mesh input, quantizes positions within bounds, and writes the core terrain header, vertices, indices, and edge structures expected by quantized mesh readers."
  tone="orange"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table'},
    {label: 'Output', value: 'Binary `.terrain` quantized mesh'},
    {label: 'Geometry', value: 'Triangle-list positions and indices'},
    {label: 'Control', value: 'Bounds and quantization options'}
  ]}
/>

<ReferenceBoundary
  title="QuantizedMeshWriter reference"
  description="The sections below document usage, input normalization, output structure, and writer options."
  tone="orange"
/>

The `QuantizedMeshWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) terrain data as quantized mesh binary data.

| Writer         | Characteristic                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------- |
| File Format    | [Quantized Mesh](https://github.com/CesiumGS/quantized-mesh)                                    |
| Data Format    | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension | `.terrain`                                                                                     |
| File Type      | Binary                                                                                         |
| MIME Type      | `application/vnd.quantized-mesh`                                                               |
| Supported APIs | `encode`, `encodeSync`                                                                         |

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {QuantizedMeshWriter} from '@loaders.gl/terrain';

declare const terrainMesh: Mesh | MeshArrowTable;

const arrayBuffer = await encode(terrainMesh, QuantizedMeshWriter, {
  'quantized-mesh': {
    bounds: [0, 0, 1, 1]
  }
});
```

## Data Format

`QuantizedMeshWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before quantized mesh binary data is encoded.

The writer requires triangle-list mesh data with a `POSITION` attribute. It writes the quantized mesh core header, vertex arrays, triangle indices, and empty edge-index lists.

## Options

| Option                  | Type                               | Default                 | Description                                                                 |
| ----------------------- | ---------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `quantized-mesh.bounds` | `[number, number, number, number]` | Mesh XY bounding box    | Bounds used to map x/y positions to quantized u/v coordinates, in `[minX, minY, maxX, maxY]`. |
