# glTF - gl Transfer Format

- _[`@loaders.gl/gltf`](/docs/modules/gltf)_
- _[glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/GlTF)_

glTF is a standard file format for three-dimensional scenes and models, intended to be a streamlined, interoperable format for the delivery of 3D assets, while minimizing file size and runtime processing by apps. Sometimes described as the "JPEG of 3D."

An open standard developed and maintained by the Khronos Group, it supports 3D model geometry, appearance, scene graph hierarchy, and animation.

## Variants

A glTF file uses one of two possible file extensions: .gltf (JSON/ASCII) or .glb (binary). Both .gltf and .glb files may reference external binary and texture resources. Alternatively, both formats may be self-contained by directly embedding binary data buffers (as base64-encoded strings in .gltf files or as raw byte arrays in .glb files).

## Version History

### glTF 2.0

-GLB was incorporated directly into glTF 2.0.

### glTF 1.0

- GLB was introduced as an extension.

## glTF Extensions

glTF extensions can be present in glTF files, and will be present in the parsed JSON. glTF extensions can supported by applications by inspecting the `extensions` fields inside glTF objects, and it is up to each application to handle or ignore them.

loaders.gl aims to provide support for glTF extensions that can be handled completely or partially during loading, and article describes glTF extensions that are fully or partially processed by the `@loaders.gl/gltf` classes.

Note that many glTF extensions affect aspects that are firmly outside of the scope of loaders.gl (e.g. rendering), and no attempt is made to process those extensions in loaders.gl.

| Extension                                                                                | Preprocessed | Description                                                      |
| ---------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------- |
| [KHR_draco_mesh_compression](/docs/modules/gltf/formats/gltf#khr_draco_mesh_compression) | Y            | Decompresses draco-compressed geometries                         |
| [EXT_meshopt_compression](/docs/modules/gltf/formats/gltf#ext_meshopt_compression)       | Y            | Decompresses meshopt-compressed geometries                       |
| [KHR_texture_basisu](/docs/modules/gltf/formats/gltf#khr_texture_basisu)                 | Y            | This extension adds the ability to specify textures using KTX v2 |
| [KHR_texture_transform](/docs/modules/gltf/formats/gltf#khr_texture_transform)                                                                | Y            |                                                                  |
| KHR_texture_webp                                                                         | Y            |
| [EXT_mesh_features](/docs/modules/gltf/formats/gltf#ext_mesh_features)                   | N            | (In progress) 3D tiles extension                                 |
| [KHR_lights_punctual](/docs/modules/gltf/formats/gltf#khr_lights_punctual)               | Y\*          | Deprecated                                                       |
| [KHR_materials_unlit](/docs/modules/gltf/formats/gltf#khr_materials_unlit)               | Y\*          | Deprecated                                                       |
| [EXT_feature_metadata](/docs/modules/gltf/formats/gltf#ext_feature_metadata)             | Y\*          | Deprecated. 3D tiles extension                                   |

## Official Extensions

### KHR_draco_mesh_compression

Supports compression of mesh attributes (geometry).

The `GLTFLoader` by default fully decompresses draco compressed geometries, removing the draco extension and the compressed data from the parsed glTF data structure.

Specification: [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression).

Parsing Support:

- By adding the `decompress: true` options to the `GLTFParser` any decompressed by the `GLTFParser`.
- The expanded attributes are placed in the mesh object (effectively making it look as if it had never been compressed).
- The extension objects are removed from the glTF file.

Encoding Support:

- Meshes can be compressed as they are added to the `GLTFBuilder`.

### KHR_lights_punctual

Supports specification of point light sources and addition of such sources to the scenegraph node.

Specification: [KHR_lights_punctual](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual)

Parsing Support:

- Any nodes with a `KHR_lights_punctual` extension will get a `light` field with value containing a light definition object with properties defining the light (this object will be resolved by index from the global `KHR_lights_punctual` extension object's `lights` array) .
- The `KHR_lights_punctual` extensions will be removed from all nodes.
- Finally, the global `KHR_lights_punctual` extension (including its light list)) will be removed.

Encoding Support:

- N/A

### KHR_materials_unlit

Specifies that a material should not be affected by light. Useful for pre-lit materials (e.g. photogrammetry).

[KHR_materials_unlit](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)

### KHR_texture_basisu

This extension adds the ability to specify textures using KTX v2 images with Basis Universal supercompression.

The `GLTFLoader` by default fully decompresses compressed textures, removing the basisu extension and the compressed data from the parsed glTF data structure.

[KHR_texture_basisu](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu)

### KHR_texture_transform

Many techniques can be used to optimize resource usage for a 3d scene. Chief among them is the ability to minimize the number of textures the GPU must load. To achieve this, many engines encourage packing many objects' low-resolution textures into a single large texture atlas. The region of the resulting atlas that corresponds with each object is then defined by vertical and horizontal offsets, and the width and height of the region.

To support this use case, this extension adds offset, rotation, and scale properties to textureInfo structures.

[KHR_texture_transform](https://github.com/KhronosGroup/glTF/blob/de6db2d6f817586bce9965d320acf03935580b34/extensions/2.0/Khronos/KHR_texture_transform/README.md)

## Custom Extensions

### EXT_meshopt_compression

This extension provides a support for the meshopt binary geometry data compression format that is tailored to the common types of data seen in glTF buffers.
The `GLTFLoader` by default fully decompresses meshopt compressed geometries, removing the meshopt extension and the compressed data from the parsed glTF data structure.

[EXT_meshopt_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression)

### EXT_feature_metadata

This extension allows batching features for efficient streaming to a client for rendering and interaction.

[EXT_feature_metadata](https://github.com/CesiumGS/glTF/tree/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata)

### EXT_mesh_features

3D tiles extension by Cesium. This extension defines a means of assigning identifiers to geometry and subcomponents of geometry within a glTF 2.0 asset.

[EXT_mesh_features](https://github.com/CesiumGS/glTF/tree/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features)
