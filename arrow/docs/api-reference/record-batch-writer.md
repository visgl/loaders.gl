## RecordBatchWriter

The `RecordBatchWriter` "serializes" Arrow Tables (or streams of RecordBatches) to the Arrow File, Stream, or JSON representations for inter-process communication (see also: [Arrow IPC format docs](https://arrow.apache.org/docs/format/IPC.html#streaming-format)).

The RecordBatchWriter is conceptually a "transform" stream that transforms Tables or RecordBatches into binary `Uint8Array` chunks that represent the Arrow IPC messages (`Schema`, `DictionaryBatch`, `RecordBatch`, and in the case of the File format, `Footer` messages).

These binary chunks are buffered inside the `RecordBatchWriter` instance until they are consumed, typically by piping the RecordBatchWriter instance to a Writable Stream (like a file or socket), enumerating the chunks via async-iteration, or by calling `toUint8Array()` to create a single contiguous buffer of the concatenated results once the desired Tables or RecordBatches have been written.

RecordBatchWriter conforms to the `AsyncIterableIterator` protocol in all environments, and supports two additional stream primitives based on the environment (nodejs or browsers) available at runtime.

* In nodejs, the `RecordBatchWriter` can be converted to a `ReadableStream`, piped to a `WritableStream`, and has a static method that returns a `TransformStream` suitable in chained `pipe` calls.
* browser environments that support the [DOM/WhatWG Streams Standard](https://github.com/whatwg/streams), corresponding methods exist to convert `RecordBatchWriters` to the DOM `ReadableStream`, `WritableStream`, and `TransformStream` variants.

*Note*: The Arrow JSON representation is not suitable as an IPC mechanism in real-world scenarios. It is used inside the Arrow project as a human-readable debugging tool and for validating interoperability between each language's separate implementation of the Arrow library.


## Member Fields

closed: Promise (readonly)

A Promise which resolves when this `RecordBatchWriter` is closed.

## Static Methods

### RecordBatchWriter.throughNode(options?: Object): DuplexStream

Creates a Node.js `TransformStream` that transforms an input `ReadableStream` of Tables or RecordBatches into a stream of `Uint8Array` Arrow Message chunks.

- `options.autoDestroy`: boolean - (default: `true`) Indicates whether the RecordBatchWriter should close after writing the first logical stream of RecordBatches (batches which all share the same Schema), or should continue and reset each time it encounters a new Schema.
- `options.*` - Any Node Duplex stream options can be supplied

Returns: A Node.js Duplex stream

Example:

```js

const fs = require('fs');
const { PassThrough, finished } = require('stream');
const { Table, RecordBatchWriter } = require('apache-arrow');

const table = Table.new({
    i32: Int32Vector.from([1, 2, 3]),
    f32: Float32Vector.from([1.0, 1.5, 2.0]),
});

const source = new PassThrough({ objectMode: true });

const result = source
    .pipe(RecordBatchWriter.throughNode())
    .pipe(fs.createWriteStream('table.arrow'));

source.write(table);
source.end();

finished(result, () => console.log('done writing table.arrow'));
```

### RecordBatchWriter.throughDOM(writableStrategy? : Object, readableStrategy? : Object) : Object

Creates a DOM/WhatWG `ReadableStream`/`WritableStream` pair that together transforms an input `ReadableStream` of Tables or RecordBatches into a stream of `Uint8Array` Arrow Message chunks.

- `options.autoDestroy`: boolean - (default: `true`) Indicates whether the RecordBatchWriter should close after writing the first logical stream of RecordBatches (batches which all share the same Schema), or should continue and reset each time it encounters a new Schema.
- `writableStrategy.*`= - Any options for QueuingStrategy\<RecordBatch\>
- `readableStrategy.highWaterMark`? : Number
- `readableStrategy.size`?: Number

Returns: an object with the following fields:

- `writable`: WritableStream\<Table | RecordBatch\>
- `readable`: ReadableStream\<Uint8Array\>




## Methods

constructor(options? : Object)

* `options.autoDestroy`: boolean -


### toString(sync: Boolean): string | Promise<string>

### toUint8Array(sync: Boolean): Uint8Array | Promise<Uint8Array>


### writeAll(input: Table | Iterable<RecordBatch>): this
### writeAll(input: AsyncIterable<RecordBatch>): Promise<this>
### writeAll(input: PromiseLike<AsyncIterable<RecordBatch>>): Promise<this>
### writeAll(input: PromiseLike<Table | Iterable<RecordBatch>>): Promise<this>

* [Symbol.asyncIterator](): AsyncByteQueue<Uint8Array>

Returns An async iterator that produces Uint8Arrays.

### toDOMStream(options?: Object): ReadableStream<Uint8Array>

Returns a new DOM/WhatWG stream that can be used to read the Uint8Array chunks produced by the RecordBatchWriter

- `options` - passed through to the DOM ReadableStream constructor, any DOM ReadableStream options.

### toNodeStream(options?: Object): Readable

- `options` - passed through to the Node ReadableStream constructor, any Node ReadableStream options.

### close() : void

Close the RecordBatchWriter. After close is called, no more chunks can be written.

### abort(reason?: any) : void
### finish() : this
### reset(sink?: WritableSink<ArrayBufferViewInput>, schema?: Schema | null): this

Change the sink

### write(payload?: Table | RecordBatch | Iterable<Table> | Iterable<RecordBatch> | null): void

Writes a `RecordBatch` or all the RecordBatches from a `Table`.


## Remarks

* Just like the `RecordBatchReader`, a `RecordBatchWriter` is a factory base class that returns an instance of the subclass appropriate to the situation: `RecordBatchStreamWriter`, `RecordBatchFileWriter`, `RecordBatchJSONWriter`
