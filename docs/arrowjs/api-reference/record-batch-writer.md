---
title: RecordBatchWriter
description: Write Arrow tables and record batches to IPC streams, files, or JSON output.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · streaming output"
  title="Write typed batches without collecting everything first."
  description="RecordBatchWriter serializes Tables or RecordBatch iterables as Arrow IPC streams, files, or JSON. It is the output counterpart to RecordBatchReader and fits incremental loaders, scans, and writers."
  tone="mint"
  meta={['IPC stream and file', 'Sync and async inputs', 'JSON output']}
  links={[
    {label: 'RecordBatchReader', to: '/docs/arrowjs/api-reference/record-batch-reader'},
    {label: 'RecordBatch', to: '/docs/arrowjs/api-reference/record-batch'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

<DocOrientation
  eyebrow="The writer path"
  title="Keep batches incremental all the way to the wire."
  description="Choose a stream, file, or JSON writer based on the receiving system. Each writer can consume a complete Table or an iterable of batches, including asynchronous producers."
  tone="mint"
  items={[
    {label: 'Input', value: 'Table, RecordBatch iterable, or async iterable'},
    {label: 'Output', value: 'Arrow IPC stream, file bytes, or JSON chunks'},
    {label: 'Adapters', value: 'Node and WHATWG transform helpers'},
    {label: 'Use it when', value: 'The consumer can receive batches or serialized bytes'}
  ]}
/>

<ReferenceBoundary
  title="RecordBatchWriter reference"
  description="The sections below document static writeAll helpers, stream transforms, output methods, and the differences between stream, file, and JSON writers."
  tone="mint"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Writes `RecordBatch` / `Table` payloads to IPC message streams (`stream`, `file`, and `json`).

## Usage

```ts
import {makeTable, RecordBatchStreamWriter, Int32} from 'apache-arrow';

const table = makeTable({id: [1, 2, 3]});
const bytes = await RecordBatchStreamWriter.writeAll(table).toUint8Array();
console.log(bytes.byteLength);
```

```ts
import {makeTable, RecordBatchJSONWriter} from 'apache-arrow';

const table = makeTable({label: ['a', 'b']});
const writer = await RecordBatchJSONWriter.writeAll(table);
for await (const chunk of writer) {
  console.log(chunk.length);
}
```

## Static helpers

### `RecordBatchWriter.throughNode(options?: DuplexOptions & { autoDestroy: boolean }): Duplex`

Create a Node.js transform stream.

### `RecordBatchWriter.throughDOM<TType extends TypeMap = any>(writableStrategy?: ByteLengthQueuingStrategy, readableStrategy?: { autoDestroy: boolean }): { writable: WritableStream<Table<TType> | RecordBatch<TType>>; readable: ReadableStream<Uint8Array> }`

Create a WHATWG transform stream pair.

### `RecordBatchStreamWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchStreamWriter<TType>> | RecordBatchStreamWriter<TType>`

### `RecordBatchStreamWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchStreamWriter<TType>>`

### `RecordBatchFileWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchFileWriter<TType>>`

### `RecordBatchFileWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>, options?: RecordBatchStreamWriterOptions): Promise<RecordBatchFileWriter<TType>>`

### `RecordBatchJSONWriter.writeAll<TType extends TypeMap = any>(input: Table<TType> | Iterable<RecordBatch<TType>>): Promise<RecordBatchJSONWriter<TType>>`

### `RecordBatchJSONWriter.writeAll<TType extends TypeMap = any>(input: AsyncIterable<RecordBatch<TType>> | Promise<AsyncIterable<RecordBatch<TType>>>): Promise<RecordBatchJSONWriter<TType>>`

Convenience writers that consume a table or iterator and return a configured writer.

## Writer methods

### `toString(sync: true): string`

### `toString(sync?: false): Promise<string>`

Returns serialized stream payload as string.

### `toUint8Array(sync: true): Uint8Array`

### `toUint8Array(sync?: false): Promise<Uint8Array>`

Returns serialized IPC payload as raw bytes.

### `writeAll(input: Table<T> | Iterable<RecordBatch<T>>): this`

### `writeAll(input: AsyncIterable<RecordBatch<T>> | Promise<AsyncIterable<RecordBatch<T>>>): Promise<this>`

Buffers and serializes all input record batches.

### `[Symbol.asyncIterator](): AsyncByteQueue<Uint8Array>`

Iterates serialized IPC chunks.

### `toDOMStream(options?: ReadableDOMStreamOptions): ReadableStream<Uint8Array>`

Builds a DOM-compatible readable stream.

### `toNodeStream(options?: ReadableOptions): NodeJS.ReadableStream`

Builds a Node.js readable stream.

### `write(payload?: Table<T> | RecordBatch<T> | Iterable<RecordBatch<T>>): void`

Writes one table/batch payload to the stream buffer.

### `close(): void`

Signal end-of-input and finalize stream state.

### `abort(reason?: any): void`

Aborts stream and discards buffered payload.

### `finish(): this`

Finishes any open writes and returns the writer.

### `reset(sink?: WritableSink<ArrayBufferView>, schema?: Schema<T> | null): this`

Replaces output sink and schema; used for reusing the writer instance.

## Remarks

`RecordBatchWriter` is intentionally stream-oriented and supports both sync and async consumption patterns.
