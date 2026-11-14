import {expect, test} from 'vitest';
import {CompressionWorker, NoCompressor, NoDecompressor, DeflateCompressor, DeflateDecompressor, GZipCompressor, GZipDecompressor, LZ4Compressor, LZ4Decompressor, SnappyCompressor, SnappyDecompressor, ZstdCompressor, ZstdDecompressor} from '@loaders.gl/compression';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from '@loaders.gl/compression/native-decompression';
import {processOnWorker, isBrowser, destroyWorkerTasks} from '@loaders.gl/core/worker-utils';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';
import {getData, compareArrayBuffers} from './utils/test-utils';
import {
  installRecordingDecompressionStream,
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA,
  supportsNativeDecompressionStream,
  type NativeDecompressionTestFormat
} from './utils/native-decompression-test-utils';
test.each([
  [new NoCompressor(), new NoDecompressor()],
  [new DeflateCompressor(), new DeflateDecompressor()],
  [new GZipCompressor(), new GZipDecompressor()],
  [new LZ4Compressor(), new LZ4Decompressor()],
  [new SnappyCompressor(), new SnappyDecompressor()],
  [new ZstdCompressor(), new ZstdDecompressor()],
])('default codec round trip', async (compressor, decompressor) => {
  const input = getData().binaryData;
  const compressed = await compressor.compress(input);
  expect(compareArrayBuffers(input, await decompressor.decompress(compressed))).toBe(true);
});
test('gzip round trips split batches', async () => {
  const input = Uint8Array.of(1, 2, 3, 4, 5, 6).buffer;
  const compressor = new GZipCompressor();
  const decompressor = new GZipDecompressor();
  const compressed = compressor.compressBatches([input.slice(0, 2), input.slice(2)]);
  expect(await concatenateArrayBuffersAsync(decompressor.decompressBatches(compressed))).toEqual(input);
});
test('native decompression#real DecompressionStream formats', async () => {
  for (const format of Object.keys(
    NATIVE_DECOMPRESSION_FIXTURES
  ) as NativeDecompressionTestFormat[]) {
    if (!(await supportsNativeDecompressionStream(format))) {
      console.log(`${format} DecompressionStream is not available in this runtime`);
      continue;
    }
    const nativeFormats: NativeDecompressionTestFormat[] = [];
    const restoreDecompressionStream = installRecordingDecompressionStream(nativeFormats);
    try {
      const compressedData = new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES[format]).buffer;
      const decompressedData = await decompressWithNativeDecompressionStream(
        compressedData,
        format
      );
      expect(
        decompressedData && compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedData),
        `native atomic ${format} decompression works`
      ).toBeTruthy();
      const splitIndex = Math.max(1, Math.floor(compressedData.byteLength / 2));
      const compressedBatches = [
        compressedData.slice(0, splitIndex),
        compressedData.slice(splitIndex, compressedData.byteLength)
      ];
      const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
        compressedBatches,
        format
      );
      expect(decompressedBatches, `native batched ${format} stream is created`).toBeTruthy();
      const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
      expect(
        compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedBatchData),
        `native batched ${format} decompression works`
      ).toBeTruthy();
      expect(
        nativeFormats,
        `${format} uses the native stream for atomic and batched decompression`
      ).toEqual([format, format]);
    } finally {
      restoreDecompressionStream();
    }
  }
});
test('native decompression#mocked zstd atomic and batched', async () => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream({
    formats,
    supportedFormats: ['zstd']
  });
  try {
    const inputBatches = [new Uint8Array([1, 2, 3]).buffer, new Uint8Array([4, 5, 6]).buffer];
    const inputData = concatenateArrayBuffers(...inputBatches);
    const decompressedData = await decompressWithNativeDecompressionStream(inputData, 'zstd');
    expect(
      decompressedData && compareArrayBuffers(inputData, decompressedData),
      'native atomic zstd needs no codec'
    ).toBeTruthy();
    const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
      inputBatches,
      'zstd'
    );
    expect(decompressedBatches, 'native batched zstd stream is created').toBeTruthy();
    const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
    expect(
      compareArrayBuffers(inputData, decompressedBatchData),
      'native batched zstd needs no codec'
    ).toBeTruthy();
    expect(formats, 'zstd maps to the native zstd format').toEqual(['zstd', 'zstd']);
  } finally {
    restoreDecompressionStream();
  }
});
test('native decompression#unsupported formats return null', async () => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream({
    formats,
    supportedFormats: []
  });
  try {
    const inputData = new Uint8Array([1, 2, 3]).buffer;
    expect(
      await decompressWithNativeDecompressionStream(inputData, 'zstd'),
      'atomic unsupported format returns null'
    ).toBe(null);
    expect(
      decompressBatchesWithNativeDecompressionStream([inputData], 'zstd'),
      'batched unsupported format returns null'
    ).toBe(null);
    expect(formats, 'both paths probe the requested format').toEqual(['zstd', 'zstd']);
  } finally {
    restoreDecompressionStream();
  }
});
test('native decompression#stream failures propagate', async () => {
  const restoreDecompressionStream = installMockDecompressionStream({
    formats: [],
    supportedFormats: ['zstd'],
    failWith: new Error('mock native decompression failed')
  });
  try {
    const inputData = new Uint8Array([1, 2, 3]).buffer;
    await expect(
      decompressWithNativeDecompressionStream(inputData, 'zstd'),
      'native stream errors propagate'
    ).rejects.toThrow(/mock native decompression failed/);
  } finally {
    restoreDecompressionStream();
  }
});
// WORKER TESTS
test('gzip#worker', async () => {
  const {binaryData} = getData();
  expect(binaryData.byteLength, 'Length correct').toBe(100000);
  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'gzip',
    operation: 'compress',
    _workerType: 'test',
    gzip: {
      level: 6
    }
  });
  expect(compressedData.byteLength, 'Length correct').toBe(12819);
  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'gzip',
    operation: 'decompress',
    _workerType: 'test',
    gzip: {
      level: 6
    }
  });
  expect(decompressdData.byteLength, 'Length correct').toBe(100000);
  expect(
    compareArrayBuffers(decompressdData, binaryData),
    'compress/decompress level 6'
  ).toBeTruthy();
  if (!isBrowser) {
    await destroyWorkerTasks();
  }
});
test('lz4#worker', async () => {
  const {binaryData} = getData();
  expect(binaryData.byteLength, 'Length correct').toBe(100000);
  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'lz4',
    operation: 'compress',
    _workerType: 'test'
  });
  expect(compressedData.byteLength).toBeLessThan(binaryData.byteLength);
  expect(new DataView(compressedData).getUint32(0, true)).toBe(0x184d2204);
  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'lz4',
    operation: 'decompress',
    _workerType: 'test'
  });
  expect(decompressdData.byteLength, 'Length correct').toBe(100000);
  expect(
    compareArrayBuffers(decompressdData, binaryData),
    'compress/decompress level 6'
  ).toBeTruthy();
  if (!isBrowser) {
    await destroyWorkerTasks();
  }
});
test.skip('zstd#worker', async () => {
  if (!isBrowser) {
    return;
  }
  const {binaryData} = getData();
  expect(binaryData.byteLength, 'Length correct').toBe(100000);
  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'zstd',
    operation: 'compress',
    _workerType: 'test'
  });
  expect(compressedData.byteLength, 'Length correct').toBe(11936);
  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'zstd',
    operation: 'decompress',
    _workerType: 'test'
  });
  expect(decompressdData.byteLength, 'Length correct').toBe(100000);
  expect(
    compareArrayBuffers(decompressdData, binaryData),
    'compress/decompress level 6'
  ).toBeTruthy();
});
type MockDecompressionStreamOptions = {
  formats: string[];
  supportedFormats: string[];
  failWith?: Error;
};
/**
 * Installs a deterministic DecompressionStream double and returns a restorer.
 *
 * @param options Mock formats and failure behavior.
 * @returns Callback that restores the original global constructor.
 */
