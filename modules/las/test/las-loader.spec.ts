// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  validateLoader,
  validateMeshCategoryData,
  validateTableCategoryData
} from 'test/common/conformance';

import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import * as las from '@loaders.gl/las';
import * as bundledLas from '@loaders.gl/las/bundled';
import * as unbundledLas from '@loaders.gl/las/unbundled';
import {
  setLoaderOptions,
  fetchFile,
  parse,
  parseInBatches,
  load,
  preload,
  makeIterator
} from '@loaders.gl/core';
import {Copc, Las} from 'copc';
import {
  createLAZChunkEncoder,
  createLAZChunkDecoder,
  decodeLAZFileInBatches,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  encodeLAZChunk,
  NeedsMoreData
} from '@loaders.gl/las';
import {createLAZChunkDecoderCursor} from '@loaders.gl/loader-utils';
import {LASCOPCLoaderWithParser} from '../src/las-copc-loader-with-parser';
import {LAZPerfLoaderWithParser} from '../src/lazperf-loader-with-parser';
import {LAZRsLoaderWithParser} from '../src/laz-rs-loader-with-parser';
import {LASLoaderWithParser} from '../src/las-loader-with-parser';
// import {ArrowLoader} from '@loaders.gl/arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAS_EXTRABYTES_BINARY_URL = '@loaders.gl/las/test/data/extrabytes.laz';
const LAS_POINT_COUNT = 808042;
const LAS_EXTRABYTES_POINT_COUNT = 1065;
const LAZ_1_4_POINT_COUNT = 100000;
const LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/points-1.4.las';
const LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/ellipsoid-1.4.laz';
const COPC_BINARY_URL = 'modules/copc/test/data/ellipsoid.copc.laz';
const LAZ_1_4_PARITY_BACKENDS = ['copc', 'laz-rs'] as const;

setLoaderOptions({
  _workerType: 'test'
});

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#removed Arrow variant exports are absent', t => {
  t.notOk('LASArrowLoader' in las, 'root does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in bundledLas, 'bundled does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in unbundledLas, 'unbundled does not export LASArrowLoader');
  t.end();
});

test('LASLoader#preload resolves backend parser implementations', async t => {
  t.equal(await preload(LASLoader), LAZPerfLoaderWithParser, 'default backend resolves laz-perf');
  t.equal(
    await preload(LASLoader, {las: {backend: 'laz-perf'}}),
    LAZPerfLoaderWithParser,
    'laz-perf backend resolves laz-perf parser'
  );
  t.equal(
    await preload(LASLoader, {las: {backend: 'copc'}}),
    LASCOPCLoaderWithParser,
    'copc backend resolves COPC parser'
  );
  t.equal(
    await preload(LASLoader, {las: {backend: 'laz-rs'}}),
    LAZRsLoaderWithParser,
    'laz-rs backend resolves laz-rs parser'
  );
  t.equal(
    await preload(LASLoader, {las: {backend: 'typescript'}}),
    LASLoaderWithParser,
    'typescript backend resolves TypeScript parser'
  );
  t.end();
});

test('LASLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(
    data.attributes.POSITION.value.length,
    LAS_POINT_COUNT * 3,
    'POSITION attribute was found'
  );

  t.end();
});

test('LASLoader#parseInBatches(mesh)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    core: {worker: false}
  });
  const batchVertexCounts: number[] = [];
  let totalVertexCount = 0;

  for await (const batch of batches as AsyncIterable<any>) {
    validateMeshCategoryData(t, batch);
    t.equal(batch.mode, 0, 'batch mode is POINTS (0)');
    t.ok(batch.attributes.POSITION, 'batch includes POSITION attribute');
    t.ok(batch.attributes.intensity, 'batch includes intensity attribute');
    t.ok(batch.attributes.classification, 'batch includes classification attribute');
    t.ok(batch.attributes.COLOR_0, 'batch includes COLOR_0 attribute');
    t.equal(
      batch.attributes.POSITION.value.length,
      batch.header.vertexCount * 3,
      'POSITION length matches batch vertex count'
    );
    t.ok(batch.progress > 0 && batch.progress <= 1, 'batch includes progress');
    batchVertexCounts.push(batch.header.vertexCount);
    totalVertexCount += batch.header.vertexCount;
  }

  t.deepEqual(
    batchVertexCounts,
    [...new Array(32).fill(25000), 8042],
    'emits requested mesh batches'
  );
  t.equal(totalVertexCount, LAS_POINT_COUNT, 'batched vertex count matches full parse');
  t.end();
});

