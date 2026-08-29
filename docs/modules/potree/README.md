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
  meta={['Potree 1.4–1.8', 'Octree traversal', 'Progressive point batches']}
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
    {label: 'Supported layouts', value: 'Potree 1.4 through 1.8 node and hierarchy variants'},
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

| Potree format version | Supported | Notes |
| --- | --- | --- |
| 1.0 - 1.3 | ❌ | Older metadata and node layouts are not supported by `PotreeSourceLoader`. |
| 1.4 | ✅ | Supports inline `cloud.js` hierarchy metadata and flat `octreeDir/r*.bin` node payloads. |
| 1.5 - 1.6 | ✅ | Supports Potree 1.x binary node payloads with `POSITION_CARTESIAN` attributes. |
| 1.7 | ✅ | Supports hierarchy chunk files and nested `octreeDir/r/r*.bin` node payloads. |
| 1.8 | ✅ | Supports hierarchy chunk files and `LAS`, `LAZ`, or Potree binary point payloads. |
| 2.x | ❌ | Potree 2.x metadata and octree layouts are not supported. |

## Scan support

For supported Potree versions and layouts, `PotreeNodeSource` exposes the same point-cloud query
shape as COPC. Unsupported versions publish metadata with a reason and do not claim an executor.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `scan()` for compatible sources | Ordered Arrow point batches |
| Schema, bounds, CRS, and hierarchy | Supported | Potree metadata and hierarchy files |
| Bounds, minimum/maximum level, target spacing | Supported | Hierarchy pushdown followed by exact point filtering |
| Attribute predicate | Supported | Residual after node decoding |
| Projection and global limit | Supported | Applied in caller column order across all nodes |
| Cancellation and early return | Supported | Stops hierarchy, payload, and result work |
| Unsupported layouts | Metadata only | Execution metadata contains the concrete reason |

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

## Roadmap

The plan is to provide the following loaders/writers:

- `PotreeLoader` for individual tiles

`PotreeLoader` is intended to work with the 3d tileset classes in the `@loaders.gl/3d-tiles` module.

- `Tileset3D` class will be generalized to accept loaded potree tilesets.

## Attribution

The `PotreeLoader` is a fork of Markus Schuetz' potree code (https://github.com/potree/potree) under BSD-2 clause license.
