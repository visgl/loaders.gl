import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Implicit Tiling and Lazy Subtrees

<Tiles3DDocsTabs active="implicit" />

Implicit tiling describes a regular quadtree or octree with coordinate templates instead of listing every tile header in the root tileset JSON. Availability files called **subtrees** say which tiles, content resources, and deeper subtrees exist. loaders.gl loads these availability files lazily so a large implicit tileset can become traversable without downloading its complete hierarchy.

## Explicit and Implicit Hierarchies

An explicit tile stores its child headers directly in `children`. An implicit root stores:

- a `QUADTREE` or `OCTREE` subdivision scheme;
- `subtreeLevels`, the number of tile levels described by each subtree file;
- `availableLevels`, the total number of available global levels, including level zero;
- content and subtree URI templates containing `{level}`, `{x}`, `{y}`, and, for octrees, `{z}`;
- one bounding volume and geometric error from which descendant values are derived.

The source tileset is still authoritative. Lazy loading changes when availability metadata is requested, not the tile coordinates, refinement mode, geometric error, or final selected LOD.

## Lifecycle

The runtime follows this sequence:

```text
parse root JSON
  -> create a contentless implicit-root reference
  -> finish source / tileset initialization (zero subtree requests)
  -> traverse a visible tile
  -> apply viewer request volume and SSE
  -> schedule one subtree request
  -> parse availability and materialize one subtree
  -> leave available child subtrees as lazy references
  -> traverse the new headers on a later update
```

`onTilesetLoad` and `tilesetInitializationPromise` therefore describe root metadata readiness. They do not mean that every implicit availability file has been downloaded.

## When a Subtree Is Requested

A lazy subtree is eligible only when all of these conditions hold:

1. its root tile intersects the current view;
2. the camera is inside its viewer request volume, when one is present;
3. its screen-space error is greater than `maximumScreenSpaceError`;
4. its request receives a slot from the normal request scheduler.

The request uses the tile's existing progressive-resolution and foveated priority. A subtree is not a special HTTP request and does not bypass `maxRequests`, authentication, custom `fetch`, query inheritance, or archive resolution. See [Request scheduling and priorities](./request-scheduling-and-priorities) for the priority calculation and [Screen-space error and LOD](./screen-space-error-and-lod) for the refinement threshold.

If the tile is culled, outside its request volume, or already detailed enough, no subtree request is made.

## One Request, One Subtree Boundary

Each successful request materializes only the tile levels represented by that resource. Availability below the resource boundary becomes contentless runtime headers with another lazy subtree reference. This has two important effects:

- initial work scales with the viewed portion of the hierarchy instead of total tileset depth;
- the scheduler can reprioritize deeper availability as the camera changes.

Repeated requests for the same final subtree URL share an in-flight promise. Settled parsed subtrees are kept in a small source-local least-recently-used cache. Set `loadOptions['3d-tiles'].maximumCachedSubtrees` to control the retained entry count; the default is `32`, and `0` retains only in-flight requests long enough to deduplicate them.

This parsed-metadata cache is separate from `Tileset3D.cacheBytes`, which governs loaded render content and estimated GPU memory. See [Caching and memory](./caching-and-memory).

## Availability and Coordinates

Subtree tile availability is breadth-first by local level and Morton order within a level. For branching factor `N` (`4` for a quadtree and `8` for an octree), the first tile index at local level `L` is:

```text
levelOffset = (N^L - 1) / (N - 1)
tileAvailabilityIndex = levelOffset + localMortonIndex
```

Child-subtree availability describes the single level immediately below the subtree. It uses that level's Morton index directly, without the breadth-first tile offset.

Coordinate arithmetic is performed numerically rather than with 32-bit bitwise concatenation, so valid deep coordinates are not truncated to signed 32-bit values.

## `availableLevels` and the Last Level

`availableLevels` is a count that includes the implicit root:

| `availableLevels` | Valid global tile levels | Last global level |
| ---: | --- | ---: |
| `1` | `0` | `0` |
| `2` | `0, 1` | `1` |
| `6` | `0, 1, 2, 3, 4, 5` | `5` |

The runtime therefore derives `maximumLevel = availableLevels - 1`. It materializes the last valid level but never creates child-subtree references beyond it. The legacy extension spelling `maximumLevel` is interpreted as the last zero-based level because it is already an index rather than a count.

## Geometric Error and Bounding Volumes

Generated geometric error halves once per global level:

```text
tileGeometricError = rootGeometricError / 2^level
```

The normal transform-aware path then converts that local value to world-space `lodMetricValue`. This prevents implicit tiles from bypassing transform-scaled SSE.

