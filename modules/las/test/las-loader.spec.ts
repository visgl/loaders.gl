// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'test/utils/vitest-tape';
import {
  validateLoader,
  validateMeshCategoryData,
  validateTableCategoryData
} from 'test/common/conformance';

import {
  LASCOPCLoader,
  LASLoader,
  LASWorkerLoader,
  LAZPerfLoader,
  LAZRsLoader
} from '@loaders.gl/las';
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
import {createLAZChunkDecoderCursor, decodeLAZChunkTable} from '@loaders.gl/loader-utils';
import {LASCOPCLoaderWithParser} from '../src/las-copc-loader';
import {LAZPerfLoaderWithParser} from '../src/lazperf-loader';
import {LAZRsLoaderWithParser} from '../src/laz-rs-loader';
import {LASLoaderWithParser} from '../src/las-loader';
// import {ArrowLoader} from '@loaders.gl/arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAS_EXTRABYTES_BINARY_URL = '@loaders.gl/las/test/data/extrabytes.laz';
const LAS_POINT_COUNT = 808042;
const LAS_EXTRABYTES_POINT_COUNT = 1065;
const LAZ_1_4_POINT_COUNT = 100000;
const VARIABLE_LAZ_1_4_POINT_COUNT = 100000;
const LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/points-1.4.las';
const LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/ellipsoid-1.4.laz';
const PDRF_4_LAS_1_3_BINARY_URL = '@loaders.gl/las/test/data/pdrf4-1.3.las';
const PDRF_4_LAZ_1_3_BINARY_URL = '@loaders.gl/las/test/data/pdrf4-1.3.laz';
const PDRF_5_LAS_1_3_BINARY_URL = '@loaders.gl/las/test/data/pdrf5-1.3.las';
const PDRF_5_LAZ_1_3_BINARY_URL = '@loaders.gl/las/test/data/pdrf5-1.3.laz';
const PDRF_6_LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf6-1.4.las';
const PDRF_6_LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf6-1.4.laz';
const PDRF_7_V4_LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf7-v4-1.4.las';
const PDRF_7_V4_LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf7-v4-1.4.laz';
const PDRF_8_LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf8-1.4.las';
const PDRF_8_LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf8-1.4.laz';
const PDRF_9_LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf9-1.4.las';
const PDRF_9_LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf9-1.4.laz';
const PDRF_9_LAS_1_5_BINARY_URL = '@loaders.gl/las/test/data/pdrf9-1.5.las';
const PDRF_9_LAZ_1_5_BINARY_URL = '@loaders.gl/las/test/data/pdrf9-1.5.laz';
const PDRF_10_LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf10-1.4.las';
const PDRF_10_LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/pdrf10-1.4.laz';
const PDRF_10_LAS_1_5_BINARY_URL = '@loaders.gl/las/test/data/pdrf10-1.5.las';
const PDRF_10_LAZ_1_5_BINARY_URL = '@loaders.gl/las/test/data/pdrf10-1.5.laz';
const COPC_BINARY_URL = 'modules/copc/test/data/ellipsoid.copc.laz';
const LAZ_1_4_PARITY_VARIANTS = [
  {name: 'COPC', loader: LASCOPCLoader},
  {name: 'laz-rs', loader: LAZRsLoader}
] as const;

setLoaderOptions({
  _workerType: 'test'
});

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  validateLoader(t, LAZPerfLoader, 'LAZPerfLoader');
  validateLoader(t, LASCOPCLoader, 'LASCOPCLoader');
  validateLoader(t, LAZRsLoader, 'LAZRsLoader');
  t.end();
});

test('LASLoader#removed Arrow variant exports are absent', t => {
  t.notOk('LASArrowLoader' in las, 'root does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in bundledLas, 'bundled does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in unbundledLas, 'unbundled does not export LASArrowLoader');
  t.end();
});

