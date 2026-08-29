---
title: '@loaders.gl/copc'
description: Read and write Cloud Optimized Point Clouds with range requests, hierarchy selection, and Arrow point tables.
hide_title: true
page_style: designed
---

import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud module"
  title="Read only the points the view needs."
  description="COPC packages a LAS point cloud as a range-readable LAZ file with an octree hierarchy. The module combines hierarchy selection, byte ranges, native TypeScript decoding, and Arrow output for cloud-hosted datasets."
  tone="violet"
  meta={['COPC 1.0', 'Cloud range reads', 'Arrow point tables']}
  links={[
    {label: 'COPC format', to: '/docs/modules/copc/formats/copc'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
current COPC/LAS projection-record support and vertical/compound CRS roadmap.

![copc-logo](../../images/logos/copc-logo-80.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From-v4.1" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

<CopcDocsTabs active="overview" />

<DocOrientation
  eyebrow="The COPC path"
  title="Metadata first. Bytes second."
  description="The hierarchy narrows the request before point records are fetched. Applications can use a tileset source for view-driven loading or the scan contract for bounded, column-selective queries."
  tone="violet"
  items={[
    {label: 'Discover', value: 'Header, VLRs, bounds, CRS, and hierarchy metadata'},
    {label: 'Select', value: 'Spatial nodes, levels of detail, and requested attributes'},
    {label: 'Fetch', value: 'Only the LAZ byte ranges needed for those nodes'},
    {label: 'Return', value: 'Point objects or ordered Arrow point batches'}
  ]}
/>

The `@loaders.gl/copc` module loads and writes the [COPC](/docs/modules/copc/formats/copc) format. Its primary reader is TypeScript-only and performs native COPC hierarchy, byte-range, and LAZ point decoding.

<ReferenceBoundary
  title="COPC module details"
  description="The sections below cover installation, source and writer APIs, compatibility, and the exact point and range behavior."
  tone="violet"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/copc
```

## APIs

| API | Description |
| --- | --- |
| [`COPCSourceLoader`](/docs/modules/copc/api-reference/copc-source-loader) <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> | Loads viewport-selected point data from COPC files through byte ranges. |
| [`COPCWriter`](/docs/modules/copc/api-reference/copc-writer) | Writes Mesh or Mesh Arrow table point clouds as COPC 1.0 data. |

## Attribution

The original module was based on Connor Manning's [copc.js](https://github.com/connormanning/copc.js/) project under the MIT license. The current primary reader is a first-party TypeScript implementation with no `copc` runtime dependency.
