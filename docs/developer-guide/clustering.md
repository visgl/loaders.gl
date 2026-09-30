# Clustering features

> **Experimental:** `ClusterSource` and its construction options may change in future releases.

`@loaders.gl/geoarrow` provides an independent, immutable clustering engine and a `ClusterSource`
adapter for complete, materialized GeoJSON and GeoArrow tables. It does not depend on Supercluster.
Clusters retain original row references, counts, numeric aggregates, and a hierarchy for member
selection and click-to-expand interactions.

Try the [interactive clustering example](/examples/geospatial/clustering) with pixel-radius
controls, polygon centroids, count labels, cluster expansion, and original-feature selection.
Its standalone source is in `examples/website/clustering`.

## Cluster a table

```typescript
import {ClusterSource} from '@loaders.gl/geoarrow/cluster-source';

const source = new ClusterSource(table, {
  radiusPixels: 40,
  maxZoom: 16,
  minPoints: 2,
  aggregations: {
    population: {column: 'population', operation: 'sum'}
  }
});

const markers = await source.getFeatures({
  layers: 'clusters',
  boundingBox: [[-123, 37], [-121, 39]],
  zoom: 8,
  format: 'geojson'
});
```

Every request must include `zoom`. Bounds are `[west, south], [east, north]` in longitude/latitude;
`west > east` queries across the antimeridian. Supported output CRS identifiers are `EPSG:4326`,
`OGC:CRS84`, and `CRS:84`, all with longitude first. The source does not reproject input data.
`requestCrs` accepts the same identifiers for the query bounds; projected bounds are rejected.

Output marker properties are:

| Property | Meaning |
| --- | --- |
| `cluster` | Whether this marker represents multiple input rows |
| `clusterId` | Index-local node ID, also present as GeoJSON feature `id` |
| `pointCount` | Number of included input rows |
| `rowIndex` | Original table row for a single feature, otherwise null |
| Named aggregates | Requested `sum`, `min`, or `max` values |

The reserved properties above and `geometry` cannot be used as aggregate names. Numeric
aggregations require finite numbers for all included rows; nulls, strings, bigint, and overflow
are rejected. A leaf's aggregate is its original numeric value.

Original feature properties are retrieved through `source.getFeature(rowIndex)` instead of being
copied into every cluster marker. GeoJSON feature IDs and geometries remain available there.
Arrow member properties and geometry are materialized only when requested. Keep source input
immutable so that member retrieval continues to agree with the snapshotted index.

The default output is an Arrow table with `geoarrow.wkb` geometry and a stable property schema,
including for empty results. `format: 'binary'` returns a binary feature collection. Arrow output
also accepts `geoarrow: {encodingPreference: 'optimized'}` for native points or
`{encodingPreference: 'geoarrow.geometry'}` for a dense union. `getSchema()` describes the default
WKB output. `getMetadata()` advertises one layer named `clusters`.

## Work directly with coordinate buffers

```typescript
import {ClusterIndex} from '@loaders.gl/geoarrow/cluster-index';

const index = new ClusterIndex(new Float64Array([
  -122.40, 37.78,
  -122.41, 37.79,
  -73.98, 40.75
]), {
  rowIndices: [10, 20, 30],
  radiusPixels: 40,
  aggregations: {
    total: {values: new Float64Array([2, 3, 5]), operation: 'sum'}
  }
});

const nodes = index.getClusters([-180, -90, 180, 90], 3);
const cluster = nodes.find(node => node.isCluster);
if (cluster) {
  const children = index.getChildren(cluster.id);
  const originalRows = index.getLeaves(cluster.id, {limit: 100, offset: 0});
  const expansionZoom = index.getExpansionZoom(cluster.id);
}
```

Coordinate arrays contain interleaved longitude/latitude pairs. Optional `rowIndices` and
aggregation arrays align with those pairs. Coordinates, row references, and aggregate values are
copied during construction; later input mutations cannot change the hierarchy. Node results and
property objects are independent snapshots. No input feature objects are required.

| Option | Default | Meaning |
| --- | --- | --- |
| `radiusPixels` | `40` | Positive seed-neighborhood radius in map pixels |
| `tileSize` | `512` | World width in pixels at zoom zero; match the map's zoom convention |
| `minZoom` | `0` | Lowest stored integer zoom |
| `maxZoom` | `16` | Highest clustered integer zoom, at most 30 |
| `minPoints` | `2` | Minimum descendant count needed to create a cluster |

