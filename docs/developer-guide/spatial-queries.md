# Spatial queries beyond picking

Picking identifies rendered objects under screen coordinates. Data queries operate on a source or
materialized table, including offscreen features. Keep these operations separate: use deck.gl
picking for hover/click feedback, a vector source for remote extent requests, and
`GeoArrowSpatialIndex` from `@loaders.gl/geoarrow` for local selection and snapping.

## Load an extent from WFS

```ts
import {createDataSource} from '@loaders.gl/core';
import {WFSSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(wfsUrl, [WFSSourceLoader], {
  wfs: {wfsParameters: {version: '2.0.0', crs: 'EPSG:3857'}}
});
const controller = new AbortController();
const result = await source.getFeatures({
  layers: ['workspace:roads'],
  boundingBox: [[minimumX, minimumY], [maximumX, maximumY]],
  crs: 'EPSG:3857',
  signal: controller.signal
});
```

WFS generic extent coordinates are XY in `requestCrs`, defaulting to the requested output `crs`
(or the configured default, falling back to EPSG:4326). The source encodes protocol axis order. It does not transform coordinates.
For different input/output CRSs, set `requestCrs` for the generic bounding box and `crs` for
the returned features, or use `getFeaturesURL()` with a five-element `bbox` ending in its CRS
and an independent `srsName`. The server must support the requested output projection.

## Manage loaded extents

Wrap any GeoJSON-capable `VectorSource`, including WFS and OGC API Features, in
`ManagedVectorSource` from `@loaders.gl/wms`:

```ts
import {ManagedVectorSource} from '@loaders.gl/wms';
import type {GetFeaturesParameters} from '@loaders.gl/loader-utils';

const managed = new ManagedVectorSource(source, {maxCachedExtents: 32});
const request: GetFeaturesParameters = {
  layers: ['workspace:roads'],
  boundingBox: [[minimumX, minimumY], [maximumX, maximumY]],
  requestCrs: 'EPSG:3857',
  crs: 'EPSG:3857',
  format: 'arrow'
};
const features = await managed.getFeatures(request);
const loaded = managed.getLoadedExtents(request);
// After external edits, evict intersecting complete requests, or clear everything:
managed.invalidateExtent(request);
managed.clear();
```

The wrapper subtracts verified loaded coverage from a new extent and requests only uncovered
rectangles. Identical in-flight requests share one fetch. Each caller can cancel its own wait;
the fetch continues for remaining callers and is aborted when no callers remain. Clearing or
invalidating cancels pending work and prevents late responses from restoring stale coverage.
Failed, aborted, or incomplete responses can be retried at the same extent.

Completeness is conservative: by default a numeric `numberMatched` or `totalFeatures` must equal
the returned feature count and there must be no `rel: 'next'` link. Unknown counts, truncated pages,
and GML responses without count metadata do **not** establish coverage. A successful HTTP response
alone is not proof of completeness. For a service whose complete-response guarantee you know,
supply `isComplete(table, request)` to certify that guarantee. Automatic WFS/OGC API pagination
is not implemented; use explicit WFS paging or a source that gathers all pages before returning.

The wrapper requests GeoJSON internally and returns GeoJSON by default, with Arrow or binary
conversion available through `format`. Only complete responses are retained; the default limit
is 32 extents, evicted in completion order. Eviction removes that entry's coverage and features,
so a future query reloads the missing area. Partial responses still contribute features to their
current query. Stable IDs deduplicate overlapping responses, newest response wins; numeric and
string IDs differ. Use `getFeatureId(feature)` for property-based IDs. Features without IDs
remain separate. Treat returned feature objects as immutable.

Coverage reuse requires **explicit equivalent `requestCrs` and `crs`**, ordered positive-area
bounds, and the same layer selection. Unknown/different CRSs and degenerate extents pass through
unchanged, avoiding unsafe comparisons between request bounds and response geometry. Cached
queries return geometry-bound candidates intersecting the requested area; null/empty geometries
are excluded. Exact geometry refinement remains an explicit local query. No reprojection or
antimeridian handling is added.

Pass the managed source as `data` to `SourceLayer` or `VectorSourceLayer`; select explicit equivalent
input/output CRSs in the layer options. The layer manages viewport request cancellation and stale
response acceptance. The wrapper manages reusable service coverage. Continue using picking for
rendered hover/click interactions.

## Use the common scan/query interface

Wrap a `VectorSource` in `VectorFeatureTableScanSource` from the optional `@loaders.gl/scan`
package. WFS, OGC API Features, and other sources that honor `format: 'arrow'` can use the same
interface. Bind the service layers, extent, and input/output CRS when creating the table view:

