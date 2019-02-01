# glTF Extensions

The glTF classes in `@loaders.gl/gltf` provide support selected glTF extensions.

## Official Extensions

### KHR_draco_mesh_compression

> Support for this extension is in progress but not yet fully implemented.

[KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression) will be supported soon.


## Custom Extensions

> A second round of review should be done to ensure that the official extension cannot cover these use cases.

### UBER_draco_mesh_compression

Similar to `KHR_draco_mesh_compression`, but does not contain any accessors and does not support any fallback or non-compressed accessors/attributes. The primitive's accessors field will be populated after decompression.


### UBER_draco_point_cloud_compression

Similar to `KHR_draco_mesh_compression`, but does not contain any accessors and does not support any fallback or non-compressed accessors/attributes. The primitive's accessors field will be populated after decompression.


## Remarks

Additional extensions can be supported by the application by inspecting the `extensions` fields inside glTF objects. This document only documents the extensions that are fully or partially supported by `@loaders.gl/gltf` classes.
