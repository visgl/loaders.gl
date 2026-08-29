---
title: '@loaders.gl/las'
description: Read and write LAS and LAZ point clouds with typed records, streaming, and Arrow output.
hide_title: true
page_style: designed
---

import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud module"
  title="Keep the point record, or keep the columns."
  description="The LAS module reads and writes the established LAS/LAZ exchange formats, including the modern point-record fields that matter for lidar workflows. Choose raw records, a render-ready point cloud, or a typed Mesh Arrow table."
  tone="blue"
  meta={['LAS 1.0–1.5', 'LAZ point formats 0–10', 'TypeScript reader']}
  links={[
    {label: 'LAS / LAZ format', to: '/docs/modules/las/formats/las'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<LasDocsTabs active="overview" />

![las-logo](../../images/logos/las-logo.svg)

<DocOrientation
  eyebrow="The LAS path"
  title="Decode the fields your workflow actually uses."
  description="LAS and LAZ carry more than positions. loaders.gl exposes standard attributes, flags, colors, time, waveform references, and Extra Bytes while allowing applications to choose the output shape."
  tone="blue"
  items={[
    {label: 'Geometry', value: 'Scaled positions with source offsets and bounds'},
    {label: 'Attributes', value: 'Classification, returns, color, time, NIR, and waveform data'},
    {label: 'Columnar path', value: "Use shape: 'arrow-table' and select columns"},
    {label: 'Write back', value: 'Encode Mesh or Mesh Arrow tables as LAS or LAZ'}
  ]}
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
current LAS/LAZ projection-record support and vertical/compound CRS roadmap.

The `@loaders.gl/las` module supports the [LAS file format](/docs/modules/las/formats/las) and its compressed version (LAZ).

<ReferenceBoundary
  title="LAS implementation details"
  description="The sections below cover installation, loaders and writers, point-record support, and current compatibility limits."
  tone="blue"
/>

`LASLoader` supports LAZ point formats 0-10 for documented LASzip codec combinations. Arrow output exposes positions, intensity, classification, RGB, GPS time, NIR, waveform references, and Extra Bytes where present, while the raw APIs preserve complete supported point records. Waveform helpers range-read internal LAS or external WDP sample packets on demand. See the [LAS/LAZ implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for exact codec, point-format, fixture, and streaming details.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/las
```

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`LASLoader`](/docs/modules/las/api-reference/las-loader)      | Loads LAS/LAZ point clouds as Mesh objects or [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`LASWriter`](/docs/modules/las/api-reference/las-writer)      | Writes Mesh or Mesh Arrow table point clouds as LAS or LAZ data. |

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
