3D Tiles runtime / hierarchy

![](/next/images/format-logos/3d-tiles-logo.png)

# Traverse the tree without losing coverage.

A tileset is a view-dependent hierarchy. This guide explains how visibility, geometric error, refinement mode, and loading state work together as the camera moves.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

Hierarchy traversal

## Choose what is needed, then fill it in.

Traversal can request more detail without making the frame depend on content that has not arrived. Ancestors remain useful coverage while descendants load.

01

Cull

Discard branches outside the frustum or request volume.

02

Measure

Compare transformed geometric error with the view.

03

Refine

Apply ADD or REPLACE semantics to visible descendants.

04

Recover

Keep renderable ancestors until replacements are ready.

Detailed guide

## Traversal behavior

The detailed sections cover hierarchy states, implicit boundaries, refinement modes, and the per-frame selection lifecycle.

3D Tiles divides a dataset into a tree. A tile describes a bounding volume, a geometric error, an optional content resource, and zero or more children. Traversal visits visible branches and decides whether each tile can provide current coverage or needs descendants.

## The Per-Frame Pipeline[​](#the-per-frame-pipeline "Direct link to The Per-Frame Pipeline")

For each viewport, `Tileset3D`:

1. Creates camera, frustum, and logical-pixel measurements.
2. Culls tiles outside the frustum and applies viewer request volumes.
3. Calculates distance and screen-space error for visible tiles.
4. Traverses descendants while refinement is required and possible.
5. Separates renderable tiles from unloaded request candidates.
6. Ranks candidates and submits them through the request scheduler.
7. Keeps safe ancestor coverage while replacement content is incomplete.
8. Touches current-frame tiles in the cache and evicts unused content when necessary.

Loading is asynchronous. A traversal may initially select an available ancestor, request descendants, and select those descendants in a later traversal after their content becomes ready. Applications should call `update()` or `selectTiles()` as the camera changes; `onTileLoad` can trigger another update after loads complete.

## Implicit Hierarchies[​](#implicit-hierarchies "Direct link to Implicit Hierarchies")

An implicit root initially has no materialized runtime children. It carries a lazy subtree reference that still supplies a bounding volume and geometric error, so traversal can cull it and calculate SSE before any availability request. Only a visible, in-volume tile that still needs refinement requests its subtree. The request installs one subtree's available headers and leaves deeper subtree roots lazy.

While a child subtree is loading, its existing tile stays the traversal boundary. This preserves safe `REPLACE` coverage and normal `ADD` accumulation instead of speculatively traversing descendants whose availability is not known. See [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md) for level indexing, cache behavior, and diagnostics.

## Refinement Modes[​](#refinement-modes "Direct link to Refinement Modes")

`REPLACE` means descendants eventually replace the parent's representation. Traditional replacement traversal keeps a parent visible until every required child is ready, preventing holes. That safety rule is why these child requests can be prioritized center-first but are not paused by moving-camera foveated deferral.

`ADD` means descendants augment their ancestors. The parent remains part of the result, so descendant requests can safely wait briefly while the camera moves.

3D Tiles enables `skipLevelOfDetail` by default. A ready replacement ancestor remains selected while traversal jumps over intermediate levels without requesting their content, so a deep tree can begin showing detail without downloading every level. `baseScreenSpaceError`, `skipScreenSpaceErrorFactor`, and `skipLevels` control periodic intermediate coverage requests; `immediatelyLoadDesiredLevelOfDetail` disables those requests and loads only final SSE targets. The ancestor is fallback coverage, not a second LOD target: once descendants are available they refine independently, and progressive-resolution descendants remain urgent. The tradeoff is temporary overdraw. Set `skipLevelOfDetail: false` to use traditional all-required-children replacement behavior. I3S retains its existing non-skipping default.

When zooming out to a level whose content is unavailable, skip-LOD traversal also keeps already-drawn descendants within two levels alongside the available ancestor. This reuses existing detail without requesting additional descendant content. The renderer's transition hold retains only previously drawn tiles and releases each region once its own selected replacement has drawn, so an unfinished region does not keep unrelated coarse tiles on screen. Each viewport retains its own fallback tile instances, even when viewport trees share content URLs. Removing a viewport also releases its fallback instances.

## Visibility, Selection, and Requests[​](#visibility-selection-and-requests "Direct link to Visibility, Selection, and Requests")

These states answer different questions:

| State     | Meaning                                                                           |
| --------- | --------------------------------------------------------------------------------- |
| Visible   | The bounding volume intersects the current view and passes visibility checks.     |
| Refining  | Its SSE exceeds the active threshold and traversal can visit descendants.         |
| Selected  | Its content should contribute to the current rendered result.                     |
| Requested | Its content is needed but is not yet available.                                   |
| Deferred  | It remains needed, but may wait until the foveated motion window expires.         |
| Cached    | Its loaded content remains resident for reuse, whether or not currently selected. |

A tile can be visible but neither selected nor requested, for example when descendants already provide replacement coverage. Conversely, traditional `REPLACE` traversal may request a required child whose bounding volume is not visible so that the whole replacement set becomes ready without a hole.

## External and Implicit Hierarchies[​](#external-and-implicit-hierarchies "Direct link to External and Implicit Hierarchies")

External tilesets extend the apparent hierarchy after their JSON is loaded. Implicit tiling materializes nodes from subtree availability data. Both still feed the same traversal concepts: bounding volumes determine relevance, geometric error determines refinement, and content state determines whether a selected representation is renderable.

Required extensions are validated before normalization or dependent network access. The supported `3DTILES_bounding_volume_S2` extension is normalized to the oriented-box representation consumed by traversal for explicit tile, content, and viewer-request volumes as well as implicit roots. The original S2 metadata remains available where implicit subdivision needs its token and height range. Unknown optional names in `extensionsUsed` remain forward-compatible.

Next: [Screen-space error and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md).
