# Zip Archive

> The [`loaders.gl/zip`](/docs/modules/zip) module provides support for working with Zip Archives.

[ZIP Archive](<https://en.wikipedia.org/wiki/Zip_(file_format)>)

## Supported local header layouts

`ZipFileSystem.fetch()` supports entries whose local headers contain ordinary 32-bit sizes, ZIP64
sizes, or zero sizes followed by a data descriptor. When general-purpose bit 3 indicates a data
descriptor, the central-directory sizes are authoritative; both signed and unsigned descriptors are
supported.

ZIP64 local headers store the uncompressed and compressed sizes as a required pair in the ZIP64
extended information record when either 32-bit local size is the ZIP64 sentinel. A non-sentinel
compressed size remains authoritative for legacy layouts.

## ZIP64 validation

The random-access ZIP header parsers validate required ZIP64 extended information records before
using 64-bit sizes and offsets. Missing, truncated, or incorrectly sized ZIP64 records are rejected
with an `Invalid ZIP archive` error instead of exposing low-level `DataView` range errors.
