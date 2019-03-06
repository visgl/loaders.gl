# glTF Extensions

Arbitrary glTF extensions can be present in glTF files, and will remain present in the parsed JSON as you would expect. Such extensions can supported by applications by inspecting the `extensions` fields inside glTF objects, and it is up to each application to handle or ignore them.

Many glTF extensions affect e.g. rendering which is outside of the scope of loaders.gl, however in a few cases it is possible to provide support for extensions directly during loading. This article describes glTF extensions that are fully or partially processed by the `@loaders.gl/gltf` classes.


## Official Extensions

### KHR_draco_mesh_compression

Description: [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression).

This extension is partially implemented. Meshes can be compressed as they are added to the `GLTFBuilder` and decompressed by the `GLTFParser`.



## Custom Extensions

### UBER_draco_point_cloud_compression

Description: Similar to `KHR_draco_mesh_compression`, but does not contain any accessors and does not support any fallback or non-compressed accessors/attributes. The primitive's accessors field will be populated after decompression.

Point clouds can be compressed as they are added to the `GLTFBuilder` and decompressed by the `GLTFParser`.

