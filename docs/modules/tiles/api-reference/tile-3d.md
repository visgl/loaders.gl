---
title: Tile3D
description: Inspect the runtime state of one tile during 3D Tiles traversal, loading, selection, and cache management.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles API / runtime tile"
  title="One tile, all the state traversal needs."
  description="Tile3D is the runtime record used by Tileset3D. It connects source headers to transformed volumes, content state, level-of-detail measurements, selection, and lazy-child lifecycle."
  tone="violet"
  meta={['Internal runtime record', 'Volumes and LOD', 'Content lifecycle']}
  links={[
    {label: 'Tiles runtime', to: '/docs/modules/tiles'},
    {label: 'Tileset3D', to: '/docs/modules/tiles/api-reference/tileset-3d'},
    {label: '3D Tiles runtime', to: '/docs/modules/3d-tiles/concepts'}
  ]}
/>

<DocOrientation
  eyebrow="Per-tile state"
  title="Separate hierarchy, content, and visibility."
  description="A tile's source header describes the hierarchy, while the runtime tracks transformed bounds, render content, request eligibility, and whether lazy children are known. Keeping those states distinct prevents traversal and rendering decisions from leaking into one another."
  tone="violet"
  items={[
    {label: 'Geometry', value: 'Bounding volumes and geometric error after transforms.'},
    {label: 'Traversal', value: 'Children, refinement mode, visibility, and request eligibility.'},
    {label: 'Content', value: 'Payload state, content bounds, selection, and load lifecycle.'},
    {label: 'Diagnostics', value: 'LOD metrics, priorities, cache state, and lazy-subtree status.'}
  ]}
/>

<ReferenceBoundary
  title="Tile3D reference"
  description="The detailed reference lists construction, properties, visibility helpers, content state, priorities, and lifecycle behavior used by the tiles runtime."
  tone="violet"
/>

## Constructor

```typescript
new Tile3D(tileset, header, parentHeader);
```

Parameters:

- `tileset` (Tileset3D) - `Tileset3D` instance which contains this tile
- `header` (Object) - Source metadata for this tile
- `parentHeader` (Object) - Source metadata for the parent tile

#### Properties

###### `childrenState` (String)

For a lazy implicit subtree root, reports `unloaded`, `loading`, `ready`, or `failed`. Explicit tiles begin in `ready` because their child headers are already known.

###### `hasUnloadedChildren` (Boolean)

Returns `true` when traversal may request a source-managed lazy child-header group. This is distinct from unloaded content: subtree metadata establishes hierarchy, while content requests load renderable payloads.

###### `boundingVolume` (BoundingVolume)

A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))

###### `contentBoundingVolumes` (BoundingVolume[])

The transformed render-content bounding volumes, one for each content entry. Entries without an explicit content volume use the tile's transformed `boundingVolume` at the same index. These volumes are used for render culling; hierarchy traversal continues to use the tile's `boundingVolume`.

###### `contentVisibility(frameState)`

Returns the render-content visibility classification after culling against the viewport and any optional world-space clipping planes. Clipping planes affect rendering only; hierarchy traversal continues to use the tile bounding volume.

###### `viewerRequestVolume` (BoundingVolume | null)

The transformed volume that limits when this tile may be requested. It is `null` when the tile does not declare a viewer request volume. This volume affects traversal/request eligibility, not render-content culling.

###### `id` (Number`|`String)

A unique number for the tile in the tileset. Default to the url of the tile.

###### `contentState` (String)

Indicate of the tile content state. Available options

- `UNLOADED`: Has never been requested or has been destroyed.
- `LOADING`: Is waiting on a pending request.
- `PROCESSING`: Contents are being processed for rendering. Depending on the content, it might make its own requests for external data.
- `READY`: All the resources are loaded and decoded.
- `FAILED`: Request failed.

###### `contentType` (String)

One of

- `empty`: does not have any content to render
- `render`: has content to render
- `tileset`: tileset tile

##### `_selectionDepth` (Number)

The depth of the tile in the traversal tree.

###### `content` (Object)

The tile's content. This represents the actual tile's payload.

###### `type` (String)

One of `scenegraph`, `pointcloud`, `mesh`

###### `parent` (Tile3D)

Parent of this tile.

###### `refine` (String)

Specifies the type of refine that is used when traversing this tile for rendering. [`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#refinement)

- `ADD`: high-resolution children tiles should be rendered in addition to lower-resolution parent tiles when level of details of parent tiles are not sufficient for current view.
- `REPLACEMENT`: high-resolution children tiles should replace parent tiles when lower-resolution parent tiles are not sufficient for current view.

###### `selected` (Boolean)

Whether this tile is selected for rendering in the current update frame and viewport. A selected
tile has its content loaded and satisfies the current viewport requirements.

###### `distanceToCamera` (Number)

Distance from the tile's bounding volume center to the camera

###### `screenSpaceError` (Number)

Screen space error for LOD selection

###### `tileset` (Tileset3D)

The `Tileset3D` instance containing this tile.

###### `header` (Object)

The unprocessed tile header object passed in.

#### Methods

##### `destroy()`

Destroys the tile node, including its metadata, and unloads its content.

##### `loadContent()`

Loads the tile content.

##### `unloadContent()`

Unloads the tile content.
