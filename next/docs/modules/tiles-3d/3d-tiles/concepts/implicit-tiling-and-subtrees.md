3D Tiles runtime / implicit tiling

![](/next/images/format-logos/3d-tiles-logo.png)

# Expand a hierarchy only where the view needs it.

Implicit tiling describes regular spatial trees with templates and availability data. loaders.gl keeps subtree metadata lazy, so traversal can grow a large hierarchy one visible boundary at a time.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

Availability-driven hierarchy

## The subtree says what exists.

A subtree availability file is not a second tileset. It is a compact answer about which coordinates have tile content or lead to another subtree.

01

Template

Derive resource URLs from level and spatial coordinates.

02

Availability

Read tile, content, and child-subtree presence.

03

Materialize

Install only the visible headers needed by traversal.

04

Continue

Leave deeper subtree roots lazy until they become relevant.

Detailed guide

## Subtree mechanics

The detailed guide covers coordinate arithmetic, content streams, lifecycle states, cache scope, and diagnostic counters.

Implicit tiling describes a regular quadtree or octree with coordinate templates instead of listing every tile header in the root tileset JSON. Availability files called **subtrees** say which tiles, content resources, and deeper subtrees exist. loaders.gl loads these availability files lazily so a large implicit tileset can become traversable without downloading its complete hierarchy.

### Multiple content streams[​](#multiple-content-streams "Direct link to Multiple content streams")

An implicit tile may declare several content templates. The subtree's `contentAvailability` array is aligned with those templates in source order: each available stream is expanded independently and emitted in the tile header's `content` array and `contentUrls` list. A tile with one available stream keeps the legacy single-object `content` shape, and a tile with no available streams remains a contentless connector. Content headers stay associated with their stream, even when an earlier stream is unavailable.

## Explicit and Implicit Hierarchies[​](#explicit-and-implicit-hierarchies "Direct link to Explicit and Implicit Hierarchies")

An explicit tile stores its child headers directly in `children`. An implicit root stores:

* a `QUADTREE` or `OCTREE` subdivision scheme;
* `subtreeLevels`, the number of tile levels described by each subtree file;
* `availableLevels`, the total number of available global levels, including level zero;
* content and subtree URI templates containing `{level}`, `{x}`, `{y}`, and, for octrees, `{z}`;
* one bounding volume and geometric error from which descendant values are derived.

The source tileset is still authoritative. Lazy loading changes when availability metadata is requested, not the tile coordinates, refinement mode, geometric error, or final selected LOD.

## Lifecycle[​](#lifecycle "Direct link to Lifecycle")

The runtime follows this sequence:

```
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

## When a Subtree Is Requested[​](#when-a-subtree-is-requested "Direct link to When a Subtree Is Requested")

A lazy subtree is eligible only when all of these conditions hold:

1. its root tile intersects the current view;
2. the camera is inside its viewer request volume, when one is present;
3. it is the level-zero subtree, or its screen-space error is greater than `maximumScreenSpaceError`;
4. its request receives a slot from the normal request scheduler.

The visible level-zero subtree is requested once regardless of SSE because its placeholder has no materialized hierarchy to traverse. Deeper subtree boundaries retain the normal SSE gate.

The request uses the tile's existing progressive-resolution and foveated priority. A subtree is not a special HTTP request and does not bypass `maxRequests`, authentication, custom `fetch`, query inheritance, or archive resolution. See [Request scheduling and priorities](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md) for the priority calculation and [Screen-space error and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md) for the refinement threshold.

If the tile is culled or outside its request volume, no subtree request is made. An already detailed enough tile suppresses deeper subtree requests, but not the initial level-zero hierarchy request.

## One Request, One Subtree Boundary[​](#one-request-one-subtree-boundary "Direct link to One Request, One Subtree Boundary")

Each successful request materializes only the tile levels represented by that resource. Availability below the resource boundary becomes contentless runtime headers with another lazy subtree reference. This has two important effects:

* initial work scales with the viewed portion of the hierarchy instead of total tileset depth;
* the scheduler can reprioritize deeper availability as the camera changes.

Repeated requests for the same final subtree URL share an in-flight promise. Settled parsed subtrees are kept in a small source-local least-recently-used cache. Set `loadOptions['3d-tiles'].maximumCachedSubtrees` to control the retained entry count; the default is `32`, and `0` retains only in-flight requests long enough to deduplicate them.

This parsed-metadata cache is separate from `Tileset3D.cacheBytes`, which governs loaded render content and estimated GPU memory. See [Caching and memory](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory.md).

## Availability and Coordinates[​](#availability-and-coordinates "Direct link to Availability and Coordinates")

Subtree tile availability is breadth-first by local level and Morton order within a level. For branching factor `N` (`4` for a quadtree and `8` for an octree), the first tile index at local level `L` is:

```
levelOffset = (N^L - 1) / (N - 1)

