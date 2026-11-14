// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Table} from '@loaders.gl/core/schema';
import {ArrowLoaderOptions} from '../../arrow-loader-types';
import {convertArrowToTable, updateArrowTableSchema} from '@loaders.gl/core/schema-utils';
import {paceBatchIterator, toArrayBufferIterator} from '@loaders.gl/core/loader-utils';
import {registerArrowCompressionCodecs, preloadArrowCompressionDecoders} from './arrow-compression';

const UNSAFE_BIGINT_ERROR_REGEXP = /^(-?\d+) is not safe to convert to a number\.$/;
const UNSUPPORTED_COMPRESSION_ERROR_REGEXP = /Record batch compression not implemented/i;

/** Parses Arrow IPC into native Arrow or the requested row or column layout. */
export function parseArrowSync(arrayBuffer: ArrayBuffer, options?: {shape?: 'arrow'}): arrow.Table;
export function parseArrowSync(
  arrayBuffer: ArrayBuffer,
  options?: {shape?: 'arrow' | Exclude<Table['shape'], 'arrow-table'>}
): arrow.Table | Exclude<Table, {shape: 'arrow-table'}>;
export function parseArrowSync(
  arrayBuffer: ArrayBuffer,
  options?: {shape?: 'arrow' | Exclude<Table['shape'], 'arrow-table'>}
): arrow.Table | Exclude<Table, {shape: 'arrow-table'}> {
  const table = parseArrowTable(arrayBuffer);
  const shape = options?.shape;
  return !shape || shape === 'arrow' ? table : convertArrowToTable(table, shape);
}

/** Parses an Arrow IPC table, normalizing dictionary ids unsupported by Arrow JS. */
function parseArrowTable(arrayBuffer: ArrayBuffer): arrow.Table {
  const compressionSupported = registerArrowCompressionCodecs();
  try {
    return arrow.tableFromIPC([new Uint8Array(arrayBuffer)]);
  } catch (error) {
    // Arrow IPC dictionary ids are signed 64-bit integers, but Arrow JS stores
    // them as JavaScript numbers. Files written by other implementations can
    // therefore contain valid ids that Arrow JS refuses to decode before
    // loaders.gl gets access to the schema.
    const normalizedArrayBuffer = normalizeUnsafeDictionaryIds(arrayBuffer, error);
    if (normalizedArrayBuffer) {
      return arrow.tableFromIPC([new Uint8Array(normalizedArrayBuffer)]);
    }
    if (!compressionSupported && isUnsupportedCompressionError(error)) {
      throw new Error(
        'Arrow IPC buffer compression requires apache-arrow 21.2.0 or later; the installed runtime only supports uncompressed IPC data',
        {cause: error}
      );
    }
    throw error;
  }
}

/** Checks for the error emitted by Apache Arrow JS releases without IPC compression support. */
function isUnsupportedCompressionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return UNSUPPORTED_COMPRESSION_ERROR_REGEXP.test(message);
}

/** Rewrites unsafe int64 dictionary ids to small ids that Arrow JS can represent. */
function normalizeUnsafeDictionaryIds(
  arrayBuffer: ArrayBuffer,
  error: unknown
): ArrayBuffer | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(UNSAFE_BIGINT_ERROR_REGEXP);
  if (!match) {
    return null;
  }

  const unsafeDictionaryId = BigInt(match[1]);
  const unsafeDictionaryIdBytes = getInt64LittleEndianBytes(unsafeDictionaryId);
  const normalizedArrayBuffer = arrayBuffer.slice(0);
  const bytes = new Uint8Array(normalizedArrayBuffer);
  const replacementBytes = new Uint8Array(8);
  let replacementCount = 0;

  // This is intentionally conservative and only runs after Arrow JS has told us
  // the exact unsafe id that blocked decoding. The id is an internal reference
  // between the schema and dictionary batches, so remapping all occurrences of
  // that byte pattern to zero preserves table semantics for a single dictionary
  // id. The tradeoff is that this is not a full FlatBuffer metadata rewrite; if
  // a file contains multiple distinct unsafe dictionary ids, Arrow JS will throw
  // again and the caller will see the remaining unsupported id.
  for (let offset = 0; offset <= bytes.length - unsafeDictionaryIdBytes.length; offset++) {
    if (hasBytesAtOffset(bytes, unsafeDictionaryIdBytes, offset)) {
      bytes.set(replacementBytes, offset);
      replacementCount++;
    }
  }

  return replacementCount > 0 ? normalizedArrayBuffer : null;
}

/** Encodes a signed int64 as little-endian bytes. */
function getInt64LittleEndianBytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigInt64(0, value, true);
  return bytes;
}

/** Checks whether a byte pattern starts at a given offset. */
function hasBytesAtOffset(bytes: Uint8Array, pattern: Uint8Array, offset: number): boolean {
  for (let index = 0; index < pattern.length; index++) {
    if (bytes[offset + index] !== pattern[index]) {
      return false;
    }
  }
  return true;
}

/** Streams native IPC record batches with the reader's declared schema. */
export function parseArrowInBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ArrowLoaderOptions
): AsyncIterable<arrow.RecordBatch> {
  registerArrowCompressionCodecs();

  async function* readBatches(): AsyncIterable<arrow.RecordBatch> {
    await preloadArrowCompressionDecoders();
    // @ts-ignore
    const readers = arrow.RecordBatchReader.readAll(toArrayBufferIterator(input));
    for await (const reader of readers) {
      for await (const batch of reader) {
        yield* updateArrowTableSchema(new arrow.Table([batch]), reader.schema).batches;
      }
      break;
    }
  }

  return paceBatchIterator(readBatches(), {
    batchMaxRowsPerSecond: options?.core?.batchMaxRowsPerSecond,
    getRowCount: batch => batch.numRows,
    signal: options?.signal
  });
}
