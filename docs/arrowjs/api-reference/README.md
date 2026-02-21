# Apache Arrow JavaScript API Reference

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

## Usage

```ts
import {makeTable, Int32, Utf8} from 'apache-arrow';

const table = makeTable({
  id: [1, 2, 3],
  name: ['alice', 'bob', 'cara']
});

console.log(table.numRows, table.schema.fields.length);
```

## Scope

The public API coverage below is for the modern Arrow JS v21+ class/function surface. Older legacy concepts (`Column`, `DataFrame`, legacy `Chunked` and type-specific `*Vector` constructors) are omitted from the core index and treated as migration notes on the individual pages.

## Core data model

### Value model

- `DataType` + concrete type classes (for example `Bool`, `Int`, `Float`, `Utf8`, `Struct`, `Dictionary`, etc.)
- `Data` — buffer-backed storage for a typed logical Arrow column segment
- `Vector` — immutable logical view over one or more `Data` chunks
- `RecordBatch` — row-aligned collection of child vectors
- `Table` — chunked, row-oriented collection of columns

### Schema and fields

- `Field` — name/type/nullability/metadata descriptor
- `Schema` — ordered list of `Field` values and schema-level metadata

### Builders

- `Builder` and concrete builder classes (`IntBuilder`, `Utf8Builder`, `StructBuilder`, …)
- Factory: `makeBuilder`
- Stream helpers: `builderThroughIterable`, `builderThroughAsyncIterable`

### IO and serialization

- `tableFromIPC`, `tableFromJSON`, `tableToIPC`
- `RecordBatchReader`, `RecordBatchStreamReader`, `RecordBatchFileReader`, and async variants
- `RecordBatchWriter`, `RecordBatchStreamWriter`, `RecordBatchFileWriter`, `RecordBatchJSONWriter`

### Containerized exports (high-value)

`DataType`, `Data`, `Vector`, `Builder`, `Field`, `Schema`, `RecordBatch`, `Table`, `RecordBatchReader`, `RecordBatchWriter`, `MessageReader`, `Message`, `makeData`, `makeVector`, `vectorFromArray`, `makeTable`, `makeBuilder`, `tableFromArrays`, `tableFromIPC`, and `tableToIPC`.

If you are cross-checking against source, prefer the official `apache-arrow` package exports in `Arrow.dom.d.ts`/`Arrow.node.d.ts` for the exact public API in your installed version.
