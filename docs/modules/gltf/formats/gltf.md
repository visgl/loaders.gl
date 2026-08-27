import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# glTF - gl Transfer Format

<GltfDocsTabs active="format" />

- _[`@loaders.gl/gltf`](/docs/modules/gltf)_
- _[glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/GlTF)_

glTF is a standard file format for three-dimensional scenes and models, intended to be a streamlined, interoperable format for the delivery of 3D assets, while minimizing file size and runtime processing by apps. Sometimes described as the "JPEG of 3D."

An open standard developed and maintained by the Khronos Group, it supports 3D model geometry, appearance, scene graph hierarchy, and animation.

## Draft glTF 2.1 Unified File References

## Draft glTF 2.1 Shapes and Bounding Volumes

The glTF module preserves the draft 2.1 top-level `shapes` array and node `boundingVolume`
references. `getGLTFCullingShape(gltf, index)` and `getGLTFNodeCullingShape(gltf, nodeIndex)`
adapt recognized box, capsule, cylinder, plane, and sphere shapes to the analytic classes in
`@math.gl/culling`. The helpers return derived objects and never modify the source JSON. Unknown
shape types return `undefined`, allowing extension-defined shapes to remain available as raw data.

Draft glTF 2.1 adds a top-level `files` array for generic dependencies beyond buffers and images.
Each file has a required `mimeType` and exactly one source: an external or data `uri`, or an
embedded `bufferView`. `GLTFLoader` can resolve these entries into its parallel `files` result
array with `gltf.loadFiles: true`.

For packaged assets, [`resolveGLTFFile()`](/docs/modules/gltf/api-reference/gltf-loader) also accepts
a string reference. It looks up `files[*].name` or the original `files[*].uri`, providing the virtual
file-system primitive needed to resolve dependencies from an embedded glTF asset. Recursive
`externalAssets` parsing builds on this file-resolution layer.

