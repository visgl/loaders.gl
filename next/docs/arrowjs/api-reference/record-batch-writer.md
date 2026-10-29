Arrow JS API · streaming output

# Write typed batches without collecting everything first.

RecordBatchWriter serializes Tables or RecordBatch iterables as Arrow IPC streams, files, or JSON. It is the output counterpart to RecordBatchReader and fits incremental loaders, scans, and writers.

[RecordBatchReader](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-reader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch-reader.md)[RecordBatch](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

The writer path

## Keep batches incremental all the way to the wire.

Choose a stream, file, or JSON writer based on the receiving system. Each writer can consume a complete Table or an iterable of batches, including asynchronous producers.

01

Input

Table, RecordBatch iterable, or async iterable

02

Output

Arrow IPC stream, file bytes, or JSON chunks

03

Adapters

Node and WHATWG transform helpers

04

Use it when

The consumer can receive batches or serialized bytes

Detailed guide

## RecordBatchWriter reference

The sections below document static writeAll helpers, stream transforms, output methods, and the differences between stream, file, and JSON writers.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

Writes `RecordBatch` / `Table` payloads to IPC message streams (`stream`, `file`, and `json`).

## Usage[​](#usage "Direct link to Usage")

```
import {tableFromArrays, RecordBatchStreamWriter, Int32} from 'apache-arrow';



const table = tableFromArrays({id: [1, 2, 3]});

const bytes = await RecordBatchStreamWriter.writeAll(table).toUint8Array();

console.log(bytes.byteLength);
```

```
import {tableFromArrays, RecordBatchJSONWriter} from 'apache-arrow';



const table = tableFromArrays({label: ['a', 'b']});

const writer = await RecordBatchJSONWriter.writeAll(table);

for await (const chunk of writer) {

  console.log(chunk.length);

}
```

## Static helpers[​](#static-helpers "Direct link to Static helpers")

### `RecordBatchWriter.throughNode(options?: DuplexOptions & { autoDestroy: boolean }): Duplex`[​](#recordbatchwriterthroughnodeoptions-duplexoptions---autodestroy-boolean--duplex "Direct link to recordbatchwriterthroughnodeoptions-duplexoptions---autodestroy-boolean--duplex")

Create a Node.js transform stream.

### `RecordBatchWriter.throughDOM<TType extends TypeMap = any>(writableStrategy?: ByteLengthQueuingStrategy, readableStrategy?: { autoDestroy: boolean }): { writable: WritableStream<Table<TType> | RecordBatch<TType>>; readable: ReadableStream<Uint8Array> }`[​](#recordbatchwriterthroughdomttype-extends-typemap--anywritablestrategy-bytelengthqueuingstrategy-readablestrategy--autodestroy-boolean---writable-writablestreamtablettype--recordbatchttype-readable-readablestreamuint8array- "Direct link to recordbatchwriterthroughdomttype-extends-typemap--anywritablestrategy-bytelengthqueuingstrategy-readablestrategy--autodestroy-boolean---writable-writablestreamtablettype--recordbatchttype-readable-readablestreamuint8array-")

Create a WHATWG transform stream pair.

### `RecordBatchStreamWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchStreamWriter<TType>> | RecordBatchStreamWriter<TType>`[​](#recordbatchstreamwriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchstreamwriterttype--recordbatchstreamwriterttype "Direct link to recordbatchstreamwriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchstreamwriterttype--recordbatchstreamwriterttype")

### `RecordBatchStreamWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchStreamWriter<TType>>`[​](#recordbatchstreamwriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchstreamwriterttype "Direct link to recordbatchstreamwriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchstreamwriterttype")

### `RecordBatchFileWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchFileWriter<TType>>`[​](#recordbatchfilewriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchfilewriterttype "Direct link to recordbatchfilewriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchfilewriterttype")

### `RecordBatchFileWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchFileWriter<TType>>`[​](#recordbatchfilewriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchfilewriterttype "Direct link to recordbatchfilewriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-options-recordbatchstreamwriteroptions-promiserecordbatchfilewriterttype")

### `RecordBatchJSONWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>): Promise<RecordBatchJSONWriter<TType>>`[​](#recordbatchjsonwriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-promiserecordbatchjsonwriterttype "Direct link to recordbatchjsonwriterwriteallttype-extends-typemap--anyinput-tablettype--iterablerecordbatchttype-promiserecordbatchjsonwriterttype")

### `RecordBatchJSONWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>): Promise<RecordBatchJSONWriter<TType>>`[​](#recordbatchjsonwriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-promiserecordbatchjsonwriterttype "Direct link to recordbatchjsonwriterwriteallttype-extends-typemap--anyinput-asynciterablerecordbatchttype--promiseasynciterablerecordbatchttype-promiserecordbatchjsonwriterttype")

Convenience writers that consume a table or iterator and return a configured writer.

## Writer methods[​](#writer-methods "Direct link to Writer methods")

### `toString(sync: true): string`[​](#tostringsync-true-string "Direct link to tostringsync-true-string")

### `toString(sync?: false): Promise<string>`[​](#tostringsync-false-promisestring "Direct link to tostringsync-false-promisestring")

Returns serialized stream payload as string.

### `toUint8Array(sync: true): Uint8Array`[​](#touint8arraysync-true-uint8array "Direct link to touint8arraysync-true-uint8array")

### `toUint8Array(sync?: false): Promise<Uint8Array>`[​](#touint8arraysync-false-promiseuint8array "Direct link to touint8arraysync-false-promiseuint8array")

Returns serialized IPC payload as raw bytes.

### `writeAll(input: Table<T> | Iterable<RecordBatch<T>>): this`[​](#writeallinput-tablet--iterablerecordbatcht-this "Direct link to writeallinput-tablet--iterablerecordbatcht-this")

### `writeAll(input: AsyncIterable<RecordBatch<T>> | Promise<AsyncIterable<RecordBatch<T>>>): Promise<this>`[​](#writeallinput-asynciterablerecordbatcht--promiseasynciterablerecordbatcht-promisethis "Direct link to writeallinput-asynciterablerecordbatcht--promiseasynciterablerecordbatcht-promisethis")

Buffers and serializes all input record batches.

### `[Symbol.asyncIterator](): AsyncByteQueue<Uint8Array>`[​](#symbolasynciterator-asyncbytequeueuint8array "Direct link to symbolasynciterator-asyncbytequeueuint8array")

Iterates serialized IPC chunks.

### `toDOMStream(options?: ReadableDOMStreamOptions): ReadableStream<Uint8Array>`[​](#todomstreamoptions-readabledomstreamoptions-readablestreamuint8array "Direct link to todomstreamoptions-readabledomstreamoptions-readablestreamuint8array")

Builds a DOM-compatible readable stream.

### `toNodeStream(options?: ReadableOptions): NodeJS.ReadableStream`[​](#tonodestreamoptions-readableoptions-nodejsreadablestream "Direct link to tonodestreamoptions-readableoptions-nodejsreadablestream")

Builds a Node.js readable stream.

### `write(payload?: Table<T> | RecordBatch<T> | Iterable<RecordBatch<T>>): void`[​](#writepayload-tablet--recordbatcht--iterablerecordbatcht-void "Direct link to writepayload-tablet--recordbatcht--iterablerecordbatcht-void")

Writes one table/batch payload to the stream buffer.

### `close(): void`[​](#close-void "Direct link to close-void")

Signal end-of-input and finalize stream state.

### `abort(reason?: any): void`[​](#abortreason-any-void "Direct link to abortreason-any-void")

Aborts stream and discards buffered payload.

### `finish(): this`[​](#finish-this "Direct link to finish-this")

Finishes any open writes and returns the writer.

### `reset(sink?: WritableSink<ArrayBufferView>, schema?: Schema<T> | null): this`[​](#resetsink-writablesinkarraybufferview-schema-schemat--null-this "Direct link to resetsink-writablesinkarraybufferview-schema-schemat--null-this")

Replaces output sink and schema; used for reusing the writer instance.

## Remarks[​](#remarks "Direct link to Remarks")

`RecordBatchWriter` is intentionally stream-oriented and supports both sync and async consumption patterns.
