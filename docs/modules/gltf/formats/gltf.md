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
  eyebrow="Scenegraph format"
  title="glTF"
  description="A delivery-focused scene format for geometry, materials, hierarchy, animation, and the linked binary or image assets that make a model complete."
  tone="pink"
  meta={['.gltf and .glb', 'Scenegraph data', 'Khronos standard']}
  logos={[{alt: 'glTF', src: '/images/format-logos/gltf-logo.png'}]}
  links={[
    {label: 'glTF module', to: '/docs/modules/gltf'},
    {label: 'GLTFLoader', to: '/docs/modules/gltf/api-reference/gltf-loader'},
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

- _[`@loaders.gl/gltf`](/docs/modules/gltf)_
- _[glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/GlTF)_

glTF is a standard file format for three-dimensional scenes and models, intended to be a streamlined, interoperable format for the delivery of 3D assets, while minimizing file size and runtime processing by apps. Sometimes described as the "JPEG of 3D."

An open standard developed and maintained by the Khronos Group, it supports 3D model geometry, appearance, scene graph hierarchy, and animation.

<ReferenceBoundary
  title="Specification and implementation details"
  description="The sections below record draft 2.1 behavior, container variants, version history, extensions, and the fields exposed by loaders.gl."
  tone="pink"
/>

## Draft glTF 2.1 Unified File References

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

## glTF 1 to glTF 2 Conversion

`GLTFLoader` automatically attempts best-effort normalization of glTF 1 inputs by default
(`gltf.normalize: true`, equivalent to `'best-effort'`). Setting `gltf.normalize: false` rejects
glTF 1 input. [`convertGLTFV1ToGLTF2()`](/docs/modules/gltf/api-reference/gltf-loader)
provides the same conversion on cloned JSON and returns a `normalizationReport`.

The table below inventories the transformations needed **when the input uses the corresponding
glTF 1 feature**. It describes the current implementation, including the diffuse-material
conversion added in [#4104](https://github.com/visgl/loaders.gl/pull/4104). It is based on the
[glTF 1 specification](https://github.com/KhronosGroup/glTF/blob/main/specification/1.0/README.md),
the final [glTF 2 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), and
the [Khronos migration discussion](https://github.com/KhronosGroup/glTF/issues/605). That discussion
includes intermediate proposals; the final glTF 2 specification defines the target requirements.

**✅ Supported** means the listed transformation is implemented. **⚠️ Partial** means only the stated
subset is converted. **❌ Unsupported** means the converter does not perform the transformation.
**📦 Preserved only** means source data is retained without equivalent glTF 2 behavior.
**❓ Not validated** means the converter neither checks nor repairs the stated requirement.

| Area | Required transformation or target requirement | Support | Current behavior and limits |
| --- | --- | --- | --- |
| Asset declaration | Set `asset.version` to `2.0` and retain applicable metadata. | ✅ Supported | Creates `asset` if absent, sets the version, and supplies a generator if absent. Updating the version does not establish glTF 2 conformance. |
| Legacy asset fields | Remove or preserve outside core JSON the obsolete `asset.profile` and `asset.premultipliedAlpha` fields. | ⚠️ Partial | Moves `asset.profile` and `asset.premultipliedAlpha` to `asset.extras.gltf1.legacyFields` and removes the obsolete core fields. False/absent premultiplied alpha needs no rendering change; true premultiplied-alpha behavior is reported and rejected in strict mode. |
| Object collections | Convert top-level dictionaries to indexed arrays and omit empty collections. | ✅ Supported | Converts all core collections, including cameras, and removes empty top-level collection and extension-declaration arrays. Source dictionary keys are retained as `id` fields. |
| Common references | Replace string IDs with array indices. | ⚠️ Partial | Handles buffer, buffer-view, sampler, skin, inverse-bind accessor, camera, default-scene, primitive accessor/material, texture-image, node child/mesh, and scene-node references. Joint and skeleton references are resolved for the skin subset below; extension-specific references are not generally migrated. |
| Multiple meshes per node | Replace `node.meshes` with a single `node.mesh`, preserving placement and children. | ✅ Supported | Keeps the first mesh on the original node and creates child nodes for additional meshes. New children inherit the original node's transform rather than duplicating it, and retain the converted skin binding. |
| Cameras | Convert camera dictionaries and references; retain valid projection parameters. | ⚠️ Partial | Converts perspective and orthographic collections and references. Checks finite projection values, positive perspective `yfov`/`znear`/optional `aspectRatio`, nonzero orthographic magnification, nonnegative orthographic `znear`, and ordered clipping planes. Reports invalid values rather than inventing replacements. Camera world-transform constraints remain unvalidated. |
| Skin joints and skeleton | Resolve `skin.jointNames` through `node.jointName` into ordered `skin.joints`; map skeleton roots to `skin.skeleton`. | ⚠️ Partial | Resolves unique names within one explicit root per instance, or globally when roots are absent; infers the nearest common ancestor. Clones shared skins for distinct bindings and preserves palette order. Reports ambiguous/missing names, multiple roots, cycles, and multiply-parented or disconnected joint hierarchies. Scene and supplied influence checks are described below; comprehensive skin conformance remains unvalidated. |
| Skeleton scene membership | Include each skin’s joint hierarchy in the scene containing its instances. | ⚠️ Partial | Adds the topmost ancestor of a fully detached skeleton as a scene root, preserving local transforms and joint order. The hierarchy must contain every joint and no meshes, cameras, or opaque node extensions. Reports overlapping, ambiguous, cyclic, or renderable attachments; does not reparent nodes or alter transforms. |
| Skin influence shape | Supply VEC4 joint/weight sets without changing active influences. | ✅ Supported | Zero-pads SCALAR/VEC2/VEC3 core joint and weight data. Preserves FLOAT or explicit normalized unsigned weights, palette indices, source bytes, and raw shared consumers. Integer interpretation without an explicit normalized flag follows the policy below. |
| Supplied skin influence semantics | Validate matching sets, palette indices, and vertex weights. | ⚠️ Partial | For resolved mesh/skin instances with supplied influences, checks paired contiguous sets starting at zero, VEC4 component types, matching vertex counts, palette range (including zero-weight slots), finite nonnegative weights, and duplicate nonzero joint influences across sets. Requires a sum of one within floating-point tolerance. Reports errors without renormalizing weights. Missing all influence sets and complete skin conformance remain unvalidated. |
| Inverse bind matrices | Convert `skin.inverseBindMatrices` from an accessor ID to an accessor index. | ✅ Supported | Resolves the accessor reference and rejects unresolved IDs. Original accessor values are retained. Non-identity bind-shape baking validates matrix count and values for its supported subset; comprehensive skin validation remains a separate gap. |
| Bind-shape matrix | Bake `skin.bindShapeMatrix` into mesh data or inverse bind matrices. | ⚠️ Partial | Consumes absent or exact identity bind shapes without changing binary data. Repacks compatible raw strided/misaligned inverse-bind data before baking finite affine non-identity transforms as `inverseBindMatrix * bindShapeMatrix` when loaded, packed FLOAT MAT4 data is available. Appends matrices to copied buffers, preserving joint order and shared source accessors. Missing payloads, sparse matrix accessors, extension-bearing matrix accessors/views, non-affine/non-finite matrices, invalid spans, insufficient matrix counts, and FLOAT overflow are reported and rejected in strict mode. |
| Vertex attribute names | Rename legacy `JOINT`/`WEIGHT` to `JOINTS_0`/`WEIGHTS_0`; use indexed `TEXCOORD_n`/`COLOR_n` names and underscore-prefixed custom semantics. | ⚠️ Partial | Renames singular and indexed `JOINT`/`WEIGHT` semantics to `JOINTS_n`/`WEIGHTS_n`, supplies set zero for unindexed texture/color semantics, canonicalizes numeric set indices, and prefixes custom names with `_`. Existing application and extension namespaces are retained. Conflicting aliases and out-of-range set indices are rejected. Does not infer meanings from arbitrary shaders or validate all attribute-set relationships. |
| Joint-index storage | Convert core joint indices to unsigned byte/short VEC4 accessors. | ✅ Supported | Converts unnormalized, finite integral scalar/vector values in `[0, 65535]`, selecting UNSIGNED_BYTE or UNSIGNED_SHORT without changing palette indices. Pads SCALAR/VEC2/VEC3 with zeros to VEC4 and separates shared consumers. Reports fractional, negative, non-finite, out-of-range, normalized, and matrix data. Palette checks are described below. |
| Integer attribute interpretation | Preserve color, weight, and texture-coordinate interpretation in valid glTF 2 accessors. | ⚠️ Partial | Retains explicit normalized integer accessors. Converts unsigned byte/short literal values in `[0, 1]` to FLOAT, preserving glTF 1 numeric inputs. For larger unsigned values, best effort assumes normalized interpretation and reports the ambiguity; strict mode rejects the assumption. Separates consumers with different interpretations. Arbitrary shader-derived normalization and signed attribute conversion remain unsupported. |
| Accessor stride | Move glTF 1 `accessor.byteStride` to glTF 2 `bufferView.byteStride`, omitting zero strides and splitting views when layouts differ. | ⚠️ Partial | Keeps compatible vertex layouts and splits views by stride/use. With loaded raw buffers, repacks valid source strides into aligned vertex elements or packed index, animation, inverse-bind, and unused data. Shared accessors are cloned for distinct consumers. Malformed spans/strides, unavailable payloads, and sparse or extension-bearing data requiring repacking are reported and rejected in strict mode. |
| Buffer layout and alignment | Meet glTF 2 component/vertex alignment and matrix-column padding rules; separate incompatible buffer-view uses. | ⚠️ Partial | Repacks loaded raw core data to aligned appended views, including MAT2/MAT3 column padding and packed small vertex attributes. Preserves original bytes and image/extension views; copies each changed source buffer once per conversion pass. Padded matrices decode through accessor utilities. Unknown extensions and sparse data requiring repacking remain unsupported. |
| Buffer lengths | Supply correct `buffer.byteLength` and `bufferView.byteLength`. | ❓ Not validated | Existing lengths are retained except for buffers extended by binary repacking or bind-shape baking, whose new lengths are calculated after validating source spans. Missing lengths and general payload reconciliation remain unvalidated. |
| Required accessor bounds | Supply `min`/`max` for `POSITION` and animation time inputs. | ✅ Supported | Calculates or repairs bounds from loaded dense raw FLOAT VEC3 positions and compatible FLOAT SCALAR timelines, honoring validated offsets and strides. Rejects non-finite values and reports missing, sparse, or extension-bearing payloads. Original bytes are unchanged; valid existing bounds are retained. |
| Accessor type and value constraints | Meet attribute-specific type and value requirements. | ⚠️ Partial | Checks core positions, supplied skin influences, and supported TRS keyframes as described here. General attribute conformance, normals/tangents, primitive index ranges, and required attributes are not comprehensively validated or repaired. |
| Buffer type and URI | Remove obsolete `buffer.type`; preserve external URIs and identify the GLB binary buffer correctly. | ✅ Supported | Removes `buffer.type`, preserves untouched external and data URIs, and removes the URI from the reserved `binary_glTF` buffer. Direct conversion replaces a changed URI-backed buffer with an updated data URI when repacking or baking bind shapes. Moves that buffer to index zero and keeps references and loaded payloads aligned. |
| Embedded images | Replace image `KHR_binary_glTF` data with core `bufferView` and `mimeType` fields and remove obsolete image fields. | ✅ Supported | Writes the core fields into image JSON, remaps the buffer-view reference, removes the ignored URI and processed extension, and omits extension-only dimensions. Other image extensions are retained; image format validation remains a separate gap. |
| Texture definitions and image formats | Remove obsolete WebGL texture `format`, `internalFormat`, `target`, and `type` fields; use image formats accepted by glTF 2 core or an appropriate extension. | ⚠️ Partial | Moves obsolete fields to `texture.extras.gltf1.legacyFields`. Default RGBA/UNSIGNED_BYTE/TEXTURE_2D settings require no replacement behavior. Non-default format/type/target semantics are reported and rejected in strict mode. Unsupported images such as BMP/GIF are not transcoded. |
| Diffuse material values | Map conventional diffuse color or texture values to a glTF 2 material. | ⚠️ Partial | Approximates valid RGBA `values.diffuse` and texture IDs under `tex`, `texture2d_0`, `diffuseTex`, or `diffuse`. Defaults to non-metallic, rough PBR factors and retains explicit PBR factors. Arbitrary uniform names and shader-derived colors are not interpreted. |
| Opacity and render state | Express transparency, alpha testing, and face culling through glTF 2 material settings where equivalent. | ⚠️ Partial | Multiplies diffuse alpha by valid `values.transparency` in `[0, 1]` and sets `BLEND` for alpha below `1` unless an alpha mode exists. Does not translate technique blend functions, culling, alpha-test state, or premultiplied alpha. |
| Other legacy lighting values | Translate ambient, emission, specular, and shininess behavior into an appropriate material model. | ❌ Unsupported | Does not map these values or reproduce legacy lighting. Original material values are retained in `material.extras.gltf1`. |
| Techniques, programs, and shaders | Replace the glTF 1 programmable material pipeline with equivalent glTF 2 materials or a supported extension. | 📦 Preserved only | Moves top-level resources to `json.extras.gltf1Resources`; does not generate `KHR_techniques_webgl` or translate shaders. Reports these resources and legacy material techniques as unsupported; strict mode rejects them. |
| Animation references | Convert sampler dictionaries, resolve parameter indirection, and change `channel.target.id` to `target.node`. | ✅ Supported | Converts dictionaries and hybrid sampler arrays, resolves parameter/accessor/node/sampler references, and removes consumed `animation.parameters`. Defaults absent interpolation to `LINEAR`. Reports unresolved references, preserving their values in best effort and rejecting them in strict mode. Extension-specific targets are not migrated. |
| Animation interpolation and payloads | Retain compatible interpolation and satisfy core keyframe requirements. | ⚠️ Partial | Supports LINEAR/STEP TRS keys. Checks FLOAT SCALAR finite, nonnegative, strictly increasing times; target-specific FLOAT VEC3/VEC4 output shapes and matching key counts; finite output values; unit rotation quaternions; and unique node/path channels. Reports matrix nodes needing TRS decomposition, unsupported paths/interpolation, and invalid samples. Does not sort, resample, normalize quaternions, or generate spline tangents. |
| Legacy extensions | Translate extension-specific references and semantics; maintain accurate used/required extension declarations. | ⚠️ Partial | Removes processed `KHR_binary_glTF` declarations. Other extension payloads and declarations are carried through without a general glTF 1 extension migration, including `KHR_materials_common` and vendor extensions. |
| GLB container | Read the GLB 1 header/body layout and serialize a GLB 2 header plus padded JSON/BIN chunks. | ⚠️ Partial | GLB 1 parsing and separate GLB 2 writing are available. The normalization helpers update JSON, repack supported binary data, and bake supported bind shapes into copied buffers; they do not produce GLB 2 bytes. Re-encoding requires a writer with version `2` and does not fill the conversion gaps above. |
| Final conformance and appearance | Validate the resulting glTF 2 document and verify rendering in an independent viewer. | ❓ Not validated | The normalizer does not run a complete schema/semantic validator or compare rendering. Retained legacy fields and unsupported features can still yield nonconforming or visually different output. |

`normalize: 'strict'` rejects **reported** unsupported features; it is not a comprehensive glTF 2
validator. The supported camera, scene, skin, bounds, and animation checks above add diagnostics to
`normalizationReport.unsupported`; other requirements, including complete attribute and extension
semantics, remain unvalidated. An empty report is therefore insufficient to establish a
valid, visually equivalent conversion. Validate exported assets separately before relying on them.

New glTF 2 capabilities such as sparse accessors, morph targets, and `CUBICSPLINE` animation do
not need to be synthesized for every glTF 1 asset. They are distinct from transformations needed
to preserve features already present in the source.

Implementation evidence: [normalizer](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/api/normalize-gltf-v1.ts),
[binary-extension preprocessing](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/extensions/KHR_binary_gltf.ts),
[normalization tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1.cross.spec.ts),
the [JSON conversion tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-json.spec.ts),
the [material conversion tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-materials.spec.ts),
the [accessor-layout converter](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/api/convert-gltf-v1-accessors.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-layouts.spec.ts),
and the [skin converter](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/api/convert-gltf-v1-skins.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-skins.spec.ts),
and the [bind-shape baker](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/api/bake-gltf-v1-bind-shapes.ts)
and [tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-bind-shapes.spec.ts),
and the [binary repacker](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/src/lib/api/repack-gltf-v1-accessors.ts)
with [layout](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-repacking.spec.ts),
[attribute](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-attributes.spec.ts),
and [field cleanup](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-fields.spec.ts) tests.
The tests cover common references, static multi-mesh nodes, animation reference conversion,
camera and inverse-bind references, attribute aliases, binary/external buffer ordering, embedded images,
empty collections, material approximations, strict rejection of reported legacy resources, and non-mutating APIs;
they also verify decoded interleaved/packed values, shared skin instances, joint order, affine bind-shape multiplication, shared buffer preservation, loader completion after buffer loading, GLB 2 round trips,
and strict rejection of reported layout and skin gaps. The [scene and payload tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-conformance.spec.ts),
[animation tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-animation-payloads.spec.ts),
and [projection and hierarchy tests](https://github.com/visgl/loaders.gl/blob/master/modules/gltf/test/lib/api/normalize-gltf-v1-projections-scenes.spec.ts)
cover the additional checks above. They do not establish complete glTF 1 conversion coverage.

## loaders.gl glTF Feature Coverage

The table below summarizes the level of glTF support exposed by `@loaders.gl/gltf`. “Raw” means
the JSON is accepted and preserved in `gltf.json`; “runtime” means loaders.gl resolves, decodes,
normalizes, or otherwise exposes the feature to applications. Draft 2.1 support follows the
evolving specification and is intentionally marked separately from stable glTF 2.0 support.

| Feature | Version | Raw | Runtime | Tests / notes |
| --- | --- | --- | --- | --- |
| Core asset, scene, node, mesh, material, camera, skin, animation, texture, image, sampler, buffer, and accessor objects | 2.0 | ✅ Complete | ✅ Complete | Loader, writer, schema, and post-processing coverage |
| `.gltf` JSON and external resources | 1.0 / 2.0 / 2.1 | ✅ Complete | ✅ Complete | URI and data-URI resolution |
| GLB v1 and v2 | 1.0 / 2.0 | ✅ Complete | ✅ Complete | GLB loader and writer tests |
| GLB v3 / multiple binary chunks | 2.1 draft | ✅ Complete | ⚠️ Partial | Draft parsing support; format may evolve |
| GLB v3 writing and round-trip serialization | 2.1 draft | ✅ Complete | ✅ Complete | Opt-in `GLBWriter` path with 64-bit lengths and multiple BIN chunks |
| glTF v1 to v2 normalization | 1.0 → 2.0 | ✅ Complete | ⚠️ Partial | Best-effort conversion via `gltf.normalize`; see the [conversion support table](#gltf-1-to-gltf-2-conversion) for known gaps |
| Sparse accessors and normalized component values | 2.0 | ✅ Complete | ✅ Complete | Typed-array extraction and accessor utilities |
| Draft 2.1 accessor component types | 2.1 draft | ✅ Complete | ⚠️ Partial | Includes 32-bit, 16-bit float words, and 64-bit integer representations |
| Unified `files` references | 2.1 draft | ✅ Complete | ✅ Complete | URI, data-URI, and bufferView-backed files |
| External asset composition | 2.1 draft | ✅ Complete | ✅ Complete | Recursive loading, caching, and cycle rejection |
| Asset thumbnails | 2.1 draft | ✅ Complete | ✅ Complete | Thumbnail image loading and post-processing |
| Implicit shapes and node bounding volumes | 2.1 draft | ✅ Complete | ⚠️ Partial | Box, capsule, cylinder, plane, and sphere adapters via `@math.gl/culling` |
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
| Punctual lights, unlit materials, and legacy techniques | 2.0 extensions | ✅ Complete | ⚠️ Partial | Parsed and retained; renderer-specific behavior remains application-owned |
| Vendor and unknown extensions | 2.0 / 2.1 | ✅ Complete | ⚠️ Raw only | Unknown payloads are preserved without invented runtime semantics |
| BVH construction and hierarchical traversal | 2.1 draft | ✅ Complete | ❌ Planned | Shape references are available; automatic BVH building is not yet provided |

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
| [KHR_lights_punctual](#khr_lights_punctual)               | ✅ Y\*          | Deprecated                                                                                  |
| [KHR_materials_unlit](#khr_materials_unlit)               | ✅ Y\*          | Deprecated                                                                                  |
| [EXT_feature_metadata](#ext_feature_metadata)             | ✅ Y\*          | Deprecated. 3D tiles extension                                                              |

## Official Extensions

### KHR_draco_mesh_compression

Supports compression of mesh attributes (geometry).

The `GLTFLoader` by default fully decompresses Draco-compressed geometries and removes the Draco
extension from the parsed glTF data structure. The original buffers remain available for other
buffer views, including when decoding runs on worker threads.

Specification: [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression).

Parsing Support:

- By adding the `decompress: true` options to the `GLTFParser` any decompressed by the `GLTFParser`.
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
