# RAD Splat Luma Renderer Plan

## Context

Spark 2.0 treats `.rad` as a paged level-of-detail splat world format. The renderer
does more than decode chunks: it traverses the LoD tree against the active view,
keeps a fixed visible splat budget, streams missing RADC pages, and renders the
selected frontier through shared GPU splat buffers.

References:

- https://sparkjs.dev/docs/new-features-2.0/
- https://sparkjs.dev/docs/lod-getting-started/
- https://sparkjs.dev/docs/spark-renderer/
- https://sparkjs.dev/docs/system-design/
- https://sparkjs.dev/docs/performance/

The loaders.gl branch is intentionally taking a deck.gl/luma.gl-native route. The
`@loaders.gl/splats` module owns RAD/SPZ/SPLAT/KSPLAT parsing and `RADSource`
range access. The internal `@loaders.gl/deck-layers` package owns experimental
rendering through `SplatLayer` and `RADSplatLayer`.

## Current Implementation

- `RADSourceLoader` parses RAD headers, fetches inline or sidecar RADC chunks, and
  decodes chunks into typed Gaussian splat arrays or Mesh Arrow tables.
- `RADSplatLayer` accepts a `RADSource`, keeps decoded chunks resident across
  viewport changes, selects a loaded LoD row frontier, and uploads that frontier to
  `SplatEngine`.
- `SplatEngine` owns luma buffers for splat attributes, active row weights,
  projected covariance data, depth keys, and render indices.
- The WebGPU path supports projection, frustum/alpha/screen-size culling, tile
  binning, tile-local sorting, and visible-count readback. CPU/WebGL fallback still
  renders circular billboards.

## Design Direction

1. Match Spark prop semantics where possible.
   - `lodSplatCount` is the visible splat budget.
   - `lodSplatScale` biases LoD selection priority.
   - `lodRenderScale` affects rendered splat radius and should not silently mean
     "foveation radius".
   - `coneFov0` and `coneFov` should be full-width angles in degrees, matching
     Spark's public API, not normalized viewport radii.
   - `behindFoveate` and `coneFoveate` remain relative priority multipliers.

2. Keep renderer ownership separate from format loading.
   - loaders.gl should continue exposing RAD source/chunk APIs.
   - The renderer can live as an internal deck/luma layer while experimental.
   - Longer term, reusable luma splat primitives should move below deck.gl layer
     code so other integrations can reuse the same renderer.

3. Preserve coherent visual progress.
   - Do not drop the previous committed frontier while children are still loading.
   - Parent rows should remain visible until their direct child frontier is resident.
   - Partial parent fade weights are acceptable when they reduce popping.

4. Treat global sorting as the quality path and tile sorting as the performance
   path.
   - `sortMode: 'global'` should keep one globally sorted frontier whenever the
     selected budget allows it.
   - `sortMode: 'tile'` is currently the usable preview path for large RAD budgets;
     it reports per-tile overflow so dense-view quality loss can be tuned explicitly.

## Near-Term Work

- Validate Spark-style angle foveation against real RAD captures and tune the
  remaining projected-size scoring.
- Add focused tests around viewport signatures, render-page grouping, and
  row-weight preservation.
- Use gaussian-splats RAD telemetry to tune Coit Tower loading and camera motion:
  resident chunks, resident splats, render pages, rendered splats, requested chunks,
  upload time, commit time, and tile overflow.
- Move the LoD traversal and chunk decode work behind a worker boundary once the
  main-thread semantics are stable.
- Add browser-level visual/performance checks before calling the luma renderer
  production-ready.

## Known Gaps

- `RADSplatLayer` currently uses decoded chunk LRU plus render-page engines rather
  than Spark's shared fixed-size GPU page table.
- Global sorting can require large compacted frontier uploads, so it is not yet a
  steady-cost path for large splat budgets.
- The foveation and projected-size scoring are approximate until validated against
  Spark captures.
- Dense tile-sorted views can still overflow the tile-local sort capacity; the
  example now reports this, but the renderer should reduce overflow rather than
  treating it as acceptable final quality.
- The current WebGL fallback does not render full anisotropic Gaussian splats.
