// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MessageHeader, MessageReader, RecordBatchReader, Table} from 'apache-arrow';
import {updateArrowTableSchema} from '@loaders.gl/core/schema-utils';
import {preloadArrowCompressionDecoders, registerArrowCompressionCodecs} from './arrow-compression';

/** Checks the Arrow IPC file signature without reading a record-batch body. */
export async function isArrowIPCFile(blob: Blob): Promise<boolean> {
  const prefix = new Uint8Array(await blob.slice(0, 6).arrayBuffer());
  return prefix.length === 6 && prefix.every((byte, index) => byte === 'ARROW1'.charCodeAt(index));
}

/** Opens a Blob with Arrow's random-access reader. */
async function openArrowFile(
  blob: Blob,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): Promise<{
  /** Reader that owns the random-access adapter. */
  reader: Awaited<ReturnType<typeof RecordBatchReader.from>>;
  /** Absolute reads for batch metadata that does not need decoding. */
  readRange: (position: number, length: number) => Promise<Uint8Array>;
}> {
  signal?.throwIfAborted();
  registerArrowCompressionCodecs();
  await preloadArrowCompressionDecoders();

  /** Reads an absolute range and attributes the fetched bytes to the active scan. */
  async function readRange(position: number, length: number): Promise<Uint8Array> {
    signal?.throwIfAborted();
    const bytes = new Uint8Array(await blob.slice(position, position + length).arrayBuffer());
    signal?.throwIfAborted();
    onByteLength?.(bytes.length);
    return bytes;
  }

  // Arrow JS detects this interface structurally. It uses only fd, stat, read, and close.
  const handle = {
    fd: 0,
    /** Exposes the immutable file size to Arrow's random-access adapter. */
    async stat() {
      return {size: blob.size};
    },
    /** Fills the destination from an absolute Blob position. */
    async read(buffer: Uint8Array, start: number, length: number, position: number) {
      const bytes = await readRange(position, length);
      if (bytes.length !== length) throw new Error('Unexpected end of Arrow IPC file');
      buffer.set(bytes, start);
      return {bytesRead: bytes.length, buffer};
    },
    /** Releases a file adapter with no external resources. */
    async close() {}
  };
  const reader = await RecordBatchReader.from(
    handle as unknown as Parameters<typeof RecordBatchReader.from>[0]
  );
  return {reader, readRange};
}

/** Discovers the seekable file's schema without reading record-batch bodies. */
export async function readArrowFileSchema(blob: Blob, signal?: AbortSignal) {
  const {reader} = await openArrowFile(blob, signal);
  try {
    await reader.open();
    return reader.schema;
  } finally {
    await reader.cancel();
  }
}

/** Reads a seekable IPC file while omitting bodies of batches preceding the row offset. */
export async function* readArrowFileWindow(
  blob: Blob,
  offset: number,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): AsyncIterable<Table> {
  const {reader, readRange} = await openArrowFile(blob, signal, onByteLength);
  try {
    await reader.open();
    if (!reader.numRecordBatches && offset === 0) {
      yield new Table(reader.schema);
      return;
    }
    for (let index = 0; index < reader.numRecordBatches; index++) {
      if (offset) {
        const block = reader.footer?.getRecordBatch(index);
        if (!block) throw new Error('Missing Arrow IPC record batch block');
        const metadata = await readRange(block.offset, block.metaDataLength);
        const message = new MessageReader(metadata).readMessage(MessageHeader.RecordBatch);
        if (!message?.isRecordBatch()) throw new Error('Missing Arrow IPC record batch metadata');
        const length = message.header().length;
        if (offset >= length) {
          offset -= length;
          continue;
        }
      }
      const batch = await reader.readRecordBatch(index);
      if (!batch) throw new Error('Missing Arrow IPC record batch');
      const table = updateArrowTableSchema(new Table([batch]), reader.schema);
      yield offset ? table.slice(offset) : table;
      offset = 0;
    }
  } finally {
    await reader.cancel();
  }
}
