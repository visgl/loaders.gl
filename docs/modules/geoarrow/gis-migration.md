---
title: Migrating GIS APIs to GeoArrow
---

# Migrating GIS APIs to GeoArrow

GeoArrow is the application-facing owner of geospatial conversion and processing.
It no longer depends on GIS. GIS temporarily forwards retained application APIs
to GeoArrow, while loaders use focused, lower-level entry points.

## Application conversions

```typescript
import {convert} from '@loaders.gl/schema-utils';
import {GEOARROW_CONVERTERS} from '@loaders.gl/geoarrow';

const geometry = convert('POINT (1 2)', 'geojson-geometry', GEOARROW_CONVERTERS);
const binary = convert(features, 'binary-feature-collection', GEOARROW_CONVERTERS);
const restoredFeatures = convert(binary, 'geojson', GEOARROW_CONVERTERS);
```

The opt-in bundle includes table, native geometry-column, single-geometry, and
feature-collection converters. Their existing names and conversion contracts are
retained. `GeometryColumnConverter` is an alias of the working
`GeoArrowGeometryConverter`; the old GIS export was an empty placeholder.

## Replacement imports

The following table covers the retained public GIS export families. Types follow
the same owner as their associated API unless a schema owner is listed.

| Old GIS exports | Replacement |
| --- | --- |
| `GIS_CONVERTERS` | `GEOARROW_CONVERTERS` from `@loaders.gl/geoarrow`; the new bundle also supports GeoArrow tables and columns |
| `GeometryConverter`, `GeometryShape`, `FeatureCollectionConverter`, `FEATURE_COLLECTION_CONVERTERS` | Same names from `@loaders.gl/geoarrow` |
| `GeometryColumnConverter` | `GeoArrowGeometryConverter` from `@loaders.gl/geoarrow` |
| `convertGeometryColumnToBinaryFeatureCollection`, `convertGeometryValuesToBinaryFeatureCollection`, their options and scratch types | Same names from `@loaders.gl/geoarrow` |
| `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection`, `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection` | Same names from `@loaders.gl/geoarrow` |
| `convertBinaryFeatureCollectionToGeojson`, `binaryToGeojson` | `convertBinaryFeatureCollectionToGeojson` or `FeatureCollectionConverter` from `@loaders.gl/geoarrow` |
| `convertGeojsonToBinaryFeatureCollection`, `geojsonToBinary` | `convertGeojsonToBinaryFeatureCollection` or `FeatureCollectionConverter` from `@loaders.gl/geoarrow` |
| `convertGeojsonToFlatGeojson`, `geojsonToFlatGeojson`, `convertFlatGeojsonToBinaryFeatureCollection`, `flatGeojsonToBinary` | Deprecated FlatGeoJSON compatibility; prefer GeoArrow or direct GeoJSON-to-binary conversion. Existing loader kernels remain in `@loaders.gl/arrow-geometry/legacy-binary` |
| `getGeometryInfo`, `getBinaryGeometryInfo`, `BinaryGeometryInfo`, `transformBinaryCoords`, `transformGeoJsonCoords` | Same names from `@loaders.gl/geoarrow`; shared loader transforms remain in `arrow-geometry/legacy-binary` |
| `convertBinaryGeometryToGeometry`, `convertWKBToBinaryGeometry` | Same names from `@loaders.gl/geoarrow` (legacy, allocating outputs) |
| `convertWKBToGeometry`, `convertWKTToGeometry`, `convertGeometryToWKB`, `convertGeometryToWKT` | Same names from `@loaders.gl/geoarrow`; loaders use `@loaders.gl/arrow-geometry/geometry-codecs`. New codec integrations can use `@math.gl/wkb` directly |
| `isWKB`, `isWKT`, `getWKTGeometryType`, `parseWKBHeader`, `WKBHeader`, `WKT_MAGIC_STRINGS` | Retained compatibility names from `@loaders.gl/geoarrow`; prefer `@math.gl/wkb` for new code |
| `getWKTDimension`, `WKTGeometryOptions` | `@loaders.gl/arrow-geometry/geometry-codecs` |
| `getWKBGeometryStatistics`, `WKBGeometryStatistics`, `WKBGeometryBoundingBox` | `scanWKB` and its types from `@math.gl/wkb`; the legacy ISO-number/bbox result is retained in `@loaders.gl/arrow-geometry/wkb-statistics` |
| `convertBinaryGeometryToWKB`, `getBinaryGeometryWKBSize`, `inferBinaryGeometryTypes`, `writeBinaryGeometryToWKB`, `reprojectWKBInPlace` | Same names from `@loaders.gl/geoarrow`; loader implementations/options in `@loaders.gl/arrow-geometry/binary-geometry-to-wkb` |
| `convertTWKBToGeometry`, `convertGeometryToTWKB` | `@loaders.gl/wkt/twkb`; implementation and fixtures stay with WKT |
| `getGeoArrowNativeGeometry`, `GeoArrowNativeGeometry`, `getGeoArrowUnionGeometryKind`, `GeoArrowUnionGeometryKind` | Same names from `@loaders.gl/geoarrow`; shared native reader in `@loaders.gl/arrow-geometry/native-geometry` |
| `GeoArrowBuilder`, `WKBBuilder`, `triangulateWKB` and builder types | `@loaders.gl/arrow-geometry` |
| `convertGeoArrowToBinaryFeatureCollection`, `getBinaryGeometryTemplate`, `getMeanCentersFromBinaryGeometries`, `getTriangleIndices` and rendering types | Same names from `@loaders.gl/geoarrow`; shared loader kernels in `@loaders.gl/arrow-geometry/binary-features` |
| `updateBoundsFromGeoArrowSamples` | Same name from `@loaders.gl/geoarrow` or `@loaders.gl/arrow-geometry/sampled-bounds`; sampling is not an exact scan |
| `convertGeoArrowTableToGeoJSON` | `@loaders.gl/arrow-geometry/geojson-table`, or `GeoArrowTableConverter` for applications |
| `convertWKBTableToGeoJSON` | Same name from `@loaders.gl/geoarrow`; loaders use `@loaders.gl/arrow-geometry/wkb-table` |
| `convertFeatureCollectionToGeoArrowTable`, `convertFeaturesToGeoArrowTable` | Same names from `@loaders.gl/geoarrow`; loader kernels in `@loaders.gl/arrow-geometry/feature-table` |
| Legacy CRS, feature-schema, feature-row and encoding-preference helpers/options | `@loaders.gl/arrow-geometry/feature-table` |
| `makeGeoArrowGeometryField`, `makeWKBGeometryField`, `set*Geometry*Metadata`, `encodeWKBGeometryValue`, `getGeometryWKBOptions`, `inferGeoParquetGeometryTypes`, `getCoordinateDimensions`, `getGeometrySampleCoordinates` | `@loaders.gl/arrow-geometry/geometry-field` |
| `makeWKBGeometryArrowTable*`, `makeWKBGeometryData*` and WKB Arrow options | `@loaders.gl/arrow-geometry/wkb-arrow-utils` |
| `buildFeatureArrowSchema`, `convertFeaturesToWKBArrowTable` | `@loaders.gl/arrow-geometry/feature-collection-to-arrow` |
| `GeoJSONGeometry`, geometry/metadata types, `getGeoMetadata`, `setGeoMetadata`, `unpackGeoMetadata`, JSON metadata and key/value helpers | `@loaders.gl/schema` (use `Geometry` instead of `GeoJSONGeometry`) |
| Metadata validators and generated JSON Schemas | `@loaders.gl/schema/geospatial-metadata-zod-schema` and the schema package's JSON Schema subpaths |
| `encodeHex`, `decodeHex` | `@loaders.gl/loader-utils` |
| `_extractNumericPropTypes` | Internal legacy helper in `@loaders.gl/arrow-geometry/legacy-binary`; do not build new application code around it |

## Ownership and allocation

Native per-row bounds use the shared Arrow adapter and math.gl kernels, preserving
chunk and slice boundaries, null/empty rows, finite XY behavior and box bounds.
The single-cell bounds API remains a compatibility path for already-materialized
Arrow values. Bounds computation allocates result storage.

Legacy BinaryGeometry, BinaryFeatureCollection and ArrowBinaryFeatureCollection
retain their current layouts and conversion behavior. Rendering conversion can
allocate coordinates, offsets, feature IDs, attributes and triangles; it is not a
borrowed batch view. The existing native reader also materializes coordinate arrays.
Zero-allocation native batch views are a separate, additive tranche.

The remaining GIS package, application/deck-layer imports and shared test fixtures
are temporary compatibility work for later removal. Loaders do not depend on GIS
or the larger GeoArrow processing package, directly or transitively.