```ts
import {VectorFeatureTableScanSource} from '@loaders.gl/scan';

const scanSource = new VectorFeatureTableScanSource(source, {
  request: {
    layers: ['workspace:roads'],
    boundingBox: [[minimumX, minimumY], [maximumX, maximumY]],
    requestCrs: 'EPSG:3857',
    crs: 'EPSG:3857'
  }
});
const query = {
  predicate: {op: '>', args: [{property: 'speedLimit'}, 50]},
  columns: ['id', 'geometry', 'speedLimit'],
  limit: 100
} as const;

const metadata = await scanSource.getQueryMetadata();
const explanation = await scanSource.explain(query);
const result = await scanSource.query(query); // ArrowTable
for await (const batch of scanSource.scan(query)) {
  // ArrowTableBatch; read(query) exposes the same batch interface.
  console.log(batch.length, batch.data);
}
```

The service applies the bound extent. Predicates, projection, ordering, aggregates, and limits
are evaluated locally on the materialized result. A query limit does not request a server page
size, and results remain limited to the features returned by the service. The adapter does not
translate portable predicates into WFS filters or follow service pagination.

The first metadata, explanation, query, or scan call fetches and caches the bound Arrow table;
subsequent calls reuse it. `scan()` and `read()` emit one materialized result batch rather than
streaming network pages. Create a new adapter to query a different extent or refresh server data.
Failed initial loads can be retried. An `AbortSignal` cancels one caller's wait without canceling
the shared fetch needed by other callers. Spatial metadata describes the request bounds in
`requestCrs` (falling back to `crs`); returned geometries use the requested output CRS.

The queried result can be passed to `GeoArrowSpatialIndex` for local geometry selection and
snapping as shown below. Keep the geometry column in the projection when geometry queries are
needed.

## Query a materialized GeoArrow table

```ts
import {GeoArrowSpatialIndex, getGeoArrowFieldInfo} from '@loaders.gl/geoarrow';

// `result` is an ArrowTable from WFS getFeatures() or the scan adapter query().
const table = result.data;
const field = table.schema.fields.find(candidate => candidate.name === 'geometry');
const encoding = field && getGeoArrowFieldInfo(field)?.encoding;
if (!encoding) throw new Error('Missing GeoArrow geometry encoding');
const geometry = table.getChild('geometry');
if (!geometry) throw new Error('Missing geometry column');
const identifiers = table.getChild('id');
const index = new GeoArrowSpatialIndex(
  geometry,
  encoding,
  identifiers ? Array.from(identifiers) : undefined
);

const candidateRows = index.getFeatureRowsInExtent([100, 200, 300, 400]);
const selectedRows = index.getFeatureRowsIntersectingExtent([100, 200, 300, 400]);
const coordinateRows = index.getFeatureRowsAtCoordinate([150, 250]);
const matchingRows = index.getFeatureRowsById('road.42');
const snap = index.getClosestFeature([150, 250], {
  maxDistance: 10,
  filter: rowIndex => table.getChild('editable')?.get(rowIndex) === true
});
if (snap) {
  const properties = table.get(snap.rowIndex);
  const snappedCoordinate = snap.coordinate;
}
```

`GeoArrowSpatialIndex` accepts a geometry vector, its declared encoding, and optional row-aligned
IDs. IDs may be strings, numbers, bigints, or null. Duplicate IDs return every matching row;
numeric and string IDs are distinct. Row indices are relative to the supplied vector, including
when it is sliced. Null geometry remains available by ID but cannot match spatial queries.

| Method | Result and semantics |
| --- | --- |
| `getFeatureRowsById(id)` | All matching row indices in input order; empty array when absent |
| `getFeatureRowsInExtent([minX, minY, maxX, maxY])` | Inclusive intersection with geometry **bounds**, in input order; may include false positives for concave polygons or holes |
| `getFeatureRowsAtCoordinate([x, y])` | Actual geometry intersection; polygon interiors and all ring boundaries match, holes do not |
| `getFeatureRowsIntersectingExtent([minX, minY, maxX, maxY])` | Actual geometry intersection with a closed rectangle; includes point/line extents and boundary contact |
| `getClosestFeature([x, y], {maxDistance?, filter?})` | `{rowIndex, coordinate, distance}` or null; inclusive distance limit; equal distances choose the earliest row |

Nearest queries refine bounds candidates against actual points, line segments, polygon areas,
and collection members. A point inside a filled polygon has distance zero; holes remain empty.
The returned coordinate supports snapping to geometry, not a vertices-only snapping policy.

Coordinates and query extents must use the same CRS. Distances are planar XY coordinate units;
Z and M are ignored. Project geographic data before metric-distance queries. This API does not
provide geodesic distance, antimeridian wrapping, reprojection, or arbitrary topology operations.
Exact intersection means geometry refinement using ordinary floating-point XY calculations, not
adaptive-precision topology or a proximity tolerance.

WKT vectors are converted once to WKB when constructing the index.
Bounds are built once and sorted by minimum X; ID lookups use a map. Extent and nearest queries
can still visit all rows in the worst case. Geometry is decoded only for exact-intersection and
nearest candidates.
Keep the vector buffers immutable and rebuild the index when data changes. This index covers
only the rows supplied to it, including offscreen rows; it cannot query unloaded server data.
For larger-than-memory analysis, use a source with server-side spatial queries or a spatial
query engine, then index the materialized result as needed.
