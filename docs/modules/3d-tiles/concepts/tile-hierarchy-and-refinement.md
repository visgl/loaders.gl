---
title: 3D Tiles tile hierarchy and refinement
description: Follow visible branches through explicit and implicit hierarchies while preserving safe coverage during loading.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime / hierarchy"
  title="Traverse the tree without losing coverage."
  description="A tileset is a view-dependent hierarchy. This guide explains how visibility, geometric error, refinement mode, and loading state work together as the camera moves."
  tone="cyan"
  meta={['Explicit and implicit trees', 'ADD / REPLACE refinement', 'Ancestor coverage']}
/>

<Tiles3DDocsTabs active="runtime" />

<DocOrientation
  eyebrow="Hierarchy traversal"
  title="Choose what is needed, then fill it in."
  description="Traversal can request more detail without making the frame depend on content that has not arrived. Ancestors remain useful coverage while descendants load."
  tone="cyan"
  items={[
    {label: 'Cull', value: 'Discard branches outside the frustum or request volume.'},
    {label: 'Measure', value: 'Compare transformed geometric error with the view.'},
    {label: 'Refine', value: 'Apply ADD or REPLACE semantics to visible descendants.'},
    {label: 'Recover', value: 'Keep renderable ancestors until replacements are ready.'}
  ]}
/>

<ReferenceBoundary
  title="Traversal behavior"
  description="The detailed sections cover hierarchy states, implicit boundaries, refinement modes, and the per-frame selection lifecycle."
  tone="cyan"
/>

3D Tiles divides a dataset into a tree. A tile describes a bounding volume, a geometric error, an optional content resource, and zero or more children. Traversal visits visible branches and decides whether each tile can provide current coverage or needs descendants.

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

## Implicit Hierarchies

An implicit root initially has no materialized runtime children. It carries a lazy subtree reference that still supplies a bounding volume and geometric error, so traversal can cull it and calculate SSE before any availability request. Only a visible, in-volume tile that still needs refinement requests its subtree. The request installs one subtree's available headers and leaves deeper subtree roots lazy.

While a child subtree is loading, its existing tile stays the traversal boundary. This preserves safe `REPLACE` coverage and normal `ADD` accumulation instead of speculatively traversing descendants whose availability is not known. See [Implicit tiling and lazy subtrees](./implicit-tiling-and-subtrees) for level indexing, cache behavior, and diagnostics.

## Refinement Modes

`REPLACE` means descendants eventually replace the parent's representation. Traditional replacement traversal keeps a parent visible until every required child is ready, preventing holes. That safety rule is why these child requests can be prioritized center-first but are not paused by moving-camera foveated deferral.

`ADD` means descendants augment their ancestors. The parent remains part of the result, so descendant requests can safely wait briefly while the camera moves.

Set `skipLevelOfDetail: true` to enable skip-LOD replacement traversal. A ready replacement ancestor
remains selected while traversal jumps over intermediate levels, so a deep tree can begin showing
detail before every level is ready. The ancestor is fallback coverage, not a second LOD target: once
descendants are available they refine independently, and progressive-resolution descendants remain
urgent. The tradeoff is temporary overdraw and potentially higher bandwidth while the camera is
moving. The default is `false`, preserving traditional all-required-children replacement behavior.

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

Required extensions are validated before normalization or dependent network access. The supported `3DTILES_bounding_volume_S2` extension is normalized to the oriented-box representation consumed by traversal for explicit tile, content, and viewer-request volumes as well as implicit roots. The original S2 metadata remains available where implicit subdivision needs its token and height range. Unknown optional names in `extensionsUsed` remain forward-compatible.

Next: [Screen-space error and LOD](./screen-space-error-and-lod).
