Tiles API / runtime tile

# One tile, all the state traversal needs.

Tile3D is the runtime record used by Tileset3D. It connects source headers to transformed volumes, content state, level-of-detail measurements, selection, and lazy-child lifecycle.

[Tiles runtime](https://loaders.gl/next/docs/modules/tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles.md)[Tileset3D](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)[3D Tiles runtime](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)

Per-tile state

## Separate hierarchy, content, and visibility.

A tile's source header describes the hierarchy, while the runtime tracks transformed bounds, render content, request eligibility, and whether lazy children are known. Keeping those states distinct prevents traversal and rendering decisions from leaking into one another.

01

Geometry

Bounding volumes and geometric error after transforms.

02

Traversal

Children, refinement mode, visibility, and request eligibility.

03

Content

Payload state, content bounds, selection, and load lifecycle.

04

Diagnostics

LOD metrics, priorities, cache state, and lazy-subtree status.

Detailed guide

## Tile3D reference

The detailed reference lists construction, properties, visibility helpers, content state, priorities, and lifecycle behavior used by the tiles runtime.

## Constructor[​](#constructor "Direct link to Constructor")

```
new Tile3D(tileset, header, parentHeader);
```

Parameters:

* `tileset` (Tileset3D) - `Tileset3D` instance which contains this tile
* `header` (Object) - Source metadata for this tile
* `parentHeader` (Tile3D, optional) - Parent runtime tile; omitted for the root

## Properties[​](#properties "Direct link to Properties")

### `childrenState` (String)[​](#childrenstate-string "Direct link to childrenstate-string")

For a lazy implicit subtree root, reports `unloaded`, `loading`, `ready`, or `failed`. Explicit tiles begin in `ready` because their child headers are already known.

### `hasUnloadedChildren` (Boolean)[​](#hasunloadedchildren-boolean "Direct link to hasunloadedchildren-boolean")

Returns `true` when traversal may request a source-managed lazy child-header group. This is distinct from unloaded content: subtree metadata establishes hierarchy, while content requests load renderable payloads.

### `boundingVolume` (BoundingVolume)[​](#boundingvolume-boundingvolume "Direct link to boundingvolume-boundingvolume")

The transformed runtime volume used for hierarchy traversal, not the source JSON `box`, `region`, or `sphere` declaration. Content bounds may be tighter; they do not replace this traversal volume.

### `contentBoundingVolumes` (BoundingVolume\[])[​](#contentboundingvolumes-boundingvolume "Direct link to contentboundingvolumes-boundingvolume")

The transformed render-content bounding volumes, one for each content entry. Entries without an explicit content volume use the tile's transformed `boundingVolume` at the same index. These volumes are used for render culling; hierarchy traversal continues to use the tile's `boundingVolume`.

### `viewerRequestVolume` (BoundingVolume | null)[​](#viewerrequestvolume-boundingvolume--null "Direct link to viewerrequestvolume-boundingvolume--null")

The transformed volume that limits when this tile may be requested. It is `null` when the tile does not declare a viewer request volume. This volume affects traversal/request eligibility, not render-content culling.

### `id` (Number`|`String)[​](#id-numberstring "Direct link to id-numberstring")

A unique number for the tile in the tileset. Default to the url of the tile.

### `contentState` (Number)[​](#contentstate-number "Direct link to contentstate-number")

Numeric runtime content state (`TILE_CONTENT_STATE`):

* `UNLOADED` (0): Has never been requested or has been unloaded.
* `LOADING` (1): Is waiting on a pending request.
* `PROCESSING` (2): Contents are being processed and may request external data.
* `READY` (3): Content loading has completed; inspect individual entries for renderability.
* `EXPIRED` (4): Expired content is awaiting replacement.
* `FAILED` (5): Request failed.

### `contentType` (String)[​](#contenttype-string "Direct link to contenttype-string")

One of

* `empty`: does not have any content to render
* `render`: has content to render
* `tileset`: tileset tile

### `_selectionDepth` (Number)[​](#_selectiondepth-number "Direct link to _selectiondepth-number")

The depth of the tile in the traversal tree.

### `content` (Object)[​](#content-object "Direct link to content-object")

The tile's content. This represents the actual tile's payload.

### `contents` (unknown\[])[​](#contents-unknown "Direct link to contents-unknown")

The ordered raw payload array populated by `Tiles3DSource` through its content-load result. `content` remains the primary payload for backward compatibility. The current `I3SSource` sets `content` directly and leaves `contents` empty, even after loading; I3S consumers should use `content`. Custom sources must return `TileContentLoadResult.contents` to populate this array.

### `contentUrls` (String\[])[​](#contenturls-string "Direct link to contenturls-string")

Ordered content resource URLs resolved from the normalized header.

### `contentEntries` (Tile3DContent\[])[​](#contententries-tile3dcontent "Direct link to contententries-tile3dcontent")

For `Tiles3DSource` tiles, ordered renderer-neutral descriptors with `index`, optional `uri`, `type`, and `group`, plus `payload`, `metadata`, `boundingVolume`, `featureIds`, and `renderable`. Entries exist before their payloads load; nested tileset content is not reported as renderable. Re-read entries after lifecycle updates. See the [contract fields](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/renderer-contracts-and-metadata.md#tile3dcontent).

This is source-dependent, not a universal contract for every `Tile3D`. The current `I3SSource` leaves `contentEntries` empty. Custom sources need normalized `header.content` descriptors with matching ordered load-result payloads, or explicit `TileContentLoadResult.contentEntries`.

### `metadataContext` (Tile3DMetadataContext)[​](#metadatacontext-tile3dmetadatacontext "Direct link to metadatacontext-tile3dmetadatacontext")

Raw tileset, group, tile, primary-content, and subtree metadata references, plus the optional groups array. For another content entry, inspect its `metadata` and `group`. This context is not a decoded property-table row; see [raw versus decoded metadata](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/renderer-contracts-and-metadata.md#raw-context-versus-decoded-properties).

### `featureIdSets` (Tile3DFeatureIdSet\[])[​](#featureidsets-tile3dfeatureidset "Direct link to featureidsets-tile3dfeatureidset")

Feature-ID declarations aggregated from content entries. Attribute, property-table, constant, texture, and implicit sources are represented without implementing picking or sampling textures. Retained declarations alone do not imply that a payload is currently loaded.

### `type` (String)[​](#type-string "Direct link to type-string")

One of `scenegraph`, `pointcloud`, `mesh`

### `parent` (Tile3D)[​](#parent-tile3d "Direct link to parent-tile3d")

Parent of this tile.

### `refine` (TILE\_REFINEMENT)[​](#refine-tile_refinement "Direct link to refine-tile_refinement")

Specifies the type of refine that is used when traversing this tile for rendering. [`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#refinement)

* `ADD` (1): high-resolution children render in addition to lower-resolution parents when the parent does not meet the current LOD target.
* `REPLACE` (2): high-resolution children replace parents once the required coverage is ready.

### `selected` (Boolean)[​](#selected-boolean "Direct link to selected-boolean")

Whether this tile is selected for rendering in the current update frame and viewport. A selected tile has its content loaded and satisfies the current viewport requirements.

### `distanceToCamera` (Number)[​](#distancetocamera-number "Direct link to distancetocamera-number")

Potentially approximate distance in meters from the closest point of the tile bounding volume to the camera, or zero when the camera is inside the volume.

### `screenSpaceError` (Number)[​](#screenspaceerror-number "Direct link to screenspaceerror-number")

Calculated error in logical/CSS pixels used for LOD selection. See [screen-space error and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md).

### `lodMetricValue` (Number)[​](#lodmetricvalue-number "Direct link to lodmetricvalue-number")

The runtime LOD metric: composed-transform-scaled geometric error for 3D Tiles 1.x, unscaled draft 2.0 error, or the unchanged I3S screen-threshold metric. Do not interpret every format's metric as meters.

### `tileset` (Tileset3D)[​](#tileset-tileset3d "Direct link to tileset-tileset3d")

The `Tileset3D` instance containing this tile.

### `header` (Object)[​](#header-object "Direct link to header-object")

The unprocessed tile header object passed in.

## Methods[​](#methods "Direct link to Methods")

### `getContentEntry(index)`[​](#getcontententryindex "Direct link to getcontententryindex")

Returns the ordered `Tile3DContent` descriptor, or `null` when the index is out of range. Sources that do not populate `contentEntries`, including the current `I3SSource`, always return `null`.

### `isContentRenderable(index)`[​](#iscontentrenderableindex "Direct link to iscontentrenderableindex")

Returns whether the entry currently has render content. Unloaded, failed, empty, and nested tileset content are not renderable. This does not imply selection, visibility, or GPU readiness. It also returns `false` when no entry exists: do not use it to classify I3S payloads, which remain available through `content` without entries.

### `contentVisibility(frameState, contentIndex?)`[​](#contentvisibilityframestate-contentindex "Direct link to contentvisibilityframestate-contentindex")

Returns `'outside'`, `'intersecting'`, or `'inside'` after render-content frustum and optional world-space clipping-plane checks. Omit `contentIndex` for the union of content volumes, or pass a valid entry index for one content. Missing explicit content bounds fall back to the tile volume. Clipping affects render visibility only; hierarchy traversal continues to use the tile volume.

### `insideViewerRequestVolume(frameState)`[​](#insideviewerrequestvolumeframestate "Direct link to insideviewerrequestvolumeframestate")

Returns whether the camera is inside the transformed request volume. Returns `true` if no request volume is declared. Request gating is separate from content visibility.

### `destroy()`[​](#destroy "Direct link to destroy")

Destroys the tile node, including its metadata, and unloads its content.

### `loadContent()`[​](#loadcontent "Direct link to loadcontent")

Loads the tile content.

### `unloadContent()`[​](#unloadcontent "Direct link to unloadcontent")

Unloads the tile content.

Clears `content`, `contents`, and descriptor payloads and marks entries non-renderable. Do not use retained feature declarations as a substitute for a fresh renderability check after unload/reload.
