/** @typedef {import('@loaders.gl/compression').Compression} Compression */
import test from 'tape-promise/tape';
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
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {getData, compareArrayBuffers} from './utils/test-utils';

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

test('compression#atomic', async (t) => {
  for (const compression of COMPRESSIONS) {
    // brotli compress import issue
    if (!compression.isSupported || compression.name === 'brotli') {
      continue; // eslint-disable-line no-continue
    }
    for (const tc of TEST_CASES) {
      const {title} = tc;
      const {name} = compression;
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

test('compression#batched', async (t) => {
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

// WORKER TESTS

test('gzip#worker', async (t) => {
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

test('lz4#worker', async (t) => {
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

test.skip('zstd#worker', async (t) => {
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
