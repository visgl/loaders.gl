# QuantizedMeshLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

The `QuantizedMeshLoader` module reconstructs mesh surfaces from the [quantized
mesh][quantized_mesh] format.

[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.terrain`                                    |
| File Type             | Binary                                        |
| File Format           | Encoded mesh                                  |
| Data Format           | [Mesh](/docs/specifications/category-mesh.md) |
| Supported APIs        | `load`, `parse`, `parseSync`                  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```js
import {QuantizedMeshLoader} from '@loaders.gl/terrain';
import {load} from '@loaders.gl/core';

const options = {
  'quantized-mesh': {
    bounds: [0, 0, 1, 1]
  }
};
const data = await load(url, QuantizedMeshLoader, options);
```

## Options

| Option                  | Type            | Default        | Description                                                                     |
| ----------------------- | --------------- | -------------- | ------------------------------------------------------------------------------- |
| `quantized-mesh.bounds` | `array<number>` | `[0, 0, 1, 1]` | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. |

## Remarks

### Future Work

- Skirting. The Quantized Mesh format includes data on which vertices are on each edge, which should assist in creating a skirt.
- Use optional Quantized Mesh extensions, such as vertex normals.
- Closer integration into tile culling. Quantized Mesh headers, the first 88 bytes, describe a tile's bounding volume and min/max elevations. Just the headers could be parsed while deciding whether the tile is in view. Upon verifying visibility, the rest of the tile's data can be parsed.
