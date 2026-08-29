# GeoArrow Roadmap

## Purpose

GeoArrow can become the canonical columnar geometry contract across loaders.gl, but that outcome is
not assumed by this roadmap. We will first consolidate the good pieces that already exist, measure
them, and make explicit decisions before changing loader contracts or expanding the implementation.

Existing GeoJSON and binary outputs remain supported. WKB remains the compact interchange and
persistence representation. Native GeoArrow buffers are the preferred candidate for computation
because they provide aligned coordinate and offset arrays.

This roadmap covers GeoArrow contracts, conversion, validation, GeoParquet interoperability, and
loader integration. Broader execution engines and unrelated integrations require separate proposals.

## Working Principles

- Extend the established converter system instead of creating a parallel conversion framework.
- Keep loader-facing helpers small; applications opt into the richer GeoArrow package.
- Preserve native layouts when possible and make identity conversion zero-copy.
- Use concrete native encodings for homogeneous columns and dense unions for genuinely mixed data.
- Keep WKB and WKT as valid serialized representations, including cases that native GeoArrow cannot
  represent directly.
- Treat a conformance ledger as an inventory. Tests, fixtures, and benchmarks are the evidence.
- Do not start a later tranche merely because it appears in this document.

## Representation Policy

If adaptive native conversion is approved, it selects the narrowest representation that covers the
column:

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

Recursive GeometryCollections remain valid in serialized WKB and WKT. Native conversion rejects
them because the GeoArrow collection member union cannot recursively contain GeometryCollection.

## Package Boundaries

- `@loaders.gl/schema` owns dependency-free wire types and metadata contracts.
- `@loaders.gl/gis` owns the minimal loader-facing geometry helpers and shared builder primitives.
- `@loaders.gl/geoarrow` owns conversion, layout inspection, validation, bounds, coordinate
  iteration, canonicalization, and metadata operations.
- `@loaders.gl/parquet` owns GeoParquet I/O and remains independent of GeoArrow processing code.
- `@loaders.gl/arrow/transport` owns worker transfer and sliced-buffer isolation.

These boundaries are part of the foundation review. Moving more code between packages requires a
measured bundle or ownership benefit, not just conceptual neatness.

## Decision Gates

### Gate A: Is the foundation coherent?

Before broadening support, review whether there is one converter path, one layout oracle, one shared
builder implementation, and clear package ownership. The public API should be small enough to
explain without exposing internal Arrow construction details.

**Decision:** continue with the existing architecture, revise the boundaries, or stop at WKB plus
the currently supported native encodings.

### Gate B: Should adaptive native conversion become a stable contract?

Decide after representative WKB, concrete-native, and dense-union benchmarks. The decision must
cover streaming schema stability, dimension handling, collection behavior, offset width, and the
cost of classification.

**Decision:** make adaptive conversion the default, require an explicit target encoding, or keep the
feature experimental.

### Gate C: Is interoperability strong enough for framework adoption?

Decide only after official fixtures and external implementations agree on metadata, child layouts,
dimensions, CRS states, unions, nulls, empties, and GeoParquet round trips.

**Decision:** begin loader-by-loader adoption, limit support to selected formats, or continue as an
opt-in conversion package.

### Gate D: Is the feature ready to stabilize?

Review API surface, compatibility, bundle size, throughput, peak memory, documentation, and support
burden. Any unsupported matrix cells must be explicit rather than hidden by object conversion.

**Decision:** stabilize the public API, retain alpha status with a reduced scope, or defer release.

## Tranches

### Tranche 1: Consolidated GeoArrow foundation

Integrate the existing converter work around a single physical-layout oracle and shared builder.
Define metadata contracts, validate native layouts, preserve zero-copy identity paths, and fix
correctness at Arrow slice, union, null, empty, dimension, and collection boundaries. Direct kernels
must expose when they are unavailable; compatibility fallback remains explicit and testable.

This is the scope of the current pull request. It ends at Gate A and does not authorize package-wide
adoption.

### Tranche 2: Complete conversion and conformance

Implement and verify direct conversions among WKB, WKT, concrete native encodings, dense unions, and
boxes for the supported Arrow JS storage forms. Add official fixtures, malformed-input coverage,
round trips, fuzzing in slow lanes, and independent benchmarks. Resolve Gate B before declaring
`'native'` a stable adaptive target.

### Tranche 3: GeoParquet interoperability

Complete versioned GeoParquet metadata and geometry-column support, including multiple geometry
columns, native and WKB layouts, dimensions, CRS states, coverings, statistics, orientation, epochs,
and antimeridian bounds. Validate readers and writers against external implementations. Gate C must
pass before changing loader contracts.

### Tranche 4: Deliberate loader adoption and stabilization

Adopt GeoArrow-compliant `arrow-table` output one loader at a time without changing established
default return values. Each adoption needs a compatibility review, focused integration tests, and a
bundle-cost check. Finish with documentation, performance baselines, migration guidance where
needed, and the Gate D release decision.

## Completion Rules

A tranche is complete only when its public API, implementation, focused tests, documentation, and
measured performance agree. Required tests stay small and hermetic; exhaustive matrices, fuzzing,
large buffers, and external interoperability remain in dedicated lanes. Failed decision gates send
the work back to the prior tranche or reduce scope; they do not automatically create more targets.
