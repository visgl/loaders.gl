Arrow JS reference

# The classes behind the columnar data path.

This reference is organized around the modern Apache Arrow JS v21+ surface: data, vectors, tables, schemas, builders, and IPC readers and writers. Use it after the conceptual Arrow guide when you need an exact API name.

[Arrow JavaScript guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Working with tables](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)[Arrow in loaders.gl](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

How to use this reference

## Start with the container, then follow the value.

Most applications begin with tableFromArrays or tableFromIPC, inspect a schema, and then work through vectors or record batches. The API pages below describe the pieces without requiring a legacy Arrow JS mental model.

01

Create

tableFromArrays, makeData, makeVector, or makeBuilder

02

Inspect

Table, RecordBatch, Schema, Field, and Vector

03

Serialize

tableFromIPC, tableToIPC, and batch readers/writers

04

Migrate

Prefer modern v21+ exports over legacy vector constructors

Detailed guide

## Core Arrow JS API

The reference below summarizes the supported public surface and links to the individual data-model, type, builder, vector, and IO pages.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

## Usage[​](#usage "Direct link to Usage")

```
import {tableFromArrays, Int32, Utf8} from 'apache-arrow';



const table = tableFromArrays({

  id: [1, 2, 3],

  name: ['alice', 'bob', 'cara']

});



console.log(table.numRows, table.schema.fields.length);
```

## Scope[​](#scope "Direct link to Scope")

The public API coverage below is for the modern Arrow JS v21+ class/function surface. Older legacy concepts (`Column`, `DataFrame`, legacy `Chunked` and type-specific `*Vector` constructors) are omitted from the core index and treated as migration notes on the individual pages.

## Core data model[​](#core-data-model "Direct link to Core data model")

### Value model[​](#value-model "Direct link to Value model")

* `DataType` + concrete type classes (for example `Bool`, `Int`, `Float`, `Utf8`, `Struct`, `Dictionary`, etc.)
* `Data` — buffer-backed storage for a typed logical Arrow column segment
* `Vector` — logical view over one or more `Data` chunks
* `RecordBatch` — row-aligned collection of child vectors
* `Table` — chunked, columnar collection with row access

### Schema and fields[​](#schema-and-fields "Direct link to Schema and fields")

* `Field` — name/type/nullability/metadata descriptor
* `Schema` — ordered list of `Field` values and schema-level metadata

### Builders[​](#builders "Direct link to Builders")

* `Builder` and concrete builder classes (`IntBuilder`, `Utf8Builder`, `StructBuilder`, …)
* Factory: `makeBuilder`
* Stream helpers: `builderThroughIterable`, `builderThroughAsyncIterable`

### IO and serialization[​](#io-and-serialization "Direct link to IO and serialization")

* `tableFromIPC`, `tableFromJSON`, `tableToIPC`
* `RecordBatchReader`, `RecordBatchStreamReader`, `RecordBatchFileReader`, and async variants
* `RecordBatchWriter`, `RecordBatchStreamWriter`, `RecordBatchFileWriter`, `RecordBatchJSONWriter`

### Containerized exports (high-value)[​](#containerized-exports-high-value "Direct link to Containerized exports (high-value)")

`DataType`, `Data`, `Vector`, `Builder`, `Field`, `Schema`, `RecordBatch`, `Table`, `RecordBatchReader`, `RecordBatchWriter`, `MessageReader`, `Message`, `makeData`, `makeVector`, `vectorFromArray`, `tableFromArrays`, `makeBuilder`, `tableFromArrays`, `tableFromIPC`, and `tableToIPC`.

If you are cross-checking against source, prefer the official `apache-arrow` package exports in `Arrow.dom.d.ts`/`Arrow.node.d.ts` for the exact public API in your installed version.
