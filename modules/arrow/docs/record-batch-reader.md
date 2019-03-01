# RecordBatchReader

The RecordBatchReader is the IPC reader for reading chunks from a stream or file

## Usage

An arrow file can contain multiple tables, each with its own set of record batches. To read all batches from all tables in the data source:

```js
const readers = RecordBatchReader.readAll(fetch(path, {credentials: 'omit'}));
for await (const reader of readers) {
    for await (const batch of reader) {
        console.log(batch.length);
    }
}
```

If you only have one table (the normal case), then there'll only be one RecordBatchReader/the outer loop will only execute once. You can also create just one reader via

```js
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));
```

A more complicated example of using Arrow to go from node -> python -> node:

```js
const { AsyncIterable } = require('ix');
const { spawn } = require('@graphistry/node-util/process');
const { RecordBatchStreamWriter } = require('apache-arrow');

const compute_degrees_via_gpu_accelerated_sql = ((scriptPath) => (edgeListColumnName) =>
    spawn('python3', [scriptPath, edgeListColumnName], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'inherit']
    })
)(require('path').resolve(__dirname, 'compute_degrees.py'));

module.exports = compute_degrees;

function compute_degrees(colName, recordBatchReaders) {
    return AsyncIterable
        .as(recordBatchReaders).mergeAll()
        .pipe(RecordBatchStreamWriter.throughNode())
        .pipe(compute_degrees_via_gpu_accelerated_sql(colName));
}
```

`compute_degrees_via_gpu_accelerated_sql` returns a node `child_process` that is also a duplex stream, similar to the [`event-stream#child()` method](https://www.npmjs.com/package/event-stream#child-child_process)

construct pipes of streams of events and that python process just reads from stdin, does a GPU-dataframe operation, and writes the results to stdout. (This example uses Rx/IxJS style functional streaming pipelines).


## Methods

### readAll() : `AsyncIterable<RecordBatchReader>`

Reads all batches from all tables in the data source.


### from(data : \*) : RecordBatchFileReader \| RecordBatchStreamReader

`data`
* Array
* fetch response object
* stream


The `RecordBatchReader.from` method will also detect which physical representation it's working with (Streaming or File), and will return either a `RecordBatchFileReader` or `RecordBatchStreamReader` accordingly.



Remarks:
* if you're fetching the table from a node server, make sure the content-type is `application/octet-stream`



### toNodeStream()
### pipe()

You can also turn the RecordBatchReader into a stream
if you're in node, you can use either toNodeStream() or call the pipe(writable) methods



in the browser (assuming you're using the UMD or "browser" fields in webpack), you can call

### toDOMStream() or
### pipeTo(writable)/pipeThrough(transform)

In the browser (assuming you're using the UMD or "browser" fields in webpack), you can call `toDOMStream()` or `pipeTo(writable)`/`pipeThrough(transform)`

You can also create a transform stream directly, instead of using `RecordBatchReader.from()`

You can also create a transform stream directly, instead of using `RecordBatchReader.from()`

### throughNode
### throughDOM

via `throughNode()` and `throughDOM()` respectively:

1. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-node-tests.ts#L54
2. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-dom-tests.ts#L50

By default the transform streams will only read one table from the source readable stream and then close, but you can change this behavior by passing `{ autoDestroy: false }` to the transform creation methods


## Remarks

* Reading from multiple tables (`readAll()`) is technically an extension in the JavaScript Arrow API compared to the Arrow C++ API. The authors found it was useful to be able to send multiple tables over the same physical socket
so they built the ability to keep the underlying socket open and read more than one table from a stream.
* Note that Arrow has two physical representations, one for streaming, and another for random-access so this only applies to the streaming representation.
* The IPC protocol is that a stream of ordered Messages are consumed atomically. Messages can be of type `Schema`, `DictionaryBatch`, `RecordBatch`, or `Tensor` (which we don't support yet). The Streaming format is just a sequence of messages with Schema first, then `n` `DictionaryBatches`, then `m` `RecordBatches`.
