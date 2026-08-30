---
title: Reading and writing Arrow data
description: Move Arrow tables through files, streams, and JavaScript pipelines without changing their columnar shape.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · I/O"
  title="Read and write tables without changing their shape."
  description="Arrow IPC can be treated as a file, a stream, or a sequence of record batches. Choose the boundary that fits the pipeline and keep the data columnar on both sides."
  tone="cyan"
  meta={['Arrow IPC', 'Record batches', 'Streams and files']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'RecordBatchReader', to: '/docs/arrowjs/api-reference/record-batch-reader'},
    {label: 'RecordBatchWriter', to: '/docs/arrowjs/api-reference/record-batch-writer'}
  ]}
/>

<DocOrientation
  eyebrow="Choose the boundary"
  title="One table model, several transport choices."
  description="Use a complete IPC read when the data is small or already local. Use readers and writers when records should move incrementally through a browser, worker, process, or service."
  tone="cyan"
  items={[
    {label: 'File', value: 'A self-contained IPC file with schema and batches'},
    {label: 'Stream', value: 'A sequence of batches for progressive processing'},
    {label: 'Reader', value: 'Async iteration over incoming record batches'},
    {label: 'Writer', value: 'Encode batches to IPC or JSON output'}
  ]}
/>

<ReferenceBoundary
  title="Arrow I/O details"
  description="The examples below cover complete reads, incremental readers, multiple tables, writers, and process pipelines."
  tone="cyan"
/>

# Reading and Writing Arrow Data

## About RecordBatches

Arrow tables are typically split into record batches, allowing incremental loading or writing.

## Reading Arrow Data

Use `tableFromIPC()` to deserialize Arrow IPC sources into a `Table`.

```ts
import {readFileSync} from 'fs';
import {tableFromIPC} from 'apache-arrow';
const arrow = readFileSync('simple.arrow');
const table = tableFromIPC([arrow]);
console.log(table.toString());
```

### Using RecordBatchReader to read from a Data Source

To read Arrow tables incrementally, use `RecordBatchReader`.

```typescript
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));
for await (const batch of reader) {
  console.log(batch.length);
}
```

### Reading Multiple Tables from a Data Source

Arrow streams can contain multiple tables. Use nested loops:

```typescript
const readers = RecordBatchReader.readAll(fetch(path, {credentials: 'omit'}));
for await (const reader of readers) {
  for await (const batch of reader) {
    console.log(batch.length);
  }
}
```

Note: this code also works if there is only one table in the source.

# Writing Arrow Data

`RecordBatchStreamWriter`, `RecordBatchFileWriter`, and `RecordBatchJSONWriter` are the current writer entry points for stream, file, and JSON outputs.

## Using Transform Streams

### Connecting to Python Processes

A more complex example of Arrow passing through Node + Python via streams:

```typescript
const {RecordBatchStreamWriter} = require('apache-arrow');

function compute_degrees_via_gpu_accelerated_sql(colName, recordBatchReaders) {
  return AsyncIterable.as(recordBatchReaders)
    .mergeAll()
    .pipe(RecordBatchStreamWriter.throughNode())
    .pipe(childProcessForCompute(colName));
}
```

This pattern constructs a duplex stream pipeline where Python reads from stdin and writes results to stdout.
