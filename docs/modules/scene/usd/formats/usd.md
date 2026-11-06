---
title: OpenUSD format
description: A scene description format for hierarchical composition, references, payloads, and variants.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Hierarchical scene format"
  title="Compose a scene without flattening it first."
  description="OpenUSD describes scenes as composed layers and prims. The initial loaders.gl implementation reads a useful, explicit subset so applications can inspect the stage and retain source relationships."
  tone="pink"
  meta={['USDA / USDC', 'USDZ', 'Shared USDStage']}
  links={[
    {label: 'Scene module', to: '/docs/modules/scene'},
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'}
  ]}
/>

## loaders.gl support

| Type | API |
| --- | --- |
| Loader | [`USDLoader`](../api-reference/usd-loader.md) |

<ThreeDDataFormatsGraphic />

<DocOrientation
  eyebrow="Composition is the format"
  title="Keep layers, payloads, and authored values visible."
  description="OpenUSD is useful when the relationships between scene elements matter. loaders.gl exposes those relationships in a typed stage representation rather than reducing the file to a flat mesh."
  tone="pink"
  items={[
    {label: 'Reads', value: 'USDA text, the initial USDC crate subset, and stored USDZ'},
    {label: 'Preserves', value: 'Prim hierarchy, dictionary metadata and encoded USDZ files'},
    {label: 'Output', value: 'Shared USDStage and asset buffers without renderer objects'},
    {label: 'Boundary', value: 'USDC crate 0.8.0 subset; no full composition or compressed ZIP entries'}
  ]}
/>

