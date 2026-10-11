# PointCloudTileSource

Creates a dynamic additive octree from a decoded point `Mesh` or `MeshArrowTable`.
This is the point-cloud counterpart to dynamic vector tiling: it generates a hierarchy
in memory and gathers content only when requested. It works in browsers and Node.js.

```typescript
import {PointCloudTileSourceLoader} from '@loaders.gl/tiles';
import {PointCloudTileset} from '@loaders.gl/tiles';

const runtime = await PointCloudTileSourceLoader.preload();
const source = runtime.createDataSource(pointMesh, {
  pointCloudTiler: {nodePointLimit: 10000, maximumDepth: 12}
});
await source.ready;
const tileset = new PointCloudTileset(source, {pointBudget: 1000000});
await tileset.selectTiles(viewport);
// Render tileset.selectedTiles; update selection when the camera changes.
```

The runtime is also available directly:

```typescript
import {PointCloudTileSource} from '@loaders.gl/tiles/point-cloud-tile-source';
const source = new PointCloudTileSource(pointMesh);
```

## Input and coordinates

Input must be an unindexed `point-list` mesh with decoded, finite XYZ positions in a
`Float32Array` or `Float64Array`, or its Arrow equivalent. Other typed attributes retain
component widths, normalization flags, raw values and row association, including 64-bit IDs.
Arrow attributes must have no null values; map nullable attributes explicitly before tiling.
Strided meshes require an explicit `header.vertexCount`. Keep input and metadata immutable
until `close()`.

The tiler is format-independent: decoded LAS/LAZ, PCD, point-only PLY, Draco point clouds,
and loaded Potree/COPC tile content can use this contract. A generic Arrow table with separate
X/Y/Z columns needs normalization to `POSITION`; a source object, batch iterator, indexed mesh,
or encoded/quantized position attribute is not a direct input. Load and normalize a bounded
dataset or batch before creating the tiler.

Arrow input is converted to Mesh typed attributes for indexing and can copy or concatenate
buffers. Direct Mesh input retains its attribute arrays. This is not a zero-copy Arrow index.

Positions remain in native coordinates. The source performs no CRS inference or projection.
Pass `pointCloudTiler.spatialReference` when the CRS is known. Returned content has Cartesian
coordinates, origin `[0, 0, 0]` and native bounds; geometric error is in source units.
Applications must configure placement and viewport projection for that coordinate system.

## Hierarchy and ownership

The root is `r`. Child digits use XYZ octant bits `4/2/1`; midpoint points belong to the
upper child. Each nonterminal node retains the first point in each sparse-grid cell,
up to `nodePointLimit`. Descendants contain only the remaining rows. Complete traversal
retains every source point exactly once. Render parent and selected descendants together
(additive refinement).

Child partitions are built lazily by `getChildren()`. Concurrent requests for the same
partition share one operation. Terminal nodes retain all remaining points, so coincident
points or the depth limit can produce content larger than `nodePointLimit`.

The source exposes `getRootTile()`, `getChildren(tile)`, `loadTileContent(tile)`,
`getMetadata()` and `close()`. Content is a fresh Arrow table on each request; the source
has no content cache. `PointCloudTileset` owns rendering selection and caching.

## Limits and lifecycle

| `pointCloudTiler` option | Default | Meaning |
| --- | --- | --- |
| `nodePointLimit` | 50,000 | Target retained sample rows per nonterminal node; maximum 1,000,000 |
| `maximumDepth` | 16 | Maximum depth, between 0 and 24 |
| `maxInputBytes` | 512 MiB | Unique retained source attribute buffers; Arrow buffers checked before conversion |
| `maxIndexBytes` | 128 MiB | Live typed row-index allocations, including split temporaries |
| `maxTileBytes` | 64 MiB | Packed attributes in one gathered tile |
| `maxNodes` | 100,000 | Discovered node count |
| `signal` | — | Cooperative cancellation during indexing, splitting and gathering |
| `spatialReference` | — | Explicit CRS metadata to attach to content |

Limits reject before the corresponding typed allocation. They are separate budgets, not a
ceiling on total JavaScript heap use: Arrow conversion, maps, grid sets, metadata, returned
tables and application caches also consume memory. A failed partial split closes the index.
Call `close()` to release retained input/index state and cancel pending operations.

This first version accepts already decoded data. Streaming/out-of-core indexing, spatial
sorting, worker execution, file-format writers and a drag-and-drop example are follow-ups.

## Lower-level authoring

`PointCloudTiler` from `@loaders.gl/schema-utils` exposes the same portable index without
the tile runtime or Arrow output wrapper. Await `ready`, then call `getRootNode()`,
`getChildNodes(id)`, `getNodeMetadata(id)` and `getTileMesh(id)`. Each output is a fresh
packed mesh, suitable for point-format writers. Call `close()` when finished.