test('LASLoader#parseInBatches(arrow-table)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 30000,
    las: {shape: 'arrow-table'},
    core: {worker: false}
  });
  const batchRowCounts: number[] = [];

  for await (const table of batches as AsyncIterable<any>) {
    t.equal(table.shape, 'arrow-table', 'batch has arrow-table shape');
    t.ok(table.data.getChild('POSITION'), 'batch includes POSITION column');
    t.ok(table.data.getChild('intensity'), 'batch includes intensity column');
    t.ok(table.data.getChild('classification'), 'batch includes classification column');
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(
    batchRowCounts,
    [...new Array(26).fill(30000), 28042],
    'emits requested Arrow batches'
  );
  t.end();
});

test('LASLoader#parseInBatches(fp64)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    las: {fp64: true},
    core: {worker: false}
  });

  for await (const batch of batches as AsyncIterable<any>) {
    t.ok(
      batch.attributes.POSITION.value instanceof Float64Array,
      'batch POSITION attribute is Float64Array'
    );
    break;
  }

  t.end();
});

test('LASLoader#parseInBatches backend option', async t => {
  for (const backend of ['laz-perf', 'copc', 'laz-rs', 'typescript'] as const) {
    const response = await fetchFile(LAS_BINARY_URL);
    const batches = await parseInBatches(makeIterator(response), LASLoader, {
      batchSize: 30000,
      las: {backend},
      core: {worker: false}
    });
    let totalVertexCount = 0;

    for await (const batch of batches as AsyncIterable<any>) {
      totalVertexCount += batch.header.vertexCount;
    }

    t.equal(totalVertexCount, LAS_POINT_COUNT, `${backend} backend emits all points`);
  }

  t.end();
});

test('LASLoader#parse LAZ 1.2 PDRF 3 TypeScript backend matches WASM backend', async t => {
  const expected = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {backend: 'laz-rs'},
    core: {worker: false}
  });
  const actual = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, actual);

  t.equal(actual.loaderData.versionAsString, '1.2', 'fixture is LAS 1.2');
  t.equal(actual.loaderData.pointsFormatId, 3, 'fixture uses point format 3');
  t.equal(actual.header.vertexCount, LAS_POINT_COUNT, 'fixture point count is expected');
  compareMeshAttributes(t, actual, expected, 'TypeScript LAZ PDRF 3 parse matches laz-rs');
  t.end();
});

test('LASLoader#parseInBatches split LAZ 1.2 PDRF 3 TypeScript backend matches WASM backend', async t => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASLoader, {
    las: {backend: 'laz-rs'},
    core: {worker: false}
  });
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 250,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  t.equal(expected.loaderData.versionAsString, '1.2', 'fixture is LAS 1.2');
  t.equal(expected.loaderData.pointsFormatId, 3, 'fixture uses point format 3');
  t.equal(
    expected.header.vertexCount,
    LAS_EXTRABYTES_POINT_COUNT,
    'fixture point count is expected'
  );

  compareCollectedMeshAttributes(
    t,
    actual,
    {
      positions: Array.from(expected.attributes.POSITION.value),
      intensities: Array.from(expected.attributes.intensity.value),
      classifications: Array.from(expected.attributes.classification.value),
      colors: Array.from(expected.attributes.COLOR_0.value)
    },
    'split TypeScript LAZ PDRF 3 streaming matches laz-rs'
  );
  t.end();
}, 15000);

test('LASLoader#parse LAS 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 3, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parse LAS 1.4 fixture with TypeScript backend', async t => {
  const expected = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 3, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  compareMeshAttributes(t, data, expected, 'TypeScript backend matches COPC/WASM backend');
  t.end();
});

test('LASLoader#parseInBatches TypeScript backend matches WASM backend', async t => {
  const expected = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });
  const response = await fetchFile(LAS_1_4_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 2,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const positions: number[] = [];
  const intensities: number[] = [];
  const classifications: number[] = [];
  const colors: number[] = [];

  for await (const batch of batches as AsyncIterable<any>) {
    positions.push(...batch.attributes.POSITION.value);
    intensities.push(...batch.attributes.intensity.value);
    classifications.push(...batch.attributes.classification.value);
    colors.push(...(batch.attributes.COLOR_0?.value || []));
  }

  t.deepEqual(positions, Array.from(expected.attributes.POSITION.value), 'positions match WASM');
  t.deepEqual(
    intensities,
    Array.from(expected.attributes.intensity.value),
    'intensities match WASM'
  );
  t.deepEqual(
    classifications,
    Array.from(expected.attributes.classification.value),
    'classifications match WASM'
  );
  t.deepEqual(colors, Array.from(expected.attributes.COLOR_0.value), 'colors match WASM');
  t.end();
});