[OpenUSD](https://openusd.org/release/index.html) is the scene description model.
USDA and USDC are its text and binary layer encodings; USDZ packages layers and assets.
The .usd extension can identify either layer encoding, so content matters.

## One loader, one stage contract

Use [USDLoader](../api-reference/usd-loader.md) for supported USDA, USDC, and USDZ inputs.
They all return USDStage with rootPrims, metadata, and layer provenance. Applications
inspect the same prim and attribute structures regardless of the root encoding.
There is no separate USDCLoader or renderer-specific stage.

| Representation | Supported subset | Composition boundary |
| --- | --- | --- |
| USDA / text .usd | Authored ASCII scene layers | Existing references, payloads, variants and local overrides |
| USDC / binary .usd | Crate 0.8.0 ordinary specifications and supported values | No binary reference/payload composition or variants |
| USDZ | Stored ZIP archives with a supported text or binary root | Root encoding limits still apply; compressed ZIP entries reject |

The binary subset is introduced by [PR #4416](https://github.com/visgl/loaders.gl/pull/4416).
Use a version containing that change. Read the [USDC encoding reference](#binary-usdc-reference)
for exact value, allocation, and compatibility limits. Common usage, output types,
and composition options belong to the [USDLoader reference](../api-reference/usd-loader.md).

## What stays authored

Prim types, attribute declarations, hierarchy, metadata, asset paths, and time samples
remain scene data. The loader does not create GPU meshes, apply a shading model,
evaluate an animation, or supply the complete OpenUSD composition engine.
A supported ASCII composition feature does not imply its binary equivalent is implemented.

## Binary USDC reference

### What is USDC?

OpenUSD describes scenes through typed prims, attributes, relationships, and layers. USDA is its text representation; USDC is the binary crate representation. USDZ packages layers and assets in an archive. A binary layer is still scene description data: it is not a GPU scene or a pre-rendered image.

The initial decoder accepts crate version 0.8.0 only. An extension such as `.usd` does not establish the crate version or prove that every authored value and composition feature is supported.

### Read a layer

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene/usd';

const stage = await load('scene.usdc', USDLoader, {usd: {compose: false}});
for (const prim of stage.rootPrims) {
  console.log(prim.path, prim.type, prim.attributes);
}
```

`compose: false` makes the example an inspection of the supported root layer. It does not enable otherwise unsupported binary reference or payload composition. The existing ASCII composition options do not imply equivalent binary coverage.

### Output contract

| Field | Meaning |
| --- | --- |
| `stage.format` | `usdc` for a binary root layer; `usdz` for the archive container |
| `stage.rootPrims` | Ordered prim hierarchy with `name`, `path`, `type`, `specifier`, `children` |
| `prim.attributes` | Named declarations with authored type, value, and metadata |
| Asset/path values | Objects such as `{assetPath: 'texture.png'}` and `{path: '/World'}` |
| Time samples | Authored times and values in attribute metadata; no animation evaluation |
| `stage.metadata`, `stage.layers` | Root metadata and layer provenance |

Vector arrays retain tuple structure. Mesh attributes such as points and face indices remain USD values; the loader does not triangulate, upload, shade, or animate them. Authored units and axis metadata remain data for the application to interpret.

### Supported features and limits

Supported ordinary prim, attribute, and relationship specifications include the implemented scalar/vector/array defaults, asset/path values, signed integers, and time-sample fields. Stored USDZ archives can have a supported binary root layer.

Unsupported crate versions, value list operations, compound path list operations, variants, binary reference/payload composition, and other unsupported value encodings fail explicitly. Do not treat acceptance of one crate fixture as general OpenUSD interoperability. Integers outside JavaScript's safe range reject instead of silently losing precision.

Input is limited to 64 MiB. Logical collections are limited to four million entries; byte buffers and expanded vector components use a separate 256 MiB aggregate decoder-storage budget, and section offsets and seeks are checked. Files are parsed in memory; there is no random-access layer source.

### Loader API and runtime

The metadata export is `USDLoader` from `@loaders.gl/scene/usd`. For direct async parsing, import `USDLoaderWithParser` from `@loaders.gl/scene/usd-loader` and pass it to core `parse`. Do not use the metadata loader with `parseSync`.

The renderer-free crate decoder is adapted from THREE.js r187 with retained MIT terms. It adds no THREE.js runtime import or package dependency. Applications receive the same USDStage contract used by the ASCII loader.

See the [OpenUSD format guide](#one-loader-one-stage-contract) and [USDLoader reference](../api-reference/usd-loader.md) for the surrounding ASCII/archive APIs; their broader ASCII features are separate from this binary subset.

### Dictionary metadata and USDZ packages

The authored-value follow-up adds bounded nested dictionary metadata, including
empty dictionaries, supported primitive and numeric-array values, tokens, and
asset-path values. Keys are retained as own data properties, including names such
as `__proto__`. Complex vector, matrix, and quaternion values inside dictionaries
remain unsupported until their typed shapes are covered explicitly.

| Dictionary values | Supported representation |
| --- | --- |
| Scalars | Boolean, uchar, int32/uint32, safe int64/uint64, half/float/double, string, token and asset path |
| Arrays | Int32/uint32, half/float/double, string and token; supported numeric compression is decoded without changing precision |
| Nested data | Bounded dictionaries, including empty dictionaries and special keys as own properties |
| Deferred | Boolean/uchar/int64/uint64/asset arrays and complex vector, matrix or quaternion dictionary values |

Dictionary nesting is limited to 64 levels and shares the decoder allocation and
value-traversal budgets. Cycles, duplicate or invalid keys, and invalid offsets
reject. This support requires the authored-value follow-up to the initial decoder.

USDZ uses the same USDLoader: its first file must be a supported native USD layer,
including binary content named .usd. A later layer is not selected as a fallback
when the first file is an image. Native usdzip fixtures cover both .usdc and binary
.usd roots and preservation of dictionary values. Stored, unencrypted entries follow the
[USDZ specification](https://openusd.org/release/spec_usdz.html); compressed ZIP
entries reject.

## USDZ textures and packaged resources

USDZ is a package around USD layers and their resources. Extracting an image from the package
does not create a material or GPU texture: the loader returns the exact encoded file bytes.
Applications choose an image decoder, renderer, color-space interpretation and sampling policy.
This avoids requiring a renderer or an image-decoding dependency merely to inspect a package.

`USDStage.assets` retains all stored files, including PNG/JPEG textures, additional layers
and files with unknown extensions. Full archive paths distinguish textures with the same basename
in different directories. The collection uses resolved package URLs so an authored asset path
can be looked up relative to its attribute's `sourceUrl` (or the owning prim's source URL).
Attribute provenance survives composition when a prim combines opinions from different layers.
These package URLs are identifiers for in-memory data, not public URLs to fetch.

The [USDLoader reference](../api-reference/usd-loader.md#embedded-usdz-assets) documents the
`USDEmbeddedAsset` fields, lookup example, buffer ownership and missing-file behavior. PNG and
JPEG filenames receive MIME hints; other resources remain available without a hint. Image
pixels, decoded dimensions, material bindings, UV transforms and renderer texture objects
are outside extraction's scope. No package dependencies are added.