test('LAS loader variants preload explicit parser implementations', async t => {
  t.equal(
    await preload(LASLoader),
    LASLoaderWithParser,
    'primary loader resolves TypeScript parser'
  );
  t.equal(
    await preload(LAZPerfLoader),
    LAZPerfLoaderWithParser,
    'laz-perf variant resolves laz-perf parser'
  );
  t.equal(
    await preload(LASCOPCLoader),
    LASCOPCLoaderWithParser,
    'COPC variant resolves COPC parser'
  );
  t.equal(
    await preload(LAZRsLoader),
    LAZRsLoaderWithParser,
    'laz-rs variant resolves laz-rs parser'
  );
  t.ok(LASLoaderWithParser.worker, 'primary TypeScript variant uses the packaged worker');
  t.notOk(LAZPerfLoaderWithParser.worker, 'laz-perf variant defaults to the main thread');
  t.notOk(LASCOPCLoaderWithParser.worker, 'COPC variant defaults to the main thread');
  t.notOk(LAZRsLoaderWithParser.worker, 'laz-rs variant defaults to the main thread');
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

test('LAS loader variants parseInBatches', async t => {
  for (const {name, loader} of [
    {name: 'TypeScript', loader: LASLoader},
    {name: 'laz-perf', loader: LAZPerfLoader},
    {name: 'COPC', loader: LASCOPCLoader},
    {name: 'laz-rs', loader: LAZRsLoader}
  ]) {
    const response = await fetchFile(LAS_BINARY_URL);
    const batches = await parseInBatches(makeIterator(response), loader, {
      batchSize: 30000,
      core: {worker: false}
    });
    let totalVertexCount = 0;

    for await (const batch of batches as AsyncIterable<any>) {
      totalVertexCount += batch.header.vertexCount;
    }

    t.equal(totalVertexCount, LAS_POINT_COUNT, `${name} loader variant emits all points`);
  }

  t.end();
});

test('LAS loader variants return Arrow tables', async t => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();

  for (const {name, loader} of [
    {name: 'laz-perf', loader: LAZPerfLoader},
    {name: 'COPC', loader: LASCOPCLoader},
    {name: 'laz-rs', loader: LAZRsLoader}
  ]) {
    const table = await parse(arrayBuffer.slice(0), loader, {
      core: {worker: false},
      las: {shape: 'arrow-table'}
    });
    t.equal(table.shape, 'arrow-table', `${name} variant returns an Arrow table`);
    t.equal(table.data.numRows, LAS_EXTRABYTES_POINT_COUNT, `${name} variant returns every point`);
  }

  const syncTable = LAZPerfLoaderWithParser.parseSync(arrayBuffer, {
    las: {shape: 'arrow-table'}
  });
  t.equal(syncTable.shape, 'arrow-table', 'laz-perf parseSync returns an Arrow table');
  t.equal(
    syncTable.data.numRows,
    LAS_EXTRABYTES_POINT_COUNT,
    'laz-perf parseSync returns every point'
  );
  t.end();
});

test('LASLoader#parse LAZ 1.2 PDRF 3 matches laz-rs variant', async t => {
  const expected = await parse(fetchFile(LAS_BINARY_URL), LAZRsLoader, {
    core: {worker: false}
  });
  const actual = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, actual);

  t.equal(actual.loaderData.versionAsString, '1.2', 'fixture is LAS 1.2');
  t.equal(actual.loaderData.pointsFormatId, 3, 'fixture uses point format 3');
  t.equal(actual.header.vertexCount, LAS_POINT_COUNT, 'fixture point count is expected');
  compareMeshAttributes(t, actual, expected, 'TypeScript LAZ PDRF 3 parse matches laz-rs');
  t.end();
}, 30000);

test('LASLoader#parseInBatches split LAZ 1.2 PDRF 3 matches laz-rs variant', async t => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LAZRsLoader, {
    core: {worker: false}
  });
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 250,
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
}, 30000);

test('LASLoader#parseInBatches emits legacy LAZ rows before input ends', async t => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  let consumedByteLength = 0;
  const batches = await parseInBatches(
    splitArrayBuffer(arrayBuffer, 257, byteLength => {
      consumedByteLength += byteLength;
    }),
    LASLoader,
    {
      batchSize: 250,
      core: {worker: false}
    }
  );
  let batchCount = 0;
  let pointCount = 0;
  let firstBatchConsumedByteLength = 0;

  for await (const batch of batches as AsyncIterable<any>) {
    if (batchCount === 0) {
      firstBatchConsumedByteLength = consumedByteLength;
    }
    batchCount++;
    pointCount += batch.header.vertexCount;
  }

  t.ok(batchCount > 1, 'fixture emits multiple batches');
  t.equal(pointCount, LAS_EXTRABYTES_POINT_COUNT, 'stream emits every point once');
  t.ok(
    firstBatchConsumedByteLength < arrayBuffer.byteLength,
    `first batch emitted after ${firstBatchConsumedByteLength} of ${arrayBuffer.byteLength} bytes`
  );
  t.end();
}, 30000);

