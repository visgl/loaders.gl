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

The tabular loaders listed below return native Apache Arrow JS objects through
the core parsing and loading APIs. Set `shape: 'arrow'` to select this output explicitly.

```typescript
import {load, loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables';

const table = await load('data.csv', CSVLoader, {csv: {shape: 'arrow'}});
console.log(table.numRows, table.getChild('name')); // arrow.Table

const batches = await loadInBatches('data.csv', CSVLoader, {
  core: {shape: 'arrow'}
});
for await (const recordBatch of batches) {
  console.log(recordBatch.numRows); // arrow.RecordBatch
}
```

| API | Native result |
| --- | --- |
| `parse`, `load`, `parseFile` | `Promise<arrow.Table>` |
| `parseSync` (where supported) | `arrow.Table` |
| `parseInBatches`, single-file `loadInBatches` | `Promise<AsyncIterable<arrow.RecordBatch>>` |

Supported tabular loaders include `ArrowLoader`, `GeoArrowLoader`, `CSVLoader`,
`JSONTableLoader`, `NDJSONLoader`, `ParquetLoader`, `ParquetJSLoader`,
`GeoParquetLoader`, `GeoJSONLoader`, `NDGeoJSONLoader`, `AvroLoader`, `LanceLoader`, and `ORCLoader`. Use the loader's regular
shape namespace (`arrow`, `csv`, `json`, `ndjson`, `parquet`, or `geojson`), or the
shared `core.shape` default. Avro, Lance, and ORC also accept their own scoped shape option. Explicit loader-scoped shapes take precedence.
Use `JSONTableLoader` for JSON row arrays.

Native output preserves Arrow schemas, field metadata, dictionaries, and column
buffers. Streaming yields every RecordBatch in each internal table, in order,
and closing the iterator closes the upstream iterator. An empty table with no
record batches yields none. Parser metadata and partial/final JSON document
messages are not yielded. With `core.metadata: true`, the first event is a
loaders.gl metadata object with `batchType: 'metadata'`. Subsequent data events
are native record batches. Use `'arrow-table'` when you need loaders.gl batch metadata
such as `bytesUsed`, scan metadata, or progress envelopes.

Parser methods and worker transport use loaders.gl table and batch objects.
The core APIs expose the Arrow objects after parsing and worker hydration.
