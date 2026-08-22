import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Request Scheduling and Priorities

<Tiles3DDocsTabs active="requests" />

A **foveated request** is an ordinary tile content request whose start time is influenced by its position in the view. It is not a new HTTP method, endpoint, file format, or server feature. The term describes client-side prioritization inspired by human vision: central detail is usually more noticeable than peripheral detail while a camera is moving.

## Selection Versus Scheduling

[Screen-space error](./screen-space-error-and-lod) determines which hierarchy levels the view ultimately needs. Scheduling answers a later question: when more needed tiles exist than available request slots, which one starts first?

The normal sequence is:

```text
visible hierarchy -> desired LOD -> missing request candidates
                  -> priority order -> RequestScheduler -> fetch/decode -> ready tile
```

Progressive and foveated measurements do not loosen the final `maximumScreenSpaceError` target. They improve perceived responsiveness on the way to that target. The same ordinary URLs and loader options are used when requests start.

Implicit subtree metadata uses this same eligibility and priority path. A subtree is considered only after its placeholder is visible, inside its viewer request volume, and above the SSE threshold. Its request then competes for a normal scheduler slot using the tile's progressive and foveated metrics. Loading availability never recursively starts deeper subtrees; each new boundary returns to traversal for another view-dependent decision. See [Implicit tiling and lazy subtrees](./implicit-tiling-and-subtrees).

## Progressive Coarse Coverage

`progressiveResolutionHeightFraction` calculates SSE at a reduced logical viewport height:

```text
progressiveProjection = fullHeightProjection * progressiveResolutionHeightFraction
progressiveSSE = progressiveProjection - dynamicSSEReduction
```

When dynamic SSE is disabled—the default for the progressive calculation's orthographic case—the reduction is zero and this simplifies to `progressiveSSE = normalSSE * fraction`. When perspective dynamic SSE is enabled, loaders.gl scales the projection term first and then applies the same view-dependent logical-pixel reduction used by normal traversal. Dynamic SSE therefore retains its established behavior instead of being scaled a second time.

The default fraction is `0.3`. Tiles still too coarse at that reduced height receive an earlier priority band. The first child crossing below the threshold is promoted too, so the initial pass ends on a real coarse-LOD boundary. This tends to fill the viewport with usable coverage before fine detail consumes every request slot.

Set the fraction to `0` to disable progressive priority. Values greater than `0.5` are ignored because they no longer represent a meaningfully reduced pass. The calculation uses logical pixels in perspective and orthographic views.

## Foveated Center Priority

With `foveatedScreenSpaceError: true`, perspective requests near the camera's forward view ray rank before equally needed peripheral requests. loaders.gl measures the nearest point of the complete tile bounding sphere to that ray. A large tile that intersects the ray therefore counts as central even when its center does not. A volume entirely behind the camera is treated as maximally peripheral instead of projecting onto the backward half of an infinite line and competing with visible center content.

`foveatedConeSize` is the fraction of the vertical field of view that receives no peripheral relaxation. It defaults to `0.1`; a larger value makes more of the view central, while `1` disables peripheral deferral. A missing or invalid field of view uses the established 60-degree fallback.

Outside the cone, `foveatedMinimumScreenSpaceErrorRelaxation` and `foveatedInterpolationCallback` describe a logical-pixel relaxation that grows toward the viewport edge. This value decides whether a peripheral request is eligible to wait; it is not subtracted from the tile's final refinement SSE. The callback receives minimum relaxation, maximum relaxation, and a normalized `[0, 1]` position, and returns logical pixels. Non-finite results safely fall back to zero relaxation.

Angular foveation is disabled for orthographic viewports because parallel projection has no perspective view axis convergence. Progressive and reverse-SSE ordering remain active there.

## Camera Motion and Deferral

`Tileset3D` retains camera position and direction separately for each viewport. When either changes beyond a small numeric tolerance, eligible peripheral requests may wait up to `foveatedTimeDelay` seconds (`0.2` by default). Continuing motion pushes the retry window forward. A single follow-up traversal is scheduled when the window expires, so requests recover even if the application supplies no further camera event.

Deferral is applied both to new candidates and to requests already waiting for a concurrency slot. If camera motion makes a queued request deferrable, its scheduler callback cancels that queue entry before network access begins. The follow-up traversal submits it again after the delay. Requests whose fetch has already started are not interrupted. Once the delay expires, the active deferral flag and its priority effect are removed together, so released work cannot remain artificially penalized while the camera is stationary.

The first observed camera pose is treated as stationary; initial tileset loading is not delayed.

Deferral preserves refinement safety:

- `ADD` descendants may wait because the ancestor remains rendered.
- Skip-LOD `REPLACE` descendants may wait when an available ancestor supplies coverage.
- Progressive tiles needed for broad initial coverage do not wait.
- Traditional `REPLACE` children never wait because all required children must be ready before the parent disappears.

Traditional replacement children are still ordered center-first; only the temporary pause is disabled.

## Complete Priority Order

Deferred work is kept out of the scheduler queue until it becomes eligible. Among requests that may start, smaller numeric priorities produce this lexicographic order:

1. Progressive coarse coverage before fine detail.
2. Center content before peripheral content.
3. Established reverse-SSE order as the tie-breaker.

Each queued measurement is normalized into its own numeric band, preventing an extreme SSE or angle from overpowering a stronger invariant.

## Options

| `Tileset3D` option | Default | Effect |
| --- | ---: | --- |
| `maxRequests` | `64` | Maximum simultaneous requests when throttling is enabled. |
| `progressiveResolutionHeightFraction` | `0.3` | Reduced-height coarse coverage; `0` disables it. |
| `foveatedScreenSpaceError` | `true` | Enables perspective center-first ranking and eligible deferral. |
| `foveatedConeSize` | `0.1` | Unrelaxed center fraction of the perspective field of view. |
| `foveatedMinimumScreenSpaceErrorRelaxation` | `0` | Logical-pixel relaxation at the cone edge. |
| `foveatedInterpolationCallback` | linear | Shapes relaxation from center cone to viewport edge. |
| `foveatedTimeDelay` | `0.2` | Maximum stationary wait after motion, in seconds. |

## Example

Suppose a pan reveals a coarse central building tile, a coarse edge tile, and fine descendants for both. Progressive priority first favors the two coarse coverage tiles. Within that band, the central tile starts first. During continued motion, safe peripheral fine descendants can wait. About `0.2` seconds after movement settles, a scheduled traversal makes them eligible, and normal loading converges on the same final SSE target.

## What Foveation Does Not Do

- It does not change URLs, request headers, authentication, range requests, or server behavior.
- It does not permanently omit peripheral content.
- It does not change the tileset's geometric errors.
- It does not replace cache eviction or request concurrency controls.
- It does not make culled or unavailable tiles loadable.

For symptoms and tuning sequences, see [Runtime tuning and diagnostics](./runtime-tuning-and-diagnostics).
