Binary columnar data

# Keep wide tables compact.

Use typed columns, selective reads, and Arrow-compatible batches to move large analytical datasets through the browser without turning every value into a JavaScript object.

ArrowParquetselective reads

Binary columnar data

# Separate the table, the file, and the scan.

Arrow, Parquet, ORC, Avro, Iceberg, and related systems solve different parts of the data path. This guide gives each layer a clear place, then shows how loaders.gl connects them in the browser.

[Arrow tentpole](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Parquet format](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

The common data plane

## Many inputs. One typed table boundary.

The file format stays specialized at the edges. Arrow is the shared shape in the middle, where loaders, scans, workers, renderers, and writers can exchange columns and batches.

Format-specific input

[Parquetcolumns and row groups↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[CSV / JSONLstreamed records↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[Geo formatsfeatures and geometry columns↗](https://loaders.gl/next/docs/specifications/category-gis.md)[Arrow IPCfile or stream↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

→

↔

Apache Arrow

schema · vectors · record batches

→

Application work

[Scanfilter and project↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Workerstransfer buffers↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Rendertables and geometry↗](https://loaders.gl/next/docs/specifications/category-table.md)[WriteIPC or another format↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

Keep the representation stable while the source, execution engine, or destination changes.

How the pieces fit

## Plan the dataset. Read the file. Return a common table.

The most useful distinction is between table-management metadata, physical file layout, scan execution, and the in-memory representation handed to an application.

01

Table layer

Snapshots, manifests, partitions, and transactions

02

File layer

Parquet, ORC, Avro, and Arrow IPC bytes

03

Scan layer

Projection, predicates, ranges, batches, and workers

04

Result layer

Typed Arrow arrays, record batches, and tables

Binary columnar formats are designed to store tabular data compactly and make analytical reads efficient. They are especially useful when a query needs a subset of columns, a subset of rows, or only selected byte ranges from a remote object.

The formats in this space are related, but they are not interchangeable. **Arrow** is primarily an in-memory and interchange representation, **Parquet** and **ORC** are analytical file formats, **Avro** is primarily a row-oriented serialization format, and **Iceberg** and **Delta Lake** are table-management layers that usually organize files in one of these formats.

Detailed guide

## Format comparison and architecture details

The reference below compares the physical formats, table layers, scan responsibilities, tradeoffs, and loaders.gl integration points.

The scan execution map

## One query path. Format-specific readers.

The application describes the request once. Planning and range access stay shared while each storage format keeps its own physical decoder.

### Application request

Viewport / queryColumns + filterRender target

↓

### Table planner

Snapshot selectionManifest discoveryPartition pruning

↓

### Shared scan engine

File discoveryProjectionPredicate ASTBounded tasksRange accessBatch scheduling

↓

### Format-specific readers

**Parquet**row groups · pages · indexes

**Avro**blocks · schemas · records

**ORC**stripes · streams · indexes

**Lance · Vortex**native storage adapters

↓

### Common analytical result

Arrow batchesZero-copy pathsApplication / GPU

↓

### Browser-native runtime

Fetch + HTTP RangeWorkers + cancellationTyped arrays

Iceberg and other table formats can plan files above the shared engine; the matching reader still owns its schema, statistics, pages, blocks, or stripes.

### Iceberg snapshot → Arrow batches

A public Iceberg table is discovered in the browser, its snapshot and manifests are planned, and the selected Parquet data is emitted as Arrow batches.

Running

Metadata

→

Manifest plan

→

Parquet scan

→

Arrow batches

Iceberg table source

<https://s3.amazonaws.com/hyperparam-iceberg/spark/bunnies>▾

Load URL

Choose a curated public table or load a table root or metadata JSON URL.

SQLSELECT \* FROM bunnies WHERE Lifespan >= 8

Predicate AST{"op":">=","args":\[{"property":"Lifespan"},8]}

Run

Edit either view and the other stays synchronized. Supported SQL is SELECT \* FROM table WHERE column operator value; Run applies the predicate to Iceberg and Parquet.

**Iceberg scan parameters**Discovering schema…

Reading source metadata before opening the data…

**Query plan**Iceberg snapshot → Parquet → Arrow

0

files

—

rows

—

metadata

## At a glance[​](#at-a-glance "Direct link to At a glance")

| Technology                                                                | Primary focus                                                   | Strengths                                                                                                                       | Tradeoffs                                                                                                                             | Typical role                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [Apache Arrow](https://arrow.apache.org/)                                 | In-memory columnar data and interchange                         | Fast vectorized processing; zero-copy sharing; broad language support; natural fit for analytics and GPU pipelines              | Not primarily a durable object-storage format; in-memory tables can be large; runtime APIs are more complex than ordinary records     | Memory and execution layer            |
| [Arrow IPC / Feather](https://arrow.apache.org/docs/format/Columnar.html) | Serialization of Arrow schemas, arrays, and record batches      | Fast to read and write; preserves Arrow types; excellent for intermediate results and local data exchange                       | Less focused on lake-scale partitioning and metadata management than Parquet; files are not usually the primary table-management unit | Arrow interchange file                |
| [Apache Parquet](https://parquet.apache.org/)                             | Durable compressed columnar files                               | Mature ecosystem; strong compression; column projection; row-group statistics; HTTP range-friendly layout; supports nested data | Immutable file model; physical and logical schemas are intricate; updates and transactions need a table layer                         | General-purpose analytical storage    |
| [Apache Avro](https://avro.apache.org/)                                   | Row-oriented serialization and schema evolution                 | Compact records; explicit schemas; schema negotiation; excellent for events, messages, and streaming                            | Usually less efficient for column-selective analytics; weaker scan pruning; record-at-a-time decoding                                 | Events and data interchange           |
| [Apache ORC](https://orc.apache.org/)                                     | Compressed columnar warehouse storage                           | Strong compression; indexes and statistics; efficient large analytical scans; mature Hive ecosystem                             | More ecosystem-specific than Parquet; complex implementation; less universal support outside warehouse systems                        | Warehouse-oriented analytical storage |
| [Apache Iceberg](https://iceberg.apache.org/)                             | Open table format over data files                               | Snapshots; transactions; time travel; schema and partition evolution; multi-engine catalogs                                     | Not a physical encoding; requires metadata and catalog management; more moving parts than a single file                               | Lakehouse table layer                 |
| [Delta Lake](https://delta.io/)                                           | Transactional lakehouse tables, commonly over Parquet           | ACID transactions; schema enforcement; mature Spark-oriented workflows; operationally familiar                                  | Transaction-log and ecosystem assumptions; interoperability depends on the reader                                                     | Lakehouse table layer                 |
| [Lance](https://lancedb.com/)                                             | Versioned analytical tables and interactive ML/vector workloads | Random access; updates and versioning; useful for multimodal and vector data; designed for interactive access                   | Younger ecosystem; fewer universal readers; different storage model from conventional lake files                                      | Interactive and ML data layer         |
| [Vortex](https://github.com/vortex-data/vortex)                           | Modern columnar storage and compute-oriented access             | Focus on selective reads, modern encodings, and efficient execution; promising for next-generation analytics                    | Young format and ecosystem; fewer established tools and compatibility guarantees                                                      | Emerging analytical storage           |

## The layers are different[​](#the-layers-are-different "Direct link to The layers are different")

It is useful to separate the stack into three layers:

```
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

This explains why a comparison that treats Iceberg as a competitor to Parquet is misleading. Iceberg can use Parquet, ORC, or Avro files underneath it. Similarly, Arrow is often the output of a Parquet reader rather than the format stored in the object store.

## Choosing a format[​](#choosing-a-format "Direct link to Choosing a format")

### Choose Arrow when the data is already in memory[​](#choose-arrow-when-the-data-is-already-in-memory "Direct link to Choose Arrow when the data is already in memory")

Arrow is a strong common representation between languages, processes, workers, and analytical engines. It avoids unnecessary conversion when the next operation is vectorized computation, visualization, or GPU upload.

Use Arrow IPC or Feather when the goal is fast interchange of Arrow data, especially for local files, intermediate results, and batch handoff. For a large multi-file object-store dataset, Parquet plus a table-management layer is usually a better fit.

### Choose Parquet for the general analytical-file default[​](#choose-parquet-for-the-general-analytical-file-default "Direct link to Choose Parquet for the general analytical-file default")

Parquet is usually the safest default for durable analytical files. Its row groups, column chunks, statistics, compression, and broad reader support work well for cloud storage and selective scans. It is also a practical target for a library that wants to preserve typed, columnar, and zero-copy paths while supporting HTTP range requests.

### Choose Avro for records and streams[​](#choose-avro-for-records-and-streams "Direct link to Choose Avro for records and streams")

Avro is a natural choice when applications exchange complete records, schemas evolve over time, or data flows through a message or event system. It can be stored in data lakes, but its row-oriented layout is generally not the first choice for repeated column-selective analytical scans.

### Choose ORC when the surrounding warehouse ecosystem already speaks ORC[​](#choose-orc-when-the-surrounding-warehouse-ecosystem-already-speaks-orc "Direct link to Choose ORC when the surrounding warehouse ecosystem already speaks ORC")

ORC can be highly effective in systems built around Hive and related warehouse engines. Its compression and indexing features are compelling, but the ecosystem fit matters: Parquet is often the more portable choice when many independent tools and runtimes must read the same files.

### Choose Iceberg or Delta Lake when files become a dataset[​](#choose-iceberg-or-delta-lake-when-files-become-a-dataset "Direct link to Choose Iceberg or Delta Lake when files become a dataset")

A collection of Parquet files is not automatically a table. When a dataset needs atomic commits, schema evolution, partition evolution, snapshots, deletes, or time travel, a table format such as Iceberg or Delta Lake supplies the metadata and transaction layer above the files.

In loaders.gl, Iceberg planning is intentionally layered above Parquet. The [`IcebergTableSource`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md) from `@loaders.gl/tables/iceberg` reads metadata and manifests, prunes candidate files, and delegates selected Parquet files to the existing dataset source. This preserves Parquet's range requests, workers, projection, predicates, and Arrow batches without exposing Parquet page or encoding details in the Iceberg API. Position and Avro equality deletes are available as an opt-in scan phase; equality fields are resolved through Iceberg schema field IDs. The live example above uses Hyperparam's public [bunnies Iceberg table](https://s3.amazonaws.com/hyperparam-iceberg/spark/bunnies), a small browser-readable table that makes the metadata → manifest → Parquet → Arrow path concrete.

### Consider Lance or Vortex for specialized workloads[​](#consider-lance-or-vortex-for-specialized-workloads "Direct link to Consider Lance or Vortex for specialized workloads")

Lance and Vortex are interesting when interactive access, frequent updates, vector search, or newer execution-oriented storage techniques matter more than maximum compatibility with existing data platforms. They should be evaluated alongside the surrounding tools, not only by comparing file compression ratios.

## What a reusable reader should share[​](#what-a-reusable-reader-should-share "Direct link to What a reusable reader should share")

A reader library can share useful analytical infrastructure without pretending that all formats have the same physical model. The reusable layer can contain:

* column projection and schema selection;
* a format-neutral predicate expression;
* partition and file selection;
* random-access and HTTP range primitives;
* cancellation, concurrency, and worker transport;
* bounded, ordered scan-task execution with backpressure;
* Arrow-oriented batches and typed-array preservation.

The format-specific layer should retain physical decoding, page or block indexes, statistics semantics, encodings, schema translation, and error behavior. For example, a generic `eq` or `and` predicate can be planned by Parquet, Avro, ORC, or Iceberg differently without requiring the shared reader infrastructure to expose Parquet row groups or ORC stripes.

## loaders.gl[​](#loadersgl "Direct link to loaders.gl")

loaders.gl uses Arrow as an important table and batch representation and provides dedicated support for formats such as [Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md) and [Parquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md). The format-specific documentation describes physical layout and loader behavior; this page provides the broader comparison and helps explain where future Avro, ORC, or table-format support would fit.
