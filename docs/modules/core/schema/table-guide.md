# Working with Tables

***

## title: Working with tables description: Move between row-oriented and columnar table representations while keeping a stable application contract. hide\_title: true page\_style: designed[​](#title-working-with-tablesdescription-move-between-row-oriented-and-columnar-table-representations-while-keeping-a-stable-application-contracthide_title-truepage_style-designed "Direct link to title: Working with tables&#xA;description: Move between row-oriented and columnar table representations while keeping a stable application contract.&#xA;hide_title: true&#xA;page_style: designed")

<!-- -->

Table data

# Choose the table shape for the next operation.

loaders.gl tables can be convenient object rows or typed Arrow columns. The right representation depends on whether the next step is application logic, scanning, geometry processing, worker transfer, or writing.

[Table category](https://loaders.gl/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/docs/specifications/category-table.md)[Apache Arrow](https://loaders.gl/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/docs/developer-guide/apache-arrow.md)[Loader categories](https://loaders.gl/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/docs/developer-guide/loader-categories.md)

A small decision

## Keep data structured as it travels.

The table category gives related loaders a common result shape. Applications can start with readable rows, switch to Arrow for scale, and preserve the same pipeline boundaries as data moves between formats.

01

Object-row table

Easy to inspect and convenient for ordinary application code.

02

Arrow table

Typed columns suited to scans, transforms, workers, and analytics.

03

Table batch

A bounded unit for streaming and incremental processing.

04

Geometry table

Arrow-compatible columns for GeoArrow and spatial workflows.

Detailed guide

## Table category reference

The detailed material below explains the supported table interfaces, conversions, metadata, and the relationship between rows, batches, and Arrow columns.

The loaders.gl table category provides support for working interchangeably with row-oriented and columnar tables.

## Native Apache Arrow output[​](#native-apache-arrow-output "Direct link to Native Apache Arrow output")

The table loaders in `@loaders.gl/tables` return native Apache Arrow objects by default when called through the core parsing and loading APIs.

```
import {load, loadInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load('data.csv', CSVLoader);

console.log(table.numRows, table.getChild('name')); // arrow.Table



const batches = await loadInBatches('data.csv', CSVLoader);

for await (const recordBatch of batches) {

  console.log(recordBatch.numRows); // arrow.RecordBatch

}
```

| API                                           | Native result                               |
| --------------------------------------------- | ------------------------------------------- |
| `parse`, `load`, `parseFile`                  | `Promise<arrow.Table>`                      |
| `parseSync` (where supported)                 | `arrow.Table`                               |
| `parseInBatches`, single-file `loadInBatches` | `Promise<AsyncIterable<arrow.RecordBatch>>` |

Set `core.shape` to select an output shape across loaders. Set the loader's own `shape` option to override it for that loader. For example, both calls below return a native Apache Arrow table:

```
await load('data.csv', CSVLoader, {core: {shape: 'arrow'}});

await load('data.csv', CSVLoader, {csv: {shape: 'arrow'}});
```

Native output preserves Arrow schemas, field metadata, dictionaries, and column buffers. Read table-wide metadata from `batch.schema.metadata` and batch-local metadata from `batch.metadata`. A loader can emit a zero-row final RecordBatch to refine the schema metadata at EOF. Use `makeArrowTableFromBatches` to collect the stream and merge schema metadata in emission order.

## Writing native Arrow data[​](#writing-native-arrow-data "Direct link to Writing native Arrow data")

Table writers take the Apache Arrow `Table` directly. For example, load a CSV file and encode the resulting table as Arrow IPC:

```
import {encode, load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';

import {ArrowWriter} from '@loaders.gl/tables/arrow';



const table = await load('data.csv', CSVLoader);

const bytes = await encode(table, ArrowWriter);
```

`GeoJSONWriter` also accepts an iterable or async iterable of Arrow `RecordBatch` objects through `encodeInBatches`.
