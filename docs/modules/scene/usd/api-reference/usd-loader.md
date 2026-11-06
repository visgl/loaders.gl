---
title: USDLoader
description: Parse OpenUSD scene descriptions into a typed stage while preserving prim hierarchy, composition, and authored metadata.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Scene API / OpenUSD"
  title="Load a composed stage, not just a bag of meshes."
  description="USDLoader parses supported USDA, USDC, USD, and USDZ scene descriptions into a typed USDStage. References, variants, overrides, transforms, and prim relationships remain available for applications to inspect or hand to a renderer."
  tone="pink"
  meta={['USD / USDA / USDC / USDZ', 'Typed USDStage', 'Composition and references']}
  links={[
    {label: 'Scene module', to: '/docs/modules/scene'},
    {label: 'OpenUSD format', to: '/docs/modules/scene/usd/formats/usd'},
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'}
  ]}
/>

<DocOrientation
  eyebrow="Stage loading"
  title="Keep composition decisions inspectable."
  description="A USD scene can spread authored data across references, variants, and overrides. The loader composes the supported inputs into a stage while leaving the resulting hierarchy and metadata visible to application code."
  tone="pink"
  items={[
    {label: 'Input', value: 'USDA text, the initial USDC crate subset, and stored USDZ assets.'},
    {label: 'Compose', value: 'ASCII references, variants, and overrides; binary support is narrower.'},
    {label: 'Output', value: 'A typed USDStage with a hierarchy of prims.'},
    {label: 'Control', value: 'Bound reference depth and reference loading through options.'}
  ]}
/>

<ReferenceBoundary
  title="USDLoader reference"
  description="The detailed reference covers input formats, composition options, reference resolution, parser entry points, and current limitations."
  tone="pink"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`USDLoader` parses [OpenUSD](/docs/modules/scene/usd/formats/usd) scene descriptions into a typed stage
containing metadata and a hierarchy of prims.

| Property | Value |
| -------- | ----- |
| Extensions | `.usd`, `.usda`, `.usdc`, `.usdz` |
| Input type | `ArrayBuffer` or USDA text |
| Output type | `USDStage` |
| Supported APIs | `load`, `parse` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene/usd';

const stage = await load('scene.usda', USDLoader);
```

The format subpath exports a metadata-only loader. Async core APIs preload the parser automatically.
Applications that need the parser-bearing object can import `USDLoaderWithParser` from
`@loaders.gl/scene/usd-loader`.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `usd.compose` | `boolean` | `true` | Composes references, variants, and overrides. |
| `usd.loadReferences` | `boolean` | `true` | Loads referenced layers during composition. |
| `usd.maxReferenceDepth` | `number` | `12` | Limits recursive composition depth. |
| `usd.variantSelections` | `Record<string, string>` | `{}` | Overrides authored variant selections. |

Relative references require a source URL from `load()` or `core.baseUrl` when parsing in-memory
content.

## Limitations

The same loader returns USDStage for text and binary layers. Binary USDC support
is the crate 0.8.0 subset introduced by [PR #4416](https://github.com/visgl/loaders.gl/pull/4416);
use a version containing that change. See the [USDC encoding reference](../formats/usd.md#binary-usdc-reference)
for supported values and limits. Binary references/payloads, variants, unsupported
crate versions and encodings, and compressed entries in USDZ archives reject.
The composition options above describe the existing ASCII behavior; they do not
enable unsupported binary features.

## Shared output

A stage contains format, optional url, metadata, rootPrims, and layers. Each prim
retains name, path, type, specifier, attributes, metadata, variants, and children.
Attributes contain name, authored type, value, and metadata. Supported USDC values
use this same contract, including asset/path objects and authored time samples.
No mesh construction or renderer object is implied by a prim type such as Mesh.
