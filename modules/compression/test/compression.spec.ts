// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** @typedef {import('@loaders.gl/compression').Compression} Compression */
import test from 'test/utils/vitest-tape';
import {
  NoCompression,
  GZipCompression,
  DeflateCompression,
  LZ4Compression,
  ZstdCompression,
  SnappyCompression,
  BrotliCompression,
  // LZOCompression,
  CompressionWorker
} from '@loaders.gl/compression';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from '@loaders.gl/compression/native-decompression';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {getData, compareArrayBuffers} from './utils/test-utils';
import {
  installRecordingDecompressionStream,
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA,
  supportsNativeDecompressionStream,
  type NativeDecompressionTestFormat
} from './utils/native-decompression-test-utils';

// Import big dependencies

// import brotli from 'brotli'; - brotli has problems with decompress in browsers
import brotliDecompress from 'brotli/decompress';
import lz4js from 'lz4js';
// import lzo from 'lzo';
import {ZstdCodec} from 'zstd-codec';

// Inject large dependencies through Compression constructor options
const modules = {
  // brotli has problems with decompress in browsers
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  },
  lz4js,
  // lzo,
  'zstd-codec': ZstdCodec
};

const TEST_DATA = getData();

const TEST_CASES = [
  {
    title: 'binary',
    data: TEST_DATA.binaryData
  },
  {
    title: 'repeated',
    data: TEST_DATA.repeatedData,
    compression: {
      plain: {
        compressedLength: 100000
      },
      compress: {
        compressedLength: 10903
      },
      gzip: {
        compressedLength: 10915
      },
      lz4: {
        compressedLength: 10422
      },
      snappy: {
        compressedLength: 23764
      },
      zstd: {
        compressedLength: 10025
      }
    }
  }
];

/** @type {Compression[]} */
const COMPRESSIONS = [
  new NoCompression({modules}),
  new BrotliCompression({modules}),
  new DeflateCompression({modules}),
  new GZipCompression({modules}),
  // new LZOCompression({modules}),
  new LZ4Compression({modules}),
  new SnappyCompression({modules}),
  new ZstdCompression({modules})
];

if (!isBrowser) {
  COMPRESSIONS.push();
}

test('compression#atomic', async t => {
  for (const compression of COMPRESSIONS) {
    // brotli compress import issue
    if (!compression.isSupported || compression.name === 'brotli') {
      continue; // eslint-disable-line no-continue
    }
    for (const tc of TEST_CASES) {
      const {title} = tc;
      const {name} = compression;
      t.comment(`Testing ${name}(${title})`);
      const compressedData = await compression.compress(tc.data);
      const compressedLength = tc.compression?.[compression.name]?.compressedLength;
      if (compressedLength) {
        t.equal(
          compressedData.byteLength,
          compressedLength,
          `${name}(${title}) compressed length correct`
        );
      }
      const uncompressedData = await compression.decompress(compressedData);
      t.ok(
        compareArrayBuffers(tc.data, uncompressedData),
        `${name}(${title}) decompressed data equals original`
      );
    }
  }

  t.end();
});

// BATCHED TESTS

test('compression#batched', async t => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  for (const compression of COMPRESSIONS) {
    // brotli compress import issue
    if (!compression.isSupported || compression.name === 'brotli') {
      continue; // eslint-disable-line no-continue
    }
    for (const tc of TEST_CASES) {
      const {title} = tc;
      const {name} = compression;

      // Test empty batches
      let compressedBatches = compression.compressBatches(inputChunks);
      const compressedData = await concatenateArrayBuffersAsync(compressedBatches);
      if (name === 'gzip') {
        t.equals(compressedData.byteLength, 29, `${name}(${title}) batches: length correct`); // Header overhead
      }

      // test chained iterators
      compressedBatches = compression.compressBatches(inputChunks);

      const decompressedBatches = compression.decompressBatches(compressedBatches);

      const inputData = concatenateArrayBuffers(...inputChunks);
      const decompressedData = await concatenateArrayBuffersAsync(decompressedBatches);

      t.ok(
        compareArrayBuffers(inputData, decompressedData),
        `${name}(${title}) batches: compress/decompress identical`
      );
    }
  }
  t.end();
});