test('LASLoader#parse LAZ 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, LAZ_1_4_POINT_COUNT, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parse LAZ 1.4 TypeScript backend matches other backends', async t => {
  const actual = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, actual);

  for (const backend of LAZ_1_4_PARITY_BACKENDS) {
    const expected = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
      las: {backend},
      core: {worker: false}
    });

    t.equal(
      actual.header.vertexCount,
      expected.header.vertexCount,
      `TypeScript LAZ point count matches ${backend}`
    );
    compareMeshAttributes(t, actual, expected, `TypeScript LAZ parse matches ${backend}`);
  }

  t.end();
});

test('LASLoader#parseInBatches LAZ 1.4 fixture with TypeScript backend', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  for (const backend of LAZ_1_4_PARITY_BACKENDS) {
    const expected = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
      las: {backend},
      core: {worker: false}
    });

    compareCollectedMeshAttributes(
      t,
      actual,
      {
        positions: Array.from(expected.attributes.POSITION.value),
        intensities: Array.from(expected.attributes.intensity.value),
        classifications: Array.from(expected.attributes.classification.value),
        colors: Array.from(expected.attributes.COLOR_0.value)
      },
      `TypeScript LAZ streaming matches ${backend}`
    );
  }

  t.end();
});

test('LASLoader#parseInBatches split LAZ 1.4 TypeScript backend matches other backends', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 25000,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  for (const backend of LAZ_1_4_PARITY_BACKENDS) {
    const expected = await parse(arrayBuffer.slice(0), LASLoader, {
      las: {backend},
      core: {worker: false}
    });

    compareCollectedMeshAttributes(
      t,
      actual,
      {
        positions: Array.from(expected.attributes.POSITION.value),
        intensities: Array.from(expected.attributes.intensity.value),
        classifications: Array.from(expected.attributes.classification.value),
        colors: Array.from(expected.attributes.COLOR_0.value)
      },
      `split TypeScript LAZ streaming matches ${backend}`
    );
  }

  t.end();
});

test('LASLoader#parseInBatches LAZ 1.4 TypeScript backend accepts split file chunks', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASLoader, {
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 25000,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  compareCollectedMeshAttributes(
    t,
    actual,
    {
      positions: Array.from(expected.attributes.POSITION.value),
      intensities: Array.from(expected.attributes.intensity.value),
      classifications: Array.from(expected.attributes.classification.value),
      colors: Array.from(expected.attributes.COLOR_0.value)
    },
    'split file chunks match complete-buffer TypeScript parse'
  );
  t.end();
});

test('LASLoader#preload exposes parseSync only for sync-capable backends', async t => {
  const arrayBuffer = new ArrayBuffer(0);
  const copcLoader = await preload(LASLoader, {las: {backend: 'copc'}});
  const lazRsLoader = await preload(LASLoader, {las: {backend: 'laz-rs'}});
  const typeScriptLoader = await preload(LASLoader, {las: {backend: 'typescript'}});

  t.notOk(copcLoader.parseSync, 'copc backend does not expose parseSync');
  t.notOk(lazRsLoader.parseSync, 'laz-rs backend does not expose parseSync');
  t.throws(
    () => typeScriptLoader.parseSync?.(arrayBuffer, {las: {backend: 'typescript'}}),
    /invalid LAS header/,
    'typescript backend can run through parseSync'
  );
  t.end();
});

test('TypeScriptLAZ#decodes COPC chunk like laz-perf', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = await Las.PointData.decompressChunk(compressed, metadata);
  const actual = decodeLAZChunk(compressed, metadata);

  t.equal(actual.byteLength, expected.byteLength, 'decoded byte length matches');
  t.deepEqual(actual, expected, 'decoded raw point records match laz-perf');
  t.end();
});

