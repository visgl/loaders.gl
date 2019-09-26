# glTF Extensions

glTF extensions can be present in glTF files, and will be present in the parsed JSON. glTF extensions can supported by applications by inspecting the `extensions` fields inside glTF objects, and it is up to each application to handle or ignore them.

loaders.gl aims to provide support for glTF extensions that can be handled completely or partially during loading, and article describes glTF extensions that are fully or partially processed by the `@loaders.gl/gltf` classes.

Note that many glTF extensions affect aspects that are firmly outside of the scope of loaders.gl (e.g. rendering), and no attempt is made to process those extensions in loaders.gl.

| Extension                                                                                                                        | Description |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression) |             |
| [KHR_lights_punctual](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual)               |             |
| [KHR_materials_unlit](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit) | |

## Official Extensions

### KHR_draco_mesh_compression

Supports compression of mesh attributes (geometry).

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

## Custom Extensions

### UBER_draco_point_cloud_compression

Specification: Similar to `KHR_draco_mesh_compression`, but supports point clouds (draw mode 0). Also does not support any fallback or non-compressed accessors/attributes.

Parsing support:

- The primitive's accessors field will be populated after decompression.
- After decompression, the extension will be removed (as if the point cloud was never compressed).

Encoding support:

- Point clouds can be compressed as they are added to the `GLTFBuilder` and decompressed by the `GLTFParser`.
