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

## Loaders

| Loader                     | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `TerrainArrowLoader`       | Loads height-map terrain as a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| `QuantizedMeshArrowLoader` | Loads quantized mesh terrain as a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| `TerrainLoader`            | Loads height-map terrain as a Mesh.                 |
| `QuantizedMeshLoader`      | Loads quantized mesh terrain as a Mesh.             |

## Attribution

The `QuantizedMeshLoader` is a fork of
[`quantized-mesh-decoder`](https://github.com/heremaps/quantized-mesh-decoder)
from HERE under the MIT license to decode quantized mesh.

The `TerrainLoader` uses [MARTINI](https://github.com/mapbox/martini) or [Delatin](https://github.com/mapbox/delatin) for mesh
reconstruction which are both under the ISC License.
