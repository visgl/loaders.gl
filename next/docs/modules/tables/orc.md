ORC module

![](/next/images/format-logos/orc-logo.png)

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# @loaders.gl/tables/orc

`@loaders.gl/tables/orc` reads and writes Apache ORC files. Its source API exposes metadata and a portable scan contract while keeping the current materialized execution model explicit.

[ORC format](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)[ORC scan](https://loaders.gl/next/docs/modules/tables/orc.md#scan-support)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/orc.md#scan-support)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

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

The ORC path

## Discover the footer. Decode the file. Apply the query.

ORC source metadata supports portable query planning, while the current implementation materializes the file before residual filtering and projection. That boundary is documented rather than implied as pushdown.

01

Input

ORC file URL, Blob, or loaded data

02

Discover

Footer metadata, schema, and row count

03

Query

Projection, predicate, and limit

04

Output

Arrow batches or materialized Arrow table

Detailed guide

## ORC scan and writer details

The reference below covers installation, current scan behavior, query methods, supported capabilities, and the distinction from physical stripe pushdown.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

The `@loaders.gl/tables/orc` module reads and writes Apache ORC files. `ORCSourceLoader` adds a portable table scan over a URL or `Blob` and returns Arrow data.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables apache-arrow
```

## Scan support[​](#scan-support "Direct link to Scan support")

The current source is a correct materialized scan. It reads ORC footer metadata for discovery, then decodes the complete file before applying the portable query. It does not claim stripe or row-index pushdown.

| Capability                             | Support                  | Execution                               |
| -------------------------------------- | ------------------------ | --------------------------------------- |
| Entry point                            | ✅ `read()` or `query()` | Arrow batch or materialized Arrow table |
| Schema and row-count discovery         | ✅ Supported             | ORC footer metadata                     |
| Predicate                              | ✅ Supported             | Residual after decoding                 |
| Projection                             | ✅ Supported             | Residual                                |
| Global limit                           | ✅ Supported             | Residual after filtering                |
| Streaming and cooperative cancellation | ❌ Not advertised        | Complete-file execution                 |
| Stripe, row-index, or range pruning    | ❌ Not implemented       | No pushdown claim is made               |

```
import {createDataSource} from '@loaders.gl/core';

import {ORCSourceLoader} from '@loaders.gl/tables/orc';

import {parseSQLPredicate} from '@loaders.gl/core/scan';



const source = createDataSource('events.orc', [ORCSourceLoader]);

const metadata = await source.getQueryMetadata();



for await (const batch of source.read({

  predicate: parseSQLPredicate("status = 'active'"),

  columns: ['id', 'status'],

  limit: 100

})) {

  console.log(batch.data);

}
```

Use Parquet when physical column and row-group pruning is a hard requirement. ORC remains useful when format compatibility matters and materializing the selected file is acceptable.

LZO decompression is supported through compress-utils 0.10.1. ORC compression chunk framing is handled in TypeScript. LZO compression is not supported.