tileAvailabilityIndex = levelOffset + localMortonIndex
```

Child-subtree availability describes the single level immediately below the subtree. It uses that level's Morton index directly, without the breadth-first tile offset.

Coordinate arithmetic is performed numerically rather than with 32-bit bitwise concatenation, so valid deep coordinates are not truncated to signed 32-bit values.

## `availableLevels` and the Last Level[​](#availablelevels-and-the-last-level "Direct link to availablelevels-and-the-last-level")

`availableLevels` is a count that includes the implicit root:

| `availableLevels` | Valid global tile levels | Last global level |
| ----------------- | ------------------------ | ----------------- |
| `1`               | `0`                      | `0`               |
| `2`               | `0, 1`                   | `1`               |
| `6`               | `0, 1, 2, 3, 4, 5`       | `5`               |

The runtime therefore derives `maximumLevel = availableLevels - 1`. It materializes the last valid level but never creates child-subtree references beyond it. The legacy extension spelling `maximumLevel` is interpreted as the last zero-based level because it is already an index rather than a count.

## Geometric Error and Bounding Volumes[​](#geometric-error-and-bounding-volumes "Direct link to Geometric Error and Bounding Volumes")

Generated geometric error halves once per global level:

```
tileGeometricError = rootGeometricError / 2^level
```

For 3D Tiles 1.x, the normal transform-aware path then converts that local value to world-space `lodMetricValue`. In the experimental draft 2.0 profile, tiles retain the declared geometric error without transform scaling, including at implicit subtree roots. This version gate preserves existing 1.x SSE behavior while applying the draft-specific runtime interpretation consistently.

Region volumes divide longitude and latitude at every level; octrees also divide height. Oriented boxes divide their half-axis vectors, so rotated boxes do not become axis-aligned accidentally. S2-derived descendants use math.gl's Hilbert-aware hierarchy APIs to derive each child token and a matching geospatial oriented box. The original S2 metadata is retained on each generated header, and S2 boxes remain world-space when runtime tile transforms are applied.

## `ADD` and `REPLACE` While Metadata Loads[​](#add-and-replace-while-metadata-loads "Direct link to add-and-replace-while-metadata-loads")

The lazy subtree root remains the traversal boundary until its availability request completes.

* With `REPLACE`, an already renderable parent remains safe coverage instead of disappearing before required descendants are known and ready.
* With `ADD`, existing ancestor content remains selected and new descendants augment it after materialization.
* A contentless initial implicit root may produce an empty first frame. Once its first visible subtree is parsed, its declared content and descendants participate in normal content loading.

Subtree completion does not masquerade as tile-content completion or enter the GPU cache. It updates hierarchy metadata, then the next traversal selects and requests render content normally.

For payload-level compatibility, the [3D Tiles format matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md#tile-payloads) records i3dm orientation support, including octahedrally encoded instance directions.

## Metadata topology[​](#metadata-topology "Direct link to Metadata topology")

The loader preserves metadata declarations at every currently representable level of the 3D Tiles hierarchy: inline or external schemas, tileset groups and metadata, explicit tile and content metadata, and property-table references carried by implicit subtrees. For draft glTF subtrees it also decodes property-table rows and standard tile/content attribute accessors. Available rows are tightly packed, so sparse availability is mapped to the matching row before URI substitution or attribute overrides are applied.

For 1.1 subtrees these fields remain lossless references. Draft glTF `3DTILES_subtree` resources add decoded tile/content attributes and property-table rows. Generated headers apply availability first, then attribute overrides, then property values. A property-backed URI placeholder resolves from the content row, then the tile row, then the implicit coordinate (`level`, `x`, `y`, `z`). Direct box, sphere, ellipsoid-region, S2, and cylinder-region values are normalized to runtime volumes; conservative oriented boxes are used where the runtime has no exact native volume.

## URLs, Authentication, and Archives[​](#urls-authentication-and-archives "Direct link to URLs, Authentication, and Archives")

Content and subtree templates are resolved against the tileset base URI during normalization. At request time the source applies the same inherited root, session, and tileset-version query parameters used for tile content; parameters already present on the subtree URI win.

An injected `TilesetSourceResolver` receives subtree loads through `loadResource`, so 3TZ and other indexed archives use their existing entry lookup instead of an unrelated network path. The `3d-tiles.isSubtree` loader hint is internal source plumbing; applications should not set it directly.

Destroying the tileset clears the source's URL and parsed-subtree caches and prevents late subtree results from mutating destroyed tiles. Transport-level cancellation depends on whether the injected resolver or core fetch path supports abort signals.

## Runtime Diagnostics[​](#runtime-diagnostics "Direct link to Runtime Diagnostics")

Inspect the subtree root tile and its source:

```
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

