## RecordBatchWriter

TBD: The `RecordBatchWriter` "serializes" RecordBatches to the Arrow streaming representation. It is essentially an asynchronous iterator that provides an API that allows the application to write `RecordBatch` instances and in response generates `Uint8Array` chunks that the application can then write to a desired location, e.g. a file or a socket. Streams are also supported, and the output of the `RecordBatchWriter` can be piped to a writeable stream.


## Member Fields

closed: Promise (readonly)


## Static Methods

### RecordBatchWriter.throughNode(options?: Object): DuplexStream

Creates a Node.js duplex stream

- `options.autoDestroy`: Boolean
- `options.*` - Any Node Duplex Stream Options can be supplied

Returns: A Node.js duplex stream

### RecordBatchWriter.throughDOM(writableStrategy? : Object, readableStrategy? : Object) : Object

Creates a DOM/WhatWG duplex stream setup.

- `writableStrategy.autoDestroy`=`false` : Boolean
- `writableStrategy.*`= - Any options for QueuingStrategy<RecordBatch>

- `readableStrategy.highWaterMark`? : Number
- `readableStrategy.size`?: Number

Returns: an object with the following fields:
- `writable`: WritableStream<Table | RecordBatch>
- `readable`: ReadableStream<Uint8Array>


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
### abort(reason?: any) : void
### finish() : this
### reset(sink?: WritableSink<ArrayBufferViewInput>, schema?: Schema | null): this

Change the sink

### write(chunk?: Table | RecordBatch | null): void

Writes a `RecordBatch` or all the RecordBatches from a `Table`.


## Remarks

* Just like the `RecordBatchReader`, a `RecordBatchWriter` is a factory base class that returns an instance of the subclass appropriate to the situation: `RecordBatchStreamWriter`, `RecordBatchFileWriter`, `RecordBatchJSONWriter`
