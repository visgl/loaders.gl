import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# Parquet

<ParquetDocsTabs active="overview" />

![parquet-logo](../images/parquet-logo-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- _[`@loaders.gl/parquet`](/docs/modules/parquet)_
- _[Apache Parquet format specification](https://github.com/apache/parquet-format)_
- _[Apache Parquet 2.13.0 release](https://github.com/apache/parquet-format/releases/tag/apache-parquet-format-2.13.0)_
- _[Apache Parquet file-format documentation](https://parquet.apache.org/docs/file-format/)_

Apache Parquet is a binary, column-oriented format designed for compact storage and selective
retrieval of tabular and nested data. Values are organized so that a reader can fetch selected
row groups and columns without downloading or decoding the complete file.

This page describes both the format and the current `@loaders.gl/parquet` TypeScript implementation.
The support tables use these symbols:

| Symbol | Meaning |
| ------ | ------- |
| ✅ | Supported by the TypeScript reader or writer |
| ⚠️ | Partially supported, metadata-only, legacy, or dependent on an injected codec |
| ❌ | Not currently supported |

`ParquetLoader` and `ParquetWriter` use the separately maintained `parquet-wasm` implementation;
their coverage can differ from the TypeScript `ParquetJSLoader`, `ParquetSourceLoader`, and
`ParquetJSWriter` described in the matrices below.

## File Layout

A Parquet file starts and ends with the four-byte `PAR1` magic value. The Thrift-encoded file
metadata and its little-endian length are stored at the end so a writer can produce the file in one
forward pass and a random-access reader can discover the layout with a small suffix read.

```text
PAR1
  row group 0
    column chunk 0: dictionary page?, data pages...
    column chunk 1: dictionary page?, data pages...
  row group 1
    column chunk 0: dictionary page?, data pages...
    column chunk 1: dictionary page?, data pages...
  ...
file metadata (Thrift compact protocol)
file metadata byte length (4-byte little endian)
PAR1
```

The format has four important storage units:

| Unit | Purpose | Natural unit of work |
| ---- | ------- | -------------------- |
| File | Schema, row-group directory, user metadata, and optional indexes | Dataset discovery |
| Row group | Horizontal partition containing a column chunk for every leaf column | Parallelism and row pruning |
| Column chunk | Contiguous values for one leaf column within one row group | Projection and range I/O |
| Page | Independently encoded and compressed values within a column chunk | Compression, decoding, page pruning |

This hierarchy is why Parquet is random-access rather than a conventional streaming format.
`ParquetSourceLoader` first reads and caches the footer, then issues ranges for selected row groups
and column chunks. `parseInBatches` can yield row-group-sized batches incrementally, but the footer
must normally be available before useful data ranges can be located.

## Schema

Parquet deliberately has a small set of physical storage types. Logical type annotations describe
how those bytes should be interpreted. Repetition declarations and Dremel definition/repetition
levels describe nulls and nesting.

Each schema element can contain:

- a name and optional stable field ID
- a physical type for leaf fields
- `REQUIRED`, `OPTIONAL`, or `REPEATED` repetition
- a modern `LogicalType` annotation or deprecated `ConvertedType` annotation
- type parameters such as fixed byte width, decimal precision/scale, time unit, or UTC adjustment

The TypeScript reader gives modern `LogicalType` metadata precedence and uses `ConvertedType` only
as a compatibility fallback.

### Physical Types

| Physical type | On-disk representation | JS read | JS write | Notes |
| ------------- | ---------------------- | ------- | -------- | ----- |
| `BOOLEAN` | One bit per value in plain encoding | ✅ | ✅ | Nulls are represented by definition levels, not value bits |
| `INT32` | 32-bit little-endian signed integer | ✅ | ✅ | Also carries dates, narrow integers, and some decimals |
| `INT64` | 64-bit little-endian signed integer | ✅ | ✅ | Preserved as exact `bigint` when required |
| `INT96` | 12-byte legacy integer | ⚠️ | ⚠️ | Deprecated; no complete portable logical interpretation |
| `FLOAT` | IEEE-754 binary32, little endian | ✅ | ✅ | Maps to Arrow Float32 |
| `DOUBLE` | IEEE-754 binary64, little endian | ✅ | ✅ | Maps to Arrow Float64 |
| `BYTE_ARRAY` | 32-bit length followed by bytes | ✅ | ✅ | Used for binary, strings, JSON, BSON, and arbitrary precision decimals |
| `FIXED_LEN_BYTE_ARRAY` | Schema-defined fixed byte width | ✅ | ✅ | Used for UUID, Float16, decimals, and fixed binary data |

### Logical Types

The exact physical constraints and sort orders are defined by Apache's
[Logical Types specification](https://github.com/apache/parquet-format/blob/master/LogicalTypes.md).

| Logical type | Physical representation | Arrow result | JS read | JS write | Notes |
| ------------ | ----------------------- | ------------ | ------- | -------- | ----- |
| `STRING` | `BYTE_ARRAY` | Utf8 | ✅ | ✅ | UTF-8 validated through the logical type |
| `ENUM` | `BYTE_ARRAY` | Utf8 | ✅ | ✅ | Semantic enum membership is application-defined |
| `INTEGER` | `INT32` or `INT64` | Int/Uint 8, 16, 32, or 64 | ✅ | ✅ | Signedness and bit width are preserved |
| `DECIMAL` | `INT32`, `INT64`, or byte array | Decimal128/256 | ✅ | ✅ | Precision, scale, sign, and big-endian byte representation are preserved |
| `DATE` | `INT32` days since Unix epoch | DateDay | ✅ | ✅ | Supports dates before the epoch |
| `TIME` | `INT32` millis or `INT64` micros/nanos | Matching Arrow Time unit | ✅ | ✅ | Retains `isAdjustedToUTC` metadata |
| `TIMESTAMP` | `INT64` millis/micros/nanos | Matching Arrow Timestamp unit | ✅ | ✅ | Local versus instant semantics are retained in metadata |
| `UUID` | 16-byte `FIXED_LEN_BYTE_ARRAY` | FixedSizeBinary(16) | ✅ | ✅ | Stored in network byte order |
| `FLOAT16` | 2-byte `FIXED_LEN_BYTE_ARRAY` | Float16 | ✅ | ✅ | IEEE-754 binary16 |
| `JSON` | `BYTE_ARRAY` | Binary/object fallback | ✅ | ✅ | Object-row reads parse JSON; raw bytes remain available |
| `BSON` | `BYTE_ARRAY` | Binary/object fallback | ✅ | ✅ | Uses the BSON logical annotation |
| `UNKNOWN` | Any physical type | Null | ✅ | ⚠️ | Values must be treated as null; writing is low-level only |
| `LIST` | Three-level nested structure | List | ✅ | ✅ | High-level writer emits the standard `list`/`element` layout, including nested element types |
| `MAP` | Repeated key/value structure | Map | ✅ | ✅ | High-level writer accepts `Map`, entry arrays, and plain objects; keys must be non-nullable |
| [`VARIANT`](https://github.com/apache/parquet-format/blob/master/VariantEncoding.md) | Variant metadata/value byte columns | Binary plus metadata | ⚠️ | ❌ | Metadata is retained; Variant payload decoding and shredding remain roadmap items |
| [`VECTOR`](https://github.com/apache/parquet-format/pull/592) | Vector logical type (proposed) | Not yet mapped | ❌ | ❌ | Active upstream proposal; intentionally not advertised as supported |
| `GEOMETRY` | `BYTE_ARRAY` | GeoArrow WKB binary | ✅ | ✅ | CRS plus native bbox/type statistics; TypeScript writer |
| `GEOGRAPHY` | `BYTE_ARRAY` | GeoArrow WKB binary | ✅ | ✅ | CRS, all five edge algorithms, antimeridian-aware reads, and native statistics |
| legacy `INTERVAL` | 12-byte `FIXED_LEN_BYTE_ARRAY` | Binary/object fallback | ✅ | ✅ | Deprecated converted type retained for compatibility |

## Nested Data and Nulls

Parquet uses the record-shredding algorithm from the Dremel paper. Every leaf column stores:

- **definition levels**, indicating how much of an optional path is present; and
- **repetition levels**, indicating at which repeated ancestor a new value begins.

Null values therefore consume definition-level entries but no value bytes. Runs of nulls are very
compact. Lists and maps use standardized nested group layouts; legacy two-level and writer-specific
layouts require compatibility handling.

| Repetition | JS read | JS write | Meaning |
| ---------- | ------- | -------- | ------- |
| `REQUIRED` | ✅ | ✅ | Every parent instance has a value |
| `OPTIONAL` | ✅ | ✅ | Definition level distinguishes null from present |
| `REPEATED` | ✅ | ✅ | Repetition levels delimit zero or more values |

The TypeScript Arrow path builds supported nested vectors directly from decoded column buffers.
Unusual legacy nesting layouts can fall back to row assembly for correctness. The TypeScript writer
accepts Arrow `struct`, `list`, and `map` fields and emits the standard Parquet three-level layouts;
map values may be supplied as JavaScript `Map` instances, `[key, value]` entry arrays, or plain
objects.

## Pages

A column chunk contains page headers serialized with Thrift compact protocol followed by page bodies.
Encoding is applied before optional compression. Compression is page-local, so a reader does not
need to inflate an entire column chunk at once.

| Page feature | JS read | JS write | Notes |
| ------------ | ------- | -------- | ----- |
| Data Page V1 | ✅ | ✅ | Levels and values share one compressed payload |
| Data Page V2 | ✅ | ✅ | Levels remain uncompressed; value compression is independently declared |
| Dictionary page | ✅ | ✅ | One chunk-wide dictionary may be shared by multiple data pages |
| Optional page CRC | ⚠️ | ❌ | CRC metadata is decoded but payload verification is not yet enforced |
| Legacy `INDEX_PAGE` | ❌ | ❌ | Deprecated and distinct from the modern page-index structures |

`ParquetJSWriter` selects Data Page V2 with `parquet.useDataPageV2`. The reader accepts both versions
within the same file. `parquet.pageSize` is a target number of shredded level entries per page. Page
boundaries are aligned to top-level rows, so a repeated row is never split between pages; a single
row larger than the target remains one page.

## Value Encodings

Encodings transform uncompressed values inside a page. A column chunk declares every encoding it
uses, while each page identifies its actual value encoding.

| Encoding | Valid targets | JS read | JS write | Status |
| -------- | ------------- | ------- | -------- | ------ |
| `PLAIN` | All physical types | ✅ | ✅ | Required baseline encoding |
| `PLAIN_DICTIONARY` | All physical types | ✅ | ❌ | Deprecated dictionary identifier |
| `RLE` | Boolean, levels, dictionary indexes | ✅ | ✅ | Writer uses it for definition/repetition levels |
| `BIT_PACKED` | Legacy levels | ❌ | ❌ | Deprecated and superseded by the RLE/bit-packing hybrid |
| `DELTA_BINARY_PACKED` | `INT32`, `INT64` | ✅ | ✅ | Effective for ordered integer sequences |
| `DELTA_LENGTH_BYTE_ARRAY` | `BYTE_ARRAY` | ✅ | ✅ | Delta-encodes lengths followed by concatenated bytes |
| `DELTA_BYTE_ARRAY` | `BYTE_ARRAY`, `FIXED_LEN_BYTE_ARRAY` | ✅ | ✅ | Prefix/suffix encoding for related byte strings |
| `RLE_DICTIONARY` | All physical types | ✅ | ✅ | Modern dictionary index encoding |
| [`BYTE_STREAM_SPLIT`](https://github.com/apache/parquet-format/blob/master/Encodings.md#byte-stream-split--9) | `INT32`, `INT64`, `FLOAT`, `DOUBLE`, `FIXED_LEN_BYTE_ARRAY` | ✅ | ✅ | Transposes fixed-width bytes to improve later compression |
| [`ALP`](https://github.com/apache/parquet-format/pull/557) | `FLOAT`, `DOUBLE` | ❌ | ❌ | Active preview encoding proposal; not part of the supported stable matrix |
| [`PFOR`](https://github.com/apache/parquet-format/pull/579) | Integer encodings | ❌ | ❌ | WIP proposal; no reader or writer support yet |

The TypeScript writer can select stable non-dictionary encodings by top-level column name:

```typescript
const parquet = await encode(table, ParquetJSWriter, {
  parquet: {
    columnEncodings: {
      temperature: 'BYTE_STREAM_SPLIT',
      timestamp: 'DELTA_BINARY_PACKED',
      identifier: 'DELTA_BYTE_ARRAY'
    },
    dictionary: 'auto'
  }
});
```

Dictionary encoding is a column-chunk policy rather than a primary `columnEncodings` value because
one chunk can start with a PLAIN dictionary page and then use `RLE_DICTIONARY` data pages. With
`dictionary: 'auto'`, the writer builds a candidate dictionary and uses it only when the dictionary
payload plus indexes are smaller than the selected primary encoding. `dictionary: true` forces the
dictionary when it fits `dictionaryPageSizeLimit`; an oversized dictionary falls back for the
complete chunk. `columnDictionaries` can override the policy for individual columns.

The dictionary is planned across the complete column chunk and shared by every data page. This
avoids page-to-page dictionary churn and lets the writer make one stable size decision before
emitting bytes. High-cardinality data therefore stays on its selected PLAIN, delta, or
byte-stream-split encoding instead of paying dictionary overhead.

## Compression

Compression is selected per column chunk and applied independently to each page. Availability of a
JavaScript fallback codec is separate from browser-native `DecompressionStream` support.

| Compression codec | JS read | JS write | Notes |
| ----------------- | ------- | -------- | ----- |
| `UNCOMPRESSED` | ✅ | ✅ | Encoding still applies |
| `SNAPPY` | ✅ | ✅ | Common Parquet default |
| `GZIP` | ✅ | ✅ | Native decompression is used when available |
| `BROTLI` | ✅ | ❌ | Native or injected decoder, depending on runtime |
| `LZO` | ❌ | ❌ | No maintained browser-capable implementation is bundled |
| legacy `LZ4` | ✅ | ✅ | Accepts raw, framed, and Hadoop-framed legacy data |
| `ZSTD` | ✅ | ✅ | Native when available; otherwise inject `zstd-codec` |
| `LZ4_RAW` | ✅ | ✅ | Interoperable LZ4 block format introduced after legacy `LZ4` |

Codec code is loaded lazily. This keeps the default browser bundle small and lets runtimes use native
decompression before downloading a JavaScript fallback.

## Metadata, Statistics, and Indexes

The file footer contains the schema, row-group directory, column-chunk offsets and sizes, row counts,
codec/encoding declarations, writer identity, and arbitrary key/value metadata. Additional metadata
can make selective reads much cheaper.

| Feature | JS read | JS write | Current behavior |
| ------- | ------- | -------- | ---------------- |
| File and schema metadata | ✅ | ✅ | Footer is cached by `ParquetSourceLoader` |
| Row-group and column-chunk offsets | ✅ | ✅ | Drive byte-range projection and row-group selection |
| Column-chunk min/max/null/distinct statistics | ✅ | ❌ | Drive conservative `ParquetSource` predicate pushdown and remain exposed in metadata |
| Page statistics in page headers | ⚠️ | ❌ | Thrift fields are decoded but not exposed as a pruning API |
| [Column index](https://github.com/apache/parquet-format/blob/master/PageIndex.md) | ✅ | ✅ (opt-in) | Predicates use page min/max statistics to derive conservative candidate row ranges, including nested/repeated primitive leaves; repeated leaves omit row-level null counts |
| [Offset index](https://github.com/apache/parquet-format/blob/master/PageIndex.md) | ✅ | ✅ (opt-in) | Selected columns use page locations and first-row indexes for selective byte reads, including complete-page reads for repeated leaves |
| [Bloom filters](https://github.com/apache/parquet-format/blob/master/BloomFilter.md) | ✅ | ✅ | TypeScript reads split-block Bloom filters for safe equality/`IN` row-group pruning; `ParquetJSWriter` can emit them opt-in |
| Size statistics | ❌ | ❌ | Histogram metadata from newer format work is not yet exposed; see the upstream [`ColumnMetaData`](https://github.com/apache/parquet-format/blob/master/src/main/thrift/parquet.thrift) definition |
| Column order and sorting columns | ⚠️ | ❌ | Raw footer metadata is retained; semantic pruning is not yet applied |

`ParquetSourceLoader` accepts serializable logical predicates, prunes impossible row groups using
footer statistics and split-block Bloom filters, and uses column/offset indexes to avoid irrelevant
data pages for primitive leaves, including nested and repeated children. Repeated leaves are read at
complete page boundaries so repetition and definition levels remain valid. Filter-only columns are
not returned in the projected Arrow schema. Candidate rows are still filtered exactly on the caller
thread or worker. Size statistics, sorting metadata, and encryption remain future
format-completeness work.

## Integrity and Encryption

| Feature | JS read | JS write | Notes |
| ------- | ------- | -------- | ----- |
| Footer and page-bound validation | ✅ | ✅ | Invalid magic, lengths, indexes, and truncated payloads are rejected |
| Page CRC verification | ❌ | ❌ | Optional CRC fields are not yet verified or emitted |
| [Parquet modular encryption](https://github.com/apache/parquet-format/blob/master/Encryption.md) | ❌ | ❌ | Encrypted footer and encrypted-column files use the `PARE` magic value |
| External column chunks | ❌ | ❌ | `file_path` column references are rejected |

## Parquet and Arrow

Parquet is optimized for storage and selective I/O; Arrow is optimized for in-memory analytics.
They share a columnar model but not a byte layout. A performant reader must still decode levels,
encodings, and compression and then construct Arrow validity, offset, and value buffers.

The TypeScript loader directly constructs Arrow buffers for supported primitive, byte, decimal, and
nested columns. This avoids object-row materialization and can outperform a WebAssembly path that
must copy or serialize data across a language boundary. See
[JavaScript and WebAssembly performance](/docs/developer-guide/concepts/javascript-and-wasm-performance)
for the broader tradeoffs.

## Interoperability and Roadmap

The compatibility suite uses checked-in files from
[apache/parquet-testing](https://github.com/apache/parquet-testing) and differential comparisons with
maintained browser-capable implementations. Required tests are hermetic; large and exhaustive
corpora run in the slow lane.

The TypeScript implementation is aiming for complete stable-format read support. The largest known
gaps are currently:

1. Variant value decoding and shredding;
2. page CRC verification and emission;
3. size statistics and semantic sorting metadata; and
4. Parquet modular encryption.

Preview features such as [ALP](https://github.com/apache/parquet-format/pull/557), [PFOR](https://github.com/apache/parquet-format/pull/579), and the upstream [format-versioning RFCs](https://github.com/apache/parquet-format/pulls?q=is%3Apr+versioning) are tracked separately from stable-format completeness.
