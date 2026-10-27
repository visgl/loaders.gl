---
title: glTF format
description: A compact, interoperable scene format for delivering geometry, materials, and animation.
hide_title: true
page_style: designed
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="gltf"
  eyebrow="Scenegraph format"
  title="glTF"
  description="A delivery-focused scene format for geometry, materials, hierarchy, animation, and the linked binary or image assets that make a model complete."
  tone="pink"
  meta={['.gltf and .glb', 'Scenegraph data', 'Khronos standard']}
  links={[
    {label: 'glTF module', to: '/docs/modules/scene/gltf'},
    {label: 'GLTFLoader', to: '/docs/modules/scene/gltf/api-reference/gltf-loader'},
    {label: 'Try glTF', to: '/examples/gltf'}
  ]}
/>

<GltfDocsTabs active="format" />

<ThreeDDataFormatsGraphic />

<DocOrientation
  eyebrow="The glTF delivery model"
  title="A scene graph with its payloads close at hand."
  description="glTF describes the scene and its relationships, while buffers, images, and extensions carry the data needed to render it. Choose the JSON or binary container without changing the application-facing scene model."
  tone="pink"
  items={[
    {label: 'Scene', value: 'Nodes, meshes, materials, skins, and animation'},
    {label: 'Containers', value: '.gltf JSON or .glb binary packaging'},
    {label: 'Payloads', value: 'Buffers and images, embedded or external'},
    {label: 'Extensions', value: 'Draco, meshopt, KTX2/Basis, and draft 2.1 features'}
  ]}
/>

glTF is the Khronos format for delivering three-dimensional scenes and models. It describes
geometry, materials, hierarchy, skins, cameras, and animation, with linked or embedded resources
for binary data and images. Extensions carry additional data and behavior declarations.

The [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) is the
normative reference for the stable format. This page describes its data model and loaders.gl
support; draft 2.1 additions and legacy conversion are documented separately below. See the
[glTF module](/docs/modules/scene/gltf) for installation and [GLTFLoader](../api-reference/gltf-loader) for API options.

<ReferenceBoundary
  title="Specification and implementation details"
  description="The sections below explain the core scene model, file variants, extension support, and the draft and legacy behavior exposed by loaders.gl."
  tone="pink"
/>

## Scene model

glTF 2.0 describes a scene as JSON objects plus binary resources. Most objects live in
top-level arrays, and references are zero-based indices into those arrays. The same mesh,
material, texture, or buffer can be reused by several scene objects.

| Objects | Role |
| --- | --- |
| `asset` | Format version, generator, copyright, and asset metadata. |
| `scenes`, `scene` | Scene root nodes and the optional default scene index. |
| `nodes` | Hierarchy, local matrix or translation/rotation/scale, and mesh, camera, or skin references. |
| `meshes`, mesh primitives | Geometry, drawing modes, material indices, morph targets, and attribute/accessor references. |
| `accessors` | Typed element counts and layouts for vertex attributes, indices, animation samples, and other data. |
| `bufferViews`, `buffers` | Byte ranges within binary resources; accessors interpret those bytes. |
| `materials`, `textures`, `images`, `samplers` | Surface parameters, image resources, and texture sampling settings. |
| `skins`, `animations`, `cameras` | Joint bindings, sampled animation channels, and camera projections. |

For geometry, a primitive attribute such as `POSITION` references an accessor; that accessor
usually references a buffer view, which selects bytes from a buffer. Component types, element
shapes, offsets, strides, sparse replacements, and normalization determine the logical values.
Nodes place reusable meshes in the scene; their transforms are separate from mesh vertex data.