for (const fixture of [
  {
    pointDataRecordFormat: 4,
    pointDataRecordLength: 61,
    lasUrl: PDRF_4_LAS_1_3_BINARY_URL,
    lazUrl: PDRF_4_LAZ_1_3_BINARY_URL
  },
  {
    pointDataRecordFormat: 5,
    pointDataRecordLength: 67,
    lasUrl: PDRF_5_LAS_1_3_BINARY_URL,
    lazUrl: PDRF_5_LAZ_1_3_BINARY_URL
  }
]) {
  const label = `PDRF ${fixture.pointDataRecordFormat}`;

  test(`TypeScriptLAZ#raw LAS 1.3 ${label} output matches uncompressed records`, async t => {
    const lasArrayBuffer = await (await fetchFile(fixture.lasUrl)).arrayBuffer();
    const lazArrayBuffer = await (await fetchFile(fixture.lazUrl)).arrayBuffer();
    const batches: Uint8Array[] = [];

    for await (const batch of decodeLAZFileInBatches(splitArrayBuffer(lazArrayBuffer, 257), {
      batchSize: 127
    })) {
      batches.push(new Uint8Array(batch.arrayBuffer));
    }

    const pointDataOffset = new DataView(lasArrayBuffer).getUint32(96, true);
    const expected = new Uint8Array(
      lasArrayBuffer,
      pointDataOffset,
      1024 * fixture.pointDataRecordLength
    );
    t.deepEqual(
      concatenateUint8ArraysForTest(batches),
      expected,
      `${label} preserves every point byte`
    );
    const waveformByteOffset = fixture.pointDataRecordFormat === 4 ? 29 : 35;
    const waveformOffset = new DataView(
      expected.buffer,
      expected.byteOffset,
      expected.byteLength
    ).getBigUint64(waveformByteOffset, true);
    t.ok(
      waveformOffset > BigInt(Number.MAX_SAFE_INTEGER),
      `${label} preserves waveform offsets beyond Number.MAX_SAFE_INTEGER`
    );
    t.end();
  });

  test(`LASLoader#parse and split streaming LAS 1.3 ${label} match uncompressed LAS`, async t => {
    const lasArrayBuffer = await (await fetchFile(fixture.lasUrl)).arrayBuffer();
    const lazArrayBuffer = await (await fetchFile(fixture.lazUrl)).arrayBuffer();
    // Bundled laz-rs rejects WavePacket13 item type 9; the raw test above uses current LASzip's
    // byte-exact round-trip as the codec oracle.
    const expected = await parse(lasArrayBuffer, LASLoader, {core: {worker: false}});
    const actual = await parse(lazArrayBuffer.slice(0), LASLoader, {
      core: {worker: false}
    });
    const batches = await parseInBatches(splitArrayBuffer(lazArrayBuffer, 257), LASLoader, {
      batchSize: 127,
      core: {worker: false}
    });
    const streamed = await collectMeshAttributes(batches as AsyncIterable<any>);

    t.equal(actual.loaderData.versionAsString, '1.3', `${label} fixture is LAS 1.3`);
    t.equal(
      actual.loaderData.pointsFormatId,
      fixture.pointDataRecordFormat,
      `${label} fixture has the expected point format`
    );
    compareMeshAttributes(t, actual, expected, `${label} TypeScript LAZ matches uncompressed LAS`);
    compareCollectedMeshAttributes(
      t,
      streamed,
      {
        positions: Array.from(expected.attributes.POSITION.value),
        intensities: Array.from(expected.attributes.intensity.value),
        classifications: Array.from(expected.attributes.classification.value),
        colors: Array.from(expected.attributes.COLOR_0?.value || [])
      },
      `${label} TypeScript streaming matches uncompressed LAS`
    );
    t.end();
  });
}

