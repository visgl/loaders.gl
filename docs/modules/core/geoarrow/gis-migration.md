---
title: Migrating GIS APIs to GeoArrow
---

# Migrating GIS APIs to GeoArrow

GeoArrow is the application-facing owner of geospatial conversion and processing.
The `@loaders.gl/gis` package has been removed from the 5.0 release line. Replace
its dependency and imports using the map below. Loaders use focused, lower-level
entry points; previously published GIS versions remain available.

## Application conversions

```typescript
import {convert} from '@loaders.gl/core/schema-utils';
import {GEOARROW_CONVERTERS} from '@loaders.gl/core/geoarrow';

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
| `GIS_CONVERTERS` | `GEOARROW_CONVERTERS` from `@loaders.gl/core/geoarrow`; the new bundle also supports GeoArrow tables and columns |
| `GeometryConverter`, `GeometryShape`, `FeatureCollectionConverter`, `FEATURE_COLLECTION_CONVERTERS` | Same names from `@loaders.gl/core/geoarrow` |
| `GeometryColumnConverter` | `GeoArrowGeometryConverter` from `@loaders.gl/core/geoarrow` |
| `convertGeometryColumnToBinaryFeatureCollection`, `convertGeometryValuesToBinaryFeatureCollection`, their options and scratch types | Same names from `@loaders.gl/core/geoarrow` |
| `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection`, `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection` | Same names from `@loaders.gl/core/geoarrow` |
| `convertBinaryFeatureCollectionToGeojson`, `binaryToGeojson` | `convertBinaryFeatureCollectionToGeojson` or `FeatureCollectionConverter` from `@loaders.gl/core/geoarrow` |
| `convertGeojsonToBinaryFeatureCollection`, `geojsonToBinary` | `convertGeojsonToBinaryFeatureCollection` or `FeatureCollectionConverter` from `@loaders.gl/core/geoarrow` |
| `convertGeojsonToFlatGeojson`, `geojsonToFlatGeojson`, `convertFlatGeojsonToBinaryFeatureCollection`, `flatGeojsonToBinary` | Deprecated FlatGeoJSON compatibility; prefer GeoArrow or direct GeoJSON-to-binary conversion. Existing loader kernels remain in `@loaders.gl/core/arrow-geometry/legacy-binary` |
| `getGeometryInfo`, `getBinaryGeometryInfo`, `BinaryGeometryInfo`, `transformBinaryCoords`, `transformGeoJsonCoords` | Same names from `@loaders.gl/core/geoarrow`; shared loader transforms remain in `arrow-geometry/legacy-binary` |
| `convertBinaryGeometryToGeometry`, `convertWKBToBinaryGeometry` | Same names from `@loaders.gl/core/geoarrow` (legacy, allocating outputs) |
| `convertWKBToGeometry`, `convertWKTToGeometry`, `convertGeometryToWKB`, `convertGeometryToWKT` | Same names from `@loaders.gl/core/geoarrow`; loaders use `@loaders.gl/core/arrow-geometry/geometry-codecs`. New codec integrations can use `@math.gl/geospatial/wkb` directly |
| `isWKB`, `isWKT`, `getWKTGeometryType`, `parseWKBHeader`, `WKBHeader`, `WKT_MAGIC_STRINGS` | Retained compatibility names from `@loaders.gl/core/geoarrow`; prefer `@math.gl/geospatial/wkb` for new code |
| `getWKTDimension`, `WKTGeometryOptions` | `@loaders.gl/core/arrow-geometry/geometry-codecs` |
| `getWKBGeometryStatistics`, `WKBGeometryStatistics`, `WKBGeometryBoundingBox` | `scanWKB` and its types from `@math.gl/geospatial/wkb`; the legacy ISO-number/bbox result is retained in `@loaders.gl/core/arrow-geometry/wkb-statistics` |
| `convertBinaryGeometryToWKB`, `getBinaryGeometryWKBSize`, `inferBinaryGeometryTypes`, `writeBinaryGeometryToWKB`, `reprojectWKBInPlace` | Same names from `@loaders.gl/core/geoarrow`; loader implementations/options in `@loaders.gl/core/arrow-geometry/binary-geometry-to-wkb` |
| `convertTWKBToGeometry`, `convertGeometryToTWKB` | `@loaders.gl/core/wkt/twkb`; implementation and fixtures stay with WKT |
| `getGeoArrowNativeGeometry`, `GeoArrowNativeGeometry`, `getGeoArrowUnionGeometryKind`, `GeoArrowUnionGeometryKind` | Same names from `@loaders.gl/core/geoarrow`; shared native reader in `@loaders.gl/core/arrow-geometry/native-geometry` |
| `GeoArrowBuilder`, `WKBBuilder`, `triangulateWKB` and builder types | `@loaders.gl/core/arrow-geometry` |
| `convertGeoArrowToBinaryFeatureCollection`, `getBinaryGeometryTemplate`, `getMeanCentersFromBinaryGeometries`, `getTriangleIndices` and rendering types | Same names from `@loaders.gl/core/geoarrow`; shared loader kernels in `@loaders.gl/core/arrow-geometry/binary-features` |
| `updateBoundsFromGeoArrowSamples` | Same name from `@loaders.gl/core/geoarrow` or `@loaders.gl/core/arrow-geometry/sampled-bounds`; sampling is not an exact scan |
| `convertGeoArrowTableToGeoJSON` | `@loaders.gl/core/arrow-geometry/geojson-table`, or `GeoArrowTableConverter` for applications |
| `convertWKBTableToGeoJSON` | Same name from `@loaders.gl/core/geoarrow`; loaders use `@loaders.gl/core/arrow-geometry/wkb-table` |
| `convertFeatureCollectionToGeoArrowTable`, `convertFeaturesToGeoArrowTable` | Same names from `@loaders.gl/core/geoarrow`; loader kernels in `@loaders.gl/core/arrow-geometry/feature-table` |
| Legacy CRS, feature-schema, feature-row and encoding-preference helpers/options | `@loaders.gl/core/arrow-geometry/feature-table` |
| `makeGeoArrowGeometryField`, `makeWKBGeometryField`, `set*Geometry*Metadata`, `encodeWKBGeometryValue`, `getGeometryWKBOptions`, `inferGeoParquetGeometryTypes`, `getCoordinateDimensions`, `getGeometrySampleCoordinates` | `@loaders.gl/core/arrow-geometry/geometry-field` |
| `makeWKBGeometryArrowTable*`, `makeWKBGeometryData*` and WKB Arrow options | `@loaders.gl/core/arrow-geometry/wkb-arrow-utils` |
| `buildFeatureArrowSchema`, `convertFeaturesToWKBArrowTable` | `@loaders.gl/core/arrow-geometry/feature-collection-to-arrow` |
| `GeoJSONGeometry`, geometry/metadata types, `getGeoMetadata`, `setGeoMetadata`, `unpackGeoMetadata`, JSON metadata and key/value helpers | `@loaders.gl/core/schema` (use `Geometry` instead of `GeoJSONGeometry`) |
| Metadata validators and generated JSON Schemas | `@loaders.gl/core/schema/geospatial-metadata-zod-schema` and `@loaders.gl/core/schema/geoparquet.schema.json` and `@loaders.gl/core/schema/geoarrow-metadata.schema.json` |
| `encodeHex`, `decodeHex` | `@loaders.gl/core/loader-utils` |
| `_extractNumericPropTypes` | Internal legacy helper in `@loaders.gl/core/arrow-geometry/legacy-binary`; do not build new application code around it |

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

Deck-layers and the geospatial example now import their application-facing APIs
from GeoArrow. Shared codec fixtures live with WKT, loader binary fixtures with
arrow-geometry, and rendering fixtures and benchmarks with GeoArrow. Run the
geometry benchmarks with the `geoarrow` module filter instead of `gis`.

GIS compatibility exports, package builds and tests are removed. Loaders do not
depend on the larger GeoArrow processing package, directly or transitively.

The old private binary concatenation, table-to-Arrow batch iterator and unused
conversion/encoding helpers were not supported package entry points and have
been deleted rather than relocated.

The repository no longer builds or publishes GIS. Its development/website dependency
graph can still contain a published GIS 4.x release required by deck.gl 9.4; this is
not the removed workspace package or a dependency added to loaders. Older standalone
test applications also retain historical release lockfiles. Removing those external
dependencies requires upgrading their consumers, not aliasing GIS to GeoArrow.
