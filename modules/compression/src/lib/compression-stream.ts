// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Compression formats exposed by a runtime CompressionStream. */
export type NativeCompressionFormat = 'deflate' | 'gzip' | 'brotli' | 'zstd';

type NativeCompressionStreamConstructor = new (
  format: NativeCompressionFormat
) => CompressionStream;

/** Compresses one ArrayBuffer with a runtime-provided CompressionStream. */
export async function compressWithNativeCompressionStream(
  input: ArrayBuffer,
  format: NativeCompressionFormat
): Promise<ArrayBuffer | null> {
  const outputBatches = compressBatchesWithNativeCompressionStream([input], format);
  return outputBatches ? await concatenateBatches(outputBatches) : null;
}

/** Compresses batches with a runtime-provided CompressionStream. */
export function compressBatchesWithNativeCompressionStream(
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  format: NativeCompressionFormat
): AsyncIterable<ArrayBuffer> | null {
  const compressionStream = createNativeCompressionStream(format);
  return compressionStream ? transformBatches(inputBatches, compressionStream) : null;
}

/** Returns whether the runtime exposes CompressionStream for a specific format. */
export function isNativeCompressionSupported(format: NativeCompressionFormat): boolean {
  return Boolean(createNativeCompressionStream(format));
}

function createNativeCompressionStream(format: NativeCompressionFormat): CompressionStream | null {
  if (typeof globalThis.CompressionStream === 'undefined') {
    return null;
  }
  try {
    const CompressionStreamConstructor =
      globalThis.CompressionStream as unknown as NativeCompressionStreamConstructor;
    return new CompressionStreamConstructor(format);
  } catch (error) {
    if (error instanceof TypeError || (error as Error)?.name === 'TypeError') {
      return null;
    }
    throw error;
  }
}

async function* transformBatches(
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  compressionStream: CompressionStream
): AsyncIterable<ArrayBuffer> {
  const writer = compressionStream.writable.getWriter();
  const reader = compressionStream.readable.getReader();
  const writePromise = writeBatches(inputBatches, writer);
  writePromise.catch(() => {});
  let outputCompleted = false;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        outputCompleted = true;
        break;
      }
      yield new Uint8Array(value).buffer;
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

async function writeBatches(
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

async function concatenateBatches(batches: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer> {
  const output: Uint8Array[] = [];
  let byteLength = 0;
  for await (const batch of batches) {
    const bytes = new Uint8Array(batch);
    output.push(bytes);
    byteLength += bytes.byteLength;
  }
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const batch of output) {
    result.set(batch, offset);
    offset += batch.byteLength;
  }
  return result.buffer;
}
