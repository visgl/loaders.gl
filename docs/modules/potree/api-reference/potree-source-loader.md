---
title: PotreeSourceLoader
description: Build a progressive point-cloud source from supported Potree hierarchy and node layouts.
hide_title: true
page_style: designed
---

import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Potree source"
  title="Traverse an octree as the view moves."
  description="PotreeSourceLoader turns supported Potree metadata and node payloads into a source that can be traversed progressively. It shares the point-cloud runtime model with COPC while respecting Potree's own layouts."
  tone="violet"
  meta={['Potree 1.4–1.8', 'Octree nodes', 'Progressive loading']}
  links={[
    {label: 'Potree module', to: '/docs/modules/potree'},
    {label: 'COPC source', to: '/docs/modules/copc/api-reference/copc-source-loader'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

<PotreeDocsTabs active="source" />

<DocOrientation
  eyebrow="What this loader does"
  title="Read the hierarchy before the points."
  description="Potree metadata identifies the node structure and attributes. The source uses that information to select relevant nodes and request their payloads progressively."
  tone="violet"
  items={[
    {label: 'Discover', value: 'Cloud metadata, bounds, attributes, and hierarchy'},
    {label: 'Select', value: 'Nodes by bounds, level, spacing, and cancellation'},
    {label: 'Decode', value: 'Potree binary, LAS, and LAZ node payloads'},
    {label: 'Return', value: 'Normalized point tiles and Arrow point batches'}
  ]}
/>

`PotreeSourceLoader` creates a point-cloud tile source for Potree datasets rooted at a `cloud.js` metadata file or dataset directory.

<ReferenceBoundary
  title="Source construction and traversal"
  description="The sections below document source creation, returned tile methods, supported payloads, and compatibility notes."
  tone="violet"
/>

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PotreeSourceLoader} from '@loaders.gl/potree';
import {PointCloudTileset} from '@loaders.gl/tiles';

const dataSource = createDataSource(url, [PotreeSourceLoader], {
  potree: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## Data Source

The created data source exposes the point-cloud tile methods used by `PointCloudTileset`:

- `getMetadata()` returns Potree metadata and an inferred initial view state.
- `getRootTile()` returns the root octree tile header.
- `getChildren(tile)` returns available child tile headers.
- `loadTileContent(tile)` returns normalized point positions, optional colors and normals, point count, and cartographic origin.

## Notes

- See the [Potree module overview](/docs/modules/potree) for the Potree format version support matrix.
- `LAS` and `LAZ` node payloads are loaded through `LASLoader`.
- Binary Potree point attribute payloads are loaded through `PotreeBinLoader`.
