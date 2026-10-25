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
