Geometry compression

![](/next/images/format-logos/draco-logo.svg)

# Smaller geometry, the same application shape.

Draco compresses triangle meshes and point clouds for delivery. loaders.gl decodes its attributes into common mesh data and can encode compatible data back into Draco payloads.

[Draco module](https://loaders.gl/next/docs/modules/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

![](/next/images/format-logos/draco-logo.svg)[Try It](https://loaders.gl/next/examples/pointclouds/draco)[Overview](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Format](https://loaders.gl/next/docs/modules/draco/format.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

Compressed geometry

## Transport geometry compactly, decode it where it is needed.

Draco represents geometry attributes using specialized compression. The loaders.gl boundary keeps the compressed payload format-specific while exposing decoded attributes through the mesh category.

01

Geometry

Triangle meshes and point clouds with supported attributes.

02

Compression

Quantization and prediction reduce delivery size.

03

Decode

Return Mesh objects or Mesh Arrow tables.

04

Encode

Write compatible mesh data as Draco binary.

Detailed guide

## Draco format and API details

The reference below covers encoded geometry, attributes, compression behavior, worker loading, and writer compatibility.

| Characteristic       | Value                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md)                                                                                                          |
| Data Format          | [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md), [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) |
| File Extension       | `.drc`                                                                                                                                                                             |
| MIME Type            | `application/octet-stream`                                                                                                                                                         |
| File Type            | Binary                                                                                                                                                                             |
| Loader APIs          | `load`, `parse`, `parseSync`                                                                                                                                                       |
| Loader Worker Thread | ✅ Yes                                                                                                                                                                             |
| Loader Streaming     | ❌ No                                                                                                                                                                              |
| Writer APIs          | `encode`, `encodeSync`                                                                                                                                                             |

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**DracoLoader**Loads Draco meshes and point clouds as Mesh objects or Mesh Arrow tables.Output: Mesh, Mesh Arrow tableAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader)[Writer**DracoWriter**Encodes Mesh or Mesh Arrow table data as Draco binary data.Input: Mesh, Mesh Arrow tableAPIs: encode, encodeSync](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer)

## Encodings[​](#encodings "Direct link to Encodings")

Draco stores compressed mesh and point cloud geometry. It supports triangle meshes and point clouds, and can preserve supported attribute arrays and metadata dictionaries.

## Runtime[​](#runtime "Direct link to Runtime")

`DracoLoader` and `DracoWriter` use the official Draco3D 1.5.7 decoder and encoder runtimes. The WebAssembly runtimes are loaded dynamically by default, are also published as package-local assets for workers and offline applications, and can be supplied through `options.modules`.
