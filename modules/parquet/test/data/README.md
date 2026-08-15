`apache` and `apache-bad` folders copied from https://github.com/apache/parquet-testing under Apache 2 license.

`benchmark-dictionary.parquet` is a deterministic 20,000-row benchmark fixture generated with
`parquet-wasm` 0.7.2. Its five low-cardinality string, nullable string, nullable numeric, and numeric
columns use uncompressed `RLE_DICTIONARY` data pages across five row groups.
