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
