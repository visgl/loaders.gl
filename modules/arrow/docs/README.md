# Arrow API Notes

> These notes are kept until Arrow API docs become available...

## About Apache Arrow

> The material in this section is assembled from various Apache Arrow docs.

* Fixed-length primitive types: numbers, booleans, date and times, fixed size binary, decimals, and other values that fit into a given number
* Variable-length primitive types: binary, string
* Nested types: list, struct, and union
* Dictionary type: An encoded categorical type


### Dictionary Arrays

The Dictionary type is a special array type that is similar to a factor in R or a pandas.Categorical in Python. It enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. This is particularly often used with strings to save memory and improve performance.

### RecordBatch

A Record Batch in Apache Arrow is a collection of equal-length array instances.

Let’s consider a collection of arrays:

```
In [66]: data = [
   ....:     pa.array([1, 2, 3, 4]),
   ....:     pa.array(['foo', 'bar', 'baz', None]),
   ....:     pa.array([True, None, False, True])
   ....: ]
   ....: 
```

A record batch can be created from this list of arrays using RecordBatch.from_arrays:

### Tables

The JavaScript `Table` type is not part of the Apache Arrow specification, but is rather a tool to help with wrangling multiple record batches and array pieces as a single logical dataset. As a relevant example, we may receive multiple small record batches in a socket stream, then need to concatenate them into contiguous memory for use in NumPy or pandas. The Table object makes this efficient without requiring additional memory copying.


Considering the record batch we created above, we can create a Table containing one or more copies of the batch using `Table.from_batches()`:

```
 const table = pa.Table.from_batches(batches)
```


The table’s columns are instances of Column, which is a container for one or more arrays of the same type.



### AsyncByteStream

### RecordBatchReader

### Schema, DataType,

### Utf8Vector


### FloatVector

### RecordBatchStreamWriter


## RecordBatchReader

The RecordBatchReader is the IPC reader for reading chunks from a stream or file

### readAll() : `AsyncIterable<RecordBatchReader>`

```
const readers = RecordBatchReader.readAll(fetch(path, {credentials: 'omit'}));
for await (const reader of reader) {
    for await (const batch of reader) {
        console.log(batch.length);
    }
}
```

If you only have one table (the normal case), then there'll only be one RecordBatchReader/the outer loop will only execute once


### from(data : \*) : RecordBatchFileReader \| RecordBatchStreamReader

`data` be
* Array
* fetch response object
* stream


The `RecordBatchReader.from` method will also detect which physical representation it's working with (Streaming or File), and will return either a `RecordBatchFileReader` or `RecordBatchStreamReader` accordingly.

if you only have one table, then there'll only be one RecordBatchReader/the outer loop will only execute once

If you know you only have one table, you can create just one reader via
```
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));
```

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

### throughNode
### throughDOM

via `throughNode()` and `throughDOM()` respectively:

1. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-node-tests.ts#L54
2. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-dom-tests.ts#L50

By default the transform streams will only read one table from the source readable stream and then close, but you can change this behavior by passing `{ autoDestroy: false }` to the transform creation methods
