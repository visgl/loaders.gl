Terrain module · loader API

# QuantizedMeshLoader

Decode Cesium quantized mesh terrain tiles into a mesh or Mesh Arrow table, preserving the compact terrain representation until it crosses into application data.

[Terrain module](https://loaders.gl/next/docs/modules/raster/terrain.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain.md)[Terrain module](https://loaders.gl/next/docs/modules/raster/terrain.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain.md)[QuantizedMeshWriter](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-writer.md)

What it reconstructs

## Decode a terrain tile that already knows its mesh shape.

Quantized Mesh stores terrain vertices and indices in a compact binary form. The loader expands that tile into the common mesh family used by rendering and analysis code.

01

Input

A \`.terrain\` quantized mesh tile

02

Output

Mesh or Mesh Arrow table

03

Coordinates

Bounds mapped to tile positions

04

Optional

Skirts and future terrain extensions

Detailed guide

## QuantizedMeshLoader reference

The sections below document format metadata, usage, output shapes, options, and current limitations.

`QuantizedMeshLoader` reconstructs mesh surfaces from the [quantized mesh](https://github.com/CesiumGS/quantized-mesh) format. It returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default. Set `quantized-mesh.shape: 'mesh'` for the legacy [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) object.

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

| QuantizedMeshLoader |                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Extension      | `.terrain`                                                                                                                                                                         |
| File Type           | Binary                                                                                                                                                                             |
| File Format         | Encoded mesh                                                                                                                                                                       |
| Data Format         | [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables), [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) |
| Supported APIs      | `load`, `parse`, `parseSync`                                                                                                                                                       |
| Decoder Type        | Synchronous                                                                                                                                                                        |
| Worker Thread       | ✅ Yes                                                                                                                                                                             |
| Streaming Support   | ❌ No                                                                                                                                                                              |

## Usage[​](#usage "Direct link to Usage")

```
import {QuantizedMeshLoader} from '@loaders.gl/raster';

import {load} from '@loaders.gl/core';



const options = {

  'quantized-mesh': {

    bounds: [0, 0, 1, 1]

  }

};

const data = await load(url, QuantizedMeshLoader, options);

const table = await load(url, QuantizedMeshLoader, {

  worker: false,

  'quantized-mesh': {...options['quantized-mesh'], shape: 'arrow-table'}

});
```

## Options[​](#options "Direct link to Options")

| Option                       | Type            | Default        | Description                                                                     |
| ---------------------------- | --------------- | -------------- | ------------------------------------------------------------------------------- |
| `quantized-mesh.bounds`      | `array<number>` | `[0, 0, 1, 1]` | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. |
| `quantized-mesh.shape`       | `string`        | `arrow-table`  | Output shape: `'arrow-table'` or `'mesh'`.                                      |
| `quantized-mesh.skirtHeight` | `number`        | `null`         | If set, create the skirt for the tile with particular height in meters          |

## Remarks[​](#remarks "Direct link to Remarks")

### Future Work[​](#future-work "Direct link to Future Work")

* Skirting. The Quantized Mesh format includes data on which vertices are on each edge, which should assist in creating a skirt.
* Use optional Quantized Mesh extensions, such as vertex normals.
* Closer integration into tile culling. Quantized Mesh headers, the first 88 bytes, describe a tile's bounding volume and min/max elevations. Just the headers could be parsed while deciding whether the tile is in view. Upon verifying visibility, the rest of the tile's data can be parsed.