This support follows the Khronos [Unified File References draft](https://github.com/KhronosGroup/glTF/issues/2590)
and [Packaging External Assets draft](https://github.com/KhronosGroup/glTF/issues/2589), and may
evolve while glTF 2.1 is finalized.

## Draft glTF 2.1 Shapes and Bounding Volumes

The glTF module preserves the draft 2.1 top-level `shapes` array and node `boundingVolume`
references. `getGLTFCullingShape(gltf, index)` and `getGLTFNodeCullingShape(gltf, nodeIndex)`
adapt recognized box, capsule, cylinder, plane, and sphere shapes to the analytic classes in
`@math.gl/culling`. The helpers return derived objects and never modify the source JSON. Unknown
shape types return `undefined`, allowing extension-defined shapes to remain available as raw data.

## Draft glTF 2.1 External Assets

The top-level `externalAssets` array references glTF files through `externalAssets[*].file`, and a
scene node instantiates one of those models with `node.externalAsset`. Set
`gltf.loadExternalAssets: true` to recursively parse referenced models into the parallel
`gltf.externalAssets` result array.

URI-backed models resolve their own dependencies relative to their URI. For models embedded in a
data URI or buffer view, dependency URIs are looked up by name in the containing asset's `files`
array. The loader caches repeated URI references, leaves unreferenced definitions unloaded, and
rejects cyclical asset graphs.

This support follows the Khronos [External Assets draft](https://github.com/KhronosGroup/glTF/issues/2586).

## Draft glTF 2.1 Thumbnails

Draft glTF 2.1 adds `asset.thumbnail`, an index into the top-level `images` array. The referenced
image provides an optional preview that applications can display without rendering the scene.

`GLTFLoader` treats the thumbnail as a referenced image, so `gltf.loadImages: true` loads it even
when no texture uses that image. The unmodified index remains available at
`gltf.json.asset.thumbnail`; [`postProcessGLTF()`](/docs/modules/gltf/api-reference/post-process-gltf)
resolves it to the corresponding processed image object.

This support follows the Khronos [Thumbnails draft](https://github.com/KhronosGroup/glTF/issues/2593).

## Variants

A glTF file uses one of two possible file extensions: .gltf (JSON/ASCII) or .glb (binary). Both .gltf and .glb files may reference external binary and texture resources. Alternatively, both formats may be self-contained by directly embedding binary data buffers (as base64-encoded strings in .gltf files or as raw byte arrays in .glb files).

## Version History

### glTF 2.1 (Draft)

Khronos has [announced glTF 2.1](https://www.khronos.org/blog/introducing-gltf-2.1-with-complex-scenes) as a backwards-compatible update focused on complex scenes and quality-of-life improvements. The specification remains under development.

#### Accessor Component Types

glTF 2.1 defines additional accessor component type constants for extensions and future core features to reference. Defining a type does not automatically make it valid for every existing accessor use; each feature still specifies the component types it accepts.

| `componentType` | Data type            | loaders.gl representation |
| --------------- | -------------------- | ------------------------- |
| `5124`          | Signed 32-bit integer | `Int32Array`              |
| `5130`          | 64-bit float          | `Float64Array`            |
| `5131`          | 16-bit float          | `Uint16Array`             |
| `5134`          | Signed 64-bit integer | `BigInt64Array`           |
| `5135`          | Unsigned 64-bit integer | `BigUint64Array`         |

JavaScript runtimes supported by loaders.gl do not yet consistently provide `Float16Array`. The loader therefore preserves 16-bit floating-point payloads in a `Uint16Array`; `componentType: 5131` records that the words contain IEEE-754 binary16 values rather than unsigned integers.

### glTF 2.0

- GLB was incorporated directly into glTF 2.0.

### glTF 1.0

- GLB was introduced as an extension.

## loaders.gl glTF Feature Coverage

The table below summarizes the level of glTF support exposed by `@loaders.gl/gltf`. “Raw” means
the JSON is accepted and preserved in `gltf.json`; “runtime” means loaders.gl resolves, decodes,
normalizes, or otherwise exposes the feature to applications. Draft 2.1 support follows the
evolving specification and is intentionally marked separately from stable glTF 2.0 support.

| Feature | Version | Raw | Runtime | Tests / notes |
| --- | --- | --- | --- | --- |
| Core asset, scene, node, mesh, material, camera, skin, animation, texture, image, sampler, buffer, and accessor objects | 2.0 | Complete | Complete | Loader, writer, schema, and post-processing coverage |
| `.gltf` JSON and external resources | 1.0 / 2.0 / 2.1 | Complete | Complete | URI and data-URI resolution |
| GLB v1 and v2 | 1.0 / 2.0 | Complete | Complete | GLB loader and writer tests |
| GLB v3 / multiple binary chunks | 2.1 draft | Complete | Partial | Draft parsing support; format may evolve |
| glTF v1 to v2 normalization | 1.0 → 2.0 | Complete | Partial | Best-effort conversion via `gltf.normalize` |
| Sparse accessors and normalized component values | 2.0 | Complete | Complete | Typed-array extraction and accessor utilities |
| Draft 2.1 accessor component types | 2.1 draft | Complete | Partial | Includes 32-bit, 16-bit float words, and 64-bit integer representations |
| Unified `files` references | 2.1 draft | Complete | Complete | URI, data-URI, and bufferView-backed files |
| External asset composition | 2.1 draft | Complete | Complete | Recursive loading, caching, and cycle rejection |
| Asset thumbnails | 2.1 draft | Complete | Complete | Thumbnail image loading and post-processing |
| Implicit shapes and node bounding volumes | 2.1 draft | Complete | Partial | Box, capsule, cylinder, plane, and sphere adapters via `@math.gl/culling` |
| Mesh and buffer compression (Draco) | 2.0 extension | Complete | Complete | `KHR_draco_mesh_compression` |
| Mesh compression (meshopt) | 2.0 extension | Complete | Complete | `KHR_meshopt_compression` and `EXT_meshopt_compression` |
| KTX2 / Basis Universal textures | 2.0 extension | Complete | Complete | `KHR_texture_basisu` |
| WebP and AVIF textures | 2.0 extensions | Complete | Complete | Optional decoder support; required-extension failures preserved |
| Texture transforms | 2.0 extension | Complete | Partial | `KHR_texture_transform` metadata is exposed for rendering integrations |
| Mesh features and structural metadata | 2.0 / 3D Tiles extensions | Complete | Partial | Loaders.gl helpers expose metadata tables and feature IDs |
| Punctual lights, unlit materials, and legacy techniques | 2.0 extensions | Complete | Partial | Parsed and retained; renderer-specific behavior remains application-owned |
| Vendor and unknown extensions | 2.0 / 2.1 | Complete | Raw only | Unknown payloads are preserved without invented runtime semantics |
| BVH construction and hierarchical traversal | 2.1 draft | Complete | Planned | Shape references are available; automatic BVH building is not yet provided |

This is a support snapshot rather than a compatibility guarantee. New 2.1 rows should be updated
as the Khronos draft stabilizes, and each runtime claim should be backed by a focused conformance
or integration test.

## glTF Extensions

glTF extensions can be present in glTF files, and will be present in the parsed JSON. glTF extensions can be supported by applications by inspecting the `extensions` fields inside glTF objects, and it is up to each application to handle or ignore them.

loaders.gl aims to provide support for glTF extensions that can be handled completely or partially during loading, and article describes glTF extensions that are fully or partially processed by the `@loaders.gl/gltf` classes.

Note that many glTF extensions affect aspects that are firmly outside of the scope of loaders.gl (e.g. rendering), and no attempt is made to process those extensions in loaders.gl.

For optional WebP or AVIF extensions, `GLTFLoader` retains the ordinary texture source when the
active runtime cannot decode the extension image. A required extension fails before image loading
when its image MIME type is unsupported.

| Extension                                                 | Preprocessed | Description                                                                                 |
| --------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| [KHR_draco_mesh_compression](#khr_draco_mesh_compression) | Y            | Decompresses draco-compressed geometries                                                    |
| [KHR_meshopt_compression](#khr_meshopt_compression)       | Y            | Decompresses version 0 or 1 meshopt streams and supports the `COLOR` filter                  |
| [EXT_meshopt_compression](#ext_meshopt_compression)       | Y            | Decompresses existing version 0 meshopt streams                                             |
| [KHR_texture_basisu](#khr_texture_basisu)                 | Y            | Adds the ability to specify textures using KTX v2                                           |
| [KHR_texture_transform](#khr_texture_transform)           | Y            | Adds transformation properties (translation, rotation, scale) for TEXCOORD\_ mesh attribute |
| [EXT_texture_webp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp) | Y | Selects the WebP source when the active decoder supports it |
| [EXT_texture_avif](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif) | Y | Selects the AVIF source when the active decoder supports it |
| [EXT_mesh_features](#ext_mesh_features)                   | Y            | 3D tiles extension                                                                          |
| [EXT_structural_metadata](#ext_structural_metadata)       | Y            | 3D tiles extension                                                                          |
| [KHR_lights_punctual](#khr_lights_punctual)               | Y\*          | Deprecated                                                                                  |
| [KHR_materials_unlit](#khr_materials_unlit)               | Y\*          | Deprecated                                                                                  |
| [EXT_feature_metadata](#ext_feature_metadata)             | Y\*          | Deprecated. 3D tiles extension                                                              |

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

Parsing support:

- During load the `GLTFLoader` applies the transform to the texture coordinate data and rewrites the accessor to point at a freshly allocated buffer view.
- Existing interleaved buffer views remain untouched so that attributes like positions and normals that share the original data continue to function correctly.
- When the extension references a different `texCoord` index than the source attribute, the loader creates a new accessor and attribute entry for the transformed coordinates.

### Meshopt compression

[meshoptimizer](https://github.com/zeux/meshoptimizer) is the codec and implementation library.
`EXT_meshopt_compression` and `KHR_meshopt_compression` are glTF extension contracts that describe
which buffer ranges use that codec. loaders.gl already supported the EXT contract; support for the
newer KHR contract is additional rather than a replacement.

| Capability | `EXT_meshopt_compression` | `KHR_meshopt_compression` |
| ---------- | ------------------------- | ------------------------- |
| Khronos status | Complete, ratified vendor extension | Release candidate Khronos extension |
| Attribute bitstream | Version 0 | Versions 0 and 1 |
| Modes | `ATTRIBUTES`, `TRIANGLES`, `INDICES` | `ATTRIBUTES`, `TRIANGLES`, `INDICES` |
| Filters | `NONE`, `OCTAHEDRAL`, `QUATERNION`, `EXPONENTIAL` | EXT filters plus `COLOR` |
| loaders.gl support | Existing assets remain supported | Added in loaders.gl 5.0 |

The exact extension name matters. A glTF document can list either name in `extensionsRequired`, so
supporting only EXT does not claim the KHR capability. Khronos also recommends that loaders retain
EXT support because existing assets and tools use it. Version 0 EXT assets are binary-compatible
with KHR, but loaders.gl does not silently rename unsupported extension declarations.

The KHR extension improves the attribute codec with a version 1 bitstream. It also adds the `COLOR`
post-decode filter for 4-byte or 8-byte color elements using a YCoCg representation. These features
required moving from the older decoder that had been embedded in loaders.gl to the maintained
decoder-only distribution from `meshoptimizer`. Applications do not need to provide or initialize a
meshopt decoder separately.

#### How loading works

Meshopt compression operates on buffer views, not just mesh primitives. It can therefore represent
geometry, animation, morph targets, and instance data. For each compressed buffer view:

1. The extension object's `buffer`, `byteOffset`, and `byteLength` select the compressed source
   bytes.
2. `mode`, `count`, and `byteStride` define how to reconstruct `count * byteStride` bytes.
3. The parent buffer view's `buffer`, `byteOffset`, and `byteLength` select the uncompressed
   destination. That buffer may contain a real uncompressed fallback or be a placeholder allocated
   for extension-aware loaders.
4. The loader decodes into the destination range and applies the declared filter.

After all matching buffer views decode successfully, `GLTFLoader` removes their extension objects,
fallback-buffer markers, and the matching top-level `extensionsUsed` and `extensionsRequired`
entries. It retains the source buffers containing compressed bytes and does not compact or renumber
the document's buffers.

Decoding runs during asynchronous loading when both `gltf.loadBuffers` and
`gltf.decompressMeshes` are `true`, which is the default. If either option is disabled, the
compressed declarations remain for the application to process. A buffer view or fallback buffer
that declares both KHR and EXT is invalid and is rejected before any stream is decoded, avoiding a
partially transformed result.

| Mode or filter | Intended data |
| -------------- | ------------- |
| `ATTRIBUTES` | Fixed-stride values such as vertex attributes, animation values, or instance transforms |
| `TRIANGLES` | Indices representing triangle lists |
| `INDICES` | Arbitrary index sequences that are not triangle lists |
| `OCTAHEDRAL` | Quantized unit vectors such as normals and tangents |
| `QUATERNION` | Quantized rotations |
| `EXPONENTIAL` | Floating-point data with reduced mantissa precision |
| `COLOR` | KHR-only quantized color data using a YCoCg representation |

Meshopt and Draco are separate compression paths. Meshopt compresses individual buffer views while
preserving the parent accessor and buffer-view layout; Draco represents the attributes and indices
of an entire mesh primitive in one extension object. The `gltf.decompressMeshes` option controls
both paths. loaders.gl currently decodes, but does not encode, either meshopt extension.

#### KHR_meshopt_compression

[KHR_meshopt_compression specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_meshopt_compression)

#### EXT_meshopt_compression

[EXT_meshopt_compression specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_meshopt_compression)

## Custom Extensions

### EXT_feature_metadata

3D tiles extension by Cesium. This extension allows batching features for efficient streaming to a client for rendering and interaction.

[EXT_feature_metadata](https://github.com/CesiumGS/glTF/tree/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata)

### EXT_mesh_features

3D tiles extension by Cesium. This extension defines a means of assigning identifiers to geometry and subcomponents of geometry within a glTF 2.0 asset.

[EXT_mesh_features](https://github.com/CesiumGS/glTF/tree/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features)

### EXT_structural_metadata

3D tiles extension by Cesium. This extension defines a means of storing structured metadata within a glTF 2.0 asset.

[EXT_structural_metadata](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata)
