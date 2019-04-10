# Reading and Writing Arrow Data

## About RecordBatches

Arrow tables are typically split into record batches, allowing them to be incrementally loaded or written, and naturally the Arrow API provides classes to facilite this reading.


## Reading Arrow Data

The `Table` class provides a simple `Table.from` convenience method for reading an Arrow formatted data file into Arrow data structures:

```
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';
const arrow = readFileSync('simple.arrow');
const table = Table.from([arrow]);
console.log(table.toString());
```

### Using RecordBatchReader to read from a Data Source

To read Arrow tables incrementally, you use the `RecordBatchReader` class.

If you only have one table in your file (the normal case), then you'll only need one `RecordBatchReader`:

```js
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));
for await (const batch of reader) {
  console.log(batch.length);
}
```

### Reading Multiple Tables from a Data Source

The JavaScript Arrow API supports arrow data streams that contain multiple tables (this is an "extension" to the arrow spec). Naturally, each Table comes with its own set of record batches, so to read all batches from all tables in the data source you will need a double loop:

```js
const readers = RecordBatchReader.readAll(fetch(path, {credentials: 'omit'}));
for await (const reader of readers) {
  for await (const batch of reader) {
    console.log(batch.length);
  }
}
```

Note: this code also works if there is only one table in the data source, in which case the outer loop will only execute once.


# Writing Arrow Data

The `RecordStreamWriter` class allows you to write Arrow `Table` and `RecordBatch` instances to a data source.


## Using Transform Streams


### Connecting to Node Processes

A 


### Connecting to Python Processes

A more complicated example of using Arrow to go from node -> python -> node:

```js
const { AsyncIterable } = require('ix');
const { child } = require('event-stream');
const { fork } = require('child_process');
const { RecordBatchStreamWriter } = require('apache-arrow');

const compute_degrees_via_gpu_accelerated_sql = ((scriptPath) => (edgeListColumnName) =>
    spawn('python3', [scriptPath, edgeListColumnName], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'inherit']
    })
)(require('path').resolve(__dirname, 'compute_degrees.py'));

function compute_degrees(colName, recordBatchReaders) {
    return AsyncIterable
        .as(recordBatchReaders).mergeAll()
        .pipe(RecordBatchStreamWriter.throughNode())
        .pipe(compute_degrees_via_gpu_accelerated_sql(colName));
}

module.exports = compute_degrees;

```

This example construct pipes of streams of events and that python process just reads from stdin, does a GPU-dataframe operation, and writes the results to stdout. (This example uses Rx/IxJS style functional streaming pipelines).

`compute_degrees_via_gpu_accelerated_sql` returns a node `child_process` that is also a duplex stream, similar to the [`event-stream#child()` method](https://www.npmjs.com/package/event-stream#child-child_process)
