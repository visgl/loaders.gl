# NRRD multidimensional arrays

Use `NRRDLoader` from `@loaders.gl/scientific`, or `NRRDLoaderWithParser` from
`@loaders.gl/scientific/nrrd-loader`. The async decoder supports attached NRRD
versions 1–5 with raw, ASCII/text, or gzip payloads and signed/unsigned 8/16/32-bit
integers and float32/float64 samples. Binary multibyte samples require endian.

Outputs retain typed samples, shape (first axis fastest), origin, per-axis space
directions, kinds, raw header fields, and custom key/value metadata. Axis units,
space names, measurement frames and spacings remain in fields; no orientation,
resampling, unit conversion, transfer function, or renderer object is applied.

Decoded payloads are limited to 256 MiB and gzip output is bounded by the declared
sample count. Detached payloads, skip directives, block and 64-bit integer samples,
hex/bzip2 encodings, streaming and writers are unsupported. ASCII samples must be
finite and representable in the declared scalar type (float32 rounding is allowed).
