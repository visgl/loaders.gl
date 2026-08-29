---
title: KSPLATLoader
description: Parse GaussianSplats3D KSPLAT files into the common Mesh Arrow table shape.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="KSPLAT loader"
  title="Bring KSPLAT data into the common splat pipeline."
  description="`KSPLATLoader` parses GaussianSplats3D `.ksplat` files and maps their packed Gaussian attributes into the Mesh Arrow table shape used by loaders.gl applications."
  tone="violet"
  meta={['KSPLAT', 'GaussianSplats3D', 'Mesh Arrow table']}
  links={[
    {label: 'Splats module', to: '/docs/modules/splats'},
    {label: 'Splat formats', to: '/docs/modules/splats/formats/splats'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="The KSPLAT path"
  title="Decode a viewer-oriented file into renderer-oriented columns."
  description="The loader owns the KSPLAT record layout and exposes a stable table interface, so downstream code can share transforms and rendering adapters with other splat formats."
  tone="violet"
  items={[
    {label: 'Input', value: 'Complete `.ksplat` binary file'},
    {label: 'Decode', value: 'Packed Gaussian positions and attributes'},
    {label: 'Shape', value: 'Mesh Arrow table with splat metadata'},
    {label: 'Limit', value: 'Complete in-memory files; no progressive sections'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`KSPLATLoader` parses GaussianSplats3D `.ksplat` files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

<ReferenceBoundary
  title="KSPLAT layout and output details"
  description="The reference below covers the supported file shape, decoded columns, output metadata, and options."
  tone="violet"
/>

| Property     | Value                 |
| ------------ | --------------------- |
| File format  | [KSPLAT](/docs/modules/splats/formats/splats) |
| Extensions   | `.ksplat`             |
| Worker       | No                    |
| Input type   | `ArrayBuffer`         |
| Output shape | `arrow-table`         |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {KSPLATLoader} from '@loaders.gl/splats';

const table = await load(url, KSPLATLoader);
```

The loader decodes complete in-memory files. It does not expose GaussianSplats3D's progressive section loading API.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
