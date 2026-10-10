---
title: GeoArrow module
---

# GeoArrow processing

`@loaders.gl/geoarrow` provides conversion, inspection, validation, and spatial
processing for geospatial Arrow tables. Applications can install it when they
need more than the geometry construction helpers used by loaders.

```bash
npm install @loaders.gl/geoarrow
```

## API groups

| API | Purpose |
| --- | --- |
| `GeoArrowTableConverter` | Converts between GeoArrow and loaders.gl table shapes through the converter dispatcher. |
| `convertGeoArrowGeometry` | Converts geometry columns between WKB, WKT, and native GeoArrow encodings. |
| `GeoArrowBuilder` | Builds geometry vectors with explicit encoding, coordinate layout, and dimensions. |
| `validateGeoArrowField`, `validateGeoArrowVector` | Checks declared geometry metadata and vector structure. |
| `inspectGeoArrowVector`, `inspectGeoArrowLayout` | Inspects geometry values and physical storage. |
| `getGeoArrowBounds`, `getGeoArrowRowBounds` | Computes whole-vector or per-row bounds. |
| `GeoArrowSpatialIndex` | Supports local extent, feature-ID, and nearest-geometry queries. |
| `mapGeoArrowCoordinates`, `rewindGeoArrow` | Transforms coordinates or polygon ring orientation. |

## Geometry conversion

```typescript
import {convertGeoArrowGeometry} from '@loaders.gl/geoarrow';

// geoarrowTable is an existing geospatial Arrow table.
const wkbTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.wkb');
```

See [GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters)
for column selection and encoding support, and
[spatial queries](/docs/developer-guide/spatial-queries) for index usage and CRS requirements.
Loader implementations should use the focused helpers in `@loaders.gl/arrow-geometry`
instead of depending on the larger processing module.