function installMockDecompressionStream(options: MockDecompressionStreamOptions): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');
  class MockDecompressionStream {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<BufferSource>;
    /** Creates a mock native decompression stream for supported formats. */
    constructor(format: string) {
      options.formats.push(format);
      if (!options.supportedFormats.includes(format)) {
        throw new TypeError('mock compression format is unsupported');
      }
      const transformStream = new TransformStream<BufferSource, Uint8Array>({
        transform(chunk, controller) {
          if (options.failWith) {
            throw options.failWith;
          }
          controller.enqueue(copyBufferSource(chunk));
        }
      });
      this.readable = transformStream.readable;
      this.writable = transformStream.writable;
    }
  }
  Object.defineProperty(globalThis, 'DecompressionStream', {
    configurable: true,
    writable: true,
    value: MockDecompressionStream
  });
  return () => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'DecompressionStream', originalDescriptor);
    } else {
      delete (globalThis as any).DecompressionStream;
    }
  };
}
/**
 * Copies a native stream input chunk into a Uint8Array.
 *
 * @param bufferSource Native stream input chunk.
 * @returns Copied bytes for the mock stream output.
 */
function copyBufferSource(bufferSource: BufferSource): Uint8Array {
  if (bufferSource instanceof ArrayBuffer) {
    return new Uint8Array(bufferSource).slice();
  }
  return new Uint8Array(
    bufferSource.buffer,
    bufferSource.byteOffset,
    bufferSource.byteLength
  ).slice();
}
