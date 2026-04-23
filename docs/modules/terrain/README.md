# Overview

The `@loaders.gl/terrain` module reconstructs mesh surfaces from either height
map images--e.g. [Mapzen Terrain Tiles][mapzen_terrain_tiles]--which encode
elevation into R,G,B values or the [quantized mesh][quantized_mesh] format.

[mapzen_terrain_tiles]: https://github.com/tilezen/joerd/blob/master/docs/formats.md
[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

## Installation

```bash
npm install @loaders.gl/terrain
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader or Writer                                                                | Description                                         |
| ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `TerrainArrowLoader`                                                            | Loads height-map terrain as a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| `QuantizedMeshArrowLoader`                                                      | Loads quantized mesh terrain as a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| `TerrainLoader`                                                                 | Loads height-map terrain as a Mesh.                 |
| `QuantizedMeshLoader`                                                           | Loads quantized mesh terrain as a Mesh.             |
| [`QuantizedMeshWriter`](/docs/modules/terrain/api-reference/quantized-mesh-writer) | Writes triangle-list Mesh or Mesh Arrow table terrain data as quantized mesh. |

## Attribution

The `QuantizedMeshLoader` is a fork of
[`quantized-mesh-decoder`](https://github.com/heremaps/quantized-mesh-decoder)
from HERE under the MIT license to decode quantized mesh.

The `TerrainLoader` uses [MARTINI](https://github.com/mapbox/martini), [Delatin](https://github.com/mapbox/delatin), or a fixed grid tesselator for mesh
reconstruction. Martini and Delatin are both under the ISC License.

The fixed grid path is designed for predictable terrain tile density and emits longitude, latitude, and elevation positions directly, which is useful for renderers such as deck.gl `TerrainLayer`.

On the shared `mapbox.png` terrain benchmark, the fixed `gridSize=33` path generated about `33.2K tiles/s`, compared to `76.7 tiles/s` for Martini and `10.0 tiles/s` for Delatin on the same decoded tile. See the [TerrainLoader API reference](/docs/modules/terrain/api-reference/terrain-loader) for the benchmark setup and tradeoffs.
