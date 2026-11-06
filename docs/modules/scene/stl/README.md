# STL

`STLLoader` from `@loaders.gl/scene` loads ASCII and little-endian binary STL.
Import `STLLoaderWithParser` from `@loaders.gl/scene/stl-loader` for synchronous parsing.

The result is a renderer-independent `Mesh` with triangle-list topology, POSITION
and NORMAL float32 attributes, bounds, and source header metadata. Facet normals
and vertex order are preserved. Coordinates have unspecified units; applications
must choose the unit convention. Multiple ASCII solids are flattened in file order.

Binary inputs must match the declared triangle count exactly. Malformed facets,
truncated buffers, and non-finite coordinates are rejected. Vendor color encodings,
solid groups, vertex welding, normal repair, and writers are outside the initial scope.
