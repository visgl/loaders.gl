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

On viewport changes, cancel the previous request with `controller.abort()` and discard stale
responses before updating application state. Applications own extent caching and deduplication
by stable feature ID. Only mark an extent loaded after a successful response so failures can be
retried. A single request can be truncated by the server: use explicit `count`, `startIndex`, and
stable `sortBy` with `getFeaturesURL()` when completeness matters. Do not assume an extent query
has downloaded the entire dataset or that paging is supported by every server.

## Query a materialized GeoArrow table

```ts
import {GeoArrowSpatialIndex, getGeoArrowFieldInfo} from '@loaders.gl/geoarrow';

// `result` is the ArrowTable returned by the default WFS getFeatures() path.
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

const selectedRows = index.getFeatureRowsInExtent([100, 200, 300, 400]);
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
| `getClosestFeature([x, y], {maxDistance?, filter?})` | `{rowIndex, coordinate, distance}` or null; inclusive distance limit; equal distances choose the earliest row |

Nearest queries refine bounds candidates against actual points, line segments, polygon areas,
and collection members. A point inside a filled polygon has distance zero; holes remain empty.
The returned coordinate supports snapping to geometry, not a vertices-only snapping policy.

Coordinates and query extents must use the same CRS. Distances are planar XY coordinate units;
Z and M are ignored. Project geographic data before metric-distance queries. This API does not
provide geodesic distance, antimeridian wrapping, reprojection, or topology operations.

WKT vectors are converted once to WKB when constructing the index.
Bounds are built once and sorted by minimum X; ID lookups use a map. Extent and nearest queries
can still visit all rows in the worst case. Geometry is decoded only for nearest candidates.
Keep the vector buffers immutable and rebuild the index when data changes. This index covers
only the rows supplied to it, including offscreen rows; it cannot query unloaded server data.
For larger-than-memory analysis, use a source with server-side spatial queries or a spatial
query engine, then index the materialized result as needed.
