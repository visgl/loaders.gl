Tiles runtime · I3SSource

# Put I3S hierarchy behind the common tiles API.

`I3SSource` implements the `Tileset3DSource` contract for I3S. It handles layer metadata, node pages, resource URLs, authentication, spatial transforms, and elevation placement while `Tileset3D` owns traversal and caching.

[I3S loader](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)[Tileset source contract](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d-source.md)[CRS in I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md)

The source/runtime split

## The source knows I3S. The runtime knows traversal.

This split lets I3S, 3D Tiles, and future tiled formats share request scheduling, culling, refinement, and cache behavior without flattening their format differences.

01

Source

I3S metadata, URLs, tokens, and node resources

02

Hierarchy

Node pages and lazy child headers

03

Spatial

CRS, precision, bounds, and elevation placement

04

Runtime

Tileset3D traversal, culling, and cache management

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The `I3SSource` class implements [`Tileset3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d-source.md) for datasets loaded with the [I3SLoader](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md).

## Usage[​](#usage "Direct link to Usage")

Detailed guide

## I3S source behavior

The detailed reference covers construction, lazy node loading, content requests, spatial transforms, authentication, and source-owned runtime state.

```
import {I3SLoader} from '@loaders.gl/tiles-3d/i3s'

import {I3SSource, Tileset3D} from '@loaders.gl/tiles-3d';



const source = new I3SSource({

  url: 'https://tiles.arcgis.com/.../SceneServer/layers/0',

  loader: I3SLoader

})



const tileset = new Tileset3D(source, {

  spatial: {targetCrs: 'EPSG:3857'}

})

await tileset.tilesetInitializationPromise
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new I3SSource(input, loadOptions?)
```

Parameters:

* `input`

  * `{url, loader, basePath?}` to let the source fetch root metadata itself
  * a preloaded root tileset JSON object for tests or internal callers

* `loadOptions` - loaders.gl options forwarded to metadata, node-header, and content requests

## Format-Specific Behavior[​](#format-specific-behavior "Direct link to Format-Specific Behavior")

`I3SSource` adds the I3S-specific logic that does not belong in `Tileset3D`:

* loads and normalizes root layer metadata
* propagates `i3s.token` into tile and node requests
* creates the I3S traversal implementation
* fetches child tile headers lazily from node pages or `/nodes/{id}`
* assembles tile-loader `_tileOptions` and `_tilesetOptions`
* derives view state from `fullExtent` or `store.extent`
* tracks observed content formats such as Draco, DDS, and KTX2
* applies requested horizontal CRS transforms consistently to vertices, normals, origins, and target-space `spatialBoundingVolume` metadata while retaining WGS84 ECEF traversal bounds
* normalizes source vertical units, offsets, and height references and applies every I3S `elevationInfo` placement mode to content and bounds

Set `Tileset3D`'s `spatial.targetCrs` to request geographic, projected, or WGS84 geocentric output. Common Proj4 definitions work directly; custom definitions and datum grids must be registered before tileset initialization. Ground-relative modes require `spatial.terrainElevationProvider`; `relativeToScene` requires `spatial.sceneElevationProvider`. See [Coordinate reference systems in I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md) and [Vertical Coordinate Systems and Elevation Placement](https://loaders.gl/next/docs/developer-guide/vertical-coordinate-systems.md).

## Key Methods[​](#key-methods "Direct link to Key Methods")

### `initialize()`[​](#initialize "Direct link to initialize")

Loads root metadata if needed and normalizes the source state consumed by `Tileset3D`.

### `loadChildTileHeader(parentTile, childId, frameState)`[​](#loadchildtileheaderparenttile-childid-framestate "Direct link to loadchildtileheaderparenttile-childid-framestate")

Loads child headers on demand using I3S node pages or node resources.

### `loadTileContent(tile)`[​](#loadtilecontenttile "Direct link to loadtilecontenttile")

Loads tile content with the I3S-specific tile and tileset loader options assembled by the source.

### `getTileUrl(tilePath)`[​](#gettileurltilepath "Direct link to gettileurltilepath")

Resolves the final request URL for I3S resources, including propagated authentication tokens.
