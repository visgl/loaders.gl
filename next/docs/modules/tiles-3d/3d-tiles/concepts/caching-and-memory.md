3D Tiles runtime / cache

![](/next/images/format-logos/3d-tiles-logo.png)

# Reuse detail without letting memory run away.

The 3D Tiles cache is a working-set policy, not a hard process limit. This guide explains which content is protected, what gets evicted, and when pressure changes refinement demand.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

Working-set policy

## Keep what the current view needs.

A useful cache balances complete coverage for the current frame with enough reuse for nearby camera positions. The base budget is soft so visible content is not evicted mid-frame.

01

Target

Use cacheBytes as the preferred resident-content budget.

02

Protect

Keep selected and current-frame tiles available.

03

Overflow

Allow headroom before memory-adjusted SSE reduces demand.

04

Evict

Remove unused least-recently-used content toward the target.

Detailed guide

## Cache and memory details

The technical sections cover both decoded tile content and the separate metadata cache used by implicit subtrees.

`Tileset3D` caches loaded content so camera movement can reuse tiles without immediately fetching and decoding them again. The cache cooperates with traversal: tiles touched in the current frame are protected, while unused least-recently-used content becomes eligible for eviction.

## Two Byte Budgets[​](#two-byte-budgets "Direct link to Two Byte Budgets")

Cache policy is controlled by two byte-native values:

| Option                      | Default               | Purpose                                                                                                       |
| --------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `cacheBytes`                | `536870912` (512 MiB) | Soft target used to evict content that was not needed in the current frame.                                   |
| `maximumCacheOverflowBytes` | `536870912` (512 MiB) | Additional current-frame headroom before memory-adjusted screen-space error (SSE) starts reducing LOD demand. |

The pressure ceiling is:

```
cache pressure ceiling = cacheBytes + maximumCacheOverflowBytes
```

Both values are byte counts, not decimal megabytes. Multiply a desired mebibyte value by `1024 * 1024`.

## The Base Budget Is Soft[​](#the-base-budget-is-soft "Direct link to The Base Budget Is Soft")

`cacheBytes` is intentionally a soft target. Tiles selected, requested, or otherwise touched in the current frame are protected from eviction even if the visible working set exceeds the target. If the current view needs 700 MiB to meet its SSE target and `cacheBytes` is 512 MiB, usage may reach 700 MiB. Once some of those tiles are no longer needed, least-recently-used content is evicted toward 512 MiB.

This policy favors complete, hole-free rendering over a hard cap. `cacheBytes` should therefore not be interpreted as a process, JavaScript heap, or GPU allocation limit.

## Implicit Subtree Metadata Cache[​](#implicit-subtree-metadata-cache "Direct link to Implicit Subtree Metadata Cache")

Implicit availability files use a separate source-local parsed-metadata cache. It is bounded by `loadOptions['3d-tiles'].maximumCachedSubtrees`, defaults to 32 entries, and deduplicates requests by final URL after query inheritance. Set it to `0` to retain only active in-flight promises. These entries are small availability structures, not decoded render content, and therefore do not count toward `cacheBytes` or `maximumCacheOverflowBytes`.

Materialized runtime headers for visited subtree levels remain part of the live hierarchy even after their parsed availability entry leaves this LRU. A lower SSE threshold can still grow the visited hierarchy by legitimately traversing deeper. Inspect `Tiles3DSource.getImplicitTilingStats()` and see [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md) when separating metadata growth from GPU content pressure.

## What the Estimate Includes[​](#what-the-estimate-includes "Direct link to What the Estimate Includes")

`gpuMemoryUsageInBytes` tracks the runtime's best estimate for loaded tile content. Geometry, textures, batch-table textures, and point metadata contribute when their loaders report byte lengths. The value does not include every allocation made by the application, browser, renderer, decoder, or network stack.

Use it to compare tileset configurations and diagnose cache behavior, not as an exact measurement of total device memory.

## Recency and Frame Protection[​](#recency-and-frame-protection "Direct link to Recency and Frame Protection")

At the start of a frame, the cache records a boundary in its least-recently-used (LRU) list. Traversal touches selected, requested, and otherwise required tiles. Entries used after the boundary are protected for that frame. Eviction walks older entries until estimated usage is at or below `cacheBytes`, or until no safe candidates remain.

Loading a tile adds it to the cache and updates `gpuMemoryUsageInBytes`. Unloading calls `onTileUnload`, releases tile content, and updates the memory statistics.

## Memory-Adjusted SSE[​](#memory-adjusted-sse "Direct link to Memory-Adjusted SSE")

`memoryAdjustedScreenSpaceError` defaults to `true`. When enabled, the active SSE threshold responds to the two byte budgets:

| Estimated usage                                | Active SSE response                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Below `cacheBytes`                             | Moves down toward `maximumScreenSpaceError`, restoring requested detail.                    |
| From `cacheBytes` through the pressure ceiling | Holds steady. The overflow window provides headroom and prevents rapid quality oscillation. |
| Above the pressure ceiling                     | Moves upward, stopping traversal at coarser tiles and reducing future memory demand.        |

Each adjustment is two percent, so quality changes converge instead of jumping abruptly. The effective logical-pixel threshold is exposed as `memoryAdjustedScreenSpaceError`; `maximumScreenSpaceError` remains the application's preferred quality target.