Queries floor fractional zoom and clamp to `[minZoom, maxZoom + 1]`. At `maxZoom + 1`, all markers
are leaves, including coincident positions. `getExpansionZoom()` returns the first level where
a cluster splits; applications may show a member list when zooming cannot visually separate
coincident features. `getNode(id)` retrieves one leaf or cluster. Hierarchy methods reject leaf
IDs where a cluster is required. `getLeaves()` defaults to 100 rows, accepts `limit: Infinity`,
and skips complete subtrees when applying `offset`.

## Use other geometries

The default `positionStrategy: 'point'` includes only Point geometries. Empty and null geometries
are skipped without renumbering original rows. An explicit strategy produces one representative
per feature, including multipart features:

| Strategy | Behavior |
| --- | --- |
| `centroid` | Area-weighted polygon center, subtracting holes; length-weighted line center; mean of multipoints |
| `bounds-center` | Midpoint of the geometry's XY bounds |
| `line-midpoint` | Halfway along cumulative line length, without bridging multipart gaps |

Collections average their nonempty child centroids. Degenerate polygons fall back to boundary
centroids. These policies use planar coordinates, ignore Z/M, and do not guarantee an interior
point for polygons. They do not unwrap dateline-crossing rings. For projected, geodesic, or
interior-point placement, provide a callback returning longitude/latitude:

```typescript
const source = new ClusterSource(table, {
  getClusterPosition: (geometry, rowIndex) => {
    // Return a longitude/latitude tuple, or null to exclude this row.
    return applicationPositions[rowIndex];
  }
});
```

The callback takes precedence over `positionStrategy` and runs once per original row. The
`getRepresentativePoint()` helper is also available independently from
`@loaders.gl/geoarrow/get-representative-point`. Native GeoArrow Point input uses direct buffer
bounds to extract coordinates without creating GeoJSON feature objects. Other encodings and
custom callbacks decode one geometry at a time during construction.

Arrow input must identify a geometry column through extension metadata. `geometryColumn` selects
the desired column when more than one is present. Coordinate reference systems must be normalized
before clustering; numeric coordinate ranges alone cannot prove that input is geographic.

## Rendering and selection

The repository's private `@loaders.gl/deck-layers` package includes `ClusterLayer`, which renders
circles and count labels and returns the same `ClusterNode` from marker and label picking:

```typescript
import {ClusterLayer} from '@loaders.gl/deck-layers';

const layer = new ClusterLayer({
  id: 'places',
  data: source,
  onClick: ({object}) => {
    if (!object) return;
    if (object.isCluster) {
      showMembers(source.index.getLeaves(object.id));
      moveCamera(object.position, source.index.getExpansionZoom(object.id));
    } else {
      selectFeature(source.getFeature(object.rowIndex));
    }
  }
});
```

`showMembers`, `moveCamera`, and `selectFeature` above are application callbacks. `markerProps`
and `labelProps` customize appearance; node data and positions remain source-controlled. The
application owns persistent selection and camera transitions. `VectorSourceLayer` can also render
the source and now forwards zoom as part of its request and cache key. `deck-layers` remains an
internal package; the public source/index APIs can be used with any renderer.

## Algorithm and lifecycle

The engine projects into normalized Web Mercator, clusters from high zoom to low zoom, and uses
sparse spatial bins to discover neighbors. Each unassigned seed groups unassigned neighbors
inside its radius; cluster centers are weighted by original point count. Membership is disjoint
at each level, and parent counts and aggregates combine their children. Unchanged levels share
their typed-array storage. Cluster centers and neighborhood searches wrap across longitude 180.

Grouping is deterministic for identical input order and options. It is not connected-component
clustering, and permuting input can change groups. IDs are local to an index and must not be
persisted across rebuilds. Pixel radius refers to the map projection and integer zoom, not exact
screen distance under pitch, perspective, or globe rendering. Marker collision avoidance and
spiderfying coincident points are separate rendering concerns.

Build from the complete dataset, then query visible cluster centers. Clustering only the currently
fetched viewport can change membership and undercount offscreen members. Remote paging,
incremental mutation, filtering, and worker scheduling are application responsibilities. Replace
the index/source after changing data, radius, representative policy, or filters. Construction is
synchronous, with storage proportional to the total retained nodes across zoom levels; use a
worker for large datasets. Sparse extent queries use the grid, while broad extents scan the level.
