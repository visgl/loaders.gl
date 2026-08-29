---
title: I3SSource
description: Adapt I3S layers to the shared tileset traversal runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles runtime · I3SSource"
  title="Put I3S hierarchy behind the common tiles API."
  description="`I3SSource` implements the `Tileset3DSource` contract for I3S. It handles layer metadata, node pages, resource URLs, authentication, spatial transforms, and elevation placement while `Tileset3D` owns traversal and caching."
  tone="orange"
  meta={['I3S source', 'Tileset3D', 'Lazy node loading']}
  links={[
    {label: 'I3S loader', to: '/docs/modules/i3s/api-reference/i3s-loader'},
    {label: 'Tileset source contract', to: '/docs/modules/tiles/api-reference/tileset-3d-source'},
    {label: 'CRS in I3S', to: '/docs/modules/i3s/concepts/coordinate-reference-systems'}
  ]}
/>

<DocOrientation
  eyebrow="The source/runtime split"
  title="The source knows I3S. The runtime knows traversal."
  description="This split lets I3S, 3D Tiles, and future tiled formats share request scheduling, culling, refinement, and cache behavior without flattening their format differences."
  tone="orange"
  items={[
    {label: 'Source', value: 'I3S metadata, URLs, tokens, and node resources'},
    {label: 'Hierarchy', value: 'Node pages and lazy child headers'},
    {label: 'Spatial', value: 'CRS, precision, bounds, and elevation placement'},
    {label: 'Runtime', value: 'Tileset3D traversal, culling, and cache management'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The `I3SSource` class implements [`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source) for datasets loaded with the [I3SLoader](/docs/modules/i3s/api-reference/i3s-loader).

## Usage

<ReferenceBoundary
  title="I3S source behavior"
  description="The detailed reference covers construction, lazy node loading, content requests, spatial transforms, authentication, and source-owned runtime state."
  tone="orange"
/>

```ts
import {I3SLoader} from '@loaders.gl/i3s'
import {I3SSource, Tileset3D} from '@loaders.gl/tiles'

const source = new I3SSource({
  url: 'https://tiles.arcgis.com/.../SceneServer/layers/0',
  loader: I3SLoader
})

const tileset = new Tileset3D(source, {
  spatial: {targetCrs: 'EPSG:3857'}
})
await tileset.tilesetInitializationPromise
```

## Constructor

```ts
new I3SSource(input, loadOptions?)
```

Parameters:

- `input`
  - `{url, loader, basePath?}` to let the source fetch root metadata itself
  - a preloaded root tileset JSON object for tests or internal callers
- `loadOptions` - loaders.gl options forwarded to metadata, node-header, and content requests

## Format-Specific Behavior

`I3SSource` adds the I3S-specific logic that does not belong in `Tileset3D`:

- loads and normalizes root layer metadata
- propagates `i3s.token` into tile and node requests
- creates the I3S traversal implementation
- fetches child tile headers lazily from node pages or `/nodes/{id}`
- assembles tile-loader `_tileOptions` and `_tilesetOptions`
- derives view state from `fullExtent` or `store.extent`
- tracks observed content formats such as Draco, DDS, and KTX2
- applies requested horizontal CRS transforms consistently to vertices, normals, origins, and
  target-space `spatialBoundingVolume` metadata while retaining WGS84 ECEF traversal bounds
- normalizes source vertical units, offsets, and height references and applies every I3S
  `elevationInfo` placement mode to content and bounds

Set `Tileset3D`'s `spatial.targetCrs` to request geographic, projected, or WGS84 geocentric output.
Common Proj4 definitions work directly; custom definitions and datum grids must be registered
before tileset initialization. Ground-relative modes require `spatial.terrainElevationProvider`;
`relativeToScene` requires `spatial.sceneElevationProvider`. See [Coordinate reference systems in
I3S](/docs/modules/i3s/concepts/coordinate-reference-systems) and [Vertical Coordinate Systems and
Elevation Placement](/docs/developer-guide/vertical-coordinate-systems).

## Key Methods

### `initialize()`

Loads root metadata if needed and normalizes the source state consumed by `Tileset3D`.

### `loadChildTileHeader(parentTile, childId, frameState)`

Loads child headers on demand using I3S node pages or node resources.

### `loadTileContent(tile)`

Loads tile content with the I3S-specific tile and tileset loader options assembled by the source.

### `getTileUrl(tilePath)`

Resolves the final request URL for I3S resources, including propagated authentication tokens.
