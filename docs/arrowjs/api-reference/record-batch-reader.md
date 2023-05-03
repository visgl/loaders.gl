# RecordBatchReader

The RecordBatchReader is the IPC reader for reading chunks from a stream or file

## Usage

The JavaScript API supports streaming multiple arrow tables over a single socket.

To read all batches from all tables in a data source:

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
