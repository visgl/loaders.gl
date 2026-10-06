---
title: TIFF decoder core
---

The numeric TIFF loader now uses an original loaders.gl decoder behind an internal
image contract. This is the first stage of replacing the geotiff.js dependency.
The public payload continues to contain plain metadata and owned typed sample arrays.

## Supported native data

The core reads little- and big-endian classic TIFF and BigTIFF directories, preserving
64-bit integer tag values as bigint. Offsets must fit JavaScript's safe integer range.
It validates the main directory chain and SubIFD graph, rejecting cycles, duplicate
tags, truncated values and exhausted metadata budgets before decoding.

Uncompressed strips and tiles support chunky or separate planes, unsigned and signed
8-, 16- and 32-bit integers, and 32- and 64-bit floating point. Internal native windows
select intersecting blocks and original bands without resampling. Padded tile edges,
final short strips, nodata, non-finite samples and raw georeferencing tags are preserved.
Sample decoding checks output budgets before allocating and yields periodically for cancellation.

## Compatibility policy

GeoTIFFRasterLoader defaults to auto mode. Explicitly unsupported compression,
predictors, sample representations, TIFF tag names or GeoKeys switch the entire
main-chain dataset to geotiff.js. Native mode rejects unsupported features; geotiff
mode forces compatibility decoding. Every mode uses the checked directory preflight.
Invalid input and resource-limit failures never select another backend.

HTTP and Blob raster sources use a loaders.gl-owned contract with geotiff.js decoding
behind an adapter. Their existing range transport and overview selection remain in place.
The original decoder currently consumes an in-memory ArrayBuffer. OME-TIFF and display
loader paths still use geotiff.js; this change does not remove the package dependency.

Output limits apply per selected image, not to the sum of all returned images.
Compatibility decompression can allocate additional scratch memory. Metadata byte
limits account for encoded input, rather than JavaScript object overhead.

## Next stages

Qualify original range-backed directory reads and numeric region decoding against the
same source contract, then add compression codecs individually with differential
fixtures. Retain compatibility coverage until supported formats, memory use,
cancellation and performance justify removing the dependency.

## Implementation provenance

The directory reader, block planner and numeric decoder are original TypeScript,
written from [TIFF 6.0](https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf)
and the [BigTIFF specification](https://libtiff.gitlab.io/libtiff/specification/bigtiff.html).
They are not copied or translated geotiff.js implementation code. Compatibility
adapters call geotiff.js under its MIT license. Existing fast-xml-parser handles GDAL XML.
