// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Compression formats that runtimes may expose through DecompressionStream.
 *
 * Brotli and zstd are included even when the installed TypeScript DOM definitions
 * have not caught up with runtime support.
 */
export type NativeDecompressionFormat = 'brotli' | 'deflate' | 'deflate-raw' | 'gzip' | 'zstd';

type NativeDecompressionStreamConstructor = new (
  format: NativeDecompressionFormat
) => DecompressionStream;

/**
 * Decompresses one ArrayBuffer with a runtime-provided DecompressionStream.
 *
 * @param input Compressed input data.
 * @param format Compression format to decode.
 * @returns Decompressed data, or null when the runtime does not support the format.
 */
export async function decompressWithNativeDecompressionStream(
  input: ArrayBuffer,
  format: NativeDecompressionFormat
): Promise<ArrayBuffer | null> {
  const outputBatches = decompressBatchesWithNativeDecompressionStream([input], format);
  return outputBatches ? await concatenateNativeDecompressionBatches(outputBatches) : null;
}

/**
 * Decompresses batches with a runtime-provided DecompressionStream.
 *
 * @param inputBatches Compressed input data.
 * @param format Compression format to decode.
 * @returns Decompressed batches, or null when the runtime does not support the format.
 */
export function decompressBatchesWithNativeDecompressionStream(
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  format: NativeDecompressionFormat
): AsyncIterable<ArrayBuffer> | null {
  const decompressionStream = createNativeDecompressionStream(format);
  return decompressionStream
    ? transformBatchesWithNativeDecompressionStream(inputBatches, decompressionStream)
    : null;
}

/**
 * Creates a runtime-provided DecompressionStream when the requested format is supported.
 *
 * @param format Compression format to decode.
 * @returns A native decompression stream, or null when it is unavailable.
 */
function createNativeDecompressionStream(
  format: NativeDecompressionFormat
): DecompressionStream | null {
  if (typeof globalThis.DecompressionStream === 'undefined') {
    return null;
  }
  // Node's zlib-backed implementation dereferences the global Buffer internally.
  if (globalThis.process?.release?.name === 'node' && typeof globalThis.Buffer === 'undefined') {
    return null;
  }

  try {
    const DecompressionStreamConstructor =
      globalThis.DecompressionStream as unknown as NativeDecompressionStreamConstructor;
    return new DecompressionStreamConstructor(format);
  } catch (error) {
    if (error instanceof TypeError || (error as Error)?.name === 'TypeError') {
      return null;
    }
    throw error;
  }
}

/**
 * Pipes compressed batches into a native stream while yielding decompressed output incrementally.
 *
 * @param inputBatches Compressed input data.
 * @param decompressionStream Native stream that performs decompression.
 * @yields Exact ArrayBuffer views of decompressed output chunks.
 */
async function* transformBatchesWithNativeDecompressionStream(
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  decompressionStream: DecompressionStream
): AsyncIterable<ArrayBuffer> {
  const writer = decompressionStream.writable.getWriter();
  const reader = decompressionStream.readable.getReader();
  const writePromise = writeBatchesToNativeDecompressionStream(inputBatches, writer);
  writePromise.catch(() => {});
  let outputCompleted = false;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        outputCompleted = true;
        break;
      }
      yield copyExactArrayBuffer(value);
    }
    await writePromise;
  } finally {
    if (!outputCompleted) {
      await reader.cancel().catch(() => {});
      await writer.abort().catch(() => {});
      await writePromise.catch(() => {});
    }
    reader.releaseLock();
  }
}

/**
 * Concatenates decompressed batches without importing codec-adjacent utilities.
 *
 * @param outputBatches Decompressed output batches.
 * @returns One exact ArrayBuffer containing every output byte.
 */
async function concatenateNativeDecompressionBatches(
  outputBatches: AsyncIterable<ArrayBuffer>
): Promise<ArrayBuffer> {
  const batches: Uint8Array[] = [];
  let byteLength = 0;
  for await (const outputBatch of outputBatches) {
    const bytes = new Uint8Array(outputBatch);
    batches.push(bytes);
    byteLength += bytes.byteLength;
  }

  const output = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const batch of batches) {
    output.set(batch, byteOffset);
    byteOffset += batch.byteLength;
  }
  return output.buffer;
}

/**
 * Copies one stream chunk into an exact ArrayBuffer.
 *
 * @param value Decompressed stream chunk.
 * @returns Exact ArrayBuffer containing only the chunk bytes.
 */
function copyExactArrayBuffer(value: Uint8Array): ArrayBuffer {
  return new Uint8Array(value).buffer;
}

/**
 * Writes compressed batches to a native decompression stream and closes its input.
 *
 * @param inputBatches Compressed input data.
 * @param writer Native stream writer receiving compressed batches.
 */
async function writeBatchesToNativeDecompressionStream(
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  writer: WritableStreamDefaultWriter<BufferSource>
): Promise<void> {
  try {
    for await (const inputBatch of inputBatches) {
      await writer.write(new Uint8Array(inputBatch));
    }
    await writer.close();
  } catch (error) {
    await writer.abort(error).catch(() => {});
    throw error;
  }
}
