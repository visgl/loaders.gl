// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/* eslint-disable max-len */
import '@loaders.gl/polyfills';
import {expect, test} from 'vitest';
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
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunkTable,
  getLAZChunkByteLength
} from '@loaders.gl/loader-utils';
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
let copcArrayBufferPromise: Promise<ArrayBuffer> | undefined;
const LAZ_1_4_PARITY_VARIANTS = [
  {name: 'COPC', loader: LASCOPCLoader},
  {name: 'laz-rs', loader: LAZRsLoader}
] as const;
setLoaderOptions({
  _workerType: 'test'
});
const vitestAssertions = {
  ok(value: unknown, message?: string) {
    expect(value, message).toBeTruthy();
  },
  notOk(value: unknown, message?: string) {
    expect(value, message).toBeFalsy();
  },
  equal(actual: unknown, expected: unknown, message?: string) {
    expect(actual, message).toBe(expected);
  },
  equals(actual: unknown, expected: unknown, message?: string) {
    expect(actual, message).toBe(expected);
  }
};
test('LASLoader#loader conformance', () => {
  validateLoader(LASLoader, 'LASLoader');
  validateLoader(LASWorkerLoader, 'LASWorkerLoader');
  validateLoader(LAZPerfLoader, 'LAZPerfLoader');
  validateLoader(LASCOPCLoader, 'LASCOPCLoader');
  validateLoader(LAZRsLoader, 'LAZRsLoader');
});
test('LASLoader#removed Arrow variant exports are absent', () => {
  expect('LASArrowLoader' in las, 'root does not export LASArrowLoader').toBeFalsy();
  expect('LASArrowLoader' in bundledLas, 'bundled does not export LASArrowLoader').toBeFalsy();
  expect('LASArrowLoader' in unbundledLas, 'unbundled does not export LASArrowLoader').toBeFalsy();
});
test('LAS loader variants preload explicit parser implementations', async () => {
  expect(await preload(LASLoader), 'primary loader resolves TypeScript parser').toBe(
    LASLoaderWithParser
  );
  expect(await preload(LAZPerfLoader), 'laz-perf variant resolves laz-perf parser').toBe(
    LAZPerfLoaderWithParser
  );
  expect(await preload(LASCOPCLoader), 'COPC variant resolves COPC parser').toBe(
    LASCOPCLoaderWithParser
  );
  expect(await preload(LAZRsLoader), 'laz-rs variant resolves laz-rs parser').toBe(
    LAZRsLoaderWithParser
  );
  expect(
    LASLoaderWithParser.worker,
    'primary TypeScript variant uses the packaged worker'
  ).toBeTruthy();
  expect(
    LAZPerfLoaderWithParser.worker,
    'laz-perf variant defaults to the main thread'
  ).toBeFalsy();
  expect(LASCOPCLoaderWithParser.worker, 'COPC variant defaults to the main thread').toBeFalsy();
  expect(LAZRsLoaderWithParser.worker, 'laz-rs variant defaults to the main thread').toBeFalsy();
});
test('LASLoader#parse(binary)', async () => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.header?.vertexCount, 'Original header was found').toBe(data.loaderData.totalRead);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.indices, 'INDICES attribute was not preset').toBeFalsy();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(
    LAS_POINT_COUNT * 3
  );
});
test('LASLoader#parseInBatches(mesh)', async () => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    core: {worker: false}
  });
  const batchVertexCounts: number[] = [];
  let totalVertexCount = 0;
  for await (const batch of batches as AsyncIterable<any>) {
    validateMeshCategoryData(vitestAssertions, batch);
    expect(batch.mode, 'batch mode is POINTS (0)').toBe(0);
    expect(batch.attributes.POSITION, 'batch includes POSITION attribute').toBeTruthy();
    expect(batch.attributes.intensity, 'batch includes intensity attribute').toBeTruthy();
    expect(batch.attributes.classification, 'batch includes classification attribute').toBeTruthy();
    expect(batch.attributes.COLOR_0, 'batch includes COLOR_0 attribute').toBeTruthy();
    expect(
      batch.attributes.POSITION.value.length,
      'POSITION length matches batch vertex count'
    ).toBe(batch.header.vertexCount * 3);
    expect(batch.progress > 0 && batch.progress <= 1, 'batch includes progress').toBeTruthy();
    batchVertexCounts.push(batch.header.vertexCount);
    totalVertexCount += batch.header.vertexCount;
  }
  expect(batchVertexCounts, 'emits requested mesh batches').toEqual([
    ...new Array(32).fill(25000),
    8042
  ]);
  expect(totalVertexCount, 'batched vertex count matches full parse').toBe(LAS_POINT_COUNT);
});
test('LASLoader#parseInBatches(arrow-table)', async () => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 30000,
    las: {shape: 'arrow-table'},
    core: {worker: false}
  });
  const batchRowCounts: number[] = [];
  for await (const table of batches as AsyncIterable<any>) {
    expect(table.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(table.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    expect(table.data.getChild('intensity'), 'batch includes intensity column').toBeTruthy();
    expect(
      table.data.getChild('classification'),
      'batch includes classification column'
    ).toBeTruthy();
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'emits requested Arrow batches').toEqual([
    ...new Array(26).fill(30000),
    28042
  ]);
});
test('LASLoader#parseInBatches(fp64)', async () => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    las: {fp64: true},
    core: {worker: false}
  });
  for await (const batch of batches as AsyncIterable<any>) {
    expect(
      batch.attributes.POSITION.value instanceof Float64Array,
      'batch POSITION attribute is Float64Array'
    ).toBeTruthy();
    break;
  }
});
test('LAS loader variants parseInBatches', async () => {
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
    expect(totalVertexCount, `${name} loader variant emits all points`).toBe(LAS_POINT_COUNT);
  }
});
test('LAS loader variants return Arrow tables', async () => {
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
    expect(table.shape, `${name} variant returns an Arrow table`).toBe('arrow-table');
    expect(table.data.numRows, `${name} variant returns every point`).toBe(
      LAS_EXTRABYTES_POINT_COUNT
    );
  }
  const syncTable = LAZPerfLoaderWithParser.parseSync(arrayBuffer, {
    las: {shape: 'arrow-table'}
  });
  expect(syncTable.shape, 'laz-perf parseSync returns an Arrow table').toBe('arrow-table');
  expect(syncTable.data.numRows, 'laz-perf parseSync returns every point').toBe(
    LAS_EXTRABYTES_POINT_COUNT
  );
});
test('LASLoader#parse LAZ 1.2 PDRF 3 matches laz-rs variant', async () => {
  const expected = await parse(fetchFile(LAS_BINARY_URL), LAZRsLoader, {
    core: {worker: false}
  });
  const actual = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, actual);
  expect(actual.loaderData.versionAsString, 'fixture is LAS 1.2').toBe('1.2');
  expect(actual.loaderData.pointsFormatId, 'fixture uses point format 3').toBe(3);
  expect(actual.header.vertexCount, 'fixture point count is expected').toBe(LAS_POINT_COUNT);
  compareMeshAttributes(actual, expected, 'TypeScript LAZ PDRF 3 parse matches laz-rs');
}, 30000);
test('LASLoader#parseInBatches split LAZ 1.2 PDRF 3 matches laz-rs variant', async () => {
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
  expect(expected.loaderData.versionAsString, 'fixture is LAS 1.2').toBe('1.2');
  expect(expected.loaderData.pointsFormatId, 'fixture uses point format 3').toBe(3);
  expect(expected.header.vertexCount, 'fixture point count is expected').toBe(
    LAS_EXTRABYTES_POINT_COUNT
  );
  compareCollectedMeshAttributes(
    actual,
    {
      positions: Array.from(expected.attributes.POSITION.value),
      intensities: Array.from(expected.attributes.intensity.value),
      classifications: Array.from(expected.attributes.classification.value),
      colors: Array.from(expected.attributes.COLOR_0.value)
    },
    'split TypeScript LAZ PDRF 3 streaming matches laz-rs'
  );
}, 30000);
test('LASLoader#parseInBatches emits legacy LAZ rows before input ends', async () => {
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
  expect(batchCount > 1, 'fixture emits multiple batches').toBeTruthy();
  expect(pointCount, 'stream emits every point once').toBe(LAS_EXTRABYTES_POINT_COUNT);
  expect(
    firstBatchConsumedByteLength < arrayBuffer.byteLength,
    `first batch emitted after ${firstBatchConsumedByteLength} of ${arrayBuffer.byteLength} bytes`
  ).toBeTruthy();
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
  test(`TypeScriptLAZ#raw LAS 1.3 ${label} output matches uncompressed records`, async () => {
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
    expect(concatenateUint8ArraysForTest(batches), `${label} preserves every point byte`).toEqual(
      expected
    );
    const waveformByteOffset = fixture.pointDataRecordFormat === 4 ? 29 : 35;
    const waveformOffset = new DataView(
      expected.buffer,
      expected.byteOffset,
      expected.byteLength
    ).getBigUint64(waveformByteOffset, true);
    expect(
      waveformOffset > BigInt(Number.MAX_SAFE_INTEGER),
      `${label} preserves waveform offsets beyond Number.MAX_SAFE_INTEGER`
    ).toBeTruthy();
  });
  test(`LASLoader#parse and split streaming LAS 1.3 ${label} match uncompressed LAS`, async () => {
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
    expect(actual.loaderData.versionAsString, `${label} fixture is LAS 1.3`).toBe('1.3');
    expect(actual.loaderData.pointsFormatId, `${label} fixture has the expected point format`).toBe(
      fixture.pointDataRecordFormat
    );
    compareMeshAttributes(actual, expected, `${label} TypeScript LAZ matches uncompressed LAS`);
    compareCollectedMeshAttributes(
      streamed,
      {
        positions: Array.from(expected.attributes.POSITION.value),
        intensities: Array.from(expected.attributes.intensity.value),
        classifications: Array.from(expected.attributes.classification.value),
        colors: Array.from(expected.attributes.COLOR_0?.value || [])
      },
      `${label} TypeScript streaming matches uncompressed LAS`
    );
  });
}
test('LASCOPCLoader#parse LAS 1.4 fixture', async () => {
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.loaderData.versionAsString, 'fixture is LAS 1.4').toBe('1.4');
  expect(data.loaderData.pointsFormatId, 'fixture uses point format 7').toBe(7);
  expect(data.header.vertexCount, 'fixture point count is expected').toBe(3);
  expect(data.attributes.COLOR_0, 'fixture includes color').toBeTruthy();
});
test('LASLoader#parse LAS 1.4 fixture matches COPC variant', async () => {
  const expected = await parse(fetchFile(LAS_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.loaderData.versionAsString, 'fixture is LAS 1.4').toBe('1.4');
  expect(data.loaderData.pointsFormatId, 'fixture uses point format 7').toBe(7);
  expect(data.header.vertexCount, 'fixture point count is expected').toBe(3);
  expect(data.attributes.COLOR_0, 'fixture includes color').toBeTruthy();
  compareMeshAttributes(data, expected, 'TypeScript variant matches COPC variant');
});
test('LASLoader#parseInBatches matches COPC variant', async () => {
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
  expect(positions, 'positions match WASM').toEqual(Array.from(expected.attributes.POSITION.value));
  expect(intensities, 'intensities match WASM').toEqual(
    Array.from(expected.attributes.intensity.value)
  );
  expect(classifications, 'classifications match WASM').toEqual(
    Array.from(expected.attributes.classification.value)
  );
  expect(colors, 'colors match WASM').toEqual(Array.from(expected.attributes.COLOR_0.value));
});
test('LASCOPCLoader#parse LAZ 1.4 fixture', async () => {
  const data = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASCOPCLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.loaderData.versionAsString, 'fixture is LAS 1.4').toBe('1.4');
  expect(data.loaderData.pointsFormatId, 'fixture uses point format 7').toBe(7);
  expect(data.header.vertexCount, 'fixture point count is expected').toBe(LAZ_1_4_POINT_COUNT);
  expect(data.attributes.COLOR_0, 'fixture includes color').toBeTruthy();
});
test('LASLoader#parse LAZ 1.4 matches other loader variants', async () => {
  const actual = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, actual);
  for (const {name, loader} of LAZ_1_4_PARITY_VARIANTS) {
    const expected = await parse(fetchFile(LAZ_1_4_BINARY_URL), loader, {
      core: {worker: false}
    });
    expect(actual.header.vertexCount, `TypeScript LAZ point count matches ${name}`).toBe(
      expected.header.vertexCount
    );
    compareMeshAttributes(actual, expected, `TypeScript LAZ parse matches ${name}`);
  }
});
test('LASLoader#parseInBatches LAZ 1.4 fixture', async () => {
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
});
test('LASLoader#parseInBatches split LAZ 1.4 matches other loader variants', async () => {
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
});
test('LASLoader#parseInBatches LAZ 1.4 accepts split file chunks', async () => {
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
    actual,
    {
      positions: Array.from(expected.attributes.POSITION.value),
      intensities: Array.from(expected.attributes.intensity.value),
      classifications: Array.from(expected.attributes.classification.value),
      colors: Array.from(expected.attributes.COLOR_0.value)
    },
    'split file chunks match complete-buffer TypeScript parse'
  );
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
  test(`TypeScriptLAZ#raw LAS ${fixture.version} ${label} output matches uncompressed records`, async () => {
    const lasArrayBuffer = await (await fetchFile(fixture.lasUrl)).arrayBuffer();
    const lazArrayBuffer = await (await fetchFile(fixture.lazUrl)).arrayBuffer();
    const batches: Uint8Array[] = [];
    if ('expectedItemVersions' in fixture) {
      const lazDataView = new DataView(lazArrayBuffer);
      for (const [itemType, expectedVersion] of fixture.expectedItemVersions) {
        const itemVersionOffset = findLASZipItemVersionOffset(lazArrayBuffer, itemType);
        expect(
          lazDataView.getUint16(itemVersionOffset, true),
          `${label} LASzip item ${itemType} uses version ${expectedVersion}`
        ).toBe(expectedVersion);
      }
    }
    for await (const batch of decodeLAZFileInBatches(splitArrayBuffer(lazArrayBuffer, 257), {
      batchSize: 127
    })) {
      expect(batch.header.pointsFormatId, `${label} header preserves point format`).toBe(
        fixture.pointDataRecordFormat
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
    expect(concatenateUint8ArraysForTest(batches), `${label} preserves every point byte`).toEqual(
      expected
    );
    if (fixture.pointDataRecordFormat >= 9) {
      const waveformByteOffset = fixture.pointDataRecordFormat === 9 ? 31 : 39;
      const waveformOffset = new DataView(
        expected.buffer,
        expected.byteOffset,
        expected.byteLength
      ).getBigUint64(waveformByteOffset, true);
      expect(
        waveformOffset > BigInt(Number.MAX_SAFE_INTEGER),
        `${label} preserves waveform offsets beyond Number.MAX_SAFE_INTEGER`
      ).toBeTruthy();
    }
    if ('exercisesAllScannerChannels' in fixture && fixture.exercisesAllScannerChannels) {
      const scannerChannels = new Set<number>();
      for (let pointIndex = 0; pointIndex < 1024; pointIndex++) {
        scannerChannels.add((expected[pointIndex * fixture.pointDataRecordLength + 15] >> 4) & 3);
      }
      expect(
        Array.from(scannerChannels).sort(),
        `${label} exercises all LASzip v4 scanner-channel contexts`
      ).toEqual([0, 1, 2, 3]);
    }
  });
  test(`LASLoader#parse and split streaming LAS ${fixture.version} ${label} preserve Arrow output`, async () => {
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
    expect(actual.loaderData.versionAsString, `${label} fixture is LAS ${fixture.version}`).toBe(
      fixture.version
    );
    expect(actual.loaderData.pointsFormatId, `${label} fixture has the expected point format`).toBe(
      fixture.pointDataRecordFormat
    );
    expect(actual.header.vertexCount, `${label} fixture has 1,024 points`).toBe(1024);
    compareMeshAttributes(actual, expected, `${label} TypeScript LAZ matches uncompressed LAS`);
    compareCollectedMeshAttributes(
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
      compareMeshAttributes(actual, expected, `${label} TypeScript parse matches ${name}`);
      compareCollectedMeshAttributes(
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
  });
}
test('LASLoader#TypeScript rejects unsupported LASzip item versions', async () => {
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
    await await expect(
      parse(corrupted, LASLoader, {
        core: {worker: false}
      }),
      `unsupported ${fixture.label} versions fail before point decoding`
    ).rejects.toThrow(fixture.error);
  }
});
test('LASLoader#TypeScript rejects incompatible LASzip item layouts', async () => {
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
    await await expect(
      parse(corrupted, LASLoader, {
        core: {worker: false}
      }),
      fixture.label
    ).rejects.toThrow(fixture.error);
  }
});
test('TypeScriptLAZ#PDRF 8 cursor preserves one complete fixed-size chunk', async () => {
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
  expect(pointsDecoded, 'raw cursor decodes every point in the chunk').toBe(256);
  expect(actual, 'raw PDRF 8 chunk matches uncompressed records').toEqual(expected);
});
test('LASLoader#parse variable-chunk LAZ 1.4 matches COPC variant', async () => {
  const response = await fetchFile(COPC_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const expected = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });
  const actual = await parse(arrayBuffer.slice(0), LASLoader, {
    core: {worker: false}
  });
  expect(actual.loaderData.versionAsString, 'fixture is LAS 1.4').toBe('1.4');
  expect(actual.loaderData.pointsFormatId, 'fixture uses point format 7').toBe(7);
  expect(actual.header.vertexCount, 'variable chunks contain every point').toBe(
    VARIABLE_LAZ_1_4_POINT_COUNT
  );
  compareMeshAttributes(actual, expected, 'variable-chunk TypeScript parse matches COPC');
}, 15000);
test('TypeScriptLAZ#decodes the COPC variable chunk table', async () => {
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
  expect(chunks.length, 'fixture contains five variable-size chunks').toBe(5);
  expect(
    chunks.reduce((pointCount, chunk) => pointCount + chunk.pointCount, 0),
    'chunk point counts cover the file'
  ).toBe(VARIABLE_LAZ_1_4_POINT_COUNT);
  expect(
    chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
    'chunk byte lengths reach the chunk table exactly'
  ).toBe(chunkTableOffset - pointDataOffset - 8);
});
test('LASLoader#parseInBatches split variable-chunk LAZ 1.4 matches COPC', async () => {
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
    actual,
    {
      positions: Array.from(expected.attributes.POSITION.value),
      intensities: Array.from(expected.attributes.intensity.value),
      classifications: Array.from(expected.attributes.classification.value),
      colors: Array.from(expected.attributes.COLOR_0.value)
    },
    'split variable-chunk TypeScript streaming matches COPC'
  );
}, 15000);
test('decodeLAZFileInBatches rejects a truncated chunk table', async () => {
  const response = await fetchFile(PDRF_7_V4_LAZ_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const truncated = arrayBuffer.slice(0, arrayBuffer.byteLength - 16);
  const batches = decodeLAZFileInBatches(splitArrayBuffer(truncated, 257), {batchSize: 25000});
  await expect(
    (async () => {
      for await (const _batch of batches) {
        _batch;
      }
    })()
  ).rejects.toThrow(/LAZ chunk table|Needs more data/);
});
test('LAS loader variants expose parseSync only when supported', async () => {
  const arrayBuffer = new ArrayBuffer(0);
  const copcLoader = await preload(LASCOPCLoader);
  const lazRsLoader = await preload(LAZRsLoader);
  const typeScriptLoader = await preload(LASLoader);
  expect(copcLoader.parseSync, 'COPC variant does not expose parseSync').toBeFalsy();
  expect(lazRsLoader.parseSync, 'laz-rs variant does not expose parseSync').toBeFalsy();
  expect(
    () => typeScriptLoader.parseSync?.(arrayBuffer),
    'TypeScript variant can run through parseSync'
  ).toThrow(/invalid LAS header/);
});
test('TypeScriptLAZ#decodes COPC chunk like laz-perf', async () => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = await Las.PointData.decompressChunk(compressed, metadata);
  const actual = decodeLAZChunk(compressed, metadata);
  expect(actual.byteLength, 'decoded byte length matches').toBe(expected.byteLength);
  expect(actual, 'decoded raw point records match laz-perf').toEqual(expected);
}, 30000);
test('TypeScriptLAZ#feedable decoder accepts split chunks', async () => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = decodeLAZChunk(compressed, metadata);
  const singleChunkDecoder = createLAZChunkDecoder(metadata);
  singleChunkDecoder.feed(compressed);
  singleChunkDecoder.close();
  expect(singleChunkDecoder.decode(), 'single input chunk decodes the same output').toEqual(
    expected
  );
  const byteDecoder = createLAZChunkDecoder(metadata);
  for (let offset = 0; offset < compressed.byteLength; offset++) {
    byteDecoder.feed(compressed.subarray(offset, offset + 1));
  }
  byteDecoder.close();
  expect(byteDecoder.decode(), 'one-byte input chunks decode the same output').toEqual(expected);
  const decoder = createLAZChunkDecoder(metadata);
  let chunkLength = 1;
  for (let offset = 0; offset < compressed.byteLength; offset += chunkLength) {
    chunkLength = ((chunkLength * 33 + 17) % 251) + 1;
    decoder.feed(
      compressed.subarray(offset, Math.min(offset + chunkLength, compressed.byteLength))
    );
  }
  decoder.close();
  expect(decoder.decode(), 'random-sized input chunks decode the same output').toEqual(expected);
}, 60000);
test('TypeScriptLAZ#position batches start before later layers arrive', async () => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expectedPositions = new Float64Array(metadata.pointCount * 3);
  const expectedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  expectedCursor.decodeIntoPointData(
    {
      positions: expectedPositions,
      pointOffset: 0,
      scale: [1, 1, 1],
      offset: [0, 0, 0]
    },
    metadata.pointCount
  );
  const decoder = createLAZChunkDecoder(metadata);
  const positions = new Float64Array(metadata.pointCount * 3);
  let decodedPointCount = 0;
  let firstDecodedByteLength = -1;
  for (let offset = 0; offset < compressed.byteLength; offset += 257) {
    decoder.feed(compressed.subarray(offset, Math.min(offset + 257, compressed.byteLength)));
    let batchPointCount = decoder.readPositionDataBatch(
      {
        positions,
        pointOffset: decodedPointCount,
        scale: [1, 1, 1],
        offset: [0, 0, 0]
      },
      metadata.pointCount - decodedPointCount
    );
    while (batchPointCount && batchPointCount > 0) {
      if (firstDecodedByteLength < 0) {
        firstDecodedByteLength = Math.min(offset + 257, compressed.byteLength);
      }
      decodedPointCount += batchPointCount;
      batchPointCount = decoder.readPositionDataBatch(
        {
          positions,
          pointOffset: decodedPointCount,
          scale: [1, 1, 1],
          offset: [0, 0, 0]
        },
        metadata.pointCount - decodedPointCount
      );
    }
    if (decodedPointCount === metadata.pointCount) {
      break;
    }
  }
  expect(decodedPointCount, 'all positions decode from the first layer').toBe(metadata.pointCount);
  expect(
    firstDecodedByteLength > 0 && firstDecodedByteLength < compressed.byteLength,
    'positions decode before the complete compressed chunk arrives'
  ).toBeTruthy();
  expect(positions, 'progressive positions match complete decoding').toEqual(expectedPositions);
});
test('TypeScriptLAZ#decodeLAZChunkInBatches accepts split chunks', async () => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const expected = decodeLAZChunk(compressed, metadata);
  const batches: Uint8Array[] = [];
  for await (const batch of decodeLAZChunkInBatches(splitArrayBuffer(compressed, 257), metadata, {
    batchSize: 17
  })) {
    batches.push(batch);
  }
  expect(concatenateUint8ArraysForTest(batches), 'streamed batches match decodeLAZChunk').toEqual(
    expected
  );
}, 30000);
test('TypeScriptLAZ#decodeLAZFileInBatches accepts split PDRF 3 files', async () => {
  const response = await fetchFile(LAS_EXTRABYTES_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches: Uint8Array[] = [];
  for await (const batch of decodeLAZFileInBatches(splitArrayBuffer(arrayBuffer, 257), {
    batchSize: 250
  })) {
    batches.push(new Uint8Array(batch.arrayBuffer));
    expect(batch.header.pointsFormatId, 'batch header preserves point format 3').toBe(3);
  }
  expect(batches.length, 'emits raw point batches').toBe(5);
  expect(
    concatenateUint8ArraysForTest(batches).byteLength,
    'raw point byte length matches point record length'
  ).toBe(LAS_EXTRABYTES_POINT_COUNT * 61);
});
test('TypeScriptLAZ#decodeLAZFileInBatches rejects uncompressed LAS input', async () => {
  const response = await fetchFile(LAS_1_4_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = decodeLAZFileInBatches(splitArrayBuffer(arrayBuffer, 257));
  await expect(
    (async () => {
      for await (const _batch of batches) {
        _batch;
      }
    })()
  ).rejects.toThrow(/requires compressed LAZ input/);
});
test('TypeScriptLAZ#cursor decodes batches smaller and larger than chunk', async () => {
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
  expect(smallBatchPointOffset, 'small batches decode every point').toBe(metadata.pointCount);
  expect(largeBatchPointsDecoded, 'large batch stops at chunk point count').toBe(
    metadata.pointCount
  );
  expect(smallBatchOutput, 'small direct batches match decodeLAZChunk').toEqual(expected);
  expect(largeBatchOutput, 'large direct batch matches decodeLAZChunk').toEqual(expected);
}, 60000);
test('TypeScriptLAZ#cursor point-data output matches full PDRF 7 records', async () => {
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
  expect(positions, 'selected positions match full point records').toEqual(expectedPositions);
  expect(intensities, 'selected intensities match full point records').toEqual(expectedIntensities);
  expect(classifications, 'selected classifications match full point records').toEqual(
    expectedClassifications
  );
  expect(rawColors, 'selected colors match full point records').toEqual(expectedRawColors);
  target.pointOffset = 0;
  const zeroPointDataCursor = createLAZChunkDecoderCursor(compressed, metadata);
  expect(
    zeroPointDataCursor.decodeIntoPointData(target, 0),
    'zero-point selected decode does not consume input'
  ).toBe(0);
  expect(
    zeroPointDataCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1),
    'zero-point selected decode does not lock the cursor output mode'
  ).toBe(1);
  const zeroRawCursor = createLAZChunkDecoderCursor(compressed, metadata);
  expect(
    zeroRawCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 0),
    'zero-point raw decode does not consume input'
  ).toBe(0);
  expect(
    zeroRawCursor.decodeIntoPointData(target, 1),
    'zero-point raw decode does not lock the cursor output mode'
  ).toBe(1);
  const pointDataFirstCursor = createLAZChunkDecoderCursor(compressed, metadata);
  pointDataFirstCursor.decodeIntoPointData(target, 1);
  expect(
    () => pointDataFirstCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1),
    'cursor rejects switching from selected to raw output'
  ).toThrow(/Cannot mix raw and point-data decoding/);
  const rawFirstCursor = createLAZChunkDecoderCursor(compressed, metadata);
  rawFirstCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1);
  expect(
    () => rawFirstCursor.decodeIntoPointData(target, 1),
    'cursor rejects switching from raw to selected output'
  ).toThrow(/Cannot mix raw and point-data decoding/);
});
test('TypeScriptLAZ#cursor skips unrequested PDRF 7 field layers', async () => {
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
  expect(positions, 'positions match while intensity and class are skipped').toEqual(
    expectedPositions
  );
  expect(rawColors, 'RGB matches while unrelated Point14 layers are skipped').toEqual(
    expectedRawColors
  );
  const positionsOnlyTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };
  const positionsOnlyCursor = createLAZChunkDecoderCursor(compressed, metadata);
  expect(
    positionsOnlyCursor.decodeIntoPointData(positionsOnlyTarget, metadata.pointCount),
    'positions-only output skips every optional independent layer'
  ).toBe(metadata.pointCount);
  expect(positionsOnlyTarget.positions, 'positions remain correct while RGB is skipped').toEqual(
    expectedPositions
  );
  const lockedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  lockedCursor.decodeIntoPointData(positionsOnlyTarget, 1);
  expect(
    () =>
      lockedCursor.decodeIntoPointData(
        {...positionsOnlyTarget, classifications: new Uint8Array(metadata.pointCount)},
        1
      ),
    'cursor rejects changing independent field selection after decoding starts'
  ).toThrow(/Cannot change selected point-data fields/);
});
test('TypeScriptLAZ#decodes single-point legacy point format 0 chunk', () => {
  const expected = createPointFormat0Record();
  const compressed = new Uint8Array(expected.byteLength + 4);
  compressed.set(expected);
  const actual = decodeLAZChunk(compressed, {
    pointCount: 1,
    pointDataRecordFormat: 0,
    pointDataRecordLength: expected.byteLength
  });
  expect(actual, 'point format 0 first point is preserved').toEqual(expected);
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
  expect(
    () => cursor.decodeIntoPointData(target, 1),
    'legacy point formats reject direct point-data output'
  ).toThrow(/does not support direct point-data output for point format 0/);
  const rawOutput = new Uint8Array(expected.byteLength);
  expect(
    cursor.decodeInto(rawOutput, 0, 1),
    'rejected direct output does not initialize or lock the cursor'
  ).toBe(1);
  expect(rawOutput, 'raw decode remains available after rejected direct output').toEqual(expected);
});
test('TypeScriptLAZ#decodes single-point legacy point format 1 chunk', () => {
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
  expect(actual, 'point format 1 first point and GPS time are preserved').toEqual(expected);
});
test('TypeScriptLAZ#decodes single-point legacy point format 2 chunk', () => {
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
  expect(actual, 'point format 2 first point and RGB are preserved').toEqual(expected);
});
test('TypeScriptLAZ#decodes single-point legacy point format 3 chunk', () => {
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
  expect(actual, 'point format 3 first point, GPS time, and RGB are preserved').toEqual(expected);
});
test('TypeScriptLAZ#feedable decoder reports missing data', async () => {
  const {compressed, metadata} = await getCOPCRootChunk();
  const decoder = createLAZChunkDecoder(metadata);
  decoder.feed(compressed.subarray(0, Math.max(0, compressed.byteLength - 1)));
  decoder.close();
  expect(() => decoder.decode(), 'truncated input reports NeedsMoreData').toThrow(NeedsMoreData);
});
test('TypeScriptLAZ#rejects unsupported point format', () => {
  expect(
    () =>
      decodeLAZChunk(new Uint8Array(0), {
        pointCount: 1,
        pointDataRecordFormat: 11,
        pointDataRecordLength: 0
      }),
    'unsupported point formats fail clearly'
  ).toThrow(/does not support point format 11/);
});
test('TypeScriptLAZ#encoder writes LASzip v3 PDRF 6-8 chunks', async () => {
  for (const pointDataRecordFormat of [6, 7, 8]) {
    const {rawPointData, metadata} = createLAZEncodingFixture(pointDataRecordFormat);
    const compressed = encodeLAZChunk(rawPointData, metadata);
    const decoded = decodeLAZChunk(compressed, metadata);
    const lazPerfDecoded = await Las.PointData.decompressChunk(compressed, metadata);
    expect(decoded, `PDRF ${pointDataRecordFormat} TypeScript roundtrip`).toEqual(rawPointData);
    expect(lazPerfDecoded, `PDRF ${pointDataRecordFormat} laz-perf interoperability`).toEqual(
      rawPointData
    );
    expect(
      encodeLAZChunk(rawPointData, metadata),
      `PDRF ${pointDataRecordFormat} output is deterministic`
    ).toEqual(compressed);
    expect(
      getLAZChunkByteLength(compressed, metadata),
      `PDRF ${pointDataRecordFormat} layered size headers are complete`
    ).toBe(compressed.byteLength);
  }
  const {rawPointData, metadata} = createLAZEncodingFixture(8);
  const padded = new Uint8Array(rawPointData.byteLength + 16);
  padded.set(rawPointData, 8);
  const encoder = createLAZChunkEncoder(metadata);
  const splitOffset = Math.floor(rawPointData.byteLength / 2);
  encoder.feed(padded.subarray(8, 8 + splitOffset));
  encoder.feed(padded.subarray(8 + splitOffset, 8 + rawPointData.byteLength));
  encoder.close();
  expect(
    decodeLAZChunk(encoder.encode(), metadata),
    'feedable encoder preserves input view byte ranges'
  ).toEqual(rawPointData);
});
test('TypeScriptLAZ#encoder validates input and item versions', () => {
  const {rawPointData, metadata} = createLAZEncodingFixture(6);
  expect(
    () =>
      encodeLAZChunk(new Uint8Array(20), {
        pointCount: 1,
        pointDataRecordFormat: 11,
        pointDataRecordLength: 20
      }),
    'unsupported point formats fail clearly'
  ).toThrow(/does not support point format 11/);
  expect(
    () => encodeLAZChunk(rawPointData.subarray(1), metadata),
    'incomplete point data is rejected'
  ).toThrow(/expected/);
  expect(
    () => encodeLAZChunk(rawPointData, {...metadata, point14ItemVersion: 4}),
    'unsupported Point14 versions are rejected'
  ).toThrow(/only supports Point14 item version 3/);
  const encoder = createLAZChunkEncoder(metadata);
  encoder.feed(new Uint8Array(10).subarray(2, 8));
  expect(() => encoder.encode(), 'feedable encoder requires close before encode').toThrow(
    /input is not closed/
  );
  encoder.close();
  expect(
    () => encoder.feed(new Uint8Array(1)),
    'closed feedable encoder rejects more input'
  ).toThrow(/closed LAZ chunk encoder/);
});
test('LASLoader#options', async () => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {fp64: false},
    core: {worker: false}
  });
  expect(
    data.attributes.POSITION.value instanceof Float32Array,
    'POSITION attribute is Float32Array'
  ).toBeTruthy();
  const data64 = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {fp64: true},
    core: {worker: false}
  });
  expect(
    data64.attributes.POSITION.value instanceof Float64Array,
    'POSITION attribute is Float64Array'
  ).toBeTruthy();
});
test('LASWorker#parse(binary) extra bytes', async () => {
  const data = await parse(fetchFile(LAS_EXTRABYTES_BINARY_URL), LASLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.header?.vertexCount, 'Original header was found').toBe(data.loaderData.totalRead);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.indices, 'INDICES attribute was not preset').toBeFalsy();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(
    LAS_EXTRABYTES_POINT_COUNT * 3
  );
});
test('LASWorkerLoader#load(worker)', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await load(LAS_BINARY_URL, LASWorkerLoader);
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(
    LAS_POINT_COUNT * 3
  );
});
test('LASLoader#shape="mesh"', async () => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {shape: 'mesh'}});
  validateMeshCategoryData(vitestAssertions, result);
});
// Related code was commented due to breaking pointcloud example on the website
test.skip('LASLoader#shape="columnar-table"', async () => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'columnar-table'}
  });
  validateTableCategoryData(vitestAssertions, result);
});
async function getCOPCRootChunk() {
  copcArrayBufferPromise ||= fetchFile(COPC_BINARY_URL).then(response => response.arrayBuffer());
  const copcArrayBuffer = await copcArrayBufferPromise;
  const getCopcBytes = async (begin: number, end: number) =>
    new Uint8Array(copcArrayBuffer.slice(begin, end));
  const copc = await Copc.create(getCopcBytes);
  const hierarchy = await Copc.loadHierarchyPage(getCopcBytes, copc.info.rootHierarchyPage);
  const node = hierarchy.nodes['0-0-0-0'];
  if (!node) {
    throw new Error('COPC root node not found');
  }
  const compressed = await Copc.loadCompressedPointDataBuffer(getCopcBytes, node);
  return {
    compressed,
    metadata: {
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    }
  };
}
/** Create varied LAS 1.4 records for LAZ encoder interoperability tests. */
function createLAZEncodingFixture(pointDataRecordFormat: number) {
  const baseRecordLength = {6: 30, 7: 36, 8: 38}[pointDataRecordFormat];
  if (!baseRecordLength) {
    throw new Error(`Unsupported fixture point format ${pointDataRecordFormat}`);
  }
  const pointCount = 32;
  const pointDataRecordLength = baseRecordLength + 2;
  const rawPointData = new Uint8Array(pointCount * pointDataRecordLength);
  let previousGpsTime = 1000000000;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const recordOffset = pointIndex * pointDataRecordLength;
    const view = new DataView(
      rawPointData.buffer,
      rawPointData.byteOffset + recordOffset,
      pointDataRecordLength
    );
    const numberOfReturns = 1 + (pointIndex % 5);
    const returnNumber = 1 + (pointIndex % numberOfReturns);
    const scannerChannel = (pointIndex * 3 + 2) % 4;
    const gpsTime = pointIndex % 7 === 0 ? previousGpsTime : 1000000000 + pointIndex * 0.001;
    previousGpsTime = gpsTime;
    view.setInt32(0, 1000 + pointIndex * 13, true);
    view.setInt32(4, -2000 + pointIndex * pointIndex, true);
    view.setInt32(8, 50 - pointIndex * 3, true);
    view.setUint16(12, 200 + pointIndex * 17, true);
    view.setUint8(14, returnNumber | (numberOfReturns << 4));
    view.setUint8(15, (pointIndex % 16) | (scannerChannel << 4) | ((pointIndex % 2) << 6));
    view.setUint8(16, (pointIndex * 7) & 0xff);
    view.setUint8(17, (pointIndex * 11) & 0xff);
    view.setInt16(18, -100 + pointIndex * 9, true);
    view.setUint16(20, 3 + (pointIndex >> 2), true);
    view.setFloat64(22, gpsTime, true);
    if (pointDataRecordFormat >= 7) {
      view.setUint16(30, pointIndex * 1000, true);
      view.setUint16(32, 65535 - pointIndex * 500, true);
      view.setUint16(34, pointIndex * 257, true);
    }
    if (pointDataRecordFormat === 8) {
      view.setUint16(36, pointIndex * 333, true);
    }
    view.setUint8(baseRecordLength, pointIndex);
    view.setUint8(baseRecordLength + 1, 255 - pointIndex);
  }
  return {
    rawPointData,
    metadata: {
      pointCount,
      pointDataRecordFormat,
      pointDataRecordLength,
      point14ItemVersion: 3 as const,
      rgb14ItemVersion: 3 as const,
      byte14ItemVersion: 3 as const
    }
  };
}
function compareMeshAttributes(actual: any, expected: any, label: string): void {
  expect(Array.from(actual.attributes.POSITION.value), `${label}: positions`).toEqual(
    Array.from(expected.attributes.POSITION.value)
  );
  expect(Array.from(actual.attributes.intensity.value), `${label}: intensities`).toEqual(
    Array.from(expected.attributes.intensity.value)
  );
  expect(Array.from(actual.attributes.classification.value), `${label}: classifications`).toEqual(
    Array.from(expected.attributes.classification.value)
  );
  expect(Array.from(actual.attributes.COLOR_0?.value || []), `${label}: colors`).toEqual(
    Array.from(expected.attributes.COLOR_0?.value || [])
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
  actual: Awaited<ReturnType<typeof collectMeshAttributes>>,
  expected: Awaited<ReturnType<typeof collectMeshAttributes>>,
  label: string
): void {
  expect(actual.positions, `${label}: positions`).toEqual(expected.positions);
  expect(actual.intensities, `${label}: intensities`).toEqual(expected.intensities);
  expect(actual.classifications, `${label}: classifications`).toEqual(expected.classifications);
  expect(actual.colors, `${label}: colors`).toEqual(expected.colors);
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
test('LASLoader#shape="arrow-table"', async () => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table'},
    core: {worker: false}
  });
  expect(result.shape, 'returns Arrow table shape').toBe('arrow-table');
  expect(result.data.getChild('POSITION'), 'returns POSITION column').toBeTruthy();
});
