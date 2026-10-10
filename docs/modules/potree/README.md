---
title: '@loaders.gl/potree'
description: Traverse Potree point clouds from cloud-hosted hierarchy and node resources.
hide_title: true
page_style: designed
---

import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud module"
  title="Traverse Potree clouds without loading the whole octree."
  description="Potree datasets expose a hierarchy and node payloads that can be requested progressively. loaders.gl turns supported Potree layouts into a source and scan shape that applications can use alongside COPC."
  tone="violet"
  meta={['Potree 1.0–1.8 and 2.0', 'Octree traversal', 'Progressive point batches']}
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'Potree source', to: '/docs/modules/potree/api-reference/potree-source-loader'}
  ]}
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
point-cloud CRS support matrix and reprojection roadmap.

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported_versions-2f855a.svg?style=flat-square" alt="Scan supported for compatible Potree versions" />
  </a>
</p>

<PotreeDocsTabs active="overview" />

<DocOrientation
  eyebrow="The Potree path"
  title="Use the hierarchy as the query plan."
  description="Metadata identifies the coordinate system, point attributes, and node layout. Traversal then selects the nodes that match the view or scan request and fetches only their payloads."
  tone="violet"
  items={[
    {label: 'Supported layouts', value: 'Potree 1.0–1.8 and current 2.0 dataset layouts'},
    {label: 'Traversal', value: 'Bounds, levels, spacing, and cancellation'},
    {label: 'Payloads', value: 'Potree binary nodes plus LAS and LAZ records'},
    {label: 'Output', value: 'Point tiles and ordered Arrow point batches'}
  ]}
/>

Support for loading and traversing [potree](http://potree.org/) format point clouds.

<ReferenceBoundary
  title="Potree compatibility details"
  description="The sections below document supported metadata and node layouts, scan behavior, and source-specific limitations."
  tone="violet"
/>

## Format Support

| Dataset version | Read | Write | Layout |
| --- | --- | --- | --- |
| 1.0–1.3 | ✅ | ✅ | Absolute float32 XYZ/RGBA; flat extensionless nodes and inline hierarchy |
| 1.4 | ✅ | ✅ | Quantized node-relative XYZ; flat binary nodes and inline hierarchy |
| 1.5–1.8 | ✅ | ✅ binary | Paged HRC hierarchy; binary, LAS or LAZ node payloads |
| 2.0 | ✅ DEFAULT/BROTLI | ✅ DEFAULT | Three-file range-readable octree from PotreeConverter 2.x |

Use `PotreeSourceLoader` for 1.x and [Potree2SourceLoader](/docs/modules/potree/api-reference/potree2-source-loader)
for 2.0. Converter/viewer release numbers are distinct from dataset versions. See
[Potree writers](/docs/modules/potree/api-reference/potree-writer) for complete typed file collections.

## Scan support

For supported **1.x** Potree versions and layouts, `PotreeNodeSource` exposes the same point-cloud query
shape as COPC. Unsupported versions publish metadata with a reason and do not claim an executor.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | ⚠️ `scan()` for compatible sources | Ordered Arrow point batches |
| Schema, bounds, CRS, and hierarchy | ✅ Supported | Potree metadata and hierarchy files |
| Bounds, minimum/maximum level, target spacing | ✅ Supported | Hierarchy pushdown followed by exact point filtering |
| Attribute predicate | ✅ Supported | Residual after node decoding |
| Projection and global limit | ✅ Supported | Applied in caller column order across all nodes |
| Cancellation and early return | ✅ Supported | Stops hierarchy, payload, and result work |
| Unsupported layouts | ⚠️ Metadata only | Execution metadata contains the concrete reason |

Potree currently decodes complete point records before projection. The capability metadata reports
that distinction so applications do not confuse correct results with selective decoder pushdown.

## Installation

```bash
npm install @loaders.gl/potree
npm install @loaders.gl/core
```

## Usage

For a complete point-cloud source, create a `DataSource` and pass it to the point-cloud tileset
runtime. The source resolves the Potree hierarchy and node payloads as the viewport requests them:

Potree can also be used through the `DataSource` path with the lightweight point-cloud manager:

```ts
import {createDataSource} from '@loaders.gl/core';
import {PointCloudTileset} from '@loaders.gl/tiles';
import {PotreeSourceLoader} from '@loaders.gl/potree';

const dataSource = createDataSource(POTREE_URL, [PotreeSourceLoader], {
  core: {type: 'potree'},
  potree: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## API

This modules provides the following exports:

- `PotreeHierarchyChunkLoader` for the hierarchy indices
- `PotreeSourceLoader` for point-cloud tile sources <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

## Modern sources and authoring

- `Potree2Loader`: metadata-only declaration loader with a parser subpath.
- `Potree2SourceLoader`: lazy native-coordinate range source compatible with `PointCloudTileset`
  and v5 tile-converter traversal. It does not yet implement the query `scan()` API.
- `PotreeWriter`: standard metadata writer.
- `encodePotreeDataset`: complete legacy or modern file collections from decoded Mesh/Arrow rows.

Follow-ups include 2.0 query scans, BROTLI output, out-of-core authoring and application download
examples. Native modern coordinates retain their CRS declaration without automatic projection.

## Attribution

The `PotreeLoader` is a fork of Markus Schuetz' potree code (https://github.com/potree/potree) under BSD-2 clause license.
