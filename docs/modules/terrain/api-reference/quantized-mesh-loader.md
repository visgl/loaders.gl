# Quantized Mesh Loaders

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

`QuantizedMeshLoader` reconstructs mesh surfaces from the [quantized
mesh][quantized_mesh] format. It returns the legacy [Mesh](/docs/specifications/category-mesh) object by default and can return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with `quantized-mesh.shape: 'arrow-table'`.

[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.terrain`                                 |
| File Type             | Binary                                     |
| File Format           | Encoded mesh                               |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| Supported APIs        | `load`, `parse`, `parseSync`               |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | Yes                                        |
| Streaming Support     | No                                         |

## Usage

```typescript
import {QuantizedMeshLoader} from '@loaders.gl/terrain';
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

## Options

| Option                       | Type            | Default        | Description                                                                     |
| ---------------------------- | --------------- | -------------- | ------------------------------------------------------------------------------- |
| `quantized-mesh.bounds`      | `array<number>` | `[0, 0, 1, 1]` | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. |
| `quantized-mesh.shape`       | `string`        | `mesh`         | Output shape: `'mesh'` or `'arrow-table'`.                                      |
| `quantized-mesh.skirtHeight` | `number`        | `null`         | If set, create the skirt for the tile with particular height in meters          |

## Remarks

### Future Work

- Skirting. The Quantized Mesh format includes data on which vertices are on each edge, which should assist in creating a skirt.
- Use optional Quantized Mesh extensions, such as vertex normals.
- Closer integration into tile culling. Quantized Mesh headers, the first 88 bytes, describe a tile's bounding volume and min/max elevations. Just the headers could be parsed while deciding whether the tile is in view. Upon verifying visibility, the rest of the tile's data can be parsed.
