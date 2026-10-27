---
title: OpenUSD format
description: A scene description format for hierarchical composition, references, payloads, and variants.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Hierarchical scene format"
  title="Compose a scene without flattening it first."
  description="OpenUSD describes scenes as composed layers and prims. The initial loaders.gl implementation reads a useful, explicit subset so applications can inspect the stage and retain source relationships."
  tone="pink"
  meta={['USDA / USD', 'USDZ', 'References and variants']}
  links={[
    {label: 'Scene module', to: '/docs/modules/scene'},
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'}
  ]}
/>

<ThreeDDataFormatsGraphic />

<DocOrientation
  eyebrow="Composition is the format"
  title="Keep layers, payloads, and authored values visible."
  description="OpenUSD is useful when the relationships between scene elements matter. loaders.gl exposes those relationships in a typed stage representation rather than reducing the file to a flat mesh."
  tone="pink"
  items={[
    {label: 'Reads', value: 'ASCII USDA/USD layers and uncompressed USDZ'},
    {label: 'Preserves', value: 'Prim hierarchy, references, payloads, variants, and overrides'},
    {label: 'Output', value: 'Typed stage and prim data for application-specific use'},
    {label: 'Boundary', value: 'Binary USDC, compressed ZIP entries, and full composition remain future work'}
  ]}
/>

[OpenUSD](https://openusd.org/release/index.html) describes hierarchical 3D scenes in text and
binary layer formats. The initial loaders.gl implementation supports:

<ReferenceBoundary
  title="OpenUSD support details"
  description="The sections below list the supported layers and the explicit boundaries of the current implementation."
  tone="pink"
/>

- ASCII `.usda` layers and ASCII content stored with a `.usd` extension
- Uncompressed `.usdz` ZIP archives whose root layer is ASCII
- External and packaged references, payloads, authored variants, and local overrides

Binary USDC crate layers, compressed ZIP entries, and the complete OpenUSD composition semantics
are not yet supported.
