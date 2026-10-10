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

GIS compatibility exports remain available during the staged migration. Rich
conversion registries, spatial processing and application APIs belong in
GeoArrow, not in this construction package.
