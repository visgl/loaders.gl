# 3D Tiles renderer contracts

The tiles runtime exposes normalized, renderer-neutral descriptors. These contracts preserve parsed
content and metadata without selecting a styling language or GPU representation.

## Tile3DContent

A Tile3DContent entry is ordered by its zero-based index. payload is null until content is
loaded or after unload. boundingVolume is transformed into world space and falls back to the tile
volume when the content has no tighter volume. renderable is false for unloaded, failed, empty,
or nested-tileset content.

## Tile3DFeatureIdSet

Feature identifiers are described as attribute, property-table, constant, texture-backed, or implicit sources. The
runtime preserves declarations and optional decoded values; it does not evaluate styles or perform
picking. Unsupported extension forms remain available in raw payload metadata.

## Tile3DMetadataContext

Metadata context contains raw tileset, group, tile, content, and implicit-subtree references. Values
are intentionally not decoded from binary property tables in this contract.

## Tile3DRenderContract

DEFAULT_TILE_3D_RENDER_CONTRACT is a pure adapter exported by @loaders.gl/deck-layers:

- getContentEntries(tile) returns ordered content descriptors.
- getFeatureIds(content) returns normalized feature-ID declarations.
- getMetadata(tile) returns raw metadata context.
- getVisibility(tile, frameState, contentIndex?) evaluates union or indexed render visibility.

Traversal still uses the tile bounding volume. Content visibility is render-only, and multiple
content entries form a union. Renderer implementations may add styling and GPU policy on top of this
contract without changing loader behavior.

See [3D Tiles correctness and conformance](../../3d-tiles/concepts/correctness-and-conformance),
[Tile3D](./tile-3d), and [Tileset3D](./tileset-3d).