Memory-adjusted SSE changes the selected final LOD under pressure. This is different from progressive and foveated scheduling, which normally change request order and timing without changing the final target. See [Screen-space error and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md) for the refinement calculation.

Set `memoryAdjustedScreenSpaceError: false` when stable LOD is more important than adapting to a constrained cache. Eviction still uses `cacheBytes`, and the visible working set can still exceed it.

These defaults apply to 3D Tiles. The shared `Tileset3D` runtime preserves I3S's existing 32 MiB base target, 1 MiB overflow, and disabled memory adjustment so this Cesium-alignment tranche does not change I3S LOD behavior.

## Runtime Updates[​](#runtime-updates "Direct link to Runtime Updates")

The public `cacheBytes` and `maximumCacheOverflowBytes` properties can be changed after construction. `setProps()` accepts the same values. All paths update the byte thresholds directly, so repeated changes do not accumulate unit conversions or leave stale internal limits.

Reducing `cacheBytes` makes old, unused tiles eligible for eviction during the next traversal. Reducing overflow headroom can raise the active SSE after subsequent load or cache activity if usage is already above the new pressure ceiling.

```
const MEBIBYTE = 1024 * 1024;



const tileset = new Tileset3D(source, {

  cacheBytes: 256 * MEBIBYTE,

  maximumCacheOverflowBytes: 64 * MEBIBYTE

});



// Adapt to a device or application memory mode later.

tileset.setProps({cacheBytes: 128 * MEBIBYTE});
```

## Migrating from MiB Options[​](#migrating-from-mib-options "Direct link to Migrating from MiB Options")

The v5 API removes the MiB-based `maximumMemoryUsage` and `memoryCacheOverflow` options and the `Tileset3D.maximumMemoryUsage` property. Replace them with the byte-native `cacheBytes` and `maximumCacheOverflowBytes` values. For example, convert a 256 MiB budget with `cacheBytes: 256 * 1024 * 1024`; do not pass the MiB number directly.

The default policy changed from a 32 MiB target, 1 MiB overflow, and disabled memory adjustment to Cesium-compatible 512 MiB budgets with memory adjustment enabled. To retain the previous policy explicitly:

```
const MEBIBYTE = 1024 * 1024;



const tileset = new Tileset3D(source, {

  cacheBytes: 32 * MEBIBYTE,

  maximumCacheOverflowBytes: 1 * MEBIBYTE,

  memoryAdjustedScreenSpaceError: false

});
```

## Tuning Tradeoffs[​](#tuning-tradeoffs "Direct link to Tuning Tradeoffs")

| Change                      | Likely benefit                                                          | Likely cost                                                                 |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Increase `cacheBytes`       | More reuse after camera reversals; fewer repeated requests and decodes. | More retained content memory.                                               |
| Decrease `cacheBytes`       | Lower idle cache footprint.                                             | More load/evict cycles and network reuse misses.                            |
| Increase overflow headroom  | Preserves the requested LOD through short memory peaks.                 | Allows a larger current-view working set.                                   |
| Decrease overflow headroom  | Adapts LOD sooner on constrained devices.                               | Coarser detail under pressure and potentially deeper quality changes.       |
| Disable memory-adjusted SSE | Stable final LOD target.                                                | The visible working set may exceed the base budget without adaptive relief. |

## Request Concurrency Is Not Cache Size[​](#request-concurrency-is-not-cache-size "Direct link to Request Concurrency Is Not Cache Size")

`maxRequests` limits simultaneous scheduled fetches when `throttleRequests` is enabled. Raising it may fill the cache faster and increase decode pressure, but it does not increase the memory limit. Lowering it changes latency and ordering visibility, but already loaded tiles remain governed by the cache.

## Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

| Symptom                                           | Explanation                                                                   | Inspect or change                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Usage exceeds `cacheBytes`                        | Current-frame tiles are protected, or no unused entries are eligible.         | Compare `gpuMemoryUsageInBytes` with the visible working set; increase SSE or allow adaptation if needed. |
| Detail becomes coarser over time                  | Usage crossed the base-plus-overflow ceiling.                                 | Inspect `memoryAdjustedScreenSpaceError`; increase a budget or reduce other content pressure.             |
| Detail stays coarse after moving away             | The active SSE restores incrementally as usage drops.                         | Confirm usage is below `cacheBytes` and allow subsequent traversal/cache updates.                         |
| Tiles repeatedly reload when reversing the camera | The base cache target is too small for useful reuse.                          | Increase `cacheBytes` or reduce the target detail level.                                                  |
| Changing an old MiB option appears ignored        | The corresponding byte-native option was also supplied and has precedence.    | Configure only `cacheBytes` and `maximumCacheOverflowBytes`.                                              |
| Memory metrics differ from browser or GPU tools   | `gpuMemoryUsageInBytes` is a tile-content estimate, not whole-process memory. | Compare trends and include renderer/application allocations separately.                                   |

Choose final visual quality with `maximumScreenSpaceError` first, then size `cacheBytes` for the expected visible working set plus useful reuse. Tune overflow headroom last, using `gpuMemoryUsageInBytes`, active SSE, request counts, and camera interaction together.

Next: [Runtime tuning and diagnostics](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/runtime-tuning-and-diagnostics.md).
