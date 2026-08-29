---
title: Binary Columnar Data Formats
description: Understand how Arrow, Parquet, ORC, Avro, and table layers fit together for analytical data.
hide_title: true
page_style: designed
---

import {CrossFormatScanEngineGraphic} from '@site/src/components/docs/cross-format-scan-engine-graphic';
import {ArrowDataPlaneGraphic} from '@site/src/components/docs/arrow-data-plane-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {IcebergScanLiveExample} from '@site/src/components/docs/iceberg-scan-live-example';

<DocPageHeader
  eyebrow="Binary columnar data"
  title="Separate the table, the file, and the scan."
  description="Arrow, Parquet, ORC, Avro, Iceberg, and related systems solve different parts of the data path. This guide gives each layer a clear place, then shows how loaders.gl connects them in the browser."
  tone="cyan"
  meta={['Arrow and IPC', 'Parquet and ORC', 'Cloud-native scans']}
  links={[
    {label: 'Arrow tentpole', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Parquet format', to: '/docs/modules/parquet/formats/parquet'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<ArrowDataPlaneGraphic />

<DocOrientation
  eyebrow="How the pieces fit"
  title="Plan the dataset. Read the file. Return a common table."
  description="The most useful distinction is between table-management metadata, physical file layout, scan execution, and the in-memory representation handed to an application."
  tone="cyan"
  items={[
    {label: 'Table layer', value: 'Snapshots, manifests, partitions, and transactions'},
    {label: 'File layer', value: 'Parquet, ORC, Avro, and Arrow IPC bytes'},
    {label: 'Scan layer', value: 'Projection, predicates, ranges, batches, and workers'},
    {label: 'Result layer', value: 'Typed Arrow arrays, record batches, and tables'}
  ]}
/>

Binary columnar formats are designed to store tabular data compactly and make analytical reads
efficient. They are especially useful when a query needs a subset of columns, a subset of rows, or
only selected byte ranges from a remote object.

The formats in this space are related, but they are not interchangeable. **Arrow** is primarily an
in-memory and interchange representation, **Parquet** and **ORC** are analytical file formats,
**Avro** is primarily a row-oriented serialization format, and **Iceberg** and **Delta Lake** are
table-management layers that usually organize files in one of these formats.

<ReferenceBoundary
  title="Format comparison and architecture details"
  description="The reference below compares the physical formats, table layers, scan responsibilities, tradeoffs, and loaders.gl integration points."
  tone="cyan"
/>

<CrossFormatScanEngineGraphic />

<IcebergScanLiveExample />

## At a glance

| Technology | Primary focus | Strengths | Tradeoffs | Typical role |
| --- | --- | --- | --- | --- |
| [Apache Arrow](https://arrow.apache.org/) | In-memory columnar data and interchange | Fast vectorized processing; zero-copy sharing; broad language support; natural fit for analytics and GPU pipelines | Not primarily a durable object-storage format; in-memory tables can be large; runtime APIs are more complex than ordinary records | Memory and execution layer |
| [Arrow IPC / Feather](https://arrow.apache.org/docs/format/Columnar.html) | Serialization of Arrow schemas, arrays, and record batches | Fast to read and write; preserves Arrow types; excellent for intermediate results and local data exchange | Less focused on lake-scale partitioning and metadata management than Parquet; files are not usually the primary table-management unit | Arrow interchange file |
| [Apache Parquet](https://parquet.apache.org/) | Durable compressed columnar files | Mature ecosystem; strong compression; column projection; row-group statistics; HTTP range-friendly layout; supports nested data | Immutable file model; physical and logical schemas are intricate; updates and transactions need a table layer | General-purpose analytical storage |
| [Apache Avro](https://avro.apache.org/) | Row-oriented serialization and schema evolution | Compact records; explicit schemas; schema negotiation; excellent for events, messages, and streaming | Usually less efficient for column-selective analytics; weaker scan pruning; record-at-a-time decoding | Events and data interchange |
| [Apache ORC](https://orc.apache.org/) | Compressed columnar warehouse storage | Strong compression; indexes and statistics; efficient large analytical scans; mature Hive ecosystem | More ecosystem-specific than Parquet; complex implementation; less universal support outside warehouse systems | Warehouse-oriented analytical storage |
| [Apache Iceberg](https://iceberg.apache.org/) | Open table format over data files | Snapshots; transactions; time travel; schema and partition evolution; multi-engine catalogs | Not a physical encoding; requires metadata and catalog management; more moving parts than a single file | Lakehouse table layer |
| [Delta Lake](https://delta.io/) | Transactional lakehouse tables, commonly over Parquet | ACID transactions; schema enforcement; mature Spark-oriented workflows; operationally familiar | Transaction-log and ecosystem assumptions; interoperability depends on the reader | Lakehouse table layer |
| [Lance](https://lancedb.com/) | Versioned analytical tables and interactive ML/vector workloads | Random access; updates and versioning; useful for multimodal and vector data; designed for interactive access | Younger ecosystem; fewer universal readers; different storage model from conventional lake files | Interactive and ML data layer |
| [Vortex](https://github.com/vortex-data/vortex) | Modern columnar storage and compute-oriented access | Focus on selective reads, modern encodings, and efficient execution; promising for next-generation analytics | Young format and ecosystem; fewer established tools and compatibility guarantees | Emerging analytical storage |

## The layers are different

It is useful to separate the stack into three layers:

```text
Table and catalog planning
  Iceberg, Delta Lake, catalogs, manifests, snapshots
                         ↓
Scan planning and transport
  projection, predicates, partition pruning, ranges, batches
                         ↓
Physical representation
  Parquet, ORC, Avro, Arrow IPC, Lance, Vortex
                         ↓
In-memory result
  Arrow arrays, record batches, and tables
```

This explains why a comparison that treats Iceberg as a competitor to Parquet is misleading.
Iceberg can use Parquet, ORC, or Avro files underneath it. Similarly, Arrow is often the output
of a Parquet reader rather than the format stored in the object store.

## Choosing a format

### Choose Arrow when the data is already in memory

Arrow is a strong common representation between languages, processes, workers, and analytical
engines. It avoids unnecessary conversion when the next operation is vectorized computation,
visualization, or GPU upload.

Use Arrow IPC or Feather when the goal is fast interchange of Arrow data, especially for local
files, intermediate results, and batch handoff. For a large multi-file object-store dataset,
Parquet plus a table-management layer is usually a better fit.

### Choose Parquet for the general analytical-file default

Parquet is usually the safest default for durable analytical files. Its row groups, column chunks,
statistics, compression, and broad reader support work well for cloud storage and selective scans.
It is also a practical target for a library that wants to preserve typed, columnar, and zero-copy
paths while supporting HTTP range requests.

### Choose Avro for records and streams

Avro is a natural choice when applications exchange complete records, schemas evolve over time, or
data flows through a message or event system. It can be stored in data lakes, but its row-oriented
layout is generally not the first choice for repeated column-selective analytical scans.

### Choose ORC when the surrounding warehouse ecosystem already speaks ORC

ORC can be highly effective in systems built around Hive and related warehouse engines. Its
compression and indexing features are compelling, but the ecosystem fit matters: Parquet is often
the more portable choice when many independent tools and runtimes must read the same files.

### Choose Iceberg or Delta Lake when files become a dataset

A collection of Parquet files is not automatically a table. When a dataset needs atomic commits,
schema evolution, partition evolution, snapshots, deletes, or time travel, a table format such as
Iceberg or Delta Lake supplies the metadata and transaction layer above the files.

In loaders.gl, Iceberg planning is intentionally layered above Parquet. The
[`IcebergTableSource`](/docs/modules/parquet/api-reference/iceberg-table-source) reads metadata and
manifests, prunes candidate files, and delegates selected Parquet files to the existing dataset
source. This preserves Parquet's range requests, workers, projection, predicates, and Arrow batches
without exposing Parquet page or encoding details in the Iceberg API. Position and Avro equality
deletes are available as an opt-in scan phase; equality fields are resolved through Iceberg schema
field IDs. The live example above uses Hyperparam's public
[bunnies Iceberg table](https://s3.amazonaws.com/hyperparam-iceberg/spark/bunnies), a small
browser-readable table that makes the metadata → manifest → Parquet → Arrow path concrete.

### Consider Lance or Vortex for specialized workloads

Lance and Vortex are interesting when interactive access, frequent updates, vector search, or newer
execution-oriented storage techniques matter more than maximum compatibility with existing data
platforms. They should be evaluated alongside the surrounding tools, not only by comparing file
compression ratios.

## What a reusable reader should share

A reader library can share useful analytical infrastructure without pretending that all formats
have the same physical model. The reusable layer can contain:

- column projection and schema selection;
- a format-neutral predicate expression;
- partition and file selection;
- random-access and HTTP range primitives;
- cancellation, concurrency, and worker transport;
- bounded, ordered scan-task execution with backpressure;
- Arrow-oriented batches and typed-array preservation.

The format-specific layer should retain physical decoding, page or block indexes, statistics
semantics, encodings, schema translation, and error behavior. For example, a generic `eq` or `and`
predicate can be planned by Parquet, Avro, ORC, or Iceberg differently without requiring the shared
reader infrastructure to expose Parquet row groups or ORC stripes.

## loaders.gl

loaders.gl uses Arrow as an important table and batch representation and provides dedicated support
for formats such as [Arrow](/docs/modules/arrow/formats/arrow) and
[Parquet](/docs/modules/parquet/formats/parquet). The format-specific documentation describes
physical layout and loader behavior; this page provides the broader comparison and helps explain
where future Avro, ORC, or table-format support would fit.
