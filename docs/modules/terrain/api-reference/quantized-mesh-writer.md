# QuantizedMeshWriter

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
