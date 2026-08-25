# Apache ORC

> **Status:** v5.0 experimental / work in progress. `@loaders.gl/orc` currently targets common primitive ORC tables and returns Apache Arrow tables; the writer remains uncompressed.

Apache ORC is a self-describing, stripe-oriented columnar format. A complete ORC implementation includes protobuf metadata, stripe indexes, stream encodings, compression, nested types, statistics, and optional encryption.

## Current loaders.gl support

| Feature | Status |
| --- | --- |
| ORC file magic, PostScript, and footer parsing | Supported |
| Stripe locations and stream metadata | Supported |
| Multiple stripes | Supported |
| Arrow-table output | Supported |
| Arrow-table input to `ORCWriter` | Supported |
| Primitive boolean, integer, date, float, double, string, and binary columns | Supported |
| ZLIB, Snappy, LZ4, and ZSTD-compressed ORC streams | Supported for framed footer, stripe-footer, and primitive data streams when codecs are available |
| Flat-column null PRESENT streams | Supported |
| Direct and short-repeat RLEv2 | Supported |
| Basic delta RLEv2 decoding | Supported |
| Patched-base RLEv2 decoding | Supported |
| Dictionary-encoded string columns | Supported for uncompressed dictionary streams |
| Dictionary-encoded repeated strings written by `ORCWriter` | Supported when dictionary cardinality is lower than row count |
| Dictionary-encoded repeated binary columns written by `ORCWriter` | Supported when dictionary cardinality is lower than row count |
| Configurable writer stripe size | Supported via `orc.stripeSize` |

## Explicitly unsupported or incomplete

| Feature | Current status |
| --- | --- |
| LZO ORC stripe compression | Not supported by the ORC loader or writer |
| Dictionary-encoded binary columns | Supported for primitive binary columns; nested binary values remain incomplete |
| Struct columns | Partial: loader assembly for non-null structs; writer and nullable struct values are unsupported |
| List, map, and union columns | Not supported |
| Nested PRESENT streams | Not supported for nullable container values |
| Timestamp and decimal ORC primitive encodings | Not supported |
| Stripe row indexes | Not supported |
| Bloom-filter streams | Not supported |
| Stripe statistics and predicate pushdown | Not supported |
| ORC encryption and encrypted stripes | Not supported |
| ACID transaction metadata and delete deltas | Not supported |
| ORC type evolution and reader-side schema projection | Not supported |
| Remote range-backed ORC reads | Not supported; the current API requires an `ArrayBuffer` |
| Multi-file ORC datasets | Not supported by this module |

The ORC writer currently emits uncompressed primitive stripes. It is not a general-purpose replacement for Hive, Spark, Trino, or the Apache ORC reference writer.
