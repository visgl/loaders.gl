# HDF5 and NetCDF-4 backend boundary (draft)

HDF5 and NetCDF-4 are deliberately separate. The HDF5 source accepts a pluggable
dataset backend and exposes typed multidimensional arrays with residual half-open slicing.
The NetCDF-4 source wraps that backend and currently surfaces variable units.

**Not yet a standalone HDF5 file decoder:** users must supply a backend that reads
datasets. A production WASM/native HDF5 backend, actual file signature detection,
groups, dimension scales, unlimited dimensions, CF conventions, filters, chunk pushdown,
remote range reads and metadata interpretation are future work. No NetCDF-4 compliance
is claimed. NetCDF classic remains unchanged.

This is an architectural slice suitable for review before choosing an HDF5 runtime.

## Range reads and CF follow-up

`HTTPRangeReader` validates byte-range responses (206, Content-Range and exact
length). It is a transport primitive, **not yet connected to HDF5 chunk address
resolution**. The current h5wasm file backend still loads the complete file.

`HDF5Dataset.readSelection` is an optional hyperslab pushdown interface.
When provided by a backend, `HDF5Source` avoids full-array materialization;
the h5wasm adapter does not yet implement this optimization.

`NetCDF4Source.readCFVariable` performs opt-in CF numeric scale/offset and
missing-value decoding, retaining raw `readScientificVariable` behavior.
Common CF attributes are parsed. This does **not** establish full NetCDF-4/CF
semantics: HDF5 dimension scales, shared dimensions, coordinate systems,
calendars, grid mappings, bounds, unsigned handling, flag variables,
string/compound types and conformance testing remain outstanding.
