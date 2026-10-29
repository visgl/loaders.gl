Arrow JavaScript · I/O

# Read and write tables without changing their shape.

Arrow IPC can be treated as a file, a stream, or a sequence of record batches. Choose the boundary that fits the pipeline and keep the data columnar on both sides.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[RecordBatchReader](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-reader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-reader.md)[RecordBatchWriter](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-writer.md)

Choose the boundary

## One table model, several transport choices.

Use a complete IPC read when the data is small or already local. Use readers and writers when records should move incrementally through a browser, worker, process, or service.

01

File

A self-contained IPC file with schema and batches

02

Stream

A sequence of batches for progressive processing

03

Reader

Async iteration over incoming record batches

04

Writer

Encode batches to IPC or JSON output

Detailed guide

## Arrow I/O details

The examples below cover complete reads, incremental readers, multiple tables, writers, and process pipelines.

# Reading and Writing Arrow Data

## About RecordBatches[​](#about-recordbatches "Direct link to About RecordBatches")

Arrow tables are typically split into record batches, allowing incremental loading or writing.

## Reading Arrow Data[​](#reading-arrow-data "Direct link to Reading Arrow Data")

Use `tableFromIPC()` to deserialize Arrow IPC sources into a `Table`.

```
import {readFileSync} from 'fs';

import {tableFromIPC} from 'apache-arrow';

const arrow = readFileSync('simple.arrow');

const table = tableFromIPC([arrow]);

console.log(table.toString());
```

### Using RecordBatchReader to read from a Data Source[​](#using-recordbatchreader-to-read-from-a-data-source "Direct link to Using RecordBatchReader to read from a Data Source")

To read Arrow tables incrementally, use `RecordBatchReader`.

```
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));

for await (const batch of reader) {

  console.log(batch.length);

}
```

### Reading Multiple Tables from a Data Source[​](#reading-multiple-tables-from-a-data-source "Direct link to Reading Multiple Tables from a Data Source")

Arrow streams can contain multiple tables. Use nested loops:

```
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

## Using Transform Streams[​](#using-transform-streams "Direct link to Using Transform Streams")

### Connecting to Python Processes[​](#connecting-to-python-processes "Direct link to Connecting to Python Processes")

A more complex example of Arrow passing through Node + Python via streams:

```
const {RecordBatchStreamWriter} = require('apache-arrow');



function compute_degrees_via_gpu_accelerated_sql(colName, recordBatchReaders) {

  return AsyncIterable.as(recordBatchReaders)

    .mergeAll()

    .pipe(RecordBatchStreamWriter.throughNode())

    .pipe(childProcessForCompute(colName));

}
```

This pattern constructs a duplex stream pipeline where Python reads from stdin and writes results to stdout.
