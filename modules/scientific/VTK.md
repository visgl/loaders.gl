# VTK scientific data

Import `parseVTKLegacy` and `parseVTKXML` from `@loaders.gl/scientific/vtk`.

## Legacy VTK
The legacy ASCII parser supports POLYDATA, STRUCTURED_POINTS and UNSTRUCTURED_GRID,
points, dimensions/origin/spacing, one connectivity block, cell types, SCALARS,
VECTORS and NORMALS. It currently converts legacy numeric values to float32.

## XML VTK
The XML parser recognizes ImageData (.vti), UnstructuredGrid (.vtu),
PolyData (.vtp), RectilinearGrid (.vtr) and StructuredGrid (.vts).
It preserves numeric typed-array precision for ASCII and uncompressed inline
base64 binary DataArray elements, including UInt64/Int64.
PointData, CellData, Points, Cells and coordinate/topology array groups
are retained with their source associations.

## Remaining limitations
Legacy binary files, XML appended and compressed arrays (including zlib/LZ4/LZMA),
parallel manifests (.pvti/.pvtu/.pvtp/.pvtr/.pvts), FIELD/TENSORS,
multiple legacy POLYDATA topology blocks, raw appended binary XML, streaming
and random access are not yet implemented.

XML piece arrays are decoded but not yet converted into a common mesh topology
or field sampler. Geometry/topology validation is incomplete, and large XML
documents are fully materialized in memory. This remains experimental support;
real-file interoperability, build and browser tests are required.
