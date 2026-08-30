---
title: Parquet format
description: A column-oriented storage format designed for compact files and selective reads.
hide_title: true
page_style: designed
---

import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';
import {ParquetLayoutGraphic} from '@site/src/components/docs/parquet-layout-graphic';
import {ParquetScanLiveExample} from '@site/src/components/docs/parquet-scan-live-example';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocOrientation} from '@site/src/components/docs/designed-doc';

<CapabilityHero
  capability="columnar"
  eyebrow="Columnar file format"
  title="Apache Parquet"
  description="Organize data into independently useful row groups, column chunks, and pages so readers can fetch less and decode only what they need."
  logos={[
    {alt: 'Apache Parquet', src: '/images/format-logos/parquet-logo.png'}
  ]}
  links={[
    {label: 'Parquet module', to: '/docs/modules/parquet'},
    {label: 'ParquetLoader', to: '/docs/modules/parquet/api-reference/parquet-loader'}
  ]}
/>

<ParquetScanLiveExample />

<ParquetDocsTabs active="overview" />

<ParquetLayoutGraphic />

<DocOrientation
  eyebrow="The storage model"
  title="Metadata first. Data second."
  description="A Parquet reader can inspect the footer, select columns and row groups, then issue only the ranges needed for the request. This is the foundation for cloud-native scans."
  tone="mint"
  items={[
    {label: 'Footer', value: 'Describes schema, statistics, and physical ranges'},
    {label: 'Row groups', value: 'Natural units for parallel reads and pruning'},
    {label: 'Pages', value: 'Compressed units for decoding and page indexes'},
    {label: 'Output', value: 'Object rows, Arrow tables, or incremental batches'}
  ]}
/>

## Try a range-aware read

Use the panel below to inspect Parquet metadata, select columns, and limit the Arrow rows returned
from a remote file. The reader can plan the request from the footer before decoding the selected
data ranges.

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

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

## Scan support

`ParquetSourceLoader` is the selective scan API. It reads and caches the footer, plans physical
ranges, emits Arrow batches, and explains which layers rejected work.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `read()` | Streaming Arrow batches |
| Schema and statistics discovery | Supported | Footer metadata |
| Projection | Supported | Column-chunk pushdown |
| Predicate | Supported | Row-group/page/statistics/Bloom pruning plus exact residual evaluation |
| Global limit | Supported | Counts rows after filtering across all batches and files |
| Cancellation and early return | Supported | Stops pending ranges, decoding, and later files |
| Multi-file datasets | Supported | Bounded concurrency with catalog-selected fragments |
| Explain output | Supported | Logical, file, row-group, page, and range decisions |

