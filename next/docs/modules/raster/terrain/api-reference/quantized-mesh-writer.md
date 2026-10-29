Terrain module · writer API

# QuantizedMeshWriter

Encode loaders.gl mesh or Mesh Arrow table data as compact quantized mesh terrain tiles for tile-based terrain delivery.

[Terrain module](https://loaders.gl/next/docs/modules/raster/terrain.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain.md)[Terrain module](https://loaders.gl/next/docs/modules/raster/terrain.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain.md)[QuantizedMeshLoader](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

What it writes

## Put a terrain surface into a tile-ready encoding.

QuantizedMeshWriter normalizes mesh input, quantizes positions within bounds, and writes the core terrain header, vertices, indices, and edge structures expected by quantized mesh readers.

01

Input

Mesh or Mesh Arrow table

02

Output

Binary \`.terrain\` quantized mesh

03

Geometry

Triangle-list positions and indices

04

Control

Bounds and quantization options

Detailed guide

## QuantizedMeshWriter reference

The sections below document usage, input normalization, output structure, and writer options.

The `QuantizedMeshWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) terrain data as quantized mesh binary data.

| Writer         | Characteristic                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format    | [Quantized Mesh](https://github.com/CesiumGS/quantized-mesh)                                                                                                                       |
| Data Format    | [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables), [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) |
| File Extension | `.terrain`                                                                                                                                                                         |
| File Type      | Binary                                                                                                                                                                             |
| MIME Type      | `application/vnd.quantized-mesh`                                                                                                                                                   |
| Supported APIs | `encode`, `encodeSync`                                                                                                                                                             |

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';

import {QuantizedMeshWriter} from '@loaders.gl/raster';



declare const terrainMesh: Mesh | MeshArrowTable;



const arrayBuffer = await encode(terrainMesh, QuantizedMeshWriter, {

  'quantized-mesh': {

    bounds: [0, 0, 1, 1]

  }

});
```

## Data Format[​](#data-format "Direct link to Data Format")

`QuantizedMeshWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before quantized mesh binary data is encoded.

The writer requires triangle-list mesh data with a `POSITION` attribute. It writes the quantized mesh core header, vertex arrays, triangle indices, and empty edge-index lists.

## Options[​](#options "Direct link to Options")

| Option                  | Type                               | Default              | Description                                                                                   |
| ----------------------- | ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `quantized-mesh.bounds` | `[number, number, number, number]` | Mesh XY bounding box | Bounds used to map x/y positions to quantized u/v coordinates, in `[minX, minY, maxX, maxY]`. |
