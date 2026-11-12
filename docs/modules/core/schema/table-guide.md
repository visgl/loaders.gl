# Working with Tables

---
title: Working with tables
description: Move between row-oriented and columnar table representations while keeping a stable application contract.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Table data"
  title="Choose the table shape for the next operation."
  description="loaders.gl tables can be convenient object rows or typed Arrow columns. The right representation depends on whether the next step is application logic, scanning, geometry processing, worker transfer, or writing."
  tone="cyan"
  meta={['Object rows', 'Arrow columns', 'Batch-compatible']}
  links={[
    {label: 'Table category', to: '/docs/specifications/category-table'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="A small decision"
  title="Keep data structured as it travels."
  description="The table category gives related loaders a common result shape. Applications can start with readable rows, switch to Arrow for scale, and preserve the same pipeline boundaries as data moves between formats."
  tone="cyan"
  items={[
    {label: 'Object-row table', value: 'Easy to inspect and convenient for ordinary application code.'},
    {label: 'Arrow table', value: 'Typed columns suited to scans, transforms, workers, and analytics.'},
    {label: 'Table batch', value: 'A bounded unit for streaming and incremental processing.'},
    {label: 'Geometry table', value: 'Arrow-compatible columns for GeoArrow and spatial workflows.'}
  ]}
/>

<ReferenceBoundary
  title="Table category reference"
  description="The detailed material below explains the supported table interfaces, conversions, metadata, and the relationship between rows, batches, and Arrow columns."
  tone="cyan"
/>

The loaders.gl table category provides support for working interchangeably with row-oriented and columnar tables.

## Native Apache Arrow output

The table loaders in `@loaders.gl/tables` return native Apache Arrow objects by default
when called through the core parsing and loading APIs.

```typescript
import {load, loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables';

const table = await load('data.csv', CSVLoader);
console.log(table.numRows, table.getChild('name')); // arrow.Table

const batches = await loadInBatches('data.csv', CSVLoader);
for await (const recordBatch of batches) {
  console.log(recordBatch.numRows); // arrow.RecordBatch
}
```

| API | Native result |
| --- | --- |
| `parse`, `load`, `parseFile` | `Promise<arrow.Table>` |
| `parseSync` (where supported) | `arrow.Table` |
| `parseInBatches`, single-file `loadInBatches` | `Promise<AsyncIterable<arrow.RecordBatch>>` |

Set `core.shape` to select an output shape across loaders. Set the loader's
own `shape` option to override it for that loader. For example, both calls
below return a loaders.gl table wrapper:

```typescript
await load('data.csv', CSVLoader, {core: {shape: 'arrow-table'}});
await load('data.csv', CSVLoader, {csv: {shape: 'arrow-table'}});
```

Native output preserves Arrow schemas, field metadata, dictionaries, and column
buffers. Streaming yields every RecordBatch in each internal table, in order,
and closing the iterator closes the upstream iterator. An empty table with no
record batches yields none. Arrow schema and field metadata are available
through each batch's schema. To receive loaders.gl metadata events, use
`core.metadata: true` with `shape: 'arrow-table'`.

Parser methods and worker transport use loaders.gl table and batch objects.
The core APIs expose the Arrow objects after parsing and worker hydration.

## Writing native Arrow data

Table writers take the Apache Arrow `Table` directly. If you have a loaders.gl
`'arrow-table'` result, pass its `data` property to the writer. For example, load a
CSV file and encode the resulting table as Arrow IPC:

```typescript
import {encode, load} from '@loaders.gl/core';
import {ArrowWriter, CSVLoader} from '@loaders.gl/tables';

const table = await load('data.csv', CSVLoader);
const bytes = await encode(table, ArrowWriter);
```

`GeoJSONWriter` also accepts an iterable or async iterable of Arrow
`RecordBatch` objects through `encodeInBatches`.
