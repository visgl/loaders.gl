# RecordBatchReader

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

`RecordBatchReader` is the IPC reader API for Arrow tables in stream, file, and JSON formats.

## Usage

```ts
import {RecordBatchReader} from 'apache-arrow';

const reader = await RecordBatchReader.from(await fetch('/sample.arrow').then((r) => r.body));
for await (const batch of reader) {
  console.log('rows', batch.numRows);
}
```

```ts
import {tableFromIPC, RecordBatchStreamReader} from 'apache-arrow';

const response = await fetch('/sample.arrow');
const arrayBuffer = await response.arrayBuffer();
const table = await tableFromIPC(arrayBuffer);
console.log(table.numRows, table.schema.names);
```

## Static methods

### `RecordBatchReader.from(source: FromArg0 | FromArg1 | FromArg2 | FromArg3 | FromArg4 | FromArg5 | RecordBatchReader<T>): RecordBatchReader | Promise<RecordBatchReader>`

Creates a reader from:

- another `RecordBatchReader`
- Arrow JSON objects / Promise-wrapped JSON
- Byte arrays / Node/WHATWG readable streams / async byte iterators
- File handles

### `RecordBatchReader.readAll(source: FromArg0 | FromArg1 | FromArg2 | FromArg3 | FromArg4 | FromArg5 | RecordBatchReader<T>): IterableIterator<RecordBatchStreamReader<T>> | AsyncIterableIterator<RecordBatchStreamReader<T>>`

Returns either sync or async iterables of readers, depending on whether input is sync or async.

### `RecordBatchReader.throughNode(options?: DuplexOptions & { autoDestroy: boolean }): Duplex`

Node stream transform helper.

### `RecordBatchReader.throughDOM<TType extends TypeMap = any>(writableStrategy?: ByteLengthQueuingStrategy, readableStrategy?: { autoDestroy: boolean }): { writable: WritableStream<Uint8Array>; readable: ReadableStream<RecordBatch<TType>> }`

WHATWG stream transform helper.

## Instance methods

### `next(): Promise<IteratorResult<RecordBatch<T>>> | IteratorResult<RecordBatch<T>>`

Get next async/sync iterator result.

### `isSync(): this is RecordBatchReaders<T>` — `true` when reader is sync.

### `isAsync(): this is AsyncRecordBatchReaders<T>` — `true` when reader uses async I/O.

### `isFile(): this is RecordBatchFileReaders<T>` — `true` for file-based readers.

### `isStream(): this is RecordBatchStreamReaders<T>` — `true` for stream-based readers.

### `open(options?: OpenOptions): this | Promise<this>`

Opens the reader and returns either itself (sync) or a promise for itself (async).

### `reset(schema?: Schema<T> | null): this`

Re-initializes internal state and optionally replaces the schema.

### `readRecordBatch(index: number): RecordBatch<T> | Promise<RecordBatch<T> | null> | null`

Reads a record batch by index.

### `toDOMStream(): ReadableStream<RecordBatch<T>>`

Exports a DOM `ReadableStream` of record batches.

### `toNodeStream(): stream.Readable`

Creates a Node.js readable stream of record batches.

### `throw(value?: any): IteratorResult<any> | Promise<IteratorResult<any>>`

### `return(value?: any): IteratorResult<any> | Promise<IteratorResult<any>>`

Iterator protocol finalization.

### `cancel(): void | Promise<void>`

Cancels async iteration.

### `closed: boolean`

Current close-state.

### `schema: Schema<T>`

Batch schema (sync or promise in async readers via the getter contract).

### `autoDestroy: boolean`

Whether the reader auto-destroys on exhaustion.

### `dictionaries: Map<number, Vector<any>>`

Dictionary vectors resolved for this reader.

### `numDictionaries: number`

Number of dictionaries in message metadata.

### `numRecordBatches: number`

Number of available record batches (0 when not yet materialized).

Reader state and counts.

## Stream-specific reader subclasses

- `RecordBatchStreamReader`
- `RecordBatchFileReader`
- `AsyncRecordBatchStreamReader`
- `AsyncRecordBatchFileReader`

Each subclass specializes message framing and sync/async behavior for different input types.
