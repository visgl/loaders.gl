---
title: GLTFLoader
description: Parse glTF and GLB scenes, resolve linked assets, and optionally process compressed content.
hide_title: true
page_style: designed
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="glTF module / loader"
  title="GLTFLoader"
  description="Load a standards-shaped scene while the loader resolves buffers, images, compressed meshes, and other linked resources around it."
  hideTitle
  tone="pink"
  meta={['.gltf and .glb', 'Linked assets', 'Draco and meshopt']}
  logos={[{alt: 'glTF', src: '/images/format-logos/gltf-logo.png'}]}
  links={[
    {label: 'glTF format', to: '/docs/modules/gltf/formats/gltf'},
    {label: 'glTF module', to: '/docs/modules/gltf'},
    {label: 'Try glTF', to: '/examples/gltf'}
  ]}
/>

<GltfDocsTabs active="gltf-loader" />

<ThreeDDataFormatsGraphic />

<DocOrientation
  eyebrow="What GLTFLoader handles"
  title="Resolve a scene without hiding the source document."
  description="GLTFLoader loads the standards-shaped scene first, then optionally resolves linked assets, decompresses payloads, and exposes derived data in parallel fields for applications that need it."
  tone="pink"
  items={[
    {label: 'Input', value: '.gltf JSON, .glb binary, or a resolved response'},
    {label: 'Resolution', value: 'Buffers, images, external files, and nested assets'},
    {label: 'Compression', value: 'Draco, meshopt, and KTX2/Basis extension paths'},
    {label: 'Output', value: 'Scenegraph JSON plus optional typed and decoded resources'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

Parses a glTF file. It loads both the `.glb` (binary) and `.gltf` (application/json) variants,
then keeps the standards-shaped JSON available alongside any resolved buffers, images, and
decoded extension data.

:::info[Start with the output you need]

- Use `GLTFLoader` when you need the glTF document, linked resources, or extension processing.
- Use [`postProcessGLTF`](post-process-gltf) or [`GLTFScenegraph`](gltf-scenegraph) when traversal
  should be more convenient than following indices in the source JSON.
- Use [`convertGLTFToMeshArrow()`](/docs/specifications/category-mesh#mesh-arrow-tables) when
  static primitive attributes should enter a shared Mesh Arrow table without baking scene
  transforms into the geometry.

:::

| Input | Output | APIs |
| --- | --- | --- |
| `.gltf` JSON, `.glb` binary, and draft glTF 2.1 assets | [Scenegraph category data](/docs/specifications/category-scenegraph): source `json` plus optional `buffers`, `images`, `files`, and `externalAssets` | `load`, `parse` |

The loader automatically attempts best-effort conversion of older glTF v1 files to glTF v2
by default (`options.gltf.normalize: true`). This conversion has limitations; use the normalization helpers
below when an application needs diagnostics or strict rejection of unsupported legacy features.
See the [glTF 1 to glTF 2 conversion support table](/docs/modules/gltf/formats/gltf#gltf-1-to-gltf-2-conversion)
for required transformations, implemented subsets, and known gaps. Strict mode only rejects
reported unsupported features; it does not perform complete glTF 2 validation.
Setting `normalize: false` rejects glTF 1 input rather than returning an unconverted asset.

Conversion includes camera dictionaries and references, conventional vertex attribute aliases
(`JOINT`, `WEIGHT`, `TEXCOORD`, and `COLOR`), inverse-bind accessor references, and embedded
`KHR_binary_glTF` images. Untouched external buffer URIs are retained; the named binary body is moved to
buffer index zero with its references and loaded payloads. Compatible accessor strides move to
separate buffer views. Other safe raw layouts are repacked after buffers load, repairing strides,
component/vertex alignment, and matrix-column padding while preserving original bytes and image views.
Joint names resolve in order within explicit skeleton subtrees per instance, or globally when unique; multiple disjoint roots are supported when they share an unambiguous common ancestor;
shared skins are cloned for distinct bindings. Absent or
identity bind shapes are consumed. Finite affine non-identity bind shapes are baked into packed
FLOAT MAT4 inverse-bind matrices after buffers load. The conversion appends aligned results to copied
buffers, preserving original accessor data and palette order. Missing payloads, invalid spans or strides,
unresolved or disconnected skin bindings, unsupported matrix data, and sparse or extension-bearing
data requiring repacking are reported and rejected in strict mode. Complete skin/attribute validation
remains unsupported.

The direct normalization helpers require loaded buffers for binary repacking, attribute component
conversion, bounds calculation, payload checks, and non-identity bind shapes. `GLTFLoader` completes these conversions after linked
buffers load; `loadBuffers: false` can only convert already available embedded payloads.
Missing payloads are reported in best-effort mode and rejected in strict mode. When direct
conversion changes a URI-backed buffer, its URI becomes an updated data URI. Other URIs are retained.

Conventional indexed joint/weight names and custom attribute namespaces are normalized. Valid scalar/vector
joint indices become unsigned byte/short VEC4 data without changing palette indices; smaller joint and
weight vectors are padded with zeros. Shared consumers keep
separate accessor metadata. Unsigned integer color, weight, and UV values confined to `[0, 1]` become
FLOAT values to retain their glTF 1 numeric inputs. Larger unsigned values are normalized by convention
in best-effort mode, with an explicit unsupported-feature diagnostic; strict mode rejects that ambiguity.
Compatible explicit normalized unsigned accessors are retained. Signed BYTE/SHORT UVs become FLOAT using literal values or the explicit normalized flag. Signed colors/weights are converted only when values remain in `[0, 1]`; smaller weight vectors are padded. Integer BYTE/SHORT normals and tangents (including unsigned types) become FLOAT using literal or explicit normalized values only when the decoded directions are already unit length and tangent handedness is ±1. They are not renormalized. Opaque extension consumers block these interpretation conversions. These notes use the supplied logger and do not interpret arbitrary shader code.

Fully detached skeleton hierarchies can be added to scenes that instantiate their skins when the
hierarchy contains no renderable objects or opaque node extensions. Local transforms and palette
order are preserved. Supplied joint/weight sets are checked per mesh/skin binding for compatible
shapes/counts, contiguous pairing, palette ranges, finite weights, sums of one, and repeated weighted
joints. Missing JOINTS_0/WEIGHTS_0 is reported; weights are not renormalized. Supplied inverse-bind matrices are validated for FLOAT MAT4 shape, sufficient count, finite values, and an affine fourth row, including absent/identity bind shapes and unused skins.

Required position and animation-input bounds are calculated from validated loaded bytes. Compatible
LINEAR/STEP TRS animations retain their samples; checks cover time ordering, target/output shapes,
key counts, finite values, unit rotation quaternions, duplicate targets, and unresolved references.
Camera projection values are also checked. Invalid values are reported in best effort and rejected
in strict mode. Translation-only animated matrices are decomposed to equivalent TRS fields when finite, affine, nonsingular, and free of shear. Their rotation/scale linear transform is preserved and checked by recomposition. Rotation or scale animation on matrix nodes requires an unambiguous basis and remains unsupported, as do conflicting TRS fields and opaque node extensions. Spline generation and complete conformance validation remain unsupported. These diagnostics and bounds checks also require loaded payloads when source
bounds already exist.

Every declared buffer/view span is checked, including unused resources. Missing buffer lengths are inferred only from loaded URI-backed data without buffer extensions, using the borrowed logical slice. Declared lengths may be smaller than the resource payload, including GLB padding. Missing buffer-view lengths are inferred from the smallest envelope containing every dense accessor consumer when loaded data proves that span fits the logical buffer. Image or sparse owners, unknown extension consumers, unused views, and invalid accessor layouts prevent inference. Source buffer bytes are retained. Missing BIN-buffer lengths are not guessed. Inferences use the supplied logger.

Primitive vertex attributes must have matching positive counts. Core NORMAL/TANGENT attributes require finite unit directions and tangent handedness ±1. Standard color/UV/joint/weight shapes and component types are checked, and color/weight values must remain in `[0, 1]`. Attribute sets start at zero and are consecutive. Primitive modes and draw counts are checked for indexed and unindexed core topology; opaque extension topology is not interpreted. Invalid geometry is reported rather than repaired, so strict mode rejects some invalid assets previously accepted. Loaded indices are checked for unnormalized unsigned SCALAR storage and range against every consuming primitive. Byte indices containing `255` are widened to short storage; short indices containing `65535` are widened to integer storage. Widening preserves values and separates shared raw vertex consumers. The UINT32 maximum (`4294967295`) cannot be represented as a core glTF 2 index and is reported. Missing or opaque index bytes are also reported. A reserved index used by an opaque primitive extension is retained and reported, with a separate accessor for core consumers.

Obsolete asset profile/premultiplied-alpha and texture format/type/target fields move under each
object's `extras.gltf1.legacyFields`, preserving application extras. True premultiplied alpha and
non-default texture settings are reported as requiring additional rendering conversion.

For applications that need explicit conversion diagnostics, `normalizeGLTFV1()` returns a report
listing unsupported legacy features. Use `normalize: 'strict'` to reject those features instead of
continuing with a best-effort conversion. `convertGLTFV1ToGLTF2()` performs the same conversion on
a cloned JSON document and leaves the caller's asset untouched. Legacy techniques, programs, and
shaders are preserved under `json.extras.gltf1Resources`; their shader behavior is not translated.

`GLTFLoader` sends conversion notes and warnings about assumptions and unsupported features through
`options.core.log`, using probe.gl-compatible lazy logging methods. The direct helpers accept
the same logger as `options.log`; absent or null loggers leave diagnostics in the report only.
Informational start and completion messages use log level 1, and warnings are emitted as they occur,
including before strict-mode rejection. The report's aggregate warning does not duplicate logger output.

```ts
const converted = convertGLTFV1ToGLTF2(gltfWithLoadedBuffers, {
  normalize: 'best-effort',
  log // A probe.gl-compatible logger supplied by the application.
});
```

Best-effort material conversion recognizes conventional `values.diffuse` RGBA factors and
diffuse texture IDs (`tex`, `texture2d_0`, `diffuseTex`, or `diffuse`). It approximates these as
non-metallic, rough PBR materials. A finite scalar `values.transparency` in `[0, 1]` multiplies
the diffuse alpha, with `0` meaning transparent and `1` opaque; resulting alpha below `1`
enables blending unless an alpha mode is already supplied. Explicit PBR factors are retained.
Invalid diffuse factors are not emitted as PBR factors. The original technique and values
remain in `material.extras.gltf1`, and the report identifies the approximation and unsupported
technique. Strict mode rejects these legacy material techniques even when a diffuse texture
or color is recognized. This does not reproduce arbitrary shaders, legacy lighting, or
premultiplied-alpha rendering, and does not establish visual equivalence in downstream viewers.

Material-level `KHR_materials_common` conversion resolves diffuse/emission texture IDs and supports
LAMBERT and diffuse-only PHONG/BLINN with rough, non-metallic PBR factors. These lighting models are
approximated, and the supplied logger and report receive a note even in strict mode. Nonzero ambient
or specular lighting is reported as unsupported and rejected in strict mode; shininess has no effect
when specular color is zero. Lit emission maps to emissive properties, with a white multiplier for
texture-only emission. CONSTANT uses emission as unlit base color, never diffuse, and generates
`KHR_materials_unlit`. Its default emission is black; ambient-dependent behavior remains unsupported.
The loader's existing unlit decoder annotates these materials with `unlit: true`.
`GLTFWriter` restores that annotation as a required `KHR_materials_unlit` extension for export;
raw optional unlit extensions remain optional. Assets without binary data omit the optional BIN chunk.

Common transparent and double-sided flags may occur in values or at the extension root. They must
be booleans, default to false, and conflicting locations are reported. Valid transparency multiplies
base-color alpha. The transparent flag controls BLEND versus OPAQUE independently of that alpha;
explicit glTF 2 material fields take precedence. Recognized color values require finite RGBA factors
in `[0, 1]`; images are not transcoded. All original common data is retained under
`material.extras.gltf1.commonMaterial` without discarding existing application extras.

Consumed common declarations are removed only when no live common payload remains. Unresolved
common lights and unknown models retain their payloads and declarations. Generated unlit is required
when the source common extension was required. Complete fallback technique/program/shader chains
overridden by converted common materials are preserved without strict rejection; this exemption
does not apply to unaccounted resources, remaining programmable materials, or opaque extension
consumers. Small material exports are independently validated in tests; runtime conversion still
does not provide a full validator or appearance guarantee.

## Usage

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLTFLoader);
```

To decompress Draco-compressed meshes:

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLTFLoader, {
  gltf: {decompressMeshes: true}
});
```

Draco and meshopt decoders are maintained by the glTF module. For linked buffers, images, or
draft glTF 2.1 files, enable the matching `gltf.load*` options described below.

<ReferenceBoundary
  title="Loader behavior and options"
  description="The reference below covers loading modes, post-processing, extension handling, scenegraph conversion, and the complete option surface."
  tone="pink"
/>

## Overview

The `GLTFLoader` aims to take care of as much processing as possible, while remaining framework-independent.

Draft glTF 2.1 readiness includes the [new accessor component type definitions](/docs/modules/gltf/formats/gltf#accessor-component-types). `GLTFScenegraph` and `postProcessGLTF` expose these values through the corresponding JavaScript typed arrays.

The loader also supports draft glTF 2.1 [thumbnails](/docs/modules/gltf/formats/gltf#draft-gltf-21-thumbnails). When `asset.thumbnail` references an image, `gltf.loadImages: true` loads that image even if it is not used by a texture.

The GLTF Loader returns an object with a `json` field containing the glTF Scenegraph. In its basic mode, the `GLTFLoader` does not modify the loaded JSON in any way. Instead, the results of additional processing are placed in parallel top-level fields such as `buffers` and `images`. This ensures that applications that want to work with the standard glTF data structure can do so.

For applications that need static geometry in the Mesh Arrow layout, use `convertGLTFToMeshArrow()` after loading. It converts each source primitive once and returns node placements separately, preserving mesh reuse. Dense, packed accessors retain views of source buffers; interleaved, sparse, and implicit-zero accessors are materialized without changing their logical component values. Conversion does not modify the glTF or bake node transforms, skinning, morph targets, or GPU instancing.

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {convertGLTFToMeshArrow} from '@loaders.gl/gltf/mesh-arrow';

const gltf = await load(url, GLTFLoader);
const meshArrow = convertGLTFToMeshArrow(gltf);
```

The result separates reusable source geometries from scene placements. Each geometry contains one
Arrow table per mesh primitive plus the original attribute component types and normalization
metadata; each placement identifies the source node and its world transform. All glTF primitive
attributes are projected as columns, including normals, tangents, texture coordinates, colors,
joints, and weights. Standard glTF point, line, and triangle modes are represented by the table's
`topology` metadata. The converter does not modify the input JSON or buffers.

Optionally, the loaded gltf can be "post processed", which lightly annotates and transforms the loaded JSON structure to make it easier to use. Refer to [postProcessGLTF](post-process-gltf) for details.

In addition, certain glTF extensions, including Draco and [meshopt compression](/docs/modules/gltf/formats/gltf#meshopt-compression), can be fully or partially processed during loading. When possible (and extension processing is enabled), such extensions will be resolved/decompressed and replaced with standards conformant representations.

Note: while supported, synchronous parsing of glTF (e.g. using `parseSync()`) has significant limitations. When parsed asynchronously (using `await parse()` or `await load()`), the following additional capabilities are enabled:

- linked binary resource URI:s will be loaded and resolved (assuming a valid base url is available).
- base64 encoded binary URI:s inside the JSON payload will be decoded.
- linked image URI:s can be loaded and decoded.
- linked raster image URI:s are decoded through [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader), producing `ImageBitmap` in browsers and the Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is installed.
- Draco meshes can be decoded asynchronously on worker threads (in parallel!).

## Options

| Option                    | Type    | Default | Description                                                                  |
| ------------------------- | ------- | ------- | ---------------------------------------------------------------------------- |
| `gltf.loadBuffers`        | Boolean | `true`  | Fetch any referenced binary buffer files (and decode base64 encoded URIs).   |
| `gltf.loadFiles`          | Boolean | `false` | Resolve draft glTF 2.1 `files` entries from URIs or buffer views.             |
| `gltf.loadExternalAssets` | Boolean | `false` | Recursively parse draft glTF 2.1 external assets instantiated by scene nodes. |
| `gltf.loadImages`         | Boolean | `true`  | Load images referenced by textures or the draft glTF 2.1 thumbnail.          |
| `gltf.decompressMeshes`   | Boolean | `true`  | Decompress Draco and [KHR/EXT meshopt](/docs/modules/gltf/formats/gltf#meshopt-compression) data. |
| `gltf.normalize`          | Boolean or string | `true`  | Automatically attempt glTF 1 to 2 conversion. `true` / `'best-effort'` continue through reported gaps; `'strict'` rejects reported unsupported features; `false` rejects glTF 1 input. |

### Meshopt decompression

`GLTFLoader` supports both the existing `EXT_meshopt_compression` extension and the newer
`KHR_meshopt_compression` extension. KHR adds version 1 attribute streams and the `COLOR` filter;
support for KHR does not replace EXT because glTF capability negotiation uses the exact extension
name and existing assets continue to declare EXT.

Meshopt decoding is available during asynchronous parsing when `gltf.loadBuffers` and
`gltf.decompressMeshes` are both enabled. The maintained decoder ships with `@loaders.gl/gltf`, so
there is no decoder option or application-level initialization step. Successful decoding writes
the uncompressed bytes into the buffer range described by the parent buffer view and removes the
processed extension declarations. The compressed source buffer remains in the returned data.

Set `gltf.decompressMeshes` to `false` to retain both KHR and EXT declarations for another component
to process. See [Meshopt compression](/docs/modules/gltf/formats/gltf#meshopt-compression) for the
stream versions, modes, filters, fallback-buffer behavior, and comparison with Draco.

## Draft glTF 2.1 File Resolution

`resolveGLTFFile(gltf, fileReference, options, context)` resolves one entry from the draft glTF 2.1
`files` array. `fileReference` can be an array index, a package name matching `files[*].name`, or an
original URI matching `files[*].uri`. URI-backed files are fetched relative to the containing asset;
buffer-view-backed files return a view of the already loaded buffer without copying it. Resolved
entries are cached in the parallel `gltf.files` array.

`findGLTFFileIndex(gltf, reference)` performs only the virtual package lookup and returns `-1` when
there is no matching entry. Ambiguous package names are rejected.

## Draft glTF 2.1 External Assets

With `gltf.loadExternalAssets: true`, `GLTFLoader` parses external assets referenced by
`json.nodes[*].externalAsset`. Parsed children are stored in `gltf.externalAssets` at the same index
as their `json.externalAssets` definition. Repeated references to the same URI share one parsed
result, and cyclical references are rejected.

Dependencies of URI-backed children resolve relative to the child URI. Dependencies of embedded
children resolve through the containing asset's `files` array, allowing an unmodified nested glTF
and its buffers or textures to be packaged together. Unreferenced definitions remain unloaded.

## Working with GLTF data

The job of `GLTFLoader` is to open the glTF container file(s) and extract the glTF JSON, together with any associated binary chunks and images.

If you already have access to libraries or code that process standard glTF JSON directly, this format may be appropriate. However, in this storage-optimized form, traversing the loaded glTF scene graph tends to require verbose and repetitive code with many checks and guards.

To simplify traversal and manipulation of glTF data, loaders.gl provides three separate mechanisms:

- The [`GLTFIterator`](./gltf-iterator) class lazily resolves references while preserving the original glTF JSON objects, making it suitable for extension transformations.
- The [`postProcessGLTF()`](./post-process-gltf) function converts the glTF JSON into a largely equivalent JavaScript structure that is simpler to work with.
- The [`GLTFScenegraph`](./gltf-scenegraph) class accepts glTF data and provides methods for accessing or modifying APIs.

The gltf module provides typescript definitions for the glTF JSON that align with the glTF specification, and all APIs and return values are strongly typed to assist applications to write robust code.

## Data Format

The data format returned by the `GLTFLoader` is the unmodified glTF JSON extracted from any binary containers, together with loaded binary chunks and optionally loaded images.

The standard glTF JSON structure will be available in the `json` field.

```typescript
{
  json: {
    scenes: [...],
    scene: ...,
    nodes: [...],
    ...
  }
}
```

However, the objects inside these arrays will have been pre-processed to simplify usage. For details on changes and extra fields added to the various glTF objects, see [post processing](post-process-gltf).

```typescript
{
  // The base URI used to load this glTF, if any. For resolving relative uris to linked resources.
  baseUri: String,

  // JSON Chunk
  json: Object, // Contains the unmodified parsed glTF JSON (the parsed GLB JSON chunk)

  // Length and indices of this array will match `json.buffers`
  // GLB v1/v2's bin chunk, or GLB v3 chunks selected by json.buffers[*].chunk.
  // Additional glTF json `buffers` are fetched and base64 decoded from the JSON uri:s.
  buffers: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number
  }],

  // Draft glTF 2.1 generic files. Length and indices match json.files.
  files: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number,
    mimeType: String,
    name: String, // optional virtual package name
    url: String  // optional resolved URL
  }],

  // Recursively parsed glTF 2.1 assets. Indices match json.externalAssets.
  // Unreferenced definitions remain null.
  externalAssets: Array<GLTFWithBuffers | null>,

  // Images can optionally be loaded and decoded, they will be stored here.
  // Standard raster images are decoded through ImageBitmapLoader.
  // Length and indices of this array will match `json.buffers`
  images: Array<ImageBitmap | object>,

  // GLBLoader output, if this was a GLB encoded glTF
  _glb?: Object
}
```

For draft GLB v3 files, `GLTFLoader` resolves each `json.buffers[*].chunk` index to the
corresponding BIN chunk. See the [GLB format documentation](../formats/glb) for indexing and
legacy fallback rules.

| Field                     | Type          | Default | Description                                                      |
| ------------------------- | ------------- | ------- | ---------------------------------------------------------------- |
| `baseUri`                 | `String`      | ``      | length of GLB (e.g. embedded in larger binary block)             |
| `json`                    | `Object`      | `{}`    | Parsed JSON from the JSON chunk                                  |
| `buffers`                 | `Object[]`    | `[]`    | The version number                                               |
| `buffers[\*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk                                                 |
| `buffers[\*].byteOffset`  | `Number`      | `null`  | offset of buffer (embedded in larger binary block)               |
| `buffers[\*].byteLength`  | `ArrayBuffer` | `null`  | length of buffer (embedded in larger binary block)               |
| `_glb`?                   | `Object`      | N/A     | The output of the GLBLoader if the parsed file was GLB formatted |
