Terrain surfaces

# Turn elevation samples into a renderable surface.

The terrain module decodes height-map imagery and quantized mesh tiles into mesh data that can be rendered, analyzed, or carried as a mesh Arrow table.

[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[Quantized mesh loader](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

Two terrain inputs

## Decode samples, then let the application place the mesh.

Height maps provide elevation samples for reconstruction. Quantized mesh provides an already tessellated terrain tile. Both can end in the same mesh-oriented application path.

01

Height map

RGB-encoded elevation samples

02

Quantized mesh

Compressed terrain vertices and indices

03

Output

Mesh or mesh Arrow table

04

Writer

Encode compatible terrain as quantized mesh

The `@loaders.gl/raster/terrain` module reconstructs mesh surfaces from either height map images--e.g. [Mapzen Terrain Tiles](https://github.com/tilezen/joerd/blob/master/docs/formats.md)--which encode elevation into R,G,B values or the [quantized mesh](https://github.com/CesiumGS/quantized-mesh) format.

Detailed guide

## Terrain loaders and writers

The sections below cover installation, supported loader and writer entry points, and the third-party components used for mesh reconstruction.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/raster

npm install @loaders.gl/core
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader or Writer                                                                                                         | Description                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TerrainLoader`                                                                                                          | Loads height-map terrain as a Mesh or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables).     |
| `QuantizedMeshLoader`                                                                                                    | Loads quantized mesh terrain as a Mesh or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables). |
| [`QuantizedMeshWriter`](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-writer.md) | Writes triangle-list Mesh or Mesh Arrow table terrain data as quantized mesh.                                                                      |

## Height grids without mesh reconstruction[​](#height-grids-without-mesh-reconstruction "Direct link to Height grids without mesh reconstruction")

The optional [`@loaders.gl/raster/terrain/heightmap`](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/heightmap.md) entry decodes already unpacked RGBA pixels into an unpadded `Float32Array`, with a named Terrarium preset and support for custom RGB coefficients. It does not load images or import tessellation or Arrow code.

## Attribution[​](#attribution "Direct link to Attribution")

The `QuantizedMeshLoader` is a fork of [`quantized-mesh-decoder`](https://github.com/heremaps/quantized-mesh-decoder) from HERE under the MIT license to decode quantized mesh.

The `TerrainLoader` uses [MARTINI](https://github.com/mapbox/martini) or [Delatin](https://github.com/mapbox/delatin) for mesh reconstruction which are both under the ISC License.

Terrain and quantized mesh are now provided by `@loaders.gl/raster`. Neither requires the optional `geotiff` or `lerc` decoder. See the [raster package](https://loaders.gl/next/docs/modules/raster.md).
