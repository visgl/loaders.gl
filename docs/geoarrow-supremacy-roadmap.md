# GeoArrow Tentpole Roadmap

## Direction

Make GeoArrow the canonical columnar geometry contract across loaders.gl while preserving existing
GeoJSON and binary outputs. WKB remains the compact interchange and persistence representation.
Native GeoArrow buffers are the preferred compute representation.

This roadmap is intentionally limited to GeoArrow contracts, conversion, validation, and
interoperability. Execution engines, rendering integrations, and unrelated data-platform work
belong in separate proposals and pull requests.

## Representation Policy

Adaptive native conversion selects the narrowest representation that covers the column:

| Geometry contents | Native target |
| --- | --- |
| Points only | `geoarrow.point` |
| Point and MultiPoint | `geoarrow.multipoint` |
| LineString only | `geoarrow.linestring` |
| LineString and MultiLineString | `geoarrow.multilinestring` |
| Polygon only | `geoarrow.polygon` |
| Polygon and MultiPolygon | `geoarrow.multipolygon` |
| Mixed geometry families | `geoarrow.geometry` |
| GeometryCollections | `geoarrow.geometry` |
| Bounding boxes | `geoarrow.box` |
| Unknown streaming contents | Stable `geoarrow.geometry` union |

Recursive GeometryCollections are valid in serialized WKB and WKT. The native GeoArrow collection
schema excludes GeometryCollection from its member union, so native conversion rejects recursive
collections rather than emitting a nonconforming Arrow type.

## Package Boundaries

- `@loaders.gl/schema` owns dependency-free wire types and metadata contracts.
- `@loaders.gl/gis` owns the small loader-facing geometry and shared builder primitives.
- `@loaders.gl/geoarrow` owns conversion, layout inspection, validation, bounds, coordinate
  iteration, canonicalization, and metadata operations.
- `@loaders.gl/parquet` owns GeoParquet I/O and remains independent of GeoArrow processing code.
- Worker transfer ownership and sliced-buffer isolation remain in `@loaders.gl/arrow/transport`.

Format loaders do not depend on the larger GeoArrow package. Applications opt into GeoArrow when
they need native conversion or processing.

## Tranches

### 1. Contract and layout oracle

Publish the canonical table and metadata contracts. Use one physical-layout oracle for field
inspection, validation, and capability projection. Track conformance cases with stable identifiers,
but treat executable tests and benchmarks as the evidence of support.

### 2. Adaptive conversion kernel

Extend the established geometry converter with direct WKB, WKT, concrete native, dense-union, and
box kernels. Identity conversion is zero-copy. Single-to-multi promotion reuses coordinate buffers
where Arrow layout permits it. Callers can set `fallback: 'error'` to require a direct kernel.

### 3. Complete GeoArrow conformance

Read, validate, and write every GeoArrow encoding and coordinate layout supported by Arrow JS.
Preserve CRS, edges, extension metadata, legal child-name variations, record batches, unknown
metadata, exact Z/M semantics, and 32/64-bit storage. Pin official fixtures and add malformed-layout
coverage.

### 4. GeoParquet interoperability

Support versioned GeoParquet metadata, WKB and native geometry columns, multiple geometry columns,
coverings, statistics, dimensions, CRS states, orientation, epochs, and antimeridian bounds. Keep
this work reviewable independently from the core converter.

### 5. Loader adoption

Standardize geospatial loaders' `arrow-table` output as GeoArrow-compliant without changing their
established default return values. Prefer WKB at lightweight loader boundaries and preserve native
GeoArrow when the source already supplies it.

### 6. Performance and release gates

Benchmark WKB, homogeneous native, and dense-union paths independently. Track throughput, peak
memory, and bundle size. Direct conversion must not create per-feature GeoJSON objects; identity
conversion must not inspect coordinates; root GeoArrow imports must not pull in unrelated engines
or rendering code.

## Verification

Required tests stay small and hermetic. Slow lanes own exhaustive matrices, fuzzing, large
geometry-buffer workloads, and external interoperability. A tranche is complete only when its public API,
focused tests, documentation, and measured performance agree.