test('TypeScriptLAZ#feedable decoder accepts split chunks', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = decodeLAZChunk(compressed, metadata);

  const singleChunkDecoder = createLAZChunkDecoder(metadata);
  singleChunkDecoder.feed(compressed);
  singleChunkDecoder.close();
  t.deepEqual(singleChunkDecoder.decode(), expected, 'single input chunk decodes the same output');

  const byteDecoder = createLAZChunkDecoder(metadata);
  for (let offset = 0; offset < compressed.byteLength; offset++) {
    byteDecoder.feed(compressed.subarray(offset, offset + 1));
  }
  byteDecoder.close();
  t.deepEqual(byteDecoder.decode(), expected, 'one-byte input chunks decode the same output');

  const decoder = createLAZChunkDecoder(metadata);
  let chunkLength = 1;
  for (let offset = 0; offset < compressed.byteLength; offset += chunkLength) {
    chunkLength = ((chunkLength * 33 + 17) % 251) + 1;
    decoder.feed(
      compressed.subarray(offset, Math.min(offset + chunkLength, compressed.byteLength))
    );
  }
  decoder.close();

  t.deepEqual(decoder.decode(), expected, 'random-sized input chunks decode the same output');
  t.end();
});

test('TypeScriptLAZ#decodeLAZChunkInBatches accepts split chunks', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = decodeLAZChunk(compressed, metadata);
  const batches: Uint8Array[] = [];

  for await (const batch of decodeLAZChunkInBatches(splitArrayBuffer(compressed, 1), metadata, {
    batchSize: 17
  })) {
    batches.push(batch);
  }

  t.deepEqual(
    concatenateUint8ArraysForTest(batches),
    expected,
    'streamed batches match decodeLAZChunk'
  );
  t.end();
});

test('TypeScriptLAZ#decodeLAZFileInBatches accepts split PDRF 3 files', async t => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches: Uint8Array[] = [];

  for await (const batch of decodeLAZFileInBatches(splitArrayBuffer(arrayBuffer, 257), {
    batchSize: 250
  })) {
    batches.push(new Uint8Array(batch.arrayBuffer));
    t.equal(batch.header.pointsFormatId, 3, 'batch header preserves point format 3');
  }

  t.equal(batches.length, 5, 'emits raw point batches');
  t.equal(
    concatenateUint8ArraysForTest(batches).byteLength,
    LAS_EXTRABYTES_POINT_COUNT * 61,
    'raw point byte length matches point record length'
  );
  t.end();
});

test('TypeScriptLAZ#decodeLAZFileInBatches rejects uncompressed LAS input', async t => {
  const response = await fetchFile(LAS_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = decodeLAZFileInBatches(splitArrayBuffer(arrayBuffer, 257));

  await t.rejects(
    async () => {
      for await (const _batch of batches) {
        _batch;
      }
    },
    /requires compressed LAZ input/,
    'decodeLAZFileInBatches requires compressed input'
  );
  t.end();
});

test('TypeScriptLAZ#cursor decodes batches smaller and larger than chunk', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = decodeLAZChunk(compressed, metadata);
  const smallBatchOutput = new Uint8Array(expected.byteLength);
  const largeBatchOutput = new Uint8Array(expected.byteLength);
  const pointByteLength = metadata.pointDataRecordLength;

  const smallBatchCursor = createLAZChunkDecoderCursor(compressed, metadata);
  let smallBatchPointOffset = 0;
  while (smallBatchCursor.remainingPointCount > 0) {
    const pointsDecoded = smallBatchCursor.decodeInto(
      smallBatchOutput,
      smallBatchPointOffset * pointByteLength,
      17
    );
    smallBatchPointOffset += pointsDecoded;
  }

  const largeBatchCursor = createLAZChunkDecoderCursor(compressed, metadata);
  const largeBatchPointsDecoded = largeBatchCursor.decodeInto(
    largeBatchOutput,
    0,
    metadata.pointCount * 2
  );

  t.equal(smallBatchPointOffset, metadata.pointCount, 'small batches decode every point');
  t.equal(largeBatchPointsDecoded, metadata.pointCount, 'large batch stops at chunk point count');
  t.deepEqual(smallBatchOutput, expected, 'small direct batches match decodeLAZChunk');
  t.deepEqual(largeBatchOutput, expected, 'large direct batch matches decodeLAZChunk');
  t.end();
});

test('TypeScriptLAZ#decodes single-point legacy point format 0 chunk', t => {
  const expected = createPointFormat0Record();
  const compressed = new Uint8Array(expected.byteLength + 4);
  compressed.set(expected);

  const actual = decodeLAZChunk(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 0,
    pointDataRecordLength: expected.byteLength
  });

  t.deepEqual(actual, expected, 'point format 0 first point is preserved');
  t.end();
});