Region volumes divide longitude and latitude at every level; octrees also divide height. Oriented boxes divide their half-axis vectors, so rotated boxes do not become axis-aligned accidentally. S2-derived root boxes are retained conservatively for lazy descendants in the lower-level runtime: this avoids incorrect culling while the S2 conversion implementation remains owned by `@loaders.gl/3d-tiles`.

## `ADD` and `REPLACE` While Metadata Loads

The lazy subtree root remains the traversal boundary until its availability request completes.

- With `REPLACE`, an already renderable parent remains safe coverage instead of disappearing before required descendants are known and ready.
- With `ADD`, existing ancestor content remains selected and new descendants augment it after materialization.
- A contentless initial implicit root may produce an empty first frame. Once its first visible subtree is parsed, its declared content and descendants participate in normal content loading.

Subtree completion does not masquerade as tile-content completion or enter the GPU cache. It updates hierarchy metadata, then the next traversal selects and requests render content normally.

## URLs, Authentication, and Archives

Content and subtree templates are resolved against the tileset base URI during normalization. At request time the source applies the same inherited root, session, and tileset-version query parameters used for tile content; parameters already present on the subtree URI win.

An injected `TilesetSourceResolver` receives subtree loads through `loadResource`, so 3TZ and other indexed archives use their existing entry lookup instead of an unrelated network path. The `3d-tiles.isSubtree` loader hint is internal source plumbing; applications should not set it directly.

Destroying the tileset clears the source's URL and parsed-subtree caches and prevents late subtree results from mutating destroyed tiles. Transport-level cancellation depends on whether the injected resolver or core fetch path supports abort signals.

## Runtime Diagnostics

Inspect the subtree root tile and its source:

```ts
const tile = tileset.root

console.log({
  childrenState: tile.childrenState, // unloaded, loading, ready, or failed
  hasUnloadedChildren: tile.hasUnloadedChildren,
  sse: tile._screenSpaceError,
  visibleAndInRequestVolume: tile.isVisibleAndInRequestVolume
})

console.table(source.getImplicitTilingStats())
```

`getImplicitTilingStats()` returns:

| Field | Meaning |
| --- | --- |
| `requestedSubtrees` | Resolver or core-API subtree requests started. |
| `loadedSubtrees` | Successful materializations, including parsed-cache reuse. |
| `cacheHits` | Materializations served from the parsed-subtree cache. |
| `cachedSubtrees` | Parsed subtree entries currently retained. |
| `pendingSubtrees` | Subtree resource requests currently in flight. |
| `materializedTiles` | Runtime headers allocated below existing subtree-root placeholders. |

The underscored SSE field is diagnostic rather than stable API. Use these values together: an unloaded subtree with low SSE is intentionally idle, while an eligible loading subtree should appear in both loading stats and `pendingSubtrees`.

## Troubleshooting

| Symptom | Check | Likely action |
| --- | --- | --- |
| No subtree request | Visibility, viewer request volume, `_screenSpaceError`, threshold | Move the camera into range or lower `maximumScreenSpaceError`; do not force-load the complete hierarchy. |
| Repeated request URL | Final query parameters and `cacheHits` | Ensure signed parameters are stable and increase `maximumCachedSubtrees` if revisits are common. |
| Last level is missing | `availableLevels` and derived last level | Treat `availableLevels` as a count including level zero. |
| Requests continue below the declared depth | Source uses legacy `maximumLevel` or malformed metadata | Verify whether the source property is a count or zero-based index. |
| Parent disappears during refinement | Refinement mode and content readiness | Verify the parent has render content and that traversal is not externally filtering selected coverage. |
| Archive subtree returns 404 | Resolver base path and entry key | Confirm subtree templates resolve inside the archive and that `loadResource` handles the final path. |
| High metadata memory | `cachedSubtrees` and materialized traversal depth | Reduce `maximumCachedSubtrees`; raise the SSE threshold if the view is legitimately exploring too deeply. |

## Current Limitations

- Only the first `contentAvailability` stream is used; `3DTILES_multiple_contents` is not implemented.
- Subtree and tile metadata semantics beyond availability are not materialized yet.
- S2-derived implicit descendants use a conservative root oriented box rather than recomputing a tight S2 box in the `@loaders.gl/tiles` runtime.
- Lazy hierarchy metadata is source-managed; custom source implementations must provide `loadTileChildren` to use the same traversal hook.

See the [3D Tiles implicit tiling specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html#implicit-tiling), [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), [`Tiles3DSource`](/docs/modules/tiles/api-reference/tiles-3d-source), [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d), and [`Tile3D`](/docs/modules/tiles/api-reference/tile-3d) for the surrounding APIs.