test('LASCOPCLoader#parse LAS 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 3, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parse LAS 1.4 fixture matches COPC variant', async t => {
  const expected = await parse(fetchFile(LAS_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 3, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  compareMeshAttributes(t, data, expected, 'TypeScript variant matches COPC variant');
  t.end();
});

test('LASLoader#parseInBatches matches COPC variant', async t => {
  const expected = await parse(fetchFile(LAS_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  const response = await fetchFile(LAS_1_4_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 2,
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

test('LASCOPCLoader#parse LAZ 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, LAZ_1_4_POINT_COUNT, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parse LAZ 1.4 matches other loader variants', async t => {
  const actual = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, actual);

  for (const {name, loader} of LAZ_1_4_PARITY_VARIANTS) {
    const expected = await parse(fetchFile(LAZ_1_4_BINARY_URL), loader, {
      core: {worker: false}
    });

    t.equal(
      actual.header.vertexCount,
      expected.header.vertexCount,
      `TypeScript LAZ point count matches ${name}`
    );
    compareMeshAttributes(t, actual, expected, `TypeScript LAZ parse matches ${name}`);
  }

  t.end();
});

test('LASLoader#parseInBatches LAZ 1.4 fixture', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  for (const {name, loader} of LAZ_1_4_PARITY_VARIANTS) {
    const expected = await parse(fetchFile(LAZ_1_4_BINARY_URL), loader, {
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
      `TypeScript LAZ streaming matches ${name}`
    );
  }

  t.end();
});

test('LASLoader#parseInBatches split LAZ 1.4 matches other loader variants', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 25000,
    core: {worker: false}
  });
  const actual = await collectMeshAttributes(batches as AsyncIterable<any>);

  for (const {name, loader} of LAZ_1_4_PARITY_VARIANTS) {
    const expected = await parse(arrayBuffer.slice(0), loader, {
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
      `split TypeScript LAZ streaming matches ${name}`
    );
  }

  t.end();
});

test('LASLoader#parseInBatches LAZ 1.4 accepts split file chunks', async t => {
  const response = await fetchFile(LAZ_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASLoader, {
    core: {worker: false}
  });
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 25000,
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

for (const fixture of [
  {
    version: '1.4',
    pointDataRecordFormat: 6,
    pointDataRecordLength: 34,
    lasUrl: PDRF_6_LAS_1_4_BINARY_URL,
    lazUrl: PDRF_6_LAZ_1_4_BINARY_URL,
    parityVariants: [{name: 'COPC', loader: LASCOPCLoader}] as const
  },
  {
    version: '1.4',
    pointDataRecordFormat: 7,
    pointDataRecordLength: 40,
    lasUrl: PDRF_7_V4_LAS_1_4_BINARY_URL,
    lazUrl: PDRF_7_V4_LAZ_1_4_BINARY_URL,
    expectedItemVersions: [
      [10, 4],
      [11, 4],
      [14, 4]
    ] as const,
    exercisesAllScannerChannels: true,
    // COPC misdecodes RGB v4 after scanner-channel changes; bundled laz-rs rejects v4 on open.
    parityVariants: [] as const
  },
  {
    version: '1.4',
    pointDataRecordFormat: 8,
    pointDataRecordLength: 42,
    lasUrl: PDRF_8_LAS_1_4_BINARY_URL,
    lazUrl: PDRF_8_LAZ_1_4_BINARY_URL,
    // The laz-rs wrapper currently fails while closing LAS 1.4 files with Extra Bytes.
    parityVariants: [{name: 'COPC', loader: LASCOPCLoader}] as const
  },
  {
    version: '1.4',
    pointDataRecordFormat: 9,
    pointDataRecordLength: 63,
    lasUrl: PDRF_9_LAS_1_4_BINARY_URL,
    lazUrl: PDRF_9_LAZ_1_4_BINARY_URL,
    // Bundled laz-rs uses laz 0.5.2 and rejects WavePacket14; laz-perf does not implement it.
    parityVariants: [] as const
  },
  {
    version: '1.4',
    pointDataRecordFormat: 10,
    pointDataRecordLength: 71,
    lasUrl: PDRF_10_LAS_1_4_BINARY_URL,
    lazUrl: PDRF_10_LAZ_1_4_BINARY_URL,
    // Bundled laz-rs uses laz 0.5.2 and rejects WavePacket14; laz-perf does not implement it.
    parityVariants: [] as const
  },
  {
    version: '1.5',
    pointDataRecordFormat: 9,
    pointDataRecordLength: 63,
    lasUrl: PDRF_9_LAS_1_5_BINARY_URL,
    lazUrl: PDRF_9_LAZ_1_5_BINARY_URL,
    expectedItemVersions: [
      [10, 4],
      [13, 4],
      [14, 4]
    ] as const,
    exercisesAllScannerChannels: true,
    // LASzip WavePacket14 v4 fixes context switching; bundled variants do not support it.
    parityVariants: [] as const
  },
  {
    version: '1.5',
    pointDataRecordFormat: 10,
    pointDataRecordLength: 71,
    lasUrl: PDRF_10_LAS_1_5_BINARY_URL,
    lazUrl: PDRF_10_LAZ_1_5_BINARY_URL,
    expectedItemVersions: [
      [10, 4],
      [12, 4],
      [13, 4],
      [14, 4]
    ] as const,
    exercisesAllScannerChannels: true,
    // LASzip WavePacket14 v4 fixes context switching; bundled variants do not support it.
    parityVariants: [] as const
  }
]) {
  const label = `PDRF ${fixture.pointDataRecordFormat}`;

  test(`TypeScriptLAZ#raw LAS ${fixture.version} ${label} output matches uncompressed records`, async t => {
    const lasArrayBuffer = await (await fetchFile(fixture.lasUrl)).arrayBuffer();
    const lazArrayBuffer = await (await fetchFile(fixture.lazUrl)).arrayBuffer();
    const batches: Uint8Array[] = [];

    if ('expectedItemVersions' in fixture) {
      const lazDataView = new DataView(lazArrayBuffer);
      for (const [itemType, expectedVersion] of fixture.expectedItemVersions) {
        const itemVersionOffset = findLASZipItemVersionOffset(lazArrayBuffer, itemType);
        t.equal(
          lazDataView.getUint16(itemVersionOffset, true),
          expectedVersion,
          `${label} LASzip item ${itemType} uses version ${expectedVersion}`
        );
      }
    }

    for await (const batch of decodeLAZFileInBatches(splitArrayBuffer(lazArrayBuffer, 257), {
      batchSize: 127
    })) {
      t.equal(
        batch.header.pointsFormatId,
        fixture.pointDataRecordFormat,
        `${label} header preserves point format`
      );
      batches.push(new Uint8Array(batch.arrayBuffer));
    }

    const lasDataView = new DataView(lasArrayBuffer);
    const pointDataOffset = lasDataView.getUint32(96, true);
    const expected = new Uint8Array(
      lasArrayBuffer,
      pointDataOffset,
      1024 * fixture.pointDataRecordLength
    );
    t.deepEqual(
      concatenateUint8ArraysForTest(batches),
      expected,
      `${label} preserves every point byte`
    );
    if (fixture.pointDataRecordFormat >= 9) {
      const waveformByteOffset = fixture.pointDataRecordFormat === 9 ? 31 : 39;
      const waveformOffset = new DataView(
        expected.buffer,
        expected.byteOffset,
        expected.byteLength
      ).getBigUint64(waveformByteOffset, true);
      t.ok(
        waveformOffset > BigInt(Number.MAX_SAFE_INTEGER),
        `${label} preserves waveform offsets beyond Number.MAX_SAFE_INTEGER`
      );
    }
    if ('exercisesAllScannerChannels' in fixture && fixture.exercisesAllScannerChannels) {
      const scannerChannels = new Set<number>();
      for (let pointIndex = 0; pointIndex < 1024; pointIndex++) {
        scannerChannels.add((expected[pointIndex * fixture.pointDataRecordLength + 15] >> 4) & 3);
      }
      t.deepEqual(
        Array.from(scannerChannels).sort(),
        [0, 1, 2, 3],
        `${label} exercises all LASzip v4 scanner-channel contexts`
      );
    }
    t.end();
  });

  test(`LASLoader#parse and split streaming LAS ${fixture.version} ${label} preserve Arrow output`, async t => {
    const lasArrayBuffer = await (await fetchFile(fixture.lasUrl)).arrayBuffer();
    const lazArrayBuffer = await (await fetchFile(fixture.lazUrl)).arrayBuffer();
    const expected = await parse(lasArrayBuffer, LASLoader, {core: {worker: false}});
    const actual = await parse(lazArrayBuffer.slice(0), LASLoader, {
      core: {worker: false}
    });
    const batches = await parseInBatches(splitArrayBuffer(lazArrayBuffer, 257), LASLoader, {
      batchSize: 127,
      core: {worker: false}
    });
    const streamed = await collectMeshAttributes(batches as AsyncIterable<any>);

    t.equal(
      actual.loaderData.versionAsString,
      fixture.version,
      `${label} fixture is LAS ${fixture.version}`
    );
    t.equal(
      actual.loaderData.pointsFormatId,
      fixture.pointDataRecordFormat,
      `${label} fixture has the expected point format`
    );
    t.equal(actual.header.vertexCount, 1024, `${label} fixture has 1,024 points`);
    compareMeshAttributes(t, actual, expected, `${label} TypeScript LAZ matches uncompressed LAS`);

    compareCollectedMeshAttributes(
      t,
      streamed,
      {
        positions: Array.from(expected.attributes.POSITION.value),
        intensities: Array.from(expected.attributes.intensity.value),
        classifications: Array.from(expected.attributes.classification.value),
        colors: Array.from(expected.attributes.COLOR_0?.value || [])
      },
      `${label} TypeScript streaming matches uncompressed LAS`
    );

    for (const {name, loader} of fixture.parityVariants) {
      const expected = await parse(lazArrayBuffer.slice(0), loader, {
        core: {worker: false}
      });
      compareMeshAttributes(t, actual, expected, `${label} TypeScript parse matches ${name}`);
      compareCollectedMeshAttributes(
        t,
        streamed,
        {
          positions: Array.from(expected.attributes.POSITION.value),
          intensities: Array.from(expected.attributes.intensity.value),
          classifications: Array.from(expected.attributes.classification.value),
          colors: Array.from(expected.attributes.COLOR_0?.value || [])
        },
        `${label} TypeScript streaming matches ${name}`
      );
    }
    t.end();
  });
}

test('LASLoader#TypeScript rejects unsupported LASzip item versions', async t => {
  for (const fixture of [
    {
      url: PDRF_4_LAZ_1_3_BINARY_URL,
      itemType: 6,
      invalidVersion: 1,
      error: /unsupported legacy LASzip item type 6 version 1/,
      label: 'Point10'
    },
    {
      url: PDRF_4_LAZ_1_3_BINARY_URL,
      itemType: 9,
      invalidVersion: 2,
      error: /unsupported WavePacket13 item version 2/,
      label: 'WavePacket13'
    },
    {
      url: PDRF_10_LAZ_1_5_BINARY_URL,
      itemType: 13,
      invalidVersion: 5,
      error: /unsupported WavePacket14 item version 5/,
      label: 'WavePacket14'
    }
  ]) {
    const lazArrayBuffer = await (await fetchFile(fixture.url)).arrayBuffer();
    const corrupted = lazArrayBuffer.slice(0);
    const itemVersionOffset = findLASZipItemVersionOffset(corrupted, fixture.itemType);
    new DataView(corrupted).setUint16(itemVersionOffset, fixture.invalidVersion, true);

    await t.rejects(
      parse(corrupted, LASLoader, {
        core: {worker: false}
      }),
      fixture.error,
      `unsupported ${fixture.label} versions fail before point decoding`
    );
  }
  t.end();
});

test('LASLoader#TypeScript rejects incompatible LASzip item layouts', async t => {
  const source = await (await fetchFile(PDRF_7_V4_LAZ_1_4_BINARY_URL)).arrayBuffer();
  for (const fixture of [
    {
      mutate: (arrayBuffer: ArrayBuffer) => {
        const dataOffset = findLASZipVLRDataOffset(arrayBuffer);
        new DataView(arrayBuffer).setUint16(dataOffset + 2, 1, true);
      },
      error: /requires LASzip arithmetic coder 0; received 1/,
      label: 'unsupported coder'
    },
    {
      mutate: (arrayBuffer: ArrayBuffer) => {
        const itemOffset = findLASZipItemOffset(arrayBuffer, 11);
        new DataView(arrayBuffer).setUint16(itemOffset, 12, true);
      },
      error: /LASzip item 1 has type 12; expected 11 for point format 7/,
      label: 'wrong item type'
    },
    {
      mutate: (arrayBuffer: ArrayBuffer) => {
        const itemOffset = findLASZipItemOffset(arrayBuffer, 14);
        new DataView(arrayBuffer).setUint16(itemOffset + 2, 3, true);
      },
      error: /LASzip item 2 has size 3; expected 4 for point format 7/,
      label: 'wrong item size'
    },
    {
      mutate: (arrayBuffer: ArrayBuffer) => {
        const dataOffset = findLASZipVLRDataOffset(arrayBuffer);
        new DataView(arrayBuffer).setUint16(dataOffset + 32, 2, true);
      },
      error: /point format 7 has 2 LASzip items; expected 3/,
      label: 'missing item'
    }
  ]) {
    const corrupted = source.slice(0);
    fixture.mutate(corrupted);
    await t.rejects(
      parse(corrupted, LASLoader, {
        core: {worker: false}
      }),
      fixture.error,
      fixture.label
    );
  }
  t.end();
});

test('TypeScriptLAZ#PDRF 8 cursor preserves one complete fixed-size chunk', async t => {
  const lasArrayBuffer = await (await fetchFile(PDRF_8_LAS_1_4_BINARY_URL)).arrayBuffer();
  const lazArrayBuffer = await (await fetchFile(PDRF_8_LAZ_1_4_BINARY_URL)).arrayBuffer();
  const lazDataView = new DataView(lazArrayBuffer);
  const pointDataOffset = lazDataView.getUint32(96, true);
  const pointDataRecordLength = lazDataView.getUint16(105, true);
  const sizeHeaderCount = 11 + (pointDataRecordLength - 38);
  let chunkByteLength = pointDataRecordLength + 4 + sizeHeaderCount * 4;
  for (let index = 0; index < sizeHeaderCount; index++) {
    chunkByteLength += lazDataView.getUint32(
      pointDataOffset + 8 + pointDataRecordLength + 4 + index * 4,
      true
    );
  }
  const compressed = new Uint8Array(lazArrayBuffer, pointDataOffset + 8, chunkByteLength);
  const cursor = createLAZChunkDecoderCursor(compressed, {
    pointCount: 256,
    pointDataRecordFormat: 8,
    pointDataRecordLength
  });
  const actual = new Uint8Array(256 * pointDataRecordLength);
  const pointsDecoded = cursor.decodeInto(actual, 0, 256);

  const lasDataView = new DataView(lasArrayBuffer);
  const expected = new Uint8Array(
    lasArrayBuffer,
    lasDataView.getUint32(96, true),
    actual.byteLength
  );
  t.equal(pointsDecoded, 256, 'raw cursor decodes every point in the chunk');
  t.deepEqual(actual, expected, 'raw PDRF 8 chunk matches uncompressed records');
  t.end();
});

test('LASLoader#parse variable-chunk LAZ 1.4 matches COPC variant', async t => {
  const response = await fetchFile(COPC_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });
  const actual = await parse(arrayBuffer.slice(0), LASLoader, {
    core: {worker: false}
  });

  t.equal(actual.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(actual.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(
    actual.header.vertexCount,
    VARIABLE_LAZ_1_4_POINT_COUNT,
    'variable chunks contain every point'
  );
  compareMeshAttributes(t, actual, expected, 'variable-chunk TypeScript parse matches COPC');
  t.end();
}, 15000);

test('TypeScriptLAZ#decodes the COPC variable chunk table', async t => {
  const response = await fetchFile(COPC_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = Number(dataView.getBigUint64(pointDataOffset, true));
  const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
  const chunks = decodeLAZChunkTable(bytes.subarray(chunkTableOffset + 8), {
    chunkCount,
    pointCount: VARIABLE_LAZ_1_4_POINT_COUNT,
    chunkSize: 0xffffffff,
    variable: true
  });

  t.equal(chunks.length, 5, 'fixture contains five variable-size chunks');
  t.equal(
    chunks.reduce((pointCount, chunk) => pointCount + chunk.pointCount, 0),
    VARIABLE_LAZ_1_4_POINT_COUNT,
    'chunk point counts cover the file'
  );
  t.equal(
    chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
    chunkTableOffset - pointDataOffset - 8,
    'chunk byte lengths reach the chunk table exactly'
  );
  t.end();
});

test('LASLoader#parseInBatches split variable-chunk LAZ 1.4 matches COPC', async t => {
  const response = await fetchFile(COPC_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });
  const batches = await parseInBatches(splitArrayBuffer(arrayBuffer, 257), LASLoader, {
    batchSize: 25000,
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
    'split variable-chunk TypeScript streaming matches COPC'
  );
  t.end();
}, 15000);

test('LASLoader#parseInBatches rejects a truncated variable chunk table', async t => {
  const response = await fetchFile(COPC_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const truncated = arrayBuffer.slice(0, arrayBuffer.byteLength - 16);
  const batches = await parseInBatches(splitArrayBuffer(truncated, 257), LASLoader, {
    core: {worker: false}
  });

  await t.rejects(
    async () => {
      for await (const _batch of batches) {
        _batch;
      }
    },
    /LAZ chunk table|Needs more data/,
    'truncated variable chunk table fails deterministically'
  );
  t.end();
});

test('LAS loader variants expose parseSync only when supported', async t => {
  const arrayBuffer = new ArrayBuffer(0);
  const copcLoader = await preload(LASCOPCLoader);
  const lazRsLoader = await preload(LAZRsLoader);
  const typeScriptLoader = await preload(LASLoader);

  t.notOk(copcLoader.parseSync, 'COPC variant does not expose parseSync');
  t.notOk(lazRsLoader.parseSync, 'laz-rs variant does not expose parseSync');
  t.throws(
    () => typeScriptLoader.parseSync?.(arrayBuffer),
    /invalid LAS header/,
    'TypeScript variant can run through parseSync'
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

test('TypeScriptLAZ#cursor point-data output matches full PDRF 7 records', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const rawPointData = decodeLAZChunk(compressed, metadata);
  const rawPointDataView = new DataView(
    rawPointData.buffer,
    rawPointData.byteOffset,
    rawPointData.byteLength
  );
  const positions = new Float64Array(metadata.pointCount * 3);
  const intensities = new Uint16Array(metadata.pointCount);
  const classifications = new Uint8Array(metadata.pointCount);
  const rawColors = new Uint16Array(metadata.pointCount * 3);
  const target = {
    positions,
    intensities,
    classifications,
    rawColors,
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };
  const cursor = createLAZChunkDecoderCursor(compressed, metadata);

  while (cursor.remainingPointCount > 0) {
    target.pointOffset = metadata.pointCount - cursor.remainingPointCount;
    cursor.decodeIntoPointData(target, 17);
  }

  const expectedPositions = new Float64Array(metadata.pointCount * 3);
  const expectedIntensities = new Uint16Array(metadata.pointCount);
  const expectedClassifications = new Uint8Array(metadata.pointCount);
  const expectedRawColors = new Uint16Array(metadata.pointCount * 3);
  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const pointOffset = pointIndex * metadata.pointDataRecordLength;
    const positionOffset = pointIndex * 3;
    expectedPositions[positionOffset] = rawPointDataView.getInt32(pointOffset, true);
    expectedPositions[positionOffset + 1] = rawPointDataView.getInt32(pointOffset + 4, true);
    expectedPositions[positionOffset + 2] = rawPointDataView.getInt32(pointOffset + 8, true);
    expectedIntensities[pointIndex] = rawPointDataView.getUint16(pointOffset + 12, true);
    expectedClassifications[pointIndex] = rawPointDataView.getUint8(pointOffset + 16);
    expectedRawColors[positionOffset] = rawPointDataView.getUint16(pointOffset + 30, true);
    expectedRawColors[positionOffset + 1] = rawPointDataView.getUint16(pointOffset + 32, true);
    expectedRawColors[positionOffset + 2] = rawPointDataView.getUint16(pointOffset + 34, true);
  }

  t.deepEqual(positions, expectedPositions, 'selected positions match full point records');
  t.deepEqual(intensities, expectedIntensities, 'selected intensities match full point records');
  t.deepEqual(
    classifications,
    expectedClassifications,
    'selected classifications match full point records'
  );
  t.deepEqual(rawColors, expectedRawColors, 'selected colors match full point records');

  target.pointOffset = 0;
  const zeroPointDataCursor = createLAZChunkDecoderCursor(compressed, metadata);
  t.equal(
    zeroPointDataCursor.decodeIntoPointData(target, 0),
    0,
    'zero-point selected decode does not consume input'
  );
  t.equal(
    zeroPointDataCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1),
    1,
    'zero-point selected decode does not lock the cursor output mode'
  );

  const zeroRawCursor = createLAZChunkDecoderCursor(compressed, metadata);
  t.equal(
    zeroRawCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 0),
    0,
    'zero-point raw decode does not consume input'
  );
  t.equal(
    zeroRawCursor.decodeIntoPointData(target, 1),
    1,
    'zero-point raw decode does not lock the cursor output mode'
  );

  const pointDataFirstCursor = createLAZChunkDecoderCursor(compressed, metadata);
  pointDataFirstCursor.decodeIntoPointData(target, 1);
  t.throws(
    () => pointDataFirstCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1),
    /Cannot mix raw and point-data decoding/,
    'cursor rejects switching from selected to raw output'
  );

  const rawFirstCursor = createLAZChunkDecoderCursor(compressed, metadata);
  rawFirstCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1);
  t.throws(
    () => rawFirstCursor.decodeIntoPointData(target, 1),
    /Cannot mix raw and point-data decoding/,
    'cursor rejects switching from raw to selected output'
  );
  t.end();
});

test('TypeScriptLAZ#cursor skips unrequested PDRF 7 field layers', async t => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const rawPointData = decodeLAZChunk(compressed, metadata);
  const rawPointDataView = new DataView(
    rawPointData.buffer,
    rawPointData.byteOffset,
    rawPointData.byteLength
  );
  const positions = new Float64Array(metadata.pointCount * 3);
  const rawColors = new Uint16Array(metadata.pointCount * 3);
  const selectedTarget = {
    positions,
    rawColors,
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };
  const selectedCursor = createLAZChunkDecoderCursor(compressed, metadata);

  while (selectedCursor.remainingPointCount > 0) {
    selectedTarget.pointOffset = metadata.pointCount - selectedCursor.remainingPointCount;
    selectedCursor.decodeIntoPointData(selectedTarget, 17);
  }

  const expectedPositions = new Float64Array(metadata.pointCount * 3);
  const expectedRawColors = new Uint16Array(metadata.pointCount * 3);
  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const pointOffset = pointIndex * metadata.pointDataRecordLength;
    const positionOffset = pointIndex * 3;
    expectedPositions[positionOffset] = rawPointDataView.getInt32(pointOffset, true);
    expectedPositions[positionOffset + 1] = rawPointDataView.getInt32(pointOffset + 4, true);
    expectedPositions[positionOffset + 2] = rawPointDataView.getInt32(pointOffset + 8, true);
    expectedRawColors[positionOffset] = rawPointDataView.getUint16(pointOffset + 30, true);
    expectedRawColors[positionOffset + 1] = rawPointDataView.getUint16(pointOffset + 32, true);
    expectedRawColors[positionOffset + 2] = rawPointDataView.getUint16(pointOffset + 34, true);
  }

  t.deepEqual(
    positions,
    expectedPositions,
    'positions match while intensity and class are skipped'
  );
  t.deepEqual(
    rawColors,
    expectedRawColors,
    'RGB matches while unrelated Point14 layers are skipped'
  );

  const positionsOnlyTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };
  const positionsOnlyCursor = createLAZChunkDecoderCursor(compressed, metadata);
  t.equal(
    positionsOnlyCursor.decodeIntoPointData(positionsOnlyTarget, metadata.pointCount),
    metadata.pointCount,
    'positions-only output skips every optional independent layer'
  );
  t.deepEqual(
    positionsOnlyTarget.positions,
    expectedPositions,
    'positions remain correct while RGB is skipped'
  );

  const lockedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  lockedCursor.decodeIntoPointData(positionsOnlyTarget, 1);
  t.throws(
    () =>
      lockedCursor.decodeIntoPointData(
        {...positionsOnlyTarget, classifications: new Uint8Array(metadata.pointCount)},
        1
      ),
    /Cannot change selected point-data fields/,
    'cursor rejects changing independent field selection after decoding starts'
  );
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

  const cursor = createLAZChunkDecoderCursor(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 0,
    pointDataRecordLength: expected.byteLength
  });
  const target = {
    positions: new Float32Array(3),
    intensities: new Uint16Array(1),
    classifications: new Uint8Array(1),
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };
  t.throws(
    () => cursor.decodeIntoPointData(target, 1),
    /does not support direct point-data output for point format 0/,
    'legacy point formats reject direct point-data output'
  );
  const rawOutput = new Uint8Array(expected.byteLength);
  t.equal(
    cursor.decodeInto(rawOutput, 0, 1),
    1,
    'rejected direct output does not initialize or lock the cursor'
  );
  t.deepEqual(rawOutput, expected, 'raw decode remains available after rejected direct output');
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
        pointDataRecordFormat: 11,
        pointDataRecordLength: 0
      }),
    /does not support point format 11/,
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
  chunkSize: number,
  onChunk?: (byteLength: number) => void
): AsyncIterable<ArrayBuffer> {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    const chunk = bytes.slice(offset, Math.min(offset + chunkSize, bytes.byteLength));
    onChunk?.(chunk.byteLength);
    yield chunk.buffer;
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

/** Find the LASzip item-version field for one item type in a test fixture. */
function findLASZipItemVersionOffset(arrayBuffer: ArrayBuffer, targetItemType: number): number {
  return findLASZipItemOffset(arrayBuffer, targetItemType) + 4;
}

/** Find one LASzip item descriptor in a test fixture. */
function findLASZipItemOffset(arrayBuffer: ArrayBuffer, targetItemType: number): number {
  const dataView = new DataView(arrayBuffer);
  let offset = dataView.getUint16(94, true);
  const variableLengthRecordCount = dataView.getUint32(100, true);

  for (let recordIndex = 0; recordIndex < variableLengthRecordCount; recordIndex++) {
    const recordId = dataView.getUint16(offset + 18, true);
    const recordLength = dataView.getUint16(offset + 20, true);
    const dataOffset = offset + 54;
    if (recordId === 22204) {
      const itemCount = dataView.getUint16(dataOffset + 32, true);
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        const itemOffset = dataOffset + 34 + itemIndex * 6;
        if (dataView.getUint16(itemOffset, true) === targetItemType) {
          return itemOffset;
        }
      }
    }
    offset = dataOffset + recordLength;
  }

  throw new Error(`LASzip item type ${targetItemType} not found`);
}

/** Find the LASzip VLR payload in a test fixture. */
function findLASZipVLRDataOffset(arrayBuffer: ArrayBuffer): number {
  const dataView = new DataView(arrayBuffer);
  let offset = dataView.getUint16(94, true);
  const variableLengthRecordCount = dataView.getUint32(100, true);

  for (let recordIndex = 0; recordIndex < variableLengthRecordCount; recordIndex++) {
    const recordId = dataView.getUint16(offset + 18, true);
    const recordLength = dataView.getUint16(offset + 20, true);
    const dataOffset = offset + 54;
    if (recordId === 22204) {
      return dataOffset;
    }
    offset = dataOffset + recordLength;
  }

  throw new Error('LASzip VLR not found');
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
