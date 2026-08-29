---
title: SPLATLoader
description: Parse raw Gaussian splat files into the common Mesh Arrow table shape.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Gaussian splat loader"
  title="Turn splat points into a common table."
  description="`SPLATLoader` reads the compact `.splat` representation used by Gaussian splat viewers and returns the Mesh Arrow table shape used by loaders.gl applications and rendering layers."
  tone="violet"
  meta={['Gaussian splats', 'Mesh Arrow table', 'Browser-ready parsing']}
  links={[
    {label: 'Splats module', to: '/docs/modules/splats'},
    {label: 'Splat formats', to: '/docs/modules/splats/formats/splats'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="The splat path"
  title="Read packed attributes. Preserve the renderer-facing columns."
  description="The loader converts position, color, opacity, scale, and rotation attributes into typed columns without requiring applications to understand the binary record layout."
  tone="violet"
  items={[
    {label: 'Input', value: 'Raw `.splat` binary data'},
    {label: 'Decode', value: 'Positions, colors, opacity, scales, and rotations'},
    {label: 'Shape', value: 'Mesh Arrow table with Gaussian splat metadata'},
    {label: 'Next step', value: 'Pass the table to a splat renderer or transform'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`SPLATLoader` parses raw `.splat` Gaussian splat files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

<ReferenceBoundary
  title="Binary layout and output details"
  description="The reference below covers supported fields, output columns, options, and the relationship between the compact file and the common Mesh Arrow representation."
  tone="violet"
/>

| Property     | Value                 |
| ------------ | --------------------- |
| File format  | [SPLAT](/docs/modules/splats/formats/splats) |
| Extensions   | `.splat`              |
| Worker       | No                    |
| Input type   | `ArrayBuffer`         |
| Output shape | `arrow-table`         |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {SPLATLoader} from '@loaders.gl/splats';

const table = await load(url, SPLATLoader);
```

The returned table uses GraphDECO-style Gaussian splat columns and can be passed to `SplatLayer`.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
