---
title: USDLoader
description: Parse OpenUSD scene descriptions into a typed stage while preserving prim hierarchy, composition, and authored metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Scene API / OpenUSD"
  title="Load a composed stage, not just a bag of meshes."
  description="USDLoader parses USDA, USD, and USDZ scene descriptions into a typed USDStage. References, variants, overrides, transforms, and prim relationships remain available for applications to inspect or hand to a renderer."
  tone="pink"
  meta={['USD / USDA / USDZ', 'Typed USDStage', 'Composition and references']}
  links={[
    {label: 'Scene module', to: '/docs/modules/scene'},
    {label: 'OpenUSD format', to: '/docs/modules/scene/formats/usd'},
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'}
  ]}
/>

<DocOrientation
  eyebrow="Stage loading"
  title="Keep composition decisions inspectable."
  description="A USD scene can spread authored data across references, variants, and overrides. The loader composes the supported inputs into a stage while leaving the resulting hierarchy and metadata visible to application code."
  tone="pink"
  items={[
    {label: 'Input', value: 'USD, USDA text, and uncompressed USDZ assets.'},
    {label: 'Compose', value: 'Resolve references, variants, and authored overrides.'},
    {label: 'Output', value: 'A typed USDStage with a hierarchy of prims.'},
    {label: 'Control', value: 'Bound reference depth and reference loading through options.'}
  ]}
/>

<ReferenceBoundary
  title="USDLoader reference"
  description="The detailed reference covers input formats, composition options, reference resolution, parser entry points, and current limitations."
  tone="pink"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`USDLoader` parses [OpenUSD](/docs/modules/scene/formats/usd) scene descriptions into a typed stage
containing metadata and a hierarchy of prims.

| Property | Value |
| -------- | ----- |
| Extensions | `.usd`, `.usda`, `.usdz` |
| Input type | `ArrayBuffer` or USDA text |
| Output type | `USDStage` |
| Supported APIs | `load`, `parse` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';

const stage = await load('scene.usda', USDLoader);
```

The package root exports a metadata-only loader. Async core APIs preload the parser automatically.
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

Binary USDC crate layers and compressed entries in USDZ archives are rejected with explicit errors.