| Field               | Meaning                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `requestedSubtrees` | Resolver or core-API subtree requests started.                      |
| `loadedSubtrees`    | Successful materializations, including parsed-cache reuse.          |
| `cacheHits`         | Materializations served from the parsed-subtree cache.              |
| `cachedSubtrees`    | Parsed subtree entries currently retained.                          |
| `pendingSubtrees`   | Subtree resource requests currently in flight.                      |
| `materializedTiles` | Runtime headers allocated below existing subtree-root placeholders. |

The underscored SSE field is diagnostic rather than stable API. Use these values together: an unloaded subtree with low SSE is intentionally idle, while an eligible loading subtree should appear in both loading stats and `pendingSubtrees`.

## Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

| Symptom                                    | Check                                                             | Likely action                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| No subtree request                         | Visibility, viewer request volume, `_screenSpaceError`, threshold | Move the camera into range or lower `maximumScreenSpaceError`; do not force-load the complete hierarchy.  |
| Repeated request URL                       | Final query parameters and `cacheHits`                            | Ensure signed parameters are stable and increase `maximumCachedSubtrees` if revisits are common.          |
| Last level is missing                      | `availableLevels` and derived last level                          | Treat `availableLevels` as a count including level zero.                                                  |
| Requests continue below the declared depth | Source uses legacy `maximumLevel` or malformed metadata           | Verify whether the source property is a count or zero-based index.                                        |
| Parent disappears during refinement        | Refinement mode and content readiness                             | Verify the parent has render content and that traversal is not externally filtering selected coverage.    |
| Archive subtree returns 404                | Resolver base path and entry key                                  | Confirm subtree templates resolve inside the archive and that `loadResource` handles the final path.      |
| High metadata memory                       | `cachedSubtrees` and materialized traversal depth                 | Reduce `maximumCachedSubtrees`; raise the SSE threshold if the view is legitimately exploring too deeply. |

## Current Limitations[​](#current-limitations "Direct link to Current Limitations")

* Implicit multiple-content availability is materialized in source order. Applications still decide how to compose or render heterogeneous content types returned by the streams.
* Legacy 1.1 subtree metadata references (`propertyTables`, `tileMetadata`, `contentMetadata`, and `subtreeMetadata`) are preserved on generated headers as `implicitMetadata`; draft glTF subtree rows are decoded only for the supported scalar, vector, matrix, string, and enum profile.
* S2-derived implicit descendants use math.gl S2 descendant indexing and recompute a matching oriented box in the `@loaders.gl/tiles` runtime.
* Lazy hierarchy metadata is source-managed; custom source implementations must provide `loadTileChildren` to use the same traversal hook.

See the [3D Tiles implicit tiling specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html#implicit-tiling), [`Tiles3DLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md), [`Tiles3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md), [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md), and [`Tile3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tile-3d.md) for the surrounding APIs.

## Conformance and lifecycle guarantees[​](#conformance-and-lifecycle-guarantees "Direct link to Conformance and lifecycle guarantees")

Each implicit boundary owns its own load lifecycle. Concurrent traversals of the same boundary share one in-flight request, while distinct boundaries may load concurrently through the request scheduler. A boundary remains a traversal boundary until metadata arrives and can retry after a failed request. Availability at the final valid global level does not create another subtree reference. QUADTREE and OCTREE fixtures cover sparse availability, contentless connectors, region and oriented-box subdivision, multiple content streams, and transformed geometric error. These guarantees keep duplicate requests bounded without changing the eventual SSE-selected level.