test('native decompression#real DecompressionStream formats', async t => {
  for (const format of Object.keys(
    NATIVE_DECOMPRESSION_FIXTURES
  ) as NativeDecompressionTestFormat[]) {
    if (!(await supportsNativeDecompressionStream(format))) {
      t.comment(`${format} DecompressionStream is not available in this runtime`);
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
      t.ok(
        decompressedData && compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedData),
        `native atomic ${format} decompression works`
      );

      const splitIndex = Math.max(1, Math.floor(compressedData.byteLength / 2));
      const compressedBatches = [
        compressedData.slice(0, splitIndex),
        compressedData.slice(splitIndex, compressedData.byteLength)
      ];
      const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
        compressedBatches,
        format
      );
      t.ok(decompressedBatches, `native batched ${format} stream is created`);
      const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
      t.ok(
        compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedBatchData),
        `native batched ${format} decompression works`
      );
      t.deepEqual(
        nativeFormats,
        [format, format],
        `${format} uses the native stream for atomic and batched decompression`
      );
    } finally {
      restoreDecompressionStream();
    }
  }

  t.end();
});

test('native decompression#mocked zstd atomic and batched', async t => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream({
    formats,
    supportedFormats: ['zstd']
  });

  try {
    const inputBatches = [new Uint8Array([1, 2, 3]).buffer, new Uint8Array([4, 5, 6]).buffer];
    const inputData = concatenateArrayBuffers(...inputBatches);

    const decompressedData = await decompressWithNativeDecompressionStream(inputData, 'zstd');
    t.ok(
      decompressedData && compareArrayBuffers(inputData, decompressedData),
      'native atomic zstd needs no codec'
    );

    const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
      inputBatches,
      'zstd'
    );
    t.ok(decompressedBatches, 'native batched zstd stream is created');
    const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
    t.ok(
      compareArrayBuffers(inputData, decompressedBatchData),
      'native batched zstd needs no codec'
    );
    t.deepEqual(formats, ['zstd', 'zstd'], 'zstd maps to the native zstd format');
  } finally {
    restoreDecompressionStream();
  }

  t.end();
});

test('native decompression#unsupported formats return null', async t => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream({
    formats,
    supportedFormats: []
  });

  try {
    const inputData = new Uint8Array([1, 2, 3]).buffer;
    t.equal(
      await decompressWithNativeDecompressionStream(inputData, 'zstd'),
      null,
      'atomic unsupported format returns null'
    );
    t.equal(
      decompressBatchesWithNativeDecompressionStream([inputData], 'zstd'),
      null,
      'batched unsupported format returns null'
    );
    t.deepEqual(formats, ['zstd', 'zstd'], 'both paths probe the requested format');
  } finally {
    restoreDecompressionStream();
  }

  t.end();
});

test('native decompression#stream failures propagate', async t => {
  const restoreDecompressionStream = installMockDecompressionStream({
    formats: [],
    supportedFormats: ['zstd'],
    failWith: new Error('mock native decompression failed')
  });

  try {
    const inputData = new Uint8Array([1, 2, 3]).buffer;
    await t.rejects(
      decompressWithNativeDecompressionStream(inputData, 'zstd'),
      /mock native decompression failed/,
      'native stream errors propagate'
    );
  } finally {
    restoreDecompressionStream();
  }

  t.end();
});

// WORKER TESTS
test('gzip#worker', async t => {
  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'gzip',
    operation: 'compress',
    _workerType: 'test',
    gzip: {
      level: 6
    }
  });

  t.equal(compressedData.byteLength, 12825, 'Length correct');

  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'gzip',
    operation: 'decompress',
    _workerType: 'test',
    gzip: {
      level: 6
    }
  });

  t.equal(decompressdData.byteLength, 100000, 'Length correct');

  t.ok(compareArrayBuffers(decompressdData, binaryData), 'compress/decompress level 6');

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('lz4#worker', async t => {
  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'lz4',
    operation: 'compress',
    _workerType: 'test'
  });

  t.equal(compressedData.byteLength, 12331, 'Length correct');

  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'lz4',
    operation: 'decompress',
    _workerType: 'test'
  });

  t.equal(decompressdData.byteLength, 100000, 'Length correct');

  t.ok(compareArrayBuffers(decompressdData, binaryData), 'compress/decompress level 6');

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test.skip('zstd#worker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  const compressedData = await processOnWorker(CompressionWorker, binaryData.slice(0), {
    compression: 'zstd',
    operation: 'compress',
    _workerType: 'test'
  });

  t.equal(compressedData.byteLength, 11936, 'Length correct');

  const decompressdData = await processOnWorker(CompressionWorker, compressedData, {
    compression: 'zstd',
    operation: 'decompress',
    _workerType: 'test'
  });

  t.equal(decompressdData.byteLength, 100000, 'Length correct');

  t.ok(compareArrayBuffers(decompressdData, binaryData), 'compress/decompress level 6');
  t.end();
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
