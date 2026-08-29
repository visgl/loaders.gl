---
title: '@loaders.gl/scene'
description: Load framework-independent OpenUSD scene descriptions and preserve their hierarchy.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Scene module"
  title="Keep scene composition available to the application."
  description="The scene module provides a framework-independent entry point for hierarchical OpenUSD data. It preserves the source relationships so applications can inspect, convert, or render the stage as needed."
  tone="pink"
  meta={['OpenUSD', 'Scene hierarchy', 'Framework-independent']}
  links={[
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'},
    {label: 'OpenUSD format', to: '/docs/modules/scene/formats/usd'}
  ]}
/>

<DocOrientation
  eyebrow="Scene data"
  title="Decode relationships, not just geometry."
  description="Scene descriptions connect prims, transforms, materials, payloads, and variants. Keeping those relationships intact gives downstream tools room to make their own rendering and conversion decisions."
  tone="pink"
  items={[
    {label: 'Source', value: 'ASCII USDA/USD layers and uncompressed USDZ'},
    {label: 'Preserves', value: 'Prim hierarchy, authored properties, references, and variants'},
    {label: 'Output', value: 'Typed USD stage and prim representations'},
    {label: 'Status', value: 'Experimental module with explicit format boundaries'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/scene` module loads framework-independent scene descriptions.

<ReferenceBoundary
  title="Scene module details"
  description="The sections below cover installation, supported scene formats, and the current composition boundaries."
  tone="pink"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/scene
```

## Loaders

| Loader | Description |
| ------ | ----------- |
| [`USDLoader`](/docs/modules/scene/api-reference/usd-loader) | Loads OpenUSD ASCII layers and uncompressed USDZ archives. |
