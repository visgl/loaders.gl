---
title: Runtime observability and benchmark baselines
description: Make 3D Tiles traversal behavior measurable, reproducible, and performance-budgeted.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime"
  title="Measure traversal before tuning it."
  description="Deterministic snapshots and source diagnostics make screen-space error, request pressure, and cache behavior comparable across cameras, devices, and releases."
  tone="violet"
  meta={['Deterministic snapshots', 'Request and cache counters', 'Benchmark budgets']}
/>

<Tiles3DDocsTabs active="runtime" />

<DocOrientation
  eyebrow="A small inspection contract"
  title="Capture what the traverser decided."
  description="The observability API reports selection and work sets without coupling loaders.gl to deck.gl, a renderer, or a particular benchmark harness."
  tone="violet"
  items={[
    {label: 'Selection', value: 'Sorted selected, requested, and empty tile IDs'},
    {label: 'Work', value: 'Loading, loaded, failed, and cached counts'},
    {label: 'Memory', value: 'Estimated resident bytes and active maximum SSE'},
    {label: 'Sources', value: 'Implicit subtree request and cache counters when available'}
  ]}
/>

<ReferenceBoundary
  title="Runtime observability"
  description="Use snapshots for regression fixtures and counters for live dashboards. The values describe the completed traversal frame and never change traversal policy."
  tone="violet"
/>

## Snapshot API

getTileset3DTraversalSnapshot(tileset) returns a serializable
Tileset3DTraversalSnapshot with sorted IDs and numeric counters:

~~~typescript
import {
  getTileset3DTraversalSnapshot,
  Tileset3D
} from '@loaders.gl/tiles';

await tileset.selectTiles(viewport);
const snapshot = getTileset3DTraversalSnapshot(tileset);

console.log(snapshot.selectedTileIds);
console.log(snapshot.requestedTileIds);
console.log(snapshot.maximumScreenSpaceError);
~~~

The snapshot is intentionally defensive. It copies tile IDs, does not retain tile or content
objects, and can be JSON-serialized as a golden fixture. Capture it only after selectTiles resolves;
asynchronous loads can change the next frame's selected set.

| Field | Meaning | Unit |
| --- | --- | --- |
| frameNumber | Completed traversal frame | count |
| selectedTileIds | Tiles selected for rendering, sorted | IDs |
| requestedTileIds | Tiles queued for content loading, sorted | IDs |
| emptyTileIds | Hierarchy-only or empty tiles visited, sorted | IDs |
| visibleTileCount | Length of the selected set | count |
| renderableTileCount | Selected tiles with ready render content | count |
| loadingTileCount | Tile and subtree loads in flight | count |
| loadedTileCount | Cumulative successful tile loads | count |
| failedTileCount | Cumulative failed tile loads | count |
| cachedTileCount | Tiles currently retained in the cache | count |
| cacheBytes | Estimated resident content memory | bytes |
| maximumScreenSpaceError | Active memory-adjusted SSE threshold | logical/CSS pixels |

The optional implicitTiling object is supplied by Tiles3DSource. Its request, materialization, pending,
and parsed-cache counters are useful for diagnosing subtree fan-out and cache reuse.

## Deterministic conformance fixtures

A conformance fixture should fix the tileset JSON, viewport, options, and initial cache state.
Compare sorted IDs and counts rather than object identity or request completion order. A practical
fixture captures:

1. one root traversal with content unavailable;
2. the same viewport after content resolves;
3. a second traversal proving cache reuse; and
4. a camera move that changes only the expected branch.

Keep network access hermetic by injecting a resolver or in-memory source. Put large hierarchies and
long camera paths in the slow suite. Do not use snapshots to bless a regression: explain why a
selected tile, request, or count changed.

## Benchmark dimensions and budgets

Record at least:

- initialization time and first useful frame;
- traversal time per viewport;
- number of selected, requested, loaded, failed, and cached tiles;
- resident bytes and peak resident bytes;
- implicit subtree requests, cache hits, and materialized headers;
- number of frames required to reach the target SSE.

Use a fixed browser, viewport size, camera path, network fixture, and warm/cold-cache label. Suggested
starting budgets are deliberately relative: a correctness change should not increase cold-start
traversal time by more than 10%, request count by more than 5%, or resident bytes by more than 10%
for the same snapshot. Calibrate absolute limits to the dataset and CI hardware before enforcing
them.

## Reading the counters

A high requestedTileIds count with a small selected set usually indicates aggressive refinement,
a low maximumScreenSpaceError, or a projection/culling mismatch. A growing loadingTileCount means
the source or decoder is the bottleneck; a growing failedTileCount points to transport, content, or
extension errors. High cachedTileCount and cacheBytes with repeated evictions suggest a budget that
is too small for the working set.

For implicit tiling, many requestedSubtrees with few cacheHits can indicate unstable URL resolution
or an undersized parsed-subtree cache. materializedTiles measures hierarchy work, not renderable GPU
content.

## What snapshots do not promise

Snapshots are diagnostic, not a renderer contract. Tile IDs and counters are stable for a fixed
source, options, and traversal implementation; they are not guaranteed to match across different
tileset revisions. The API does not expose styling, GPU buffer formats, draw order, or network
timings. I3S sources provide the common tile counters, but the implicit-tiling section is specific
to 3D Tiles.

See [screen-space error and LOD](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod),
[caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory), and
[request scheduling](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities) for the
controls that explain these measurements.
