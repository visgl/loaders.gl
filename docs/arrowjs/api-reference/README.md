---
title: Apache Arrow JavaScript API reference
description: Find the modern Apache Arrow JS classes and functions used by loaders.gl data pipelines.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS reference"
  title="The classes behind the columnar data path."
  description="This reference is organized around the modern Apache Arrow JS v21+ surface: data, vectors, tables, schemas, builders, and IPC readers and writers. Use it after the conceptual Arrow guide when you need an exact API name."
  tone="cyan"
  meta={['Apache Arrow JS v21+', 'Core exports', 'IPC and builders']}
  links={[
    {label: 'Arrow JavaScript guide', to: '/docs/arrowjs'},
    {label: 'Working with tables', to: '/docs/arrowjs/developer-guide/tables'},
    {label: 'Arrow in loaders.gl', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="How to use this reference"
  title="Start with the container, then follow the value."
  description="Most applications begin with makeTable or tableFromIPC, inspect a schema, and then work through vectors or record batches. The API pages below describe the pieces without requiring a legacy Arrow JS mental model."
  tone="cyan"
  items={[
    {label: 'Create', value: 'makeTable, makeData, makeVector, or makeBuilder'},
    {label: 'Inspect', value: 'Table, RecordBatch, Schema, Field, and Vector'},
    {label: 'Serialize', value: 'tableFromIPC, tableToIPC, and batch readers/writers'},
    {label: 'Migrate', value: 'Prefer modern v21+ exports over legacy vector constructors'}
  ]}
/>

<ReferenceBoundary
  title="Core Arrow JS API"
  description="The reference below summarizes the supported public surface and links to the individual data-model, type, builder, vector, and IO pages."
  tone="cyan"
/>

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
