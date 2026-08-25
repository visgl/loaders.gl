# Apache Avro

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The Avro loader, schema loader, and Arrow-based writer are available for evaluation.

Apache Avro is a schema-based data serialization system. This loader targets Avro Object Container Files and returns an Apache Arrow table.

## Format variants

| Variant | Description | Supported |
| --- | --- | :---: |
| Object Container File | Self-contained file beginning with `Obj\x01`, including metadata, schema, sync marker, and data blocks | ✓ |
| Raw Avro datum | A datum encoded with a separately supplied schema | ✓ via `avro.schema` |
| Single-object encoding | Compact `c3 01`-prefixed datum with an external schema fingerprint | ✓ via `avro.schema`; fingerprint validated by default |
| Raw binary datum | Schema-external Avro binary datum | ✓ for one Arrow row via writer `encoding: 'raw'` |
| Avro RPC protocol | Message framing and protocol metadata for Avro RPC | — |
| Avro schema/protocol JSON | Schema or protocol definition without serialized records | — |

## Object Container File features

| Feature | Supported |
| --- | :---: |
| Embedded `avro.schema` metadata | ✓ |
| Custom file metadata | Read and writable via `avro.metadata` |
| Multiple data blocks | ✓ |
| Block sync markers | ✓ |
| OCF block metadata/index inspection | ✓ via `parseAvroOCF` |
| Block byte offsets for selective reads | ✓; record-level filtering remains future work |
| Selective block decoding | ✓ via `avro.blockIndices` |
| URL-backed OCF loading | ✓ through normal `load(url, AvroLoader)` and `parseFile(HttpFile, AvroLoader)`; uses HTTP ranges when available |
| Authenticated URL loading | ✓ via `avro.headers`; supports cancellation with `avro.signal` |
| Empty files / empty data blocks | ✓ |
| Object Container File schema evolution via reader schema | Partial: projection, aliases, validated defaults, and Avro numeric promotions |
| External reader schema | ✓ through `avro.readerSchema` |
| Streaming `parseInBatches` | ✓, block-oriented Arrow batches |
| Chunked OCF writing | ✓ via `encodeAvroInChunks` |

## Schema types

| Avro schema feature | Supported |
| --- | :---: |
| `null` | ✓ |
| `boolean` | ✓ |
| `int` | ✓ |
| `long` | ✓, JavaScript safe range by default; exact `bigint` mode via `avro.longType` |
| `float` | ✓ |
| `double` | ✓ |
| `bytes` | ✓, returned as `Uint8Array` |
| `string` | ✓ |
| `record` | ✓ |
| `enum` | ✓, returned as the symbol string |
| `array` | ✓ |
| `map` | ✓ |
| `fixed` | ✓, returned as `Uint8Array` |
| Unions | ✓ |
| Nested records and collections | ✓ |
| Named type references | ✓ |
| Recursive schemas | ✓ for named record references |
| Logical types | Partial: `date`, timestamps, time values, decimal, big-decimal, UUID, and duration |
| Field aliases and documentation | — |
| Schema defaults | ✓ validated by `AvroSchemaLoader`; reader defaults enforce union-first-branch rules |

## Block codecs

| Avro codec | Supported |
| --- | :---: |
| `null` | ✓ |
| `deflate` | ✓, raw DEFLATE through `@loaders.gl/compression`; writer supported |
| `snappy` | ✓, including Avro block CRC32 validation; writer supported |
| `zstandard` | ✓, through `@loaders.gl/compression`; writer supported |
| `bzip2` | ✓ loader; writer supported when the optional codec runtime is installed |
| `xz` | ✓ loader; writer supported when the optional codec runtime is installed |
| Custom codec | — |

## Output

| Output | Supported |
| --- | :---: |
| Loaders.gl `arrow-table` wrapper | ✓ |
| Apache Arrow `Table` | ✓ |
| Object-row table output | — |
| Arrow schema metadata copied from Avro schema annotations | — |

The implementation uses the shared loaders.gl compression module for supported compressed blocks. Avro data decoding is implemented in the parquet module, and Arrow columns are constructed with `apache-arrow`.

## Explicitly unsupported or incomplete

These limitations are intentional and should not be inferred as supported merely because the surrounding Avro format is supported:

| Feature | Current status |
| --- | --- |
| Avro RPC protocols and message framing | Not supported |
| Protocol-definition JSON documents | Not supported by `AvroSchemaLoader` |
| Custom codecs | Not supported |
| bzip2 and xz writing | Not supported; loader decompression only |
| Single-object Avro writing | Supported for exactly one Arrow row; fingerprint is emitted from the supplied/derived schema |
| Raw Avro writing | Supported for exactly one Arrow row; schema is required by the reader |
| Record-level predicate filtering | Not supported; selection is at OCF block granularity |
| Remote range-backed OCF reads | Supported for explicit URL APIs; servers without byte-range support fall back to full download |
| Recursive data with cycles in the in-memory Arrow result | Not supported; recursive named schemas must produce finite values |
| `time-millis`, `time-micros`, timestamp nanos, and local-timestamp logical types | Supported; integer precision is preserved on load and `Date` inputs use UTC time-of-day semantics |
| Avro `big-decimal` logical type | Supported for writer values shaped as `{value, scale}`; loaded values are `{value, scale}` with JavaScript-number precision |
| Full schema namespace/name canonicalization | Incomplete |
| Full reader-schema resolution for every union/default edge case | Incomplete |
| Arrow schema metadata/documentation annotations | Not supported |

## Loaders

| Loader | Input | Output |
| --- | --- | --- |
| `AvroLoader` | `.avro` Object Container Files | Loaders.gl `arrow-table` containing an Apache Arrow `Table` |
| `AvroSchemaLoader` | `.avsc` standalone JSON schemas | Parsed and validated Avro schema object |
| `AvroWriter` | Arrow `arrow-table` | `.avro` Object Container File; null codec |

`AvroSchemaLoader` validates primitive types, unions, arrays, maps, records, enums, fixed types, and named-type references. It does not parse Avro RPC protocol definitions, which are a separate JSON document type.
