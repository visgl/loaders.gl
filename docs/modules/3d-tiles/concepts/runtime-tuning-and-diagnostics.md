import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Runtime Tuning and Diagnostics

<Tiles3DDocsTabs active="diagnostics" />

Tune 3D Tiles in layers: establish the desired final LOD, then improve how quickly useful coverage arrives, then size request and memory resources. Changing several layers together makes symptoms harder to explain.

## Recommended Sequence

1. Hold the camera still and choose `maximumScreenSpaceError` for acceptable final quality.
2. Use `viewDistanceScale` only if a global multiplier is more convenient than changing the threshold.
3. Tune `progressiveResolutionHeightFraction` for initial broad coverage.
4. Tune `foveatedConeSize`, relaxation, and `foveatedTimeDelay` for interaction.
5. Tune `maxRequests` for network and decode capacity.
6. Tune byte-native `cacheBytes` and `maximumCacheOverflowBytes`; memory-adjusted SSE is enabled by default.

## What to Inspect

Useful `Tile3D` fields include:

| Field | Diagnostic meaning |
| --- | --- |
| `lodMetricValue` | World-space geometric error after transform scaling for 3D Tiles. |
| `distanceToCamera` | Bounding-volume distance used by perspective SSE. |
| `screenSpaceError` | Most recently calculated final-LOD SSE. |
| `selected` | Whether content contributes to the current frame. |
| `refine` | `ADD` or `REPLACE` continuity semantics. |
| `_priorityProgressiveResolution` | Whether the tile belongs to the coarse-coverage band. |
| `_priorityDeferred` | Whether motion deferral currently holds the request. |
| `_foveatedFactor` | Unitless distance from the perspective view axis. |
| `_priority` | Combined scheduler priority; smaller starts first. |

The underscored fields are runtime diagnostics, not stable public API. Prefer callbacks and stats for application behavior. `Tileset3D.stats` exposes tiles loading, loaded, in memory, in view, renderable, failed, estimated GPU memory, and the current maximum SSE.

## Troubleshooting

| Symptom | Likely cause | Inspect or change |
| --- | --- | --- |
| Final view stays coarse | High SSE threshold, low `viewDistanceScale`, missing children, or memory-adjusted SSE. | Compare tile SSE with the active maximum; inspect load failures and descendants. |
| Too many tiles load | Low threshold or high distance scale. | Raise `maximumScreenSpaceError`; monitor memory and requests. |
| Empty regions during replacement | Required children failed or application code removed safe ancestors. | Inspect `REPLACE` child loads and `onTileError`; traditional children are not motion-deferred. |
| Fine detail starts before broad coverage | Progressive priority is disabled or the root already satisfies reduced-height SSE. | Use a fraction in `(0, 0.5]`; inspect the error hierarchy. |
| Center is not faster than edges | Foveation disabled, cone too large, orthographic projection, or few competing requests. | Check foveated options, projection, `maxRequests`, and priority fields. |
| Periphery recovers slowly | Delay or relaxation is too aggressive. | Reduce `foveatedTimeDelay`, enlarge the cone, or reduce relaxation. |
| Requests never recover after motion | Traversal is frozen or tileset was destroyed. | Keep `loadTiles` enabled; the runtime otherwise schedules one expiry traversal. |
| Orthographic LOD or progressive pass looks wrong | Invalid `metersPerPixel` or physical/logical pixel mixing. | Supply a positive finite logical-pixel scale. |
| High-DPI displays choose different LOD | Custom viewport applied DPR a second time. | Use CSS/logical dimensions with no additional DPR factor. |
| Scaled tiles under-refine | World transform was not applied to geometric error. | Inspect `lodMetricValue` and the composed model/tile transforms. |
| Memory exceeds `cacheBytes` | Current-frame working set is larger than the soft eviction target. | Compare usage with the base-plus-overflow ceiling; raise a budget, raise SSE, or keep memory-adjusted SSE enabled. |
| Many queued requests but low throughput | Request throttling or upstream fetch limits. | Inspect `maxRequests`, browser connection limits, and loader worker concurrency. |

## Multi-Viewport Behavior

Traversal and camera-motion state are retained per viewport. Selected and requested tiles from traversed viewports are combined before loading and cache eviction. A moving viewport can therefore reprioritize its peripheral work without falsely marking a stationary viewport as moving. Shared content still benefits from the common cache.

## Projection Changes

Perspective foveation requires a perspective field of view. Orthographic traversal uses `metersPerPixel` for SSE and progressive priority, but disables angular foveation. When an orthographic viewport lacks a valid scale, SSE falls back to the perspective-compatible formula; inspect viewport fields when changing projection at runtime.

Return to the [3D Tiles runtime concepts overview](/docs/modules/3d-tiles/concepts).