test('TypeScriptLAZ#decodes single-point legacy point format 1 chunk', t => {
  const expected = new Uint8Array(28);
  expected.set(createPointFormat0Record());
  const dataView = new DataView(expected.buffer, expected.byteOffset, expected.byteLength);
  dataView.setFloat64(20, 12345.25, true);
  const compressed = new Uint8Array(expected.byteLength + 4);
  compressed.set(expected);

  const actual = decodeLAZChunk(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 1,
    pointDataRecordLength: expected.byteLength
  });

  t.deepEqual(actual, expected, 'point format 1 first point and GPS time are preserved');
  t.end();
});

test('TypeScriptLAZ#decodes single-point legacy point format 2 chunk', t => {
  const expected = new Uint8Array(26);
  expected.set(createPointFormat0Record());
  const dataView = new DataView(expected.buffer, expected.byteOffset, expected.byteLength);
  dataView.setUint16(20, 257, true);
  dataView.setUint16(22, 1025, true);
  dataView.setUint16(24, 4097, true);
  const compressed = new Uint8Array(expected.byteLength + 4);
  compressed.set(expected);

  const actual = decodeLAZChunk(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 2,
    pointDataRecordLength: expected.byteLength
  });

  t.deepEqual(actual, expected, 'point format 2 first point and RGB are preserved');
  t.end();
});

test('TypeScriptLAZ#decodes single-point legacy point format 3 chunk', t => {
  const expected = new Uint8Array(34);
  expected.set(createPointFormat0Record());
  const dataView = new DataView(expected.buffer, expected.byteOffset, expected.byteLength);
  dataView.setFloat64(20, 12345.25, true);
  dataView.setUint16(28, 257, true);
  dataView.setUint16(30, 1025, true);
  dataView.setUint16(32, 4097, true);
  const compressed = new Uint8Array(expected.byteLength + 4);
  compressed.set(expected);

  const actual = decodeLAZChunk(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 3,
    pointDataRecordLength: expected.byteLength
  });

  t.deepEqual(actual, expected, 'point format 3 first point, GPS time, and RGB are preserved');
  t.end();
});

test('TypeScriptLAZ#feedable decoder reports missing data', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const decoder = createLAZChunkDecoder(metadata);
  decoder.feed(compressed.subarray(0, Math.max(0, compressed.byteLength - 1)));
  decoder.close();

  t.throws(() => decoder.decode(), NeedsMoreData, 'truncated input reports NeedsMoreData');
  t.end();
});

test('TypeScriptLAZ#rejects unsupported point format', t => {
  t.throws(
    () =>
      decodeLAZChunk(new Uint8Array(0), {
        pointCount: 1,
        pointDataRecordFormat: 4,
        pointDataRecordLength: 57
      }),
    /does not support point format 4/,
    'unsupported point formats fail clearly'
  );
  t.end();
});

test('TypeScriptLAZ#encoder API reports unimplemented LAZ encoding', t => {
  const metadata = {
    pointCount: 1,
    pointDataRecordFormat: 0,
    pointDataRecordLength: 20
  };
  t.throws(
    () => encodeLAZChunk(new Uint8Array(20), metadata),
    /not implemented yet/,
    'complete-buffer encoder reports unimplemented LAZ encoding'
  );

  const encoder = createLAZChunkEncoder(metadata);
  encoder.feed(new Uint8Array(10).subarray(2, 8));
  t.throws(
    () => encoder.encode(),
    /input is not closed/,
    'feedable encoder requires close before encode'
  );
  encoder.close();
  t.throws(
    () => encoder.feed(new Uint8Array(1)),
    /closed LAZ chunk encoder/,
    'closed feedable encoder rejects more input'
  );
  t.throws(
    () => encoder.encode(),
    /not implemented yet/,
    'feedable encoder reports unimplemented LAZ encoding'
  );
  t.end();
});

test('LASLoader#options', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {fp64: false},
    core: {worker: false}
  });
  t.ok(
    data.attributes.POSITION.value instanceof Float32Array,
    'POSITION attribute is Float32Array'
  );

  const data64 = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {fp64: true},
    core: {worker: false}
  });
  t.ok(
    data64.attributes.POSITION.value instanceof Float64Array,
    'POSITION attribute is Float64Array'
  );

  t.end();
});

