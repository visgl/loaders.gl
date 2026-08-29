---
title: 3D Tiles correctness and conformance
description: Use observable runtime invariants to reason about parsing, transforms, traversal, LOD, and I3S isolation.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime / conformance"
  title="Make correctness observable."
  description="Conformance is more useful when each guarantee has a fixture, a runtime measurement, and a clear boundary between loader behavior and renderer policy."
  tone="violet"
  meta={['Invariants and fixtures', 'Runtime measurements', 'Renderer boundary']}
/>

<Tiles3DDocsTabs active="diagnostics" />

<DocOrientation
  eyebrow="Conformance contract"
  title="Check the values that drive the frame."
  description="A correct runtime preserves source semantics while making its decisions inspectable: transformed error, selected coverage, content state, request eligibility, and extension handling."
  tone="violet"
  items={[
    {label: 'Preserve', value: 'Keep source metadata and unknown extensions available.'},
    {label: 'Separate', value: 'Keep traversal, rendering, and application styling boundaries clear.'},
    {label: 'Exercise', value: 'Use focused fixtures for hierarchy, volumes, LOD, and lifecycle.'},
    {label: 'Inspect', value: 'Compare public runtime fields against expected invariants.'}
  ]}
/>

<ReferenceBoundary
  title="Correctness and conformance details"
  description="The sections below record guarantees, test tranches, debugging values, and the parts of the renderer intentionally outside this package."
  tone="violet"
/>

The 3D Tiles runtime is view-dependent: parsing, transform composition, culling, LOD selection, and request scheduling must agree before a tile can be considered correct. This page is the working conformance contract for loaders.gl.

## Correctness guarantees

| Area | Guarantee | Observable check |
| --- | --- | --- |
| Geometric error | Raw geometric error is retained and scaled once by the maximum component of the composed transform. | Change a tileset model matrix repeatedly and verify the tile error follows the new matrix, without compounding. |
| SSE/LOD | Perspective SSE preserves the established denominator; orthographic SSE uses `metersPerPixel`; both report logical/CSS pixels. | The same camera selects the same LOD at DPR 1 and DPR 2. Invalid orthographic scales use the perspective fallback. |
| Hierarchy | `REPLACE` retains a renderable ancestor until required descendants are ready; `ADD` can select both levels. | Delay child content and inspect selected tiles during the loading frame. |
| Content visibility | Multiple content volumes are a union. Clipping planes affect render content only and never prune traversal descendants. | Put one content volume outside the frustum and another inside; clip both and verify the return classification. |
| Implicit tiling | Subtree availability uses zero-based global levels and materializes only the requested subtree boundary. | Verify exact `availableLevels`, QUADTREE/OCTREE indexes, sparse tiles, and child-subtree references. |
| Extensions | Unsupported `extensionsRequired` names fail before normalization or network access; unknown `extensionsUsed` names are preserved. | Supply an unsupported required extension and assert that the resolver was never called. |
| I3S isolation | I3S screen-threshold metrics do not receive 3D Tiles geometric-error transform scaling. | Apply a non-uniform transform and compare the unchanged I3S metric. |

## Conformance tranches

The tracker issue [#1245](https://github.com/visgl/loaders.gl/issues/1245) records the full Cesium parity audit. The umbrella correctness work is intentionally split into reviewable areas inside one PR:

1. **Volume and visibility correctness** — union semantics for multiple contents, clipping-only render culling, antimeridian/polar/degenerate region fixtures, and transformed-volume regressions.
2. **Implicit hierarchy correctness** — one-subtree materialization, deepest-level arithmetic, sparse availability, retry/deduplication, and bounded metadata lifetime.
3. **Traversal and LOD correctness** — ADD/REPLACE coverage, skip-LOD guarantees, camera jumps, foveated/progressive ordering, perspective/orthographic SSE, and dynamic-SSE isolation.
4. **Metadata and extension correctness** — schema-aware semantics, property-table references, feature IDs, required/used extension invariants, and metadata-derived bounds.
5. **Lifecycle and conformance** — empty/external/expired content, viewer request volumes, cancellation, eviction/reload/destroy, statistics, and maintained Cesium comparison fixtures.

Each tranche should add a focused fixture or unit test before changing runtime behavior. Renderer-specific behavior (styling, Gaussian splats, vector/CAD, voxels, and GPU upload policy) remains outside the loader/runtime conformance boundary.

## Debugging a mismatch

Inspect these values for the same tile and frame:

- `tile.distanceToCamera` — world-space distance from the tile volume.
- `tile.lodMetricValue` — transformed 3D Tiles geometric error, or the unchanged I3S metric.
- `tile.screenSpaceError` — calculated logical-pixel error used by refinement.
- `tileset.options.maximumScreenSpaceError` — the refinement target.
- `tile.contentVisibility(frameState)` — render-content classification after frustum and clipping checks.
- `tile.childrenState` — whether an implicit boundary is unloaded, loading, ready, or failed.

A mismatch is usually caused by mixing source-space and world-space units, applying device-pixel ratio twice, using a content volume for hierarchy traversal, or evaluating a stale frame's request priority.

See [screen-space error and LOD](./screen-space-error-and-lod), [implicit tiling and subtrees](./implicit-tiling-and-subtrees), [request scheduling and priorities](./request-scheduling-and-priorities), and [caching and memory](./caching-and-memory) for detailed behavior.
