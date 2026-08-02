# Caching and Memory

`Tileset3D` caches loaded content so camera movement can reuse tiles without immediately fetching and decoding them again. The cache cooperates with traversal: tiles touched in the current frame are protected, while unused least-recently-used content becomes eligible for eviction.

Concepts: [overview](/docs/modules/3d-tiles/concepts) · [hierarchy](./tile-hierarchy-and-refinement) · [SSE and LOD](./screen-space-error-and-lod) · [request scheduling](./request-scheduling-and-priorities) · [diagnostics](./runtime-tuning-and-diagnostics)

## The Memory Limit Is Soft

`maximumMemoryUsage` defaults to `32` MB and limits estimated GPU memory retained by the tileset cache. Geometry, textures, batch-table textures, and point metadata contribute to the estimate.

The limit is intentionally soft. Tiles selected or otherwise used in the current frame are not evicted merely to satisfy the budget. If the current view needs 50 MB to meet its SSE target and the limit is 32 MB, usage can reach 50 MB; those tiles become evictable after they leave the working set. This favors complete, hole-free rendering over a hard cap.

`memoryCacheOverflow` defaults to `1` MB and provides hysteresis for memory-adjusted SSE behavior.

## Recency and Frame Protection

At the start of a frame, the cache records a boundary in its least-recently-used list. Traversal touches selected, requested, and otherwise required tiles. Entries used after the boundary are protected for that frame. Eviction walks older entries until the memory target is met or no safe candidates remain.

Loading a tile adds it to the cache and updates `gpuMemoryUsageInBytes`. Unloading calls `onTileUnload`, releases tile content, and updates the memory statistics.

## Memory-Adjusted SSE

When `memoryAdjustedScreenSpaceError` is enabled, memory pressure can raise the active SSE threshold gradually, reducing refinement demand. Usage below the cache target moves the threshold back toward `maximumScreenSpaceError`; usage beyond the target plus overflow raises it. The adjustment is incremental, so it avoids abrupt LOD swings.

This option changes the effective quality target and is distinct from progressive or foveated scheduling, which normally change request order only.

## Request Concurrency Is Not Cache Size

`maxRequests` limits simultaneous scheduled fetches when `throttleRequests` is enabled. Raising it may fill the cache faster and increase decode pressure, but it does not increase the memory limit. Lowering it changes latency and ordering visibility, but already loaded tiles remain governed by the cache.

## Practical Guidance

- Choose final visual quality with `maximumScreenSpaceError` first.
- Size `maximumMemoryUsage` for the expected visible working set plus useful reuse.
- Watch `gpuMemoryUsageInBytes` and the tileset stats rather than treating the configured limit as a hard guarantee.
- Reduce request concurrency when network or decode contention hurts interaction.
- Enable memory-adjusted SSE only when graceful quality reduction is preferable to exceeding the working budget.

Next: [Runtime tuning and diagnostics](./runtime-tuning-and-diagnostics).
