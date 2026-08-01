// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Native formats supported by the DecompressionStream adapter. */
export type NativeDecompressionTestFormat = 'brotli' | 'deflate' | 'deflate-raw' | 'gzip' | 'zstd';

/** Uncompressed bytes shared by real runtime DecompressionStream format tests. */
export const NATIVE_DECOMPRESSION_TEST_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
  .buffer as ArrayBuffer;

/** Fixed compressed fixtures for every format supported by the native adapter. */
export const NATIVE_DECOMPRESSION_FIXTURES: Record<NativeDecompressionTestFormat, number[]> = {
  gzip: [
    31, 139, 8, 0, 0, 0, 0, 0, 0, 19, 99, 100, 98, 102, 97, 101, 99, 231, 224, 4, 0, 158, 171, 239,
    64, 9, 0, 0, 0
  ],
  deflate: [120, 156, 99, 100, 98, 102, 97, 101, 99, 231, 224, 4, 0, 0, 174, 0, 46],
  'deflate-raw': [99, 100, 98, 102, 97, 101, 99, 231, 224, 4, 0],
  brotli: [11, 4, 128, 1, 2, 3, 4, 5, 6, 7, 8, 9, 3],
  zstd: [40, 181, 47, 253, 32, 9, 73, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
};

/**
 * Returns whether the runtime accepts one native DecompressionStream format.
 *
 * @param format Native format to probe.
 * @returns Whether the runtime can construct a stream for the format.
 */
export async function supportsNativeDecompressionStream(
  format: NativeDecompressionTestFormat
): Promise<boolean> {
  if (typeof globalThis.DecompressionStream === 'undefined') {
    return false;
  }

  try {
    const DecompressionStreamConstructor = globalThis.DecompressionStream as unknown as new (
      format: NativeDecompressionTestFormat
    ) => DecompressionStream;
    const decompressionStream = new DecompressionStreamConstructor(format);
    await decompressionStream.writable.abort();
    return true;
  } catch {
    return false;
  }
}

/**
 * Installs a constructor wrapper that records formats while delegating to the real runtime API.
 *
 * @param formats Mutable list that receives every requested native format.
 * @returns Callback that restores the original global constructor.
 */
export function installRecordingDecompressionStream(
  formats: NativeDecompressionTestFormat[]
): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');
  const DecompressionStreamConstructor = globalThis.DecompressionStream as unknown as new (
    format: NativeDecompressionTestFormat
  ) => DecompressionStream;
  const RecordingDecompressionStream = function (
    format: NativeDecompressionTestFormat
  ): DecompressionStream {
    formats.push(format);
    return new DecompressionStreamConstructor(format);
  } as unknown as typeof DecompressionStream;

  Object.defineProperty(globalThis, 'DecompressionStream', {
    configurable: true,
    writable: true,
    value: RecordingDecompressionStream
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'DecompressionStream', originalDescriptor);
    } else {
      delete (globalThis as any).DecompressionStream;
    }
  };
}
