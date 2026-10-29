Mesh interchange format

OBJ

# Readable mesh geometry with a long tail of tooling.

Wavefront OBJ is a simple text format for vertices, normals, texture coordinates, and faces. loaders.gl maps it into the shared mesh pipeline and can write compatible OBJ text back out.

[OBJ module](https://loaders.gl/next/docs/modules/scene/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

OBJ[Try It](https://loaders.gl/next/examples/pointclouds/obj)[Overview](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[Format](https://loaders.gl/next/docs/modules/scene/obj/format.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[OBJWriter](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

The OBJ data path

## Parse familiar text into a portable mesh shape.

OBJ keeps the source easy to inspect and edit, while the loader resolves its separate attribute streams and face references into data that renderers and Arrow-based tools can consume.

01

Geometry

Vertices, normals, UVs, colors, and faces

02

Materials

Optional MTL references are recognized at the loader boundary

03

Output

Mesh objects or Mesh Arrow tables

04

Write

Encode compatible mesh data as OBJ text

Detailed guide

## OBJ structure and APIs

The reference below covers the file layout, loaders, writers, mesh output, materials, and implementation limits.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**OBJLoader**Loads OBJ meshes as Mesh objects or Mesh Arrow tables.Output: Mesh, Mesh Arrow tableAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader)[Writer**OBJWriter**Writes Mesh or Mesh Arrow table data as Wavefront OBJ text.Input: Mesh, Mesh Arrow tableAPIs: encode, encodeSync, encodeTextSync](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer)

| Characteristic       | Value                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [Wavefront OBJ](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)                                                                                                |
| Data Format          | [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md), [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) |
| File Extension       | `.obj`                                                                                                                                                                             |
| MIME Type            | Not standardized                                                                                                                                                                   |
| File Type            | Text                                                                                                                                                                               |
| Loader Decoder Type  | Synchronous                                                                                                                                                                        |
| Loader Worker Thread | ✅ Yes                                                                                                                                                                             |
| Loader Streaming     | ❌ No                                                                                                                                                                              |
| Writer File Type     | Text                                                                                                                                                                               |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                                                                                                           |

## Mesh Data[​](#mesh-data "Direct link to Mesh Data")

OBJ files describe mesh geometry through vertex positions, texture coordinates, normals, and face indices. `OBJLoader` returns Mesh Arrow tables by default, or legacy Mesh objects when `obj.shape: 'mesh'` is selected.

## Materials[​](#materials "Direct link to Materials")

OBJ files are commonly paired with MTL files for material definitions. loaders.gl's OBJ support focuses on geometry data.
