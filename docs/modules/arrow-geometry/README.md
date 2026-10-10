---
title: Arrow geometry module
---

# Arrow geometry builders

`@loaders.gl/arrow-geometry` builds Arrow-compatible geometry arrays and
triangulates WKB geometry. It supplies shared construction primitives to other
loaders.gl modules.

```bash
npm install @loaders.gl/arrow-geometry
```

| API | Purpose |
| --- | --- |
| `GeoArrowBuilder` | Writes native GeoArrow geometry with configurable dimensions and coordinate layout. |
| `WKBBuilder` | Writes WKB geometry arrays with associated Arrow-compatible buffers. |
| `triangulateWKB` | Triangulates polygonal WKB geometry. |

Applications that need table conversion, validation, coordinate transforms, or
spatial indexing should start with [GeoArrow processing](/docs/modules/geoarrow).
Loader authors should import builders directly from this package and select a
focused subpath for output construction. These helpers do not depend on GIS,
GeoArrow processing, or core.

## Loader output helpers

| Subpath | Purpose |
| --- | --- |
| `geometry-field` | Geometry fields, column metadata, WKB values and dimensional metadata. |
| `wkb-arrow-utils` | Arrow Binary data and geometry tables from values or writer callbacks. |
| `feature-collection-to-arrow` | Property-preserving feature-to-WKB table construction. |
| `feature-table` | Feature-to-native/WKB/WKT table construction and legacy CRS metadata. |
| `geojson-table` | Materialize a primary geometry column as a GeoJSON table. |
| `binary-features` | Allocating legacy Arrow-to-renderer conversion and triangulation helpers. |
| `legacy-binary` | Shared GeoJSON/FlatGeoJSON-to-renderer conversion, geometry counts and numeric attributes. |
| `sampled-bounds` | Sampled coordinate bounds; not an exact full scan. |
| `binary-geometry-to-wkb` | Legacy binary geometry writing and in-place WKB reprojection. |
| `geometry-codecs` | Shared loaders.gl output compatibility over math.gl WKB/WKT codecs. |

```typescript
import {makeWKBGeometryField} from '@loaders.gl/arrow-geometry/geometry-field';
import {makeWKBGeometryDataFromWriters} from '@loaders.gl/arrow-geometry/wkb-arrow-utils';
import {getGeoMetadata} from '@loaders.gl/schema';
```

The codec subpath preserves null-on-invalid WKT, optional EWKT CRS properties,
non-enumerable dimensional markers and empty point coordinates. The WKB writer
retains the legacy dimensional options; use math.gl's WKBBuilder when writing
EWKB SRIDs. Native, serialized and renderer outputs keep their existing shapes.
Materializing GeoJSON, renderer arrays or serialized bytes may allocate; these
APIs do not promise borrowed, zero-allocation batch views.

Native feature tables preserve declared M/ZM axes, including empty measured
geometries. Mixed Z and M inputs promote to ZM with missing axes filled with NaN;
geometry type metadata describes the stored dimension. For legacy binary inputs,
pass the same `hasZ`/`hasM` options to `inferBinaryGeometryTypes` and the WKB writer.
Three ordinates otherwise mean XYZ, and four mean XYZM.

The `legacy-binary` subpath exports `convertGeojsonToBinaryFeatureCollection`,
`convertGeojsonToFlatGeojson`, `convertFlatGeojsonToBinaryFeatureCollection`,
`getGeometryInfo`, `extractNumericPropTypes`, and their option/info types. It retains the existing position
precision, vertex-based offsets, feature IDs, numeric attributes, ring-winding
and triangulation behavior. Ring-winding correction may mutate input rings, as
before; clone GeoJSON first when its coordinates must remain unchanged.
This is one shared compatibility implementation for loader outputs, not a new
canonical geometry representation or a converter registry.

GIS compatibility exports remain available during the staged migration. Rich
conversion registries, spatial processing and application APIs belong in
GeoArrow, not in this construction package.
