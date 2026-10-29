# GeoArrow processing

`@loaders.gl/core/geoarrow` provides conversion, inspection, validation, and spatial processing for geospatial Arrow tables. Applications can import this utility subpath when they need more than the geometry construction helpers used by loaders.

GeoArrow is independent of the deprecated GIS package. See the [GIS migration map](https://loaders.gl/next/docs/modules/core/geoarrow/gis-migration.md) for replacement imports, the combined `GEOARROW_CONVERTERS` bundle, and legacy rendering allocation semantics.

```
npm install @loaders.gl/core
```

## API groups[​](#api-groups "Direct link to API groups")

| API                                               | Purpose                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GeoArrowTableConverter`                          | Converts between GeoArrow and loaders.gl table shapes through the converter dispatcher. |
| `convertGeoArrowGeometry`                         | Converts geometry columns between WKB, WKT, and native GeoArrow encodings.              |
| `GeoArrowBuilder`                                 | Builds geometry vectors with explicit encoding, coordinate layout, and dimensions.      |
| `validateGeoArrowField`, `validateGeoArrowVector` | Checks declared geometry metadata and vector structure.                                 |
| `inspectGeoArrowVector`, `inspectGeoArrowLayout`  | Inspects geometry values and physical storage.                                          |
| `getGeoArrowBounds`, `getGeoArrowRowBounds`       | Computes whole-vector or per-row bounds.                                                |
| `GeoArrowSpatialIndex`                            | Supports local extent, feature-ID, and nearest-geometry queries.                        |
| `mapGeoArrowCoordinates`, `rewindGeoArrow`        | Transforms coordinates or polygon ring orientation.                                     |

## Geometry conversion[​](#geometry-conversion "Direct link to Geometry conversion")

```
import {convertGeoArrowGeometry} from '@loaders.gl/core/geoarrow';



// geoarrowTable is an existing geospatial Arrow table.

const wkbTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.wkb');
```

See [GeoArrow converters](https://loaders.gl/next/docs/developer-guide/converters/geoarrow-converters.md) for column selection and encoding support, and [spatial queries](https://loaders.gl/next/docs/developer-guide/spatial-queries.md) for index usage and CRS requirements. Loader implementations should use the focused helpers in `@loaders.gl/core/arrow-geometry` instead of depending on the larger processing module.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).

## Inspiration and attribution[​](#inspiration-and-attribution "Direct link to Inspiration and attribution")

Kyle Barron’s [GeoArrow work](https://github.com/geoarrow/geoarrow-js) inspired loaders.gl’s GeoArrow integration and its geospatial Arrow conversion and processing APIs.