test('LASWorker#parse(binary) extra bytes', async t => {
  const data = await parse(fetchFile(LAS_EXTRABYTES_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(
    data.attributes.POSITION.value.length,
    LAS_EXTRABYTES_POINT_COUNT * 3,
    'POSITION attribute was found'
  );

  t.end();
});

test('LASWorkerLoader#load(worker)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader);
  validateMeshCategoryData(t, data);

  t.equal(
    data.attributes.POSITION.value.length,
    LAS_POINT_COUNT * 3,
    'POSITION attribute was found'
  );
  t.end();
});

test('LASLoader#shape="mesh"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {shape: 'mesh'}});
  validateMeshCategoryData(t, result);
  t.end();
});

// Related code was commented due to breaking pointcloud example on the website
test.skip('LASLoader#shape="columnar-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'columnar-table'}
  });
  validateTableCategoryData(t, result);
  t.end();
});

async function getCOPCRootChunk() {
  const copc = await Copc.create(COPC_BINARY_URL);
  const hierarchy = await Copc.loadHierarchyPage(COPC_BINARY_URL, copc.info.rootHierarchyPage);
  const node = hierarchy.nodes['0-0-0-0'];
  if (!node) {
    throw new Error('COPC root node not found');
  }
  const compressed = await Copc.loadCompressedPointDataBuffer(COPC_BINARY_URL, node);

  return {
    compressed,
    metadata: {
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    }
  };
}

function compareMeshAttributes(t, actual: any, expected: any, label: string): void {
  t.deepEqual(
    Array.from(actual.attributes.POSITION.value),
    Array.from(expected.attributes.POSITION.value),
    `${label}: positions`
  );
  t.deepEqual(
    Array.from(actual.attributes.intensity.value),
    Array.from(expected.attributes.intensity.value),
    `${label}: intensities`
  );
  t.deepEqual(
    Array.from(actual.attributes.classification.value),
    Array.from(expected.attributes.classification.value),
    `${label}: classifications`
  );
  t.deepEqual(
    Array.from(actual.attributes.COLOR_0?.value || []),
    Array.from(expected.attributes.COLOR_0?.value || []),
    `${label}: colors`
  );
}

async function collectMeshAttributes(batches: AsyncIterable<any>) {
  const positions: number[] = [];
  const intensities: number[] = [];
  const classifications: number[] = [];
  const colors: number[] = [];

  for await (const batch of batches) {
    positions.push(...batch.attributes.POSITION.value);
    intensities.push(...batch.attributes.intensity.value);
    classifications.push(...batch.attributes.classification.value);
    colors.push(...(batch.attributes.COLOR_0?.value || []));
  }

  return {positions, intensities, classifications, colors};
}

function compareCollectedMeshAttributes(
  t,
  actual: Awaited<ReturnType<typeof collectMeshAttributes>>,
  expected: Awaited<ReturnType<typeof collectMeshAttributes>>,
  label: string
): void {
  t.deepEqual(actual.positions, expected.positions, `${label}: positions`);
  t.deepEqual(actual.intensities, expected.intensities, `${label}: intensities`);
  t.deepEqual(actual.classifications, expected.classifications, `${label}: classifications`);
  t.deepEqual(actual.colors, expected.colors, `${label}: colors`);
}

async function* splitArrayBuffer(
  arrayBuffer: ArrayBuffer | Uint8Array,
  chunkSize: number
): AsyncIterable<ArrayBuffer> {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    yield bytes.slice(offset, Math.min(offset + chunkSize, bytes.byteLength)).buffer;
  }
}

function concatenateUint8ArraysForTest(chunks: Uint8Array[]): Uint8Array {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function createPointFormat0Record(): Uint8Array {
  const record = new Uint8Array(20);
  const dataView = new DataView(record.buffer, record.byteOffset, record.byteLength);
  dataView.setInt32(0, 123456, true);
  dataView.setInt32(4, -234567, true);
  dataView.setInt32(8, 345678, true);
  dataView.setUint16(12, 321, true);
  dataView.setUint8(14, 0b00010001);
  dataView.setUint8(15, 2);
  dataView.setInt8(16, -12);
  dataView.setUint8(17, 7);
  dataView.setUint16(18, 99, true);
  return record;
}

test('LASLoader#shape="arrow-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table'},
    core: {worker: false}
  });
  t.equal(result.shape, 'arrow-table', 'returns Arrow table shape');
  t.ok(result.data.getChild('POSITION'), 'returns POSITION column');
  t.end();
});
