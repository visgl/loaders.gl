# GeoArrow Conformance Ledger

The loaders.gl GeoArrow contract has a lazily generated case ledger exported from
`@loaders.gl/geoarrow/geoarrow-conformance`. Its identifiers coordinate focused fast tests, slow
interoperability tests, and benchmarks. Generating the ledger does not itself certify a case;
executable tests and benchmark results provide that evidence.

## Matrix Axes

| Axis | Values |
| --- | --- |
| Encodings | `geometry`, `geometrycollection`, six concrete native families, `box`, `wkb`, `wkt` |
| Geometry families | Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, GeometryCollection |
| Dimensions | XY, XYZ, XYM, XYZM |
| Native coordinate layout | Interleaved, separated |
| Variable offsets | 32-bit, 64-bit |
| Row states | Valid, null, empty, chunked, malformed where the encoding can be malformed |

The Cartesian matrix contains the physical combinations even when an axis is not used by a
serialized value. This is deliberate: conversion requests can select a native layout after a
serialized column has been inspected, and the requested physical contract must remain explicit.

## Programmatic Use

```ts
import {getGeoArrowConformanceMatrix} from '@loaders.gl/geoarrow/geoarrow-conformance';

for (const testCase of getGeoArrowConformanceMatrix()) {
  // Use testCase.id as the stable fixture and benchmark key.
}
```

The matrix is immutable by convention and has stable ordering. Any new encoding, dimension,
layout, or offset width must add a matrix axis or an explicit unsupported reason rather than
silently reducing coverage.

## Validation Rules

- Extension metadata does not override an incompatible physical Arrow layout.
- Concrete native fields require canonical coordinate or box child names.
- List offsets are non-negative, monotonic, and bounded by their child buffers.
- Dense union IDs must be declared by the union type and their value offsets must address the
  corresponding child.
- WKB rows must contain one complete geometry with no trailing bytes.
- WKT rows must parse as one supported geometry value.
- Null rows remain valid and are not decoded.
- Native layout conversion of sliced vectors normalizes retained offsets, child values, and
  validity bits without calling `Vector.get()`; this applies to concrete points and nested
  list geometries.

Required conformance tests are kept hermetic. Large payloads, fuzzing, and external implementation
round-trips belong in slow or external test projects.
