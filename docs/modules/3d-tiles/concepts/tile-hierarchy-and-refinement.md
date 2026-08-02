# Tile Hierarchy and Refinement

3D Tiles divides a dataset into a tree. A tile describes a bounding volume, a geometric error, an optional content resource, and zero or more children. Traversal visits visible branches and decides whether each tile can provide current coverage or needs descendants.

Concepts: [overview](/docs/modules/3d-tiles/concepts) · [SSE and LOD](./screen-space-error-and-lod) · [request scheduling](./request-scheduling-and-priorities) · [cache and memory](./caching-and-memory) · [diagnostics](./runtime-tuning-and-diagnostics)

## The Per-Frame Pipeline

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

## Refinement Modes

`REPLACE` means descendants eventually replace the parent's representation. Traditional replacement traversal keeps a parent visible until every required child is ready, preventing holes. That safety rule is why these child requests can be prioritized center-first but are not paused by moving-camera foveated deferral.

`ADD` means descendants augment their ancestors. The parent remains part of the result, so descendant requests can safely wait briefly while the camera moves.

Some source traversers support skip-LOD replacement: a ready ancestor can remain as coverage while traversal jumps to deeper descendants. Progressive-resolution descendants needed for initial broad coverage remain urgent even in this mode.

## Visibility, Selection, and Requests

These states answer different questions:

| State | Meaning |
| --- | --- |
| Visible | The bounding volume intersects the current view and passes visibility checks. |
| Refining | Its SSE exceeds the active threshold and traversal can visit descendants. |
| Selected | Its content should contribute to the current rendered result. |
| Requested | Its content is needed but is not yet available. |
| Deferred | It remains needed, but may wait until the foveated motion window expires. |
| Cached | Its loaded content remains resident for reuse, whether or not currently selected. |

A tile can be visible but neither selected nor requested, for example when descendants already provide replacement coverage. Conversely, traditional `REPLACE` traversal may request a required child whose bounding volume is not visible so that the whole replacement set becomes ready without a hole.

## External and Implicit Hierarchies

External tilesets extend the apparent hierarchy after their JSON is loaded. Implicit tiling materializes nodes from subtree availability data. Both still feed the same traversal concepts: bounding volumes determine relevance, geometric error determines refinement, and content state determines whether a selected representation is renderable.

Next: [Screen-space error and LOD](./screen-space-error-and-lod).
