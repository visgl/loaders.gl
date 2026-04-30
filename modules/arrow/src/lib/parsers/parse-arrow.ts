// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Table, ArrowTableBatch} from '@loaders.gl/schema';
import {ArrowLoaderOptions} from '../../exports/arrow-loader';
import {convertArrowToTable} from '@loaders.gl/schema-utils';
import {toArrayBufferIterator} from '@loaders.gl/loader-utils';

const UNSAFE_BIGINT_ERROR_REGEXP = /^(-?\d+) is not safe to convert to a number\.$/;

/** Parses arrow to a loaders.gl table. Defaults to `arrow-table` */
export function parseArrowSync(
  arrayBuffer: ArrayBuffer,
  options?: {shape?: Table['shape']}
): Table {
  const shape = options?.shape || 'arrow-table';
  const arrowTable = parseArrowTable(arrayBuffer);
  return convertArrowToTable(arrowTable, shape);
}

/** Parses an Arrow IPC table, normalizing dictionary ids unsupported by Arrow JS. */
function parseArrowTable(arrayBuffer: ArrayBuffer): arrow.Table {
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
    throw error;
  }
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

export function parseArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  // Creates the appropriate arrow.RecordBatchReader subclasses from the input
  // This will also close the underlying source in case of early termination or errors

  // As an optimization, return a non-async iterator
  /*
  if (isIterable(readers)) {
    function* makeArrowIterator() {
      for (const reader of readers) {
        for (const batch of reader) {
          yield processBatch(batch, reader);
        }
        break; // only processing one stream of batches
      }
    }
    const arrowIterator = makeArrowIterator();
  }
  */

  async function* makeArrowAsyncIterator(): AsyncIterator<ArrowTableBatch> {
    // @ts-ignore
    const readers = arrow.RecordBatchReader.readAll(toArrayBufferIterator(asyncIterator));
    for await (const reader of readers) {
      for await (const recordBatch of reader) {
        // use options.batchDebounceMs to add a delay between batches if needed (use case: incremental loading)
        if (options?.arrow?.batchDebounceMs !== undefined && options?.arrow?.batchDebounceMs > 0) {
          await new Promise(resolve => setTimeout(resolve, options.arrow?.batchDebounceMs || 0));
        }
        const arrowTabledBatch: ArrowTableBatch = {
          shape: 'arrow-table',
          batchType: 'data',
          data: new arrow.Table([recordBatch]),
          length: recordBatch.data.length
        };
        // processBatch(recordBatch);
        yield arrowTabledBatch;
      }
      break; // only processing one stream of batches
    }
  }

  return makeArrowAsyncIterator() as any; // as AsyncIterator<ArrowTableBatch>;
}

// function processBatch(batch: RecordBatch): ArrowTableBatch {
//   const values = {};
//   batch.schema.fields.forEach(({name}, index) => {
//     values[name] = batch.getChildAt(index)?.toArray();
//   });
//   return {
//   };
// }
