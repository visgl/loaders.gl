Mesh format

PLY

# A flexible interchange for polygon geometry.

PLY describes vertices, faces, and additional element properties in a simple header-driven file. loaders.gl turns supported data into common mesh or Mesh Arrow output and can write compatible ASCII files.

[PLY module](https://loaders.gl/next/docs/modules/pointclouds/ply.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

PLY[Try It](https://loaders.gl/next/examples/pointclouds/ply)[Overview](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/ply/format.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)[PLYWriter](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/ply/benchmarks.md)

Polygon data path

## Read the elements, keep the useful attributes.

PLY files can vary in element names, property layouts, and storage encoding. The loader handles the supported combinations and exposes geometry through the same mesh contract as other formats.

01

Header

Declare elements, properties, counts, and storage encoding.

02

Decode

Read vertices, faces, colors, normals, and supported attributes.

03

Output

Return Mesh objects or Mesh Arrow tables.

04

Write

Encode compatible mesh data as ASCII PLY text.

Detailed guide

## PLY format and API details

The reference below covers header syntax, element/property handling, encodings, decoded attributes, and writer behavior.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**PLYLoader**Loads PLY meshes as Mesh objects or Mesh Arrow tables.Output: Mesh, Mesh Arrow tableAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader)[Writer**PLYWriter**Writes Mesh or Mesh Arrow table data as ASCII PLY text.Input: Mesh, Mesh Arrow tableAPIs: encode, encodeSync, encodeTextSync](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer)

| Characteristic       | Value                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [PLY](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)                                                                                                    |
| Data Format          | [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md), [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) |
| File Extension       | `.ply`                                                                                                                                                                             |
| MIME Type            | Not standardized                                                                                                                                                                   |
| File Type            | Binary/Text                                                                                                                                                                        |
| Loader Decoder Type  | Synchronous                                                                                                                                                                        |
| Loader Worker Thread | ✅ Yes                                                                                                                                                                             |
| Loader Streaming     | ❌ No                                                                                                                                                                              |
| Writer File Type     | Text                                                                                                                                                                               |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                                                                                                           |

## Supported Encodings[​](#supported-encodings "Direct link to Supported Encodings")

PLY supports ASCII, binary little-endian, and binary big-endian encodings. `PLYWriter` currently writes ASCII PLY text.

## Mesh Data[​](#mesh-data "Direct link to Mesh Data")

PLY files describe mesh elements such as vertices and faces. `PLYLoader` maps common vertex properties to Mesh Arrow table columns by default. Set `ply.shape: 'mesh'` for the legacy Mesh object. Common attributes include `POSITION`, `NORMAL`, `TEXCOORD_0`, and `COLOR_0`.