`IcebergTableSource` and `DeltaTableSource` select active Parquet files before delegating to this
same executor. Iceberg supports snapshot and manifest planning. Delta supports read-only log replay;
tables with deletion vectors are rejected until deletion-vector decoding is available.

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
| `INT96` | 12-byte legacy timestamp | ✅ (Arrow) | ✅ (opt-in) | Canonical Julian-day plus nanoseconds representation maps to `timestamp-nanosecond`; object-row compatibility remains available via `int96AsTimestamp` |
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
| [`VARIANT`](https://github.com/apache/parquet-format/blob/master/VariantEncoding.md) | Variant metadata/value and typed-value columns | Struct storage with Variant metadata | ✅ | ❌ | TypeScript object-row reads decode unshredded values and collapse the one-field shredded typed-value union; Arrow retains canonical struct storage and specification metadata |
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
| Optional page CRC | ✅ (opt-in) | ✅ (opt-in) | `ParquetReader`/`ParquetSource` can verify CRC-32 page bodies; `ParquetJSWriter` can emit them with `writePageChecksums` |
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
| `PLAIN_DICTIONARY` | All physical types | ✅ | ✅ | Deprecated dictionary identifier; emitted when explicitly selected for legacy interoperability |
| `RLE` | Boolean, levels, dictionary indexes | ✅ | ✅ | Writer uses it for definition/repetition levels |
| `BIT_PACKED` | Legacy levels | ✅ | ❌ | Deprecated and superseded by the RLE/bit-packing hybrid; supported for legacy page-level compatibility |
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
| Column-chunk min/max/null/distinct statistics | ✅ | ✅ (opt-in) | Drive conservative `ParquetSource` predicate pushdown; `ParquetJSWriter` emits min/max/null-count statistics with `writeStatistics` |
| Page statistics in page headers | ⚠️ | ✅ (opt-in) | Thrift fields are decoded; `ParquetJSWriter` emits min/max/null-count page statistics with `writeStatistics` |
| [Column index](https://github.com/apache/parquet-format/blob/master/PageIndex.md) | ✅ | ✅ (opt-in) | Predicates use page min/max statistics to derive conservative candidate row ranges for primitive leaves, including canonical INT96 timestamps, nested struct children, and repeated leaves when selected columns share page boundaries |
| [Offset index](https://github.com/apache/parquet-format/blob/master/PageIndex.md) | ✅ | ✅ (opt-in) | Selected columns use page locations and first-row indexes for selective byte reads; repeated values and continuation pages are decoded only from complete, mutually aligned row ranges |
| [Bloom filters](https://github.com/apache/parquet-format/blob/master/BloomFilter.md) | ✅ | ✅ | TypeScript reads split-block Bloom filters for safe equality/`IN` row-group pruning; `ParquetJSWriter` can emit them opt-in |
| Size statistics | ✅ | ✅ (opt-in) | Byte-array sizes and repetition/definition histograms are decoded and exposed; `ParquetJSWriter` emits them with `writeSizeStatistics` |
| Column order and sorting columns | ✅ (metadata) | ✅ (declaration) | Row-group sort declarations are normalized as `sortingColumns`; `ParquetJSWriter` can emit declarations but does not sort rows or apply semantic pruning |

`ParquetSourceLoader` accepts serializable logical predicates, prunes impossible row groups using
footer statistics and split-block Bloom filters, and uses column/offset indexes to avoid irrelevant
data pages for primitive leaves, including nested struct children. Filter-only columns are not
returned in the projected Arrow schema. Candidate rows are still filtered exactly on the caller
thread or worker. Repeated-leaf pruning is enabled when all selected leaves have compatible page boundaries,
including pages that continue one logical row; files with incompatible boundaries conservatively use full
column-chunk reads. Size statistics are available for memory and nested-value planning; semantic sorting
pruning remains future format-completeness work. The TypeScript reader supports AES-GCM and
AES-GCM-CTR encrypted column metadata, page indexes, Bloom filters, and page modules when a key retriever
is provided. Encrypted source reads resolve selected data keys on the caller thread and transfer only
the required key material to the worker. `ParquetJSWriter` can now emit an encrypted footer with
caller-supplied key metadata and a key retriever; column metadata, pages, indexes, and Bloom filters
can also be encrypted for selected columns or all columns. Per-column key metadata enables independent
keys and rotation, while plaintext-footer signatures authenticate unencrypted footer metadata.

## Integrity and Encryption

| Feature | JS read | JS write | Notes |
| ------- | ------- | -------- | ----- |
| Footer and page-bound validation | ✅ | ✅ | Invalid magic, lengths, indexes, and truncated payloads are rejected |
| Page CRC verification | ✅ (opt-in) | ✅ (opt-in) | CRC-32 covers the compressed page body; enable verification or emission explicitly to avoid a default throughput cost |
| [Parquet modular encryption](https://github.com/apache/parquet-format/blob/master/Encryption.md) | ✅ | ✅ (opt-in) | Reader and writer support encrypted footers, per-column metadata/pages/indexes/Bloom filters, AES-GCM/AES-GCM-CTR pages, independent column keys, and plaintext-footer signatures; external-key management remains the caller's responsibility |
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

The current implementation status is tracked in the following broad work tranches. A check mark
means that the shipped path is usable; it does not imply that every producer variant has been
exhaustively certified. The remaining work is intentionally grouped by user-visible outcomes
rather than by individual missing methods.

| Tranche | Status | Landed | Exit criteria |
| ------- | ------ | ------ | ------------ |
| Selective scan and physical planning | ✅ foundation | Footer statistics, Bloom filters, page/offset indexes, nested-leaf pruning, late materialization, and explainable range plans | Sorting-column semantics drive safe page/row-group pruning, and estimates describe the physical late-materialization plan |
| Cloud-native table sources | ✅ read-only slice | Iceberg metadata/manifest planning and Delta snapshot replay dispatch selected files through `ParquetDatasetSource` | Checkpoints, CDC, deletion vectors, catalog discovery, and consistent snapshot/error semantics |
| Modular encryption | ✅ opt-in | Encrypted footer/column metadata, page/index/Bloom-filter reads, AES-GCM/AES-GCM-CTR pages, worker scans, footer-key and per-column-key encrypted-column writing, and plaintext-footer signatures | Broader encrypted-file interoperability and external key-management guidance |
| Logical and legacy parity | ✅ core Arrow path | Logical Arrow mappings, canonical INT96 timestamp read/write and page statistics, nested LIST/MAP/VARIANT/geo types, legacy `BIT_PACKED` reads, and explicit `PLAIN_DICTIONARY` writes | Legacy nested/shredding variants, object-row compatibility policy, and exact Arrow fidelity across the remaining stable logical-type matrix |
| Conformance and scale gate | ⚠️ ongoing | Hermetic feature tests, differential checks, and representative browser benchmarks | Apache corpus plus nested/repeated cases, every stable codec/encoding, differential validation, and large-file/selective-range benchmarks pass in CI |
| Emerging-format lab | 🧪 experimental | Tracking links and isolated capability flags | ALP, PFOR, VECTOR, and format-versioning experiments remain opt-in until an upstream format and interoperability fixtures stabilize |

The recent follow-up work adds conservative logical-statistics handling, repeated-page safety,
zero-valued size statistics, legacy `BIT_PACKED` level decoding, explicit legacy
`PLAIN_DICTIONARY` writer output, and footer-key encrypted column modules. Preview features such as
[ALP](https://github.com/apache/parquet-format/pull/557),
[PFOR](https://github.com/apache/parquet-format/pull/579), and the upstream
[format-versioning RFCs](https://github.com/apache/parquet-format/pulls?q=is%3Apr+versioning) remain
separate from stable-format completeness.
