Lance module

# Read columnar dataset fragments without loading everything.

`@loaders.gl/tables/lance` provides a focused, read-only path through Lance manifests, fragments, and selected primitive columns. It uses Arrow tables as the result and HTTP ranges for remote column reads.

[Lance APIs](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-source-loader.md)[Arrow data plane](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Lance example](https://github.com/visgl/loaders.gl/tree/master/examples/lance/browser)

<!-- -->

[ ↗](https://github.com/visgl/loaders.gl/tree/master/examples/lance/browser)

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

The Lance read path

## Read metadata. Select columns. Decode Arrow data.

The current module keeps its supported surface explicit: remote range reads and primitive columns are implemented, while unsupported encodings and writes remain outside the advertised contract.

01

Discover

Versioned manifests, fragments, and data files

02

Select

Primitive scalar or 2D coordinate columns

03

Transport

Local reads or HTTP byte ranges

04

Output

Decoded Apache Arrow tables

Detailed guide

## Current scope and APIs

The reference below documents supported column types, source and parser entry points, known limitations, and the browser example.

![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

The `@loaders.gl/tables/lance` module provides read-only access to Lance dataset manifests, data-file metadata, and a small Arrow decoding MVP.

## Current scope[​](#current-scope "Direct link to Current scope")

* Reads versioned Lance manifests and fragments.
* Reads fixed-width integer and floating-point columns.
* Reads selected remote columns with HTTP range requests.
* Reads two-dimensional fixed-size float coordinate columns, used by the PushT trajectory example.
* Returns decoded values as Apache Arrow tables.

Strings, binary/image columns, nullable values, general lists, compressed encodings, predicate pushdown, and writes are not yet supported.

## APIs[​](#apis "Direct link to APIs")

* [`LanceSourceLoader`](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-source-loader.md) reads dataset metadata and local or remote Arrow batches.
* The parser helpers are available from the [`@loaders.gl/tables/lance/lance-arrow`](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-arrow.md) subpath. They read selected primitive or two-dimensional coordinate columns with HTTP ranges.

See the [Lance browser example](https://github.com/visgl/loaders.gl/tree/master/examples/lance/browser) for a curated Hugging Face picker, LAION scalar table, and PushT deck.gl coordinate view.
