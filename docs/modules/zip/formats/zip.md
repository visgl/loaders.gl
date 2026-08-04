# Zip Archive

> The [`loaders.gl/zip`](/docs/modules/zip) module provides support for working with Zip Archives.

[ZIP Archive](<https://en.wikipedia.org/wiki/Zip_(file_format)>)

## ZIP64 validation

The random-access ZIP header parsers validate required ZIP64 extended information records before
using 64-bit sizes and offsets. Missing, truncated, or incorrectly sized ZIP64 records are rejected
with an `Invalid ZIP archive` error instead of exposing low-level `DataView` range errors.
