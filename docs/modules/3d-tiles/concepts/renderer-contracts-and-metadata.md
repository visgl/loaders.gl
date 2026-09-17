---
title: Renderer contracts and metadata
description: Consume ordered tile content, feature IDs, visibility, and decoded metadata through public renderer-neutral APIs.
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Renderer contracts and metadata

<Tiles3DDocsTabs active="runtime" />

The public `@loaders.gl/tiles` runtime exposes content independently of a renderer. Applications can
enumerate each payload, inspect its bounds and metadata, and distinguish loaded render content from
an external tileset or an unloaded entry. These contracts do not prescribe GPU buffers, draw calls,
styling expressions, or picking. No import from the private `@loaders.gl/deck-layers` package is needed.

## Ordered content and lifecycle

For tiles backed by `Tiles3DSource`, `Tile3D.contentEntries` represents single-content tiles and
explicit or implicit multiple contents in source order. `tile.content` remains the primary payload;
`tile.contents` remains the ordered raw payload array. The additive descriptors do not replace
either legacy field.

These arrays are source-dependent. The current `I3SSource` assigns `tile.content` directly and leaves
both `contents` and `contentEntries` empty after loading. I3S consumers must continue to use
`tile.content`; an empty entries array or `isContentRenderable(index) === false` does not establish
that an I3S tile lacks a loaded payload. Custom sources must supply normalized content headers and
matching load-result payloads, or explicit `TileContentLoadResult.contentEntries`, to participate in
the descriptor contract. The example below is for a `Tiles3DSource` tile.

```typescript
import type {Tile3D} from '@loaders.gl/tiles';

function inspectTile(tile: Tile3D) {
  for (const entry of tile.contentEntries) {
    console.log(entry.index, entry.uri, entry.metadata, entry.featureIds);
    if (!tile.isContentRenderable(entry.index)) continue;
    // Pass entry.payload to a consumer that understands this payload type.
    console.log(entry.payload, entry.boundingVolume);
  }
}
```

`getContentEntry(index)` returns a descriptor or `null`. Inspect descriptors before loading, after
failure, and after unloading, but do not infer renderability from their presence. Unloading clears
payloads and marks entries non-renderable; descriptors and retained declarations are not evidence
that decoded arrays or renderer resources are still usable. Re-read entries after a lifecycle update
rather than holding an old descriptor object indefinitely.

### `Tile3DContent`

This public type is exported by `@loaders.gl/tiles`.

| Field | Meaning |
| --- | --- |
| `index` | Zero-based position in the ordered content list. |
| `uri`, `type` | Optional resource reference and content-type hint. |
| `group` | Optional index into tileset groups; different contents may belong to different groups. |
| `payload` | Loaded payload, or `null` before loading/after unloading. Narrow the payload type before inspecting format-specific fields. |
| `metadata` | Raw content metadata reference, or `null`; not a decoded property-table row. |
| `boundingVolume` | Transformed content volume, falling back to the transformed tile volume. |
| `featureIds` | Feature-ID declarations found in supported payloads. |
| `renderable` | Whether this entry currently has render content; nested tileset payloads are not renderable entries. |

`renderable` does not mean visible, selected, or uploaded to a GPU. Use selection state and render
visibility separately. Mixed mesh/splat payloads can share a tile; Gaussian and voxel primitive
descriptors are attached to the parsed **payload**, not directly to `Tile3DContent`.

## Traversal versus render visibility

Traversal uses the tile bounding volume to decide whether descendants matter. Render culling uses
each content's transformed volume, or the tile volume when no explicit content volume exists.

- `tile.contentVisibility(frameState)` classifies the union of content volumes.
- `tile.contentVisibility(frameState, entry.index)` classifies one valid content index.
- Optional world-space clipping planes affect these render classifications, not hierarchy traversal.
- Viewer request volumes independently gate request eligibility.

Visibility does not load content or choose a renderer's clipping technique. See the
[`Tile3D` methods](../../tiles/api-reference/tile-3d#methods) and
[correctness guide](./correctness-and-conformance).

## Feature IDs are declarations, not picking

The public `Tile3DFeatureIdSet` type identifies an attribute, property table, constant, texture, or
implicit source. Optional fields include `attribute`, `propertyTable`, `constant`, `texture`,
`implicit`, `values`, and `details`. `details` preserves the original declaration; `values` is present
only where values are available. `tile.featureIdSets` aggregates the entries' declarations.

An attribute declaration does not guarantee a decoded ID array. A texture declaration does not
sample that texture. A property-table reference does not automatically join a feature to a row.
Applications choose a feature ID and the corresponding property table, then use the metadata helpers.
This separation retains `EXT_mesh_features` associations without inventing a picking or coloring policy.

## Raw context versus decoded properties

`Tile3DMetadataContext`, exported by `@loaders.gl/tiles`, exposes raw references:

| Scope | Runtime field |
| --- | --- |
| Tileset entity | `tile.metadataContext.tileset` |
| Primary content's group / all groups | `tile.metadataContext.group` / `.groups` |
| Tile entity | `tile.metadataContext.tile` |
| Primary content entity | `tile.metadataContext.content` |
| Implicit subtree metadata | `tile.metadataContext.subtree` |
| Any particular content entity | `entry.metadata`, with its group selected by `entry.group` |

Raw references preserve schema links and unsupported fields. They are not a promise that every
property encoding is decoded. With `gltf.loadBuffers: true`, glTF structural-metadata parsing decodes
supported property-table columns: numeric scalars/vectors/matrices, booleans, strings, enums, and
fixed/variable arrays. Numeric normalization, scale, and offset are applied while raw values remain
available for `noData` comparison. Property-texture sampling is a separate concern.

`getStructuralMetadataRow(propertyTable, schemaClass, rowIndex)` and
`getStructuralMetadataProperty(...)`, exported by `@loaders.gl/3d-tiles`, read these decoded tables.
Rows apply class defaults and `noData` semantics; they do not fetch missing buffers. An out-of-range
row returns `null`. JSON batch-table hierarchy access is also supported; binary hierarchy property
access remains unsupported.

## Renderer-neutral style inputs

`createTile3DStyleInput` combines a chosen content entry with its metadata context and an optional
feature/batch-table selection. Its property precedence is tileset → group → tile → content → batch;
later scopes override earlier ones. The chosen entry's group takes precedence over the primary
content's group. Subtree references remain available but are not another property-merge layer.

See [styling and feature access](./styling-and-feature-access) for complete examples, source
diagnostics, and structural-metadata row lookup. This API prepares property values; it does not
evaluate a styling language or automatically connect all property tables to features.

## Related guides

- [Gaussian, vector, and voxel descriptors](./gaussian-vector-voxel-extensions)
- [Format compatibility matrix](../formats/3d-tiles)
- [Runtime observability](./observability-and-benchmarks)
- [`Tile3D`](../../tiles/api-reference/tile-3d) and [`Tileset3D`](../../tiles/api-reference/tileset-3d)
