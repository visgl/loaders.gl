Arrow JS API · streaming input

# Read batches as the bytes arrive.

RecordBatchReader turns Arrow IPC streams, files, JSON, readable streams, or byte iterators into record batches. Use it when a complete table would add latency or memory pressure.

[RecordBatch](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)[RecordBatchWriter](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-writer.md)[Streaming guide](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

The reader path

## Turn a byte stream into typed row-aligned chunks.

The reader preserves the Arrow schema and yields RecordBatch chunks. Applications can process each batch immediately, or assemble the sequence into a Table when they need a complete logical result.

01

Input

IPC bytes, streams, async iterators, or JSON

02

Output

Sync or async iterators of RecordBatch values

03

Formats

Arrow stream, file, and JSON encodings

04

Transforms

Node and WHATWG through helpers

Detailed guide

## RecordBatchReader reference

The sections below document source construction, sync and async iteration, stream transforms, file readers, and reader lifecycle methods.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

`RecordBatchReader` is the IPC reader API for Arrow tables in stream, file, and JSON formats.

## Usage[​](#usage "Direct link to Usage")

```
import {RecordBatchReader} from 'apache-arrow';



const reader = await RecordBatchReader.from(await fetch('/sample.arrow').then((r) => r.body));

for await (const batch of reader) {

  console.log('rows', batch.numRows);

}
```

```
import {tableFromIPC, RecordBatchStreamReader} from 'apache-arrow';



const response = await fetch('/sample.arrow');

const arrayBuffer = await response.arrayBuffer();

const table = await tableFromIPC(arrayBuffer);

console.log(table.numRows, table.schema.names);
```

## Static methods[​](#static-methods "Direct link to Static methods")

### `RecordBatchReader.from(source: FromArg0 | FromArg1 | FromArg2 | FromArg3 | FromArg4 | FromArg5 | RecordBatchReader<T>): RecordBatchReader | Promise<RecordBatchReader>`[​](#recordbatchreaderfromsource-fromarg0--fromarg1--fromarg2--fromarg3--fromarg4--fromarg5--recordbatchreadert-recordbatchreader--promiserecordbatchreader "Direct link to recordbatchreaderfromsource-fromarg0--fromarg1--fromarg2--fromarg3--fromarg4--fromarg5--recordbatchreadert-recordbatchreader--promiserecordbatchreader")

Creates a reader from:

* another `RecordBatchReader`
* Arrow JSON objects / Promise-wrapped JSON
* Byte arrays / Node/WHATWG readable streams / async byte iterators
* File handles

### `RecordBatchReader.readAll(source: FromArg0 | FromArg1 | FromArg2 | FromArg3 | FromArg4 | FromArg5 | RecordBatchReader<T>): IterableIterator<RecordBatchStreamReader<T>> | AsyncIterableIterator<RecordBatchStreamReader<T>>`[​](#recordbatchreaderreadallsource-fromarg0--fromarg1--fromarg2--fromarg3--fromarg4--fromarg5--recordbatchreadert-iterableiteratorrecordbatchstreamreadert--asynciterableiteratorrecordbatchstreamreadert "Direct link to recordbatchreaderreadallsource-fromarg0--fromarg1--fromarg2--fromarg3--fromarg4--fromarg5--recordbatchreadert-iterableiteratorrecordbatchstreamreadert--asynciterableiteratorrecordbatchstreamreadert")

Returns either sync or async iterables of readers, depending on whether input is sync or async.

### `RecordBatchReader.throughNode(options?: DuplexOptions & { autoDestroy: boolean }): Duplex`[​](#recordbatchreaderthroughnodeoptions-duplexoptions---autodestroy-boolean--duplex "Direct link to recordbatchreaderthroughnodeoptions-duplexoptions---autodestroy-boolean--duplex")

Node stream transform helper.

### `RecordBatchReader.throughDOM<TType extends TypeMap = any>(writableStrategy?: ByteLengthQueuingStrategy, readableStrategy?: { autoDestroy: boolean }): { writable: WritableStream<Uint8Array>; readable: ReadableStream<RecordBatch<TType>> }`[​](#recordbatchreaderthroughdomttype-extends-typemap--anywritablestrategy-bytelengthqueuingstrategy-readablestrategy--autodestroy-boolean---writable-writablestreamuint8array-readable-readablestreamrecordbatchttype- "Direct link to recordbatchreaderthroughdomttype-extends-typemap--anywritablestrategy-bytelengthqueuingstrategy-readablestrategy--autodestroy-boolean---writable-writablestreamuint8array-readable-readablestreamrecordbatchttype-")

WHATWG stream transform helper.

## Instance methods[​](#instance-methods "Direct link to Instance methods")

### `next(): Promise<IteratorResult<RecordBatch<T>>> | IteratorResult<RecordBatch<T>>`[​](#next-promiseiteratorresultrecordbatcht--iteratorresultrecordbatcht "Direct link to next-promiseiteratorresultrecordbatcht--iteratorresultrecordbatcht")

Get next async/sync iterator result.

### `isSync(): this is RecordBatchReaders<T>` — `true` when reader is sync.[​](#issync-this-is-recordbatchreaderst--true-when-reader-is-sync "Direct link to issync-this-is-recordbatchreaderst--true-when-reader-is-sync")

### `isAsync(): this is AsyncRecordBatchReaders<T>` — `true` when reader uses async I/O.[​](#isasync-this-is-asyncrecordbatchreaderst--true-when-reader-uses-async-io "Direct link to isasync-this-is-asyncrecordbatchreaderst--true-when-reader-uses-async-io")

### `isFile(): this is RecordBatchFileReaders<T>` — `true` for file-based readers.[​](#isfile-this-is-recordbatchfilereaderst--true-for-file-based-readers "Direct link to isfile-this-is-recordbatchfilereaderst--true-for-file-based-readers")

### `isStream(): this is RecordBatchStreamReaders<T>` — `true` for stream-based readers.[​](#isstream-this-is-recordbatchstreamreaderst--true-for-stream-based-readers "Direct link to isstream-this-is-recordbatchstreamreaderst--true-for-stream-based-readers")

### `open(options?: OpenOptions): this | Promise<this>`[​](#openoptions-openoptions-this--promisethis "Direct link to openoptions-openoptions-this--promisethis")

Opens the reader and returns either itself (sync) or a promise for itself (async).

### `reset(schema?: Schema<T> | null): this`[​](#resetschema-schemat--null-this "Direct link to resetschema-schemat--null-this")

Re-initializes internal state and optionally replaces the schema.

### `readRecordBatch(index: number): RecordBatch<T> | Promise<RecordBatch<T> | null> | null`[​](#readrecordbatchindex-number-recordbatcht--promiserecordbatcht--null--null "Direct link to readrecordbatchindex-number-recordbatcht--promiserecordbatcht--null--null")

Reads a record batch by index.

### `toDOMStream(): ReadableStream<RecordBatch<T>>`[​](#todomstream-readablestreamrecordbatcht "Direct link to todomstream-readablestreamrecordbatcht")

Exports a DOM `ReadableStream` of record batches.

### `toNodeStream(): stream.Readable`[​](#tonodestream-streamreadable "Direct link to tonodestream-streamreadable")

Creates a Node.js readable stream of record batches.

### `throw(value?: any): IteratorResult<any> | Promise<IteratorResult<any>>`[​](#throwvalue-any-iteratorresultany--promiseiteratorresultany "Direct link to throwvalue-any-iteratorresultany--promiseiteratorresultany")

### `return(value?: any): IteratorResult<any> | Promise<IteratorResult<any>>`[​](#returnvalue-any-iteratorresultany--promiseiteratorresultany "Direct link to returnvalue-any-iteratorresultany--promiseiteratorresultany")

Iterator protocol finalization.

### `cancel(): void | Promise<void>`[​](#cancel-void--promisevoid "Direct link to cancel-void--promisevoid")

Cancels async iteration.

### `closed: boolean`[​](#closed-boolean "Direct link to closed-boolean")

Current close-state.

### `schema: Schema<T>`[​](#schema-schemat "Direct link to schema-schemat")

Batch schema (sync or promise in async readers via the getter contract).

### `autoDestroy: boolean`[​](#autodestroy-boolean "Direct link to autodestroy-boolean")

Whether the reader auto-destroys on exhaustion.

### `dictionaries: Map<number, Vector<any>>`[​](#dictionaries-mapnumber-vectorany "Direct link to dictionaries-mapnumber-vectorany")

Dictionary vectors resolved for this reader.

### `numDictionaries: number`[​](#numdictionaries-number "Direct link to numdictionaries-number")

Number of dictionaries in message metadata.

### `numRecordBatches: number`[​](#numrecordbatches-number "Direct link to numrecordbatches-number")

Number of available record batches (0 when not yet materialized).

Reader state and counts.

## Stream-specific reader subclasses[​](#stream-specific-reader-subclasses "Direct link to Stream-specific reader subclasses")

* `RecordBatchStreamReader`
* `RecordBatchFileReader`
* `AsyncRecordBatchStreamReader`
* `AsyncRecordBatchFileReader`

Each subclass specializes message framing and sync/async behavior for different input types.
