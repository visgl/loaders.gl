Columnar file format

![](/next/images/format-logos/orc-logo.png)

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# Apache ORC

Apache ORC stores a schema, encoded column streams, and statistics in a compact file layout. Its footer makes the structure discoverable before the data is materialized.

[ORC module](https://loaders.gl/next/docs/modules/tables/orc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/orc.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

## Hosted ORC loader

This Apache ORC compatibility fixture is fetched directly in the browser and decoded to an Apache Arrow table.

Load hosted ORC

**Ready**

Source:

<!-- -->

[Apache ORC v0 compatibility fixture](https://github.com/apache/orc/blob/rel/release-2.0.1/examples/demo-11-none.orc).

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

The ORC layout

## Footer first. Stripes and streams after.

The current loaders.gl source uses ORC metadata for discovery and returns correct Arrow data. The physical layout also explains where future selective reads can be added.

01

Footer

Schema, encodings, streams, and statistics

02

Stripes

Independent groups of rows and column data

03

Streams

Encoded values, indexes, and dictionaries

04

Output

Arrow tables with portable scan semantics

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`@loaders.gl/tables/orc`](https://loaders.gl/next/docs/modules/tables/orc.md)*
* *[Apache ORC](https://orc.apache.org/)*

Apache ORC is a typed, column-oriented storage format. Files organize rows into stripes and keep a schema, encodings, stream locations, and statistics in their footer and stripe metadata.

Detailed guide

## ORC layout and scan support

The sections below explain the physical format and make the current materialized-scan boundary explicit.

## Format characteristics[​](#format-characteristics "Direct link to Format characteristics")

| Characteristic                  | ORC                                                     |
| ------------------------------- | ------------------------------------------------------- |
| Layout                          | Column-oriented stripes containing encoded streams      |
| Schema                          | Stored in the file footer                               |
| Compression                     | Per-stream codecs described by the postscript           |
| Selective-reading opportunities | Stripes, row indexes, Bloom filters, and column streams |
| loaders.gl result               | Arrow table data                                        |

## Scan support[​](#scan-support "Direct link to Scan support")

`ORCSource` currently provides a materialized common scan. Footer metadata drives discovery, while the data path decodes the complete file and applies predicates, projection, and limit residually.

| Scan feature                                       | Support                  |
| -------------------------------------------------- | ------------------------ |
| Entry point                                        | ✅ `read()` or `query()` |
| Schema discovery                                   | ✅ Supported             |
| Predicate, projection, and global limit            | ✅ Supported, residual   |
| Arrow output                                       | ✅ Supported             |
| Streaming and cooperative cancellation             | ❌ Not advertised        |
| Stripe, row-index, Bloom-filter, or range pushdown | ❌ Not implemented       |

The green badge means the query executes correctly. It does not claim the physical pruning features that the ORC format can theoretically support.
