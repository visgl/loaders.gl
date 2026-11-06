# OpenEXR

Use `EXRLoader` from `@loaders.gl/images`, or `EXRLoaderWithParser` from
`@loaders.gl/images/exr-loader`. The async, dependency-free reader supports version
2 single-part scanline files with NONE, RLE, ZIPS and ZIP compression. Native
DecompressionStream supplies zlib decoding. UINT samples remain uint32; HALF
expands exactly to float32 and FLOAT remains float32. Negative/HDR values and
non-finite binary samples are preserved. Channels must use unit X/Y sampling.

The result contains named row-major channel planes in increasing data-window Y
order, data/display windows, compression metadata, and raw typed header attributes
(including chromaticities when present). No RGB selection, color conversion,
exposure, tone mapping, alpha conversion, or GPU texture is applied.

Tiled, multipart, deep, subsampled, PIZ, PXR24, B44/B44A and DWAA/DWAB data are
explicitly unsupported. Decoded planes are limited to 256 MiB. Files with missing,
duplicate or out-of-range scanline chunks fail rather than returning partial images.