The JSON defines the asset. A rendering or application runtime interprets animation, materials,
lighting, interactivity, and spatial audio. `GLTFLoader` returns the source-shaped document in
`gltf.json` alongside resolved resources and derived metadata. Use
[`GLTFIterator`](../api-reference/gltf-iterator) for lazy reference traversal or
[`postProcessGLTF`](https://luma.gl/docs/api-reference/gltf/post-process-gltf) when an object tree is more convenient.

### Coordinate conventions

glTF uses a right-handed coordinate system with +Y up. Linear distances are in meters and
angles are in radians. Node rotations use unit quaternions in XYZW order. A local TRS transform
is composed as `T * R * S`, and a child node's world transform combines its parent's world
transform with its local transform. See the
[coordinate and transformation rules](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units).

## Variants

The two file variants package the same scene model:

| File | Media type | Packaging |
| --- | --- | --- |
| `.gltf` | `model/gltf+json` | JSON document with external, data-URI, or extension-defined resources. |
| `.glb` | `model/gltf-binary` | [GLB container](./glb) containing JSON and optional binary chunks. |

GLB 2.0 can embed geometry and images in one binary resource, but a GLB may still reference
external assets. Relative resource URIs resolve against the containing glTF document.
File variants are distinct from [material variants](#typed-extension-metadata-and-permissive-validation),
which select alternative materials for a shared set of geometry.

## loaders.gl glTF Feature Coverage

The table below summarizes the level of glTF support exposed by `@loaders.gl/scene/gltf`. “Raw” means
the JSON is accepted and preserved in `gltf.json`; “runtime” means loaders.gl resolves, decodes,
normalizes, or otherwise exposes the feature to applications. Draft 2.1 support follows the
evolving specification and is intentionally marked separately from stable glTF 2.0 support.

| Feature | Version | Raw | Runtime | Tests / notes |
| --- | --- | --- | --- | --- |
| Core asset, scene, node, mesh, material, camera, skin, animation, texture, image, sampler, buffer, and accessor objects | 2.0 | ✅ Complete | ✅ Complete | Loader, writer, schema, and indexed accessor coverage |
| `.gltf` JSON and external resources | 1.0 / 2.0 / 2.1 | ✅ Complete | ✅ Complete | URI and data-URI resolution |
| GLB v1 and v2 | 1.0 / 2.0 | ✅ Complete | ✅ Complete | GLB loader and writer tests |
| GLB v3 / multiple binary chunks | 2.1 draft | ✅ Complete | ⚠️ Partial | Draft parsing support; format may evolve |
| GLB v3 writing and round-trip serialization | 2.1 draft | ✅ Complete | ✅ Complete | Opt-in `GLBWriter` path with 64-bit lengths and multiple BIN chunks |
| glTF v1 to v2 normalization | 1.0 → 2.0 | ✅ Complete | ⚠️ Partial | Best-effort conversion via `gltf.normalize`; see the [conversion support table](#gltf-1-to-gltf-2-conversion) for known gaps |
| Sparse accessors and normalized component values | 2.0 | ✅ Complete | ✅ Complete | Typed-array extraction and accessor utilities |
| Draft 2.1 accessor component types | 2.1 draft | ✅ Complete | ⚠️ Partial | Includes 32-bit, 16-bit float words, and 64-bit integer representations |
| Unified `files` references | 2.1 draft | ✅ Complete | ✅ Complete | URI, data-URI, and bufferView-backed files |
| External asset composition | 2.1 draft | ✅ Complete | ✅ Complete | Recursive loading, caching, and cycle rejection |
| Asset thumbnails | 2.1 draft | ✅ Complete | ✅ Complete | Thumbnail image loading; rendering links in luma.gl |
| Implicit shapes and node bounding volumes | 2.1 draft | ✅ Complete | ⚠️ Partial | Box, capsule, cylinder, plane, and sphere adapters via `@math.gl/geometry/culling` |
| WebGPU accessor transforms | 2.0 / 2.1 | ✅ Complete | ⚠️ Partial | GPU-oriented derived views are available without rewriting accessor JSON |
| WebGPU texture format mapping | 2.0 / 2.1 | ✅ Complete | ❌ Planned | Raw image MIME and texture metadata are preserved; normalized GPU descriptors are the next tranche |
| WebGPU sampler constants | 2.0 / 2.1 | ✅ Complete | ❌ Planned | Sampler JSON is preserved; WebGPU address/filter enum mapping is not yet a public helper |
| WebGPU upload descriptors | 2.0 / 2.1 | ✅ Complete | ❌ Planned | Future non-mutating descriptors will combine image data, format, dimensions, and sampler state |
| Mesh and buffer compression (Draco) | 2.0 extension | ✅ Complete | ⚠️ Partial | Decode plus opt-in async writer for single-buffer triangle meshes |
| Mesh compression (meshopt) | 2.0 extension | ✅ Complete | ✅ Complete | `KHR_meshopt_compression` and `EXT_meshopt_compression` |
| KTX2 / Basis Universal textures | 2.0 extension | ✅ Complete | ✅ Complete | `KHR_texture_basisu` |
| WebP and AVIF textures | 2.0 extensions | ✅ Complete | ✅ Complete | Optional decoder support; required-extension failures preserved |
| Texture transforms | 2.0 extension | ✅ Complete | ⚠️ Partial | `KHR_texture_transform` metadata is exposed for rendering integrations |
| Mesh features and structural metadata | 2.0 / 3D Tiles extensions | ✅ Complete | ⚠️ Partial | Loaders.gl helpers expose metadata tables and feature IDs |
| Vector primitive topology | Draft 2.0 extensions | ✅ Complete | ⚠️ Partial | Primitive-restart ranges and polygon loops are decoded; rendering remains application-owned |
| Punctual lights and unlit materials | 2.0 extensions | ✅ Complete | ⚠️ Partial | Parsed and retained; renderer-specific behavior remains application-owned |
| Legacy techniques, programs, and shaders | 1.0 / legacy extension | 📦 Preserved only | ❌ Unsupported | Retained source data; glTF 1 shader/technique conversion is unsupported |
| Interactivity graphs | 2.0 extension | ✅ Complete | ⚠️ Metadata | Typed graphs, raw accessor, and GLB preservation; application executes graphs. |
| Spatial audio | 2.0 extensions | ✅ Complete | ⚠️ Partial | MPEG source metadata and draft KHR encoded clips/emitter attachments; application decodes and plays audio. |
| Material variants, GPU instances, XMP packets | 2.0 extensions | ✅ Complete | ⚠️ Metadata | Types, permissive schemas, and reference-resolution helpers. |
| Animation pointers and node interaction flags | 2.0 extensions | ✅ Complete | ⚠️ Metadata | Typed declarations and permissive schemas; runtime evaluates pointers and inherited flags. |
| Vendor and unknown extensions | 2.0 / 2.1 | ✅ Complete | ⚠️ Raw only | Unknown payloads are preserved without invented runtime semantics |
| BVH construction and hierarchical traversal | 2.1 draft | ✅ Complete | ❌ Planned | Shape references are available; automatic BVH building is not yet provided |

This is a support snapshot rather than a compatibility guarantee. New 2.1 rows should be updated
as the Khronos draft stabilizes, and each runtime claim should be backed by a focused conformance
or integration test.

## glTF Extensions

Extensions add properties to glTF objects through their `extensions` dictionaries.
`extensionsUsed` identifies extensions present in the document; `extensionsRequired` identifies
capabilities needed to consume the asset correctly. Unknown extension data remains available
in the source JSON, and applications determine which required capabilities their runtime supports.

loaders.gl handles resource loading and decoding where possible, exposes metadata through types,
schemas, and helpers, and preserves behavior declarations for the application runtime. Metadata
support does not imply graph execution, animation playback, audio playback, or a rendering engine.
The table distinguishes automatic processing from metadata access and explicitly called helpers.

For optional WebP or AVIF extensions, `GLTFLoader` retains the ordinary texture source when the
active runtime cannot decode the extension image. A required extension fails before image loading
when its image MIME type is unsupported.

| Extension                                                 | Processing | Description                                                                                 |
| --------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| [KHR_interactivity](#khr_interactivity) | Metadata | Typed behavior graphs and a raw graph accessor; execution belongs to the application runtime. |
| [KHR_draco_mesh_compression](#khr_draco_mesh_compression) | ✅ Y            | Decompresses draco-compressed geometries                                                    |
| [KHR_meshopt_compression](#khr_meshopt_compression)       | ✅ Y            | Decompresses version 0 or 1 meshopt streams and supports the `COLOR` filter                  |
| [EXT_meshopt_compression](#ext_meshopt_compression)       | ✅ Y            | Decompresses existing version 0 meshopt streams                                             |
| [KHR_texture_basisu](#khr_texture_basisu)                 | ✅ Y            | Adds the ability to specify textures using KTX v2                                           |
| [KHR_texture_transform](#khr_texture_transform)           | ✅ Y            | Adds transformation properties (translation, rotation, scale) for TEXCOORD\_ mesh attribute |
| [EXT_texture_webp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp) | ✅ Y | Selects the WebP source when the active decoder supports it |
| [EXT_texture_avif](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif) | ✅ Y | Selects the AVIF source when the active decoder supports it |
| [EXT_mesh_features](#ext_mesh_features)                   | ✅ Y            | 3D tiles extension                                                                          |
| [EXT_structural_metadata](#ext_structural_metadata)       | ✅ Y            | 3D tiles extension                                                                          |
| [KHR_mesh_primitive_restart](#vector-primitive-topology)   | ✅ Y            | Draft restart-separated strip topology                                                      |
| [EXT_mesh_polygon](#vector-primitive-topology)             | ✅ Y            | Draft polygon triangles, exterior rings, and interior rings                                  |
| [MPEG_audio_spatial](#spatial-audio) | Metadata | Root/node audio declarations and validated source accessor references; application provides timed media and playback. |
| [KHR_audio_emitter](#spatial-audio) | Resources | Draft encoded clips, resolved sources and node/scene emitter instances; application provides decoding and playback. |
| [KHR_materials_variants](#typed-extension-metadata-and-permissive-validation) | Helper | Types, permissive schemas and resolved material-to-variant mappings. |
| [EXT_mesh_gpu_instancing](#typed-extension-metadata-and-permissive-validation) | Helper | Types, permissive schema and lazy instance/accessor descriptors. |
| [KHR_animation_pointer](#typed-extension-metadata-and-permissive-validation) | Metadata | Types and permissive animation-target schema; application resolves and animates pointer targets. |
| [KHR_node_visibility, KHR_node_selectability, KHR_node_hoverability](#typed-extension-metadata-and-permissive-validation) | Metadata | Types and permissive schemas; application evaluates inherited subtree flags. |
| [KHR_xmp_json_ld](#typed-extension-metadata-and-permissive-validation) | Helper | Types, permissive schemas and shared XMP packet resolution. |
| [KHR_lights_punctual](#khr_lights_punctual)               | ✅ Y\*          | Deprecated                                                                                  |
| [KHR_materials_unlit](#khr_materials_unlit)               | ✅ Y\*          | Deprecated                                                                                  |
| [EXT_feature_metadata](#ext_feature_metadata)             | ✅ Y\*          | Deprecated. 3D tiles extension                                                              |

## Official Extensions

### KHR_interactivity

`GLTFLoader` preserves the root `KHR_interactivity` extension. Use
`getGLTFInteractivity(gltf)` from `@loaders.gl/scene/gltf` with either a loader result or
raw glTF JSON to read it; the helper returns `null` when the extension is absent.

```typescript
import {getGLTFInteractivity} from '@loaders.gl/scene/gltf';

const interactivity = getGLTFInteractivity(gltf);
const graph = interactivity?.graphs[interactivity.graph ?? 0];
```

The helper returns the original extension object, without validating, cloning,
resolving graph indices, or inserting defaults. Treat the returned value as shared
data. Luma.gl’s `postProcessGLTF` retains the extension and `GLTFWriter` preserves it in GLB
output. Graph execution and property-pointer evaluation are the rendering runtime's
responsibility.

The exported `GLTF_KHR_interactivity`, `GLTFInteractivityGraph`, node, declaration,
socket, event, variable, and value types describe the
[Khronos JSON schemas](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_interactivity/schema).
Indices refer to arrays within the same graph. Event IDs and initial values are
optional. TypeScript types do not validate index bounds, nonempty arrays, reserved
socket names, or operation-specific configuration and component values at runtime.

For explicit schema validation, use the
`GLTF2ExtensionSchemas.Khronos.KHR_interactivity['glTF.KHR_interactivity']` fragment
from `@loaders.gl/scene/gltf/schema`. The loader's raw accessor does not invoke it. Graph-local
index bounds and operation-specific runtime semantics still require application checks.

### KHR_draco_mesh_compression

Supports compression of mesh attributes (geometry).

The `GLTFLoader` by default fully decompresses Draco-compressed geometries and removes the Draco
extension from the parsed glTF data structure. The original buffers remain available for other
buffer views, including when decoding runs on worker threads.

Specification: [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression).

Parsing Support:

- Enable `gltf.decompressMeshes` on `GLTFLoader` to decode supported compressed mesh extensions.
- The expanded attributes are placed in the mesh object (effectively making it look as if it had never been compressed).
- The extension objects are removed from the glTF file.

Encoding Support:

- `GLTFWriter.encode` can opt into Draco compression with
  `{gltf: {draco: {enabled: true}}}`. It appends extension payloads without
  mutating the input and currently targets single-buffer triangle primitives.

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
both paths. loaders.gl decodes both extensions; only the Draco writer currently has an opt-in
encoding path.

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

### Vector primitive topology

Draft `KHR_mesh_primitive_restart` assets expose a loader-derived `primitiveRestart` descriptor
on applicable indexed primitives. Its `restartIndex` identifies the component-type maximum and
its `ranges` identify non-empty source-index runs without copying the index buffer.

Draft `EXT_mesh_polygon` objects retain their serialized accessor references and add a `data`
descriptor when buffers are loaded. The descriptor contains typed views of triangle offsets, loop
indices, and loop offsets, plus random-access polygon ranges. Core triangle indices are retained as
a rendering fallback. These extensions expose topology only; tessellation, line widening, styling,
and rendering remain application responsibilities.

## Spatial audio

`GLTFLoader` supports loading metadata for
[`MPEG_audio_spatial`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/MPEG_audio_spatial)
and the draft
[`KHR_audio_emitter`](https://github.com/omigroup/gltf-extensions/tree/main/extensions/2.0/KHR_audio_emitter).
Both retain their original extension JSON and `extensionsUsed` / `extensionsRequired` entries.
These are loader integrations: applications provide audio decoding, playback, spatialization,
and any streaming or timed-media runtime.

For `MPEG_audio_spatial`, `gltf.spatialAudio` contains root and node declarations. Each entry
has `nodeIndex` (`null` for the root) and `extension`, including sources, a listener, and reverb
settings. `getSpatialAudio(gltf)` also discovers these declarations from a raw glTF document
or a loader result. Source accessor indices are validated and remain indices into
`gltf.json.accessors`. Timed accessors are preserved; `MPEG_accessor_timed`, `MPEG_media`,
and circular-buffer streaming are not implemented by this handler. HOA orientation and
reverb processing remain renderer responsibilities.

For `KHR_audio_emitter`, `gltf.audioClips` parallels the extension's `audio` array. Each clip
contains the original `audio` declaration and, when loaded, encoded `data` as a `Uint8Array`.
External clips also include the resolved `url`. URI resources use the loader context's fetch
function, including data URIs and paths relative to the glTF document. Embedded buffer views
take precedence over URIs and require a MIME type.

Embedded clip data may be a view into a larger loaded buffer. Honor the `Uint8Array`'s
`byteOffset` and `byteLength` when decoding it. For APIs such as Web Audio's `decodeAudioData`
that accept an `ArrayBuffer`, use `clip.data.slice().buffer` to obtain just the encoded clip.

`gltf.audioEmitters` contains one descriptor per node or scene attachment, with `emitterIndex`,
`nodeIndex`, `sceneIndex`, the original `emitter`, and resolved `sources`. A resolved source has
`sourceIndex`, the original `source`, and a shared `clip` reference when audio is assigned.
Placeholder sources and emitters without sources are supported. Scene attachments must use
global emitters; nodes may use global or positional emitters. Playback properties, including
`autoplay`, are retained as declarations and do not start playback. Omitted properties retain
the draft's defaults; the loader does not insert default values into the JSON.

```typescript
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';

const gltf = await load('scene.gltf', GLTFLoader, {
  gltf: {loadAudio: true}
});

for (const instance of gltf.audioEmitters || []) {
  for (const {source, clip} of instance.sources) {
    // Pass clip?.data and source playback settings to your application's audio system.
  }
}
```

Set `gltf.loadAudio: false` to resolve emitter metadata without fetching audio URIs or
populating `audioClips[].data`. Buffer loading runs independently: the default
`gltf.loadBuffers: true` still downloads external buffers, including buffers containing
audio. Set both `loadAudio: false` and `loadBuffers: false` to avoid those downloads; this
also disables loading external buffers used by meshes and other resources. With
`loadBuffers: false` alone, clips backed by unavailable buffers retain metadata only,
while URI audio still loads. Embedded GLB bytes are already part of the asset download.
To bypass audio handling and its reference validation entirely, set
`gltf.excludeExtensions: ['MPEG_audio_spatial', 'KHR_audio_emitter']`.

## Typed extension metadata and permissive validation

The package exports TypeScript types and permissive Zod schemas for the following extension
metadata. `GLTFSchema` uses the corresponding schemas at document, primitive, node, scene,
and animation-target locations. Unknown properties, nested extensions, custom instance
attributes, and XMP namespace properties are preserved. Validation does not insert defaults,
resolve references, or run animation or interaction behavior. Known fields retain their
expected JSON types; array indices must be nonnegative integers.

| Extension | Public schemas | Loading and inspection |
| --- | --- | --- |
| `KHR_materials_variants` | `GLTFKHRMaterialsVariantsSchema`, `GLTFKHRMaterialsVariantsPrimitiveSchema` | `getMaterialVariantMappings(gltf)` resolves each mapping's material and named variants. |
| `EXT_mesh_gpu_instancing` | `GLTFEXTMeshGPUInstancingSchema` | `getMeshInstances(gltf)` exposes node and mesh indices, instance counts, original attribute indices and lazy accessor declarations. It checks mesh/accessor references and equal counts. |
| `KHR_animation_pointer` | `GLTFKHRAnimationPointerSchema` | Preserves animation target pointers for the application's animation runtime. |
| `KHR_node_visibility` | `GLTFKHRNodeVisibilitySchema` | Preserves local subtree visibility declarations. |
| `KHR_node_selectability` | `GLTFKHRNodeSelectabilitySchema` | Preserves local subtree selection declarations. |
| `KHR_node_hoverability` | `GLTFKHRNodeHoverabilitySchema` | Preserves local subtree hover declarations. |
| `KHR_xmp_json_ld` | `GLTFKHRXMPJSONLDSchema`, `GLTFKHRXMPJSONLDReferenceSchema` | `getXMPMetadata(gltf, object)` resolves an object's shared packet without fetching namespace URLs. |
| Draft `KHR_audio_emitter` | `GLTFKHRAudioEmitterExtensionSchema`, `GLTFKHRAudioAttachmentSchema` | Resolves encoded audio and emitter instances as described above. |
| `MPEG_audio_spatial` | `GLTFMPEGAudioSpatialSchema` | Exposes lazy root and node spatial audio declarations as described above. |

The additional extension types use their serialized names, for example
`GLTF_KHR_materials_variants`, `GLTF_EXT_mesh_gpu_instancing`, and
`GLTF_KHR_animation_pointer`. Typed extension maps are also exported as
`GLTFRootExtensions`, `GLTFNodeExtensions`, `GLTFSceneExtensions`,
`GLTFMeshPrimitiveExtensions`, and `GLTFAnimationTargetExtensions`.

```typescript
import {GLTFSchema, getMaterialVariantMappings} from '@loaders.gl/scene/gltf';
import {GLTFKHRNodeVisibilitySchema} from '@loaders.gl/scene/gltf/schema';

const document = GLTFSchema.parse(json);
const mappings = getMaterialVariantMappings(document);
const visibility = GLTFKHRNodeVisibilitySchema.parse({visible: false, applicationTag: 'hidden'});
```

The helpers accept raw glTF JSON or a `GLTFLoader` result and preserve source JSON. They resolve
references when called and throw on broken references; permissive schema validation alone does
not check cross-object references. GPU instance helpers leave TRS composition, normalized
accessor decoding, shader binding, and rendering to the application. Node flags retain local
values; applications combine them with ancestor flags when evaluating visibility or input.
Animation pointer schemas validate the pointer field's type; applications resolve the pointer
and check that its target is animatable.

These named schemas are available from both `@loaders.gl/scene/gltf` and `@loaders.gl/scene/gltf/schema`.
The versioned official extension schema collections remain available from the schema subpath
for callers that need the authoritative specification constraints.

## Draft glTF 2.1 Unified File References

Draft glTF 2.1 adds a top-level `files` array for generic dependencies beyond buffers and images.
Each file has a required `mimeType` and exactly one source: an external or data `uri`, or an
embedded `bufferView`. `GLTFLoader` can resolve these entries into its parallel `files` result
array with `gltf.loadFiles: true`.

For packaged assets, [`resolveGLTFFile()`](/docs/modules/scene/gltf/api-reference/gltf-loader) also accepts
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
`@math.gl/geometry/culling`. The helpers return derived objects and never modify the source JSON. Unknown
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
`gltf.json.asset.thumbnail`; [`postProcessGLTF()`](https://luma.gl/docs/api-reference/gltf/post-process-gltf)
resolves it to the corresponding processed image object.

This support follows the Khronos [Thumbnails draft](https://github.com/KhronosGroup/glTF/issues/2593).

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

## glTF 1 to glTF 2 Conversion

`GLTFLoader` automatically attempts best-effort normalization of glTF 1 inputs by default
(`gltf.normalize: true`, equivalent to `'best-effort'`). Setting `gltf.normalize: false` rejects
glTF 1 input. [`convertGLTFV1ToGLTF2()`](/docs/modules/scene/gltf/api-reference/gltf-loader)
provides the same conversion on cloned JSON and returns a `normalizationReport`.

The table describes conversion of features present in a glTF 1 source. The
[glTF 1 specification](https://github.com/KhronosGroup/glTF/blob/main/specification/1.0/README.md)
defines the source; the [glTF 2 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
defines the target. See the [loader API](/docs/modules/scene/gltf/api-reference/gltf-loader) for
options, diagnostics, and detailed validation rules.

**✅ Supported** means the stated transformation is implemented. **⚠️ Partial** means the
listed subset is supported. **❌ Unsupported** means no conversion is provided.
**📦 Preserved only** means source data is retained without equivalent rendering behavior.
**❓ Not validated** means the converter does not establish the stated guarantee.

| Area | Support | Conversion and limits |
| --- | --- | --- |
| Asset and collections | ✅ Supported | Sets `asset.version` to `2.0`, converts dictionaries to arrays, and omits optional empty collections, child lists, and scene-root lists. Preserves source IDs and applicable metadata. |
| Core references | ✅ Supported | Replaces core resource IDs with indices, including camera, scene, accessor, texture, and animation references. Extension-specific references require separate support. |
| Multiple meshes per node | ✅ Supported | Creates child nodes for additional meshes, inheriting placement and skin binding without duplicating transforms. |
| Cameras | ⚠️ Partial | Converts references and checks projection parameters. Camera world-transform constraints are not fully validated. |
| Joint names and skeleton roots | ⚠️ Partial | Resolves unique joints in explicit subtrees or globally unique bindings; preserves palette order and clones differing skin bindings. Ambiguous, cyclic, multiply-parented, or disconnected hierarchies are reported. |
| Detached skeletons | ⚠️ Partial | Adds a fully detached, non-renderable joint hierarchy to the instance's scene. Does not reparent nodes or invent transforms. |
| Inverse binds and bind shapes | ⚠️ Partial | Resolves inverse binds; repacks loaded dense matrices and bakes finite affine bind shapes. Missing, sparse, extension-owned, invalid, or overflowing payloads are reported. |
| Attribute names | ⚠️ Partial | Converts legacy joint/weight names, indexed color/UV names, and custom namespaces. Conflicting aliases are rejected; unsupported core names are reported. |
| Joint and weight storage | ✅ Supported | Converts valid integral joint indices to unsigned VEC4 and zero-pads smaller influence vectors. Preserves palette indices and compatible weight interpretation. |
| Integer color, weight, and UV values | ⚠️ Partial | Converts compatible literal or explicitly normalized values without clamping. Larger unnormalized unsigned values require a reported best-effort assumption; strict mode rejects it. |
| Integer normals and tangents | ⚠️ Partial | Converts BYTE/SHORT and unsigned equivalents to FLOAT using literal or explicit normalized interpretation. Decoded directions must already be unit length and tangent handedness ±1; no renormalization is performed. |
| Layout and alignment | ⚠️ Partial | Repacks loaded dense core accessors, including legacy strides, vertex alignment, and matrix-column padding. Preserves source bytes and shared consumers. Sparse or extension-owned repacking is unsupported. |
| Buffer and view lengths | ⚠️ Partial | Checks declared and borrowed spans. Infers missing URI-buffer lengths from loaded logical slices, and missing dense accessor-view lengths from bounded consumer spans. Does not infer missing BIN-buffer lengths or image-owned, sparse, unused, or opaque view lengths. |
| Required accessor bounds | ✅ Supported | Calculates position and animation-time bounds from finite loaded values. Invalid or unavailable payloads are reported. |
| Reserved index values | ✅ Supported | Widens byte index `255` and short index `65535` without changing values. The UINT32 maximum and opaque extension semantics are reported. |
| Geometry and skin checks | ⚠️ Partial | Checks core shapes, counts, finite values, directions, attribute sets, draw counts, influence pairing, palettes, and weight sums. Reports invalid data without repair; does not validate all extension semantics. |
| Buffers, embedded images, and GLB | ✅ Supported | Converts GLB 1 references and embedded-image fields; removes obsolete buffer type. Repacking updates changed URI payloads. Use `GLTFWriter` with version `2` to produce GLB 2 bytes. |
| Common materials | ⚠️ Partial | Approximates diffuse LAMBERT and diffuse-only PHONG/BLINN as rough non-metallic PBR. Converts supported emission, opacity, and explicit double-sided/transparent flags; preserves source values as provenance. |
| CONSTANT common materials | ✅ Supported | Converts emission to unlit base color, including emission textures and the black default. Generates `KHR_materials_unlit` declarations. |
| Conventional diffuse uniforms | ⚠️ Partial | Recognizes conventional diffuse colors and texture names. Arbitrary shader uniforms are not interpreted. |
| Lighting and render state | ❌ Unsupported | Does not translate nonzero ambient/specular lighting, common light definitions, general shininess, technique render states, or true premultiplied-alpha behavior. |
| Texture settings and formats | ⚠️ Partial | Preserves obsolete texture fields outside core JSON. Default RGBA/UNSIGNED_BYTE/TEXTURE_2D needs no replacement; non-default semantics are reported. BMP/GIF images are not transcoded. |
| Techniques, programs, and shaders | 📦 Preserved only | Retains resources in `extras.gltf1Resources`. **Technique and shader conversion is unsupported.** Complete fallback chains overridden by converted common materials may be preserved in strict mode. |
| Animation references and samples | ✅ Supported | Resolves sampler/parameter/target references and retains compatible LINEAR/STEP TRS samples. Checks times, shapes, counts, quaternions, and duplicate targets. Invalid samples are reported without resampling. |
| Animated matrix nodes | ⚠️ Partial | Decomposes finite, affine, nonsingular, shear-free matrices for translation-only animation. Rotation/scale animation with an ambiguous basis remains unsupported. |
| Legacy extensions | ⚠️ Partial | Converts `KHR_binary_glTF` and the stated `KHR_materials_common` subset, maintaining consumed/generated declarations. Unknown extension payloads are retained without interpreting their references or behavior. |
| Complete conformance and appearance | ❓ Not validated | Independent Khronos tests cover small generated exports and original Box/BoxAnimated assets. The loader does not run a full validator or establish visual equivalence for arbitrary assets. |

The remaining limitations are:

- **Appearance policies:** shaders, lighting/render-state differences, premultiplied alpha, and image transcoding.
- **Ambiguous or opaque source data:** unresolved skeletons, rotation/scale matrix animation, unknown numeric interpretation, and sparse or extension-owned repacking.
- **Complete validation:** document-wide conformance and independent rendering comparisons.

`normalize: 'strict'` rejects reported unsupported features. An empty
`normalizationReport.unsupported` does not establish complete conformance or visual equivalence;
validate exported assets separately. Conversion notes and assumptions use the supplied
probe.gl-compatible `core.log` or direct-helper `log` object.

New glTF 2 features such as morph targets, sparse accessors, and `CUBICSPLINE` animation do not
need to be synthesized for glTF 1 inputs that do not use them.

Implementation evidence: [normalizer](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/normalize-gltf-v1.ts),
[binary-extension preprocessing](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/extensions/KHR_binary_gltf.ts),
[normalization tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1.cross.spec.ts),
the [JSON conversion tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-json.spec.ts),
the [material conversion tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-materials.spec.ts),
the [common-material converter](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/convert-gltf-v1-materials.ts)
and [independent validation tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-common-materials.spec.ts),
the [accessor-layout converter](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/convert-gltf-v1-accessors.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-layouts.spec.ts),
and the [skin converter](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/convert-gltf-v1-skins.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-skins.spec.ts),
and the [bind-shape baker](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/bake-gltf-v1-bind-shapes.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-bind-shapes.spec.ts),
and the [binary repacker](https://github.com/visgl/loaders.gl/blob/master/modules/scene/src/gltf/lib/api/repack-gltf-v1-accessors.ts)
with [layout](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-repacking.spec.ts),
[attribute](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-attributes.spec.ts),
and [field cleanup](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-fields.spec.ts) tests.
The tests cover common references, static multi-mesh nodes, animation reference conversion,
camera and inverse-bind references, attribute aliases, binary/external buffer ordering, embedded images,
empty collections, material approximations, strict rejection of reported legacy resources, and non-mutating APIs;
they also verify decoded interleaved/packed values, shared skin instances, joint order, affine bind-shape multiplication, shared buffer preservation, loader completion after buffer loading, GLB 2 round trips,
and strict rejection of reported layout and skin gaps. The [scene and payload tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-conformance.spec.ts),
[animation tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-animation-payloads.spec.ts),
and [projection and hierarchy tests](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/lib/api/normalize-gltf-v1-projections-scenes.spec.ts)
cover the additional checks above. They do not establish complete glTF 1 conversion coverage.
