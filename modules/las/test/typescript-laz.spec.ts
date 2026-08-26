// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {expect, test as vitestTest} from 'vitest';
import {fetchFile, isBrowser, parse} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import {
  createLAZChunkDecoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  getLAZChunkByteLength
} from '@loaders.gl/loader-utils';
import type {LAZChunkMetadata, LAZPointDataTarget} from '@loaders.gl/loader-utils';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {
  decodeLAZFileInBatches,
  parseLAS,
  parseLASInBatches,
  type LASArrowTable
} from '../src/lib/typescript/parse-las';
import type {LASMesh} from '../src/lib/las-types';

type LAZFixture = {
  label: string;
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  lasUrl: string;
  lazUrl: string;
  metadata?: Partial<LAZChunkMetadata>;
};

type CollectedAttributes = {
  positions: number[];
  intensities: number[];
  classifications: number[];
  colors: number[];
};

const POINT_COUNT = 1024;
const CHUNK_POINT_COUNT = 256;
const TEST_BATCH_SIZE = 127;
const TEST_INPUT_CHUNK_SIZE = 257;

const FIXTURES: LAZFixture[] = [
  {
    label: 'LAS 1.3 PDRF 4',
    pointDataRecordFormat: 4,
    pointDataRecordLength: 61,
    lasUrl: '@loaders.gl/las/test/data/pdrf4-1.3.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf4-1.3.laz'
  },
  {
    label: 'LAS 1.3 PDRF 5',
    pointDataRecordFormat: 5,
    pointDataRecordLength: 67,
    lasUrl: '@loaders.gl/las/test/data/pdrf5-1.3.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf5-1.3.laz'
  },
  {
    label: 'LAS 1.4 PDRF 6',
    pointDataRecordFormat: 6,
    pointDataRecordLength: 34,
    lasUrl: '@loaders.gl/las/test/data/pdrf6-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf6-1.4.laz',
    metadata: {point14ItemVersion: 3, byte14ItemVersion: 3}
  },
  {
    label: 'LAS 1.4 PDRF 7 item version 4',
    pointDataRecordFormat: 7,
    pointDataRecordLength: 40,
    lasUrl: '@loaders.gl/las/test/data/pdrf7-v4-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf7-v4-1.4.laz',
    metadata: {point14ItemVersion: 4, rgb14ItemVersion: 4, byte14ItemVersion: 4}
  },
  {
    label: 'LAS 1.4 PDRF 8',
    pointDataRecordFormat: 8,
    pointDataRecordLength: 42,
    lasUrl: '@loaders.gl/las/test/data/pdrf8-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf8-1.4.laz',
    metadata: {point14ItemVersion: 3, rgb14ItemVersion: 3, byte14ItemVersion: 3}
  },
  {
    label: 'LAS 1.4 PDRF 9',
    pointDataRecordFormat: 9,
    pointDataRecordLength: 63,
    lasUrl: '@loaders.gl/las/test/data/pdrf9-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf9-1.4.laz',
    metadata: {point14ItemVersion: 3, wavePacketItemVersion: 3, byte14ItemVersion: 3}
  },
  {
    label: 'LAS 1.4 PDRF 10',
    pointDataRecordFormat: 10,
    pointDataRecordLength: 71,
    lasUrl: '@loaders.gl/las/test/data/pdrf10-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf10-1.4.laz',
    metadata: {
      point14ItemVersion: 3,
      rgb14ItemVersion: 3,
      wavePacketItemVersion: 3,
      byte14ItemVersion: 3
    }
  }
];

test('TypeScript LAZ raw streaming preserves PDRF 4-10 records', async t => {
  for (const fixture of FIXTURES) {
    const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
      loadArrayBuffer(fixture.lasUrl),
      loadArrayBuffer(fixture.lazUrl)
    ]);
    const decodedBatches: Uint8Array[] = [];

    for await (const batch of decodeLAZFileInBatches(
      splitArrayBuffer(lazArrayBuffer, TEST_INPUT_CHUNK_SIZE),
      {batchSize: TEST_BATCH_SIZE}
    )) {
      decodedBatches.push(new Uint8Array(batch.arrayBuffer));
    }

    const expected = getLASPointData(lasArrayBuffer, fixture.pointDataRecordLength);
    const actual = concatenateUint8Arrays(decodedBatches);
    t.equal(
      actual.byteLength,
      expected.byteLength,
      `${fixture.label} raw record byte length matches LAS`
    );
    t.deepEqual(actual, expected, `${fixture.label} raw records match LAS`);
  }
  t.end();
}, 60000);

test('TypeScript LAZ complete and split parsing preserve Arrow attributes', async t => {
  for (const fixture of FIXTURES) {
    const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
      loadArrayBuffer(fixture.lasUrl),
      loadArrayBuffer(fixture.lazUrl)
    ]);
    const expected = collectTableAttributes(parseLAS(lasArrayBuffer));
    const complete = collectTableAttributes(parseLAS(lazArrayBuffer));
    const streamed = await collectBatchAttributes(
      parseLASInBatches(splitArrayBuffer(lazArrayBuffer, TEST_INPUT_CHUNK_SIZE), {
        batchSize: TEST_BATCH_SIZE
      })
    );

    for (const attributeName of Object.keys(expected) as Array<keyof CollectedAttributes>) {
      t.equal(
        complete[attributeName].length,
        expected[attributeName].length,
        `${fixture.label} complete ${attributeName} length matches LAS`
      );
      t.equal(
        streamed[attributeName].length,
        expected[attributeName].length,
        `${fixture.label} split ${attributeName} length matches LAS`
      );
    }
    t.deepEqual(complete, expected, `${fixture.label} complete parse matches LAS`);
    t.deepEqual(streamed, expected, `${fixture.label} split parse matches LAS`);
  }
  t.end();
}, 60000);

test('TypeScript LAZ selective Point14 targets decode only requested layers', async t => {
  const fixture = FIXTURES.find(({pointDataRecordFormat}) => pointDataRecordFormat === 7)!;
  const lazArrayBuffer = await loadArrayBuffer(fixture.lazUrl);
  const {compressed, metadata} = getFirstLAZChunk(lazArrayBuffer, fixture);
  const rawPointData = decodeLAZChunk(compressed, metadata);
  const expected = getExpectedPointData(rawPointData, metadata);

  const targets: Array<{
    label: string;
    createTarget: () => LAZPointDataTarget;
    validate: (target: LAZPointDataTarget) => void;
  }> = [
    {
      label: 'positions only',
      createTarget: () => createPointDataTarget(metadata.pointCount),
      validate: target => t.deepEqual(target.positions, expected.positions, 'positions match')
    },
    {
      label: 'intensity only',
      createTarget: () => ({
        ...createPointDataTarget(metadata.pointCount),
        intensities: new Uint16Array(metadata.pointCount)
      }),
      validate: target => t.deepEqual(target.intensities, expected.intensities, 'intensity matches')
    },
    {
      label: 'classification only',
      createTarget: () => ({
        ...createPointDataTarget(metadata.pointCount),
        classifications: new Uint8Array(metadata.pointCount)
      }),
      validate: target =>
        t.deepEqual(target.classifications, expected.classifications, 'classification matches')
    },
    {
      label: 'classification flags only',
      createTarget: () => ({
        ...createPointDataTarget(metadata.pointCount),
        syntheticFlags: new Uint8Array(metadata.pointCount),
        keyPointFlags: new Uint8Array(metadata.pointCount),
        withheldFlags: new Uint8Array(metadata.pointCount),
        overlapFlags: new Uint8Array(metadata.pointCount)
      }),
      validate: target => {
        t.deepEqual(target.syntheticFlags, expected.syntheticFlags, 'synthetic flags match');
        t.deepEqual(target.keyPointFlags, expected.keyPointFlags, 'key-point flags match');
        t.deepEqual(target.withheldFlags, expected.withheldFlags, 'withheld flags match');
        t.deepEqual(target.overlapFlags, expected.overlapFlags, 'overlap flags match');
      }
    },
    {
      label: 'RGB only',
      createTarget: () => ({
        ...createPointDataTarget(metadata.pointCount),
        rawColors: new Uint16Array(metadata.pointCount * 3)
      }),
      validate: target => t.deepEqual(target.rawColors, expected.rawColors, 'RGB matches')
    }
  ];

  for (const selection of targets) {
    const target = selection.createTarget();
    const cursor = createLAZChunkDecoderCursor(compressed, metadata);
    t.equal(
      cursor.decodeIntoPointData(target, metadata.pointCount),
      metadata.pointCount,
      `${selection.label} decodes every point`
    );
    selection.validate(target);
  }

  const lockedTarget = createPointDataTarget(metadata.pointCount);
  const lockedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  lockedCursor.decodeIntoPointData(lockedTarget, 1);
  t.throws(
    () =>
      lockedCursor.decodeIntoPointData(
        {...lockedTarget, classifications: new Uint8Array(metadata.pointCount)},
        1
      ),
    /Cannot change selected point-data fields/,
    'selection cannot change after decoding begins'
  );
  t.end();
}, 60000);

test('TypeScript LAZ skips unrequested RGB and auxiliary PDRF 8-10 layers', async t => {
  for (const fixture of FIXTURES.filter(({pointDataRecordFormat}) =>
    [8, 9, 10].includes(pointDataRecordFormat)
  )) {
    const lazArrayBuffer = await loadArrayBuffer(fixture.lazUrl);
    const {compressed, metadata} = getFirstLAZChunk(lazArrayBuffer, fixture);
    const rawPointData = decodeLAZChunk(compressed, metadata);
    const expected = getExpectedPointData(rawPointData, metadata);
    const target = createPointDataTarget(metadata.pointCount);
    const cursor = createLAZChunkDecoderCursor(compressed, metadata);

    t.equal(
      cursor.decodeIntoPointData(target, metadata.pointCount),
      metadata.pointCount,
      `${fixture.label} positions-only target decodes every point`
    );
    t.deepEqual(
      target.positions,
      expected.positions,
      `${fixture.label} positions match raw records`
    );
  }
  t.end();
}, 60000);

vitestTest('TypeScript LAZ progressively delivers PDRF 8 RGB and NIR', async () => {
  const fixture = FIXTURES.find(({pointDataRecordFormat}) => pointDataRecordFormat === 8)!;
  const lazArrayBuffer = await loadArrayBuffer(fixture.lazUrl);
  const {compressed, metadata} = getFirstLAZChunk(lazArrayBuffer, fixture);
  const expectedPositions = new Float64Array(metadata.pointCount * 3);
  const expectedColors = new Uint16Array(metadata.pointCount * 3);
  const expectedNir = new Uint16Array(metadata.pointCount);
  const expectedCursor = createLAZChunkDecoderCursor(compressed, metadata);

  expectedCursor.decodeIntoPointData(
    {
      positions: expectedPositions,
      rawColors: expectedColors,
      nir: expectedNir,
      pointOffset: 0,
      scale: [1, 1, 1],
      offset: [0, 0, 0]
    },
    metadata.pointCount
  );

  const decoder = createLAZChunkDecoder(metadata);
  const positions = new Float64Array(metadata.pointCount * 3);
  const colors = new Uint16Array(metadata.pointCount * 3);
  const nir = new Uint16Array(metadata.pointCount);
  let decodedPointCount = 0;
  let firstDecodedByteLength = -1;

  for (let offset = 0; offset < compressed.byteLength; offset += TEST_INPUT_CHUNK_SIZE) {
    const end = Math.min(offset + TEST_INPUT_CHUNK_SIZE, compressed.byteLength);
    decoder.feed(compressed.subarray(offset, end));
    let batchPointCount = decoder.readPointDataBatch(
      {
        positions,
        rawColors: colors,
        nir,
        pointOffset: decodedPointCount,
        scale: [1, 1, 1],
        offset: [0, 0, 0]
      },
      metadata.pointCount - decodedPointCount
    );
    while (batchPointCount && batchPointCount > 0) {
      firstDecodedByteLength = firstDecodedByteLength < 0 ? end : firstDecodedByteLength;
      decodedPointCount += batchPointCount;
      batchPointCount = decoder.readPointDataBatch(
        {
          positions,
          rawColors: colors,
          nir,
          pointOffset: decodedPointCount,
          scale: [1, 1, 1],
          offset: [0, 0, 0]
        },
        metadata.pointCount - decodedPointCount
      );
    }
  }

  expect(decodedPointCount).toBe(metadata.pointCount);
  expect(firstDecodedByteLength > 0 && firstDecodedByteLength < compressed.byteLength).toBe(true);
  expect(positions).toEqual(expectedPositions);
  expect(colors).toEqual(expectedColors);
  expect(nir).toEqual(expectedNir);
});

vitestTest('TypeScript LAZ does not wait for unrequested Point14 layers', async () => {
  const fixture = FIXTURES.find(({pointDataRecordFormat}) => pointDataRecordFormat === 7)!;
  const lazArrayBuffer = await loadArrayBuffer(fixture.lazUrl);
  const {compressed, metadata} = getFirstLAZChunk(lazArrayBuffer, fixture);
  const expectedPositions = new Float64Array(metadata.pointCount * 3);
  const expectedClassifications = new Uint8Array(metadata.pointCount);
  const expectedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  expectedCursor.decodeIntoPointData(
    {
      positions: expectedPositions,
      classifications: expectedClassifications,
      pointOffset: 0,
      scale: [1, 1, 1],
      offset: [0, 0, 0]
    },
    metadata.pointCount
  );

  const decoder = createLAZChunkDecoder(metadata);
  const positions = new Float64Array(metadata.pointCount * 3);
  const classifications = new Uint8Array(metadata.pointCount);
  let decodedPointCount = 0;
  let firstDecodedByteLength = -1;
  for (let offset = 0; offset < compressed.byteLength; offset += TEST_INPUT_CHUNK_SIZE) {
    const end = Math.min(offset + TEST_INPUT_CHUNK_SIZE, compressed.byteLength);
    decoder.feed(compressed.subarray(offset, end));
    const decoded = decoder.readPointDataBatch(
      {
        positions,
        classifications,
        pointOffset: decodedPointCount,
        scale: [1, 1, 1],
        offset: [0, 0, 0]
      },
      metadata.pointCount - decodedPointCount
    );
    if (decoded) {
      firstDecodedByteLength = end;
      decodedPointCount += decoded;
      break;
    }
  }

  expect(decodedPointCount).toBe(metadata.pointCount);
  expect(firstDecodedByteLength > 0 && firstDecodedByteLength < compressed.byteLength).toBe(true);
  expect(positions).toEqual(expectedPositions);
  expect(classifications).toEqual(expectedClassifications);
});

test('TypeScript LAZ validates VLR codecs and truncated input', async t => {
  const fixture = FIXTURES.find(({pointDataRecordFormat}) => pointDataRecordFormat === 7)!;
  const source = await loadArrayBuffer(fixture.lazUrl);
  const vlrDataOffset = findLASZipVLRDataOffset(source);
  const itemOffset = findLASZipItemOffset(source, 11);
  const cases = [
    {
      label: 'arithmetic coder',
      mutate: (dataView: DataView) => dataView.setUint16(vlrDataOffset + 2, 1, true),
      error: /requires LASzip arithmetic coder 0; received 1/
    },
    {
      label: 'item type',
      mutate: (dataView: DataView) => dataView.setUint16(itemOffset, 12, true),
      error: /type 12; expected 11/
    },
    {
      label: 'item size',
      mutate: (dataView: DataView) => dataView.setUint16(itemOffset + 2, 5, true),
      error: /size 5; expected 6/
    },
    {
      label: 'item version',
      mutate: (dataView: DataView) => dataView.setUint16(itemOffset + 4, 5, true),
      error: /unsupported LAS 1\.4 item type 11 version 5/
    }
  ];

  for (const fixtureCase of cases) {
    const corrupted = source.slice(0);
    fixtureCase.mutate(new DataView(corrupted));
    t.throws(() => parseLAS(corrupted), fixtureCase.error, `rejects invalid ${fixtureCase.label}`);
  }

  t.throws(
    () => parseLAS(source.slice(0, source.byteLength - 32)),
    /needs more|truncated|beyond input/i,
    'rejects truncated compressed point data'
  );
  t.end();
});

test('LASLoader primary TypeScript variant uses its packaged worker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const fixture = FIXTURES.find(({pointDataRecordFormat}) => pointDataRecordFormat === 7)!;
  const arrayBuffer = await loadArrayBuffer(fixture.lazUrl);
  const workerResult = (await parse(arrayBuffer.slice(0), LASLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'}
  })) as LASMesh;
  const mainThreadResult = (await parse(arrayBuffer.slice(0), LASLoader, {
    core: {worker: false}
  })) as LASMesh;

  t.equal(workerResult.header.vertexCount, POINT_COUNT, 'TypeScript worker decodes LAS 1.4 PDRF 7');
  t.deepEqual(
    workerResult.attributes.POSITION.value,
    mainThreadResult.attributes.POSITION.value,
    'worker positions match main-thread TypeScript output'
  );
  t.deepEqual(
    workerResult.attributes.COLOR_0.value,
    mainThreadResult.attributes.COLOR_0.value,
    'worker colors match main-thread TypeScript output'
  );
  t.end();
});

/** Load one local LAS/LAZ fixture. */
async function loadArrayBuffer(url: string): Promise<ArrayBuffer> {
  return (await fetchFile(url)).arrayBuffer();
}

/** Return the complete point-record region from an uncompressed fixture. */
function getLASPointData(arrayBuffer: ArrayBuffer, pointDataRecordLength: number): Uint8Array {
  const pointDataOffset = new DataView(arrayBuffer).getUint32(96, true);
  return new Uint8Array(arrayBuffer, pointDataOffset, POINT_COUNT * pointDataRecordLength);
}

/** Extract the first fixed-size compressed chunk and its codec metadata. */
function getFirstLAZChunk(
  arrayBuffer: ArrayBuffer,
  fixture: LAZFixture
): {compressed: Uint8Array; metadata: LAZChunkMetadata} {
  const pointDataOffset = new DataView(arrayBuffer).getUint32(96, true);
  const metadata: LAZChunkMetadata = {
    pointCount: CHUNK_POINT_COUNT,
    pointDataRecordFormat: fixture.pointDataRecordFormat,
    pointDataRecordLength: fixture.pointDataRecordLength,
    ...fixture.metadata
  };
  const remaining = new Uint8Array(arrayBuffer, pointDataOffset + 8);
  const byteLength = getLAZChunkByteLength(remaining, metadata);
  return {compressed: remaining.subarray(0, byteLength), metadata};
}

/** Allocate the always-required direct output columns. */
function createPointDataTarget(pointCount: number): LAZPointDataTarget {
  return {
    positions: new Float64Array(pointCount * 3),
    pointOffset: 0,
    scale: [1, 1, 1],
    offset: [0, 0, 0]
  };
}

/** Extract direct-output oracle columns from complete raw PDRF 6-10 records. */
function getExpectedPointData(
  rawPointData: Uint8Array,
  metadata: LAZChunkMetadata
): {
  positions: Float64Array;
  intensities: Uint16Array;
  classifications: Uint8Array;
  syntheticFlags: Uint8Array;
  keyPointFlags: Uint8Array;
  withheldFlags: Uint8Array;
  overlapFlags: Uint8Array;
  rawColors: Uint16Array;
} {
  const dataView = new DataView(
    rawPointData.buffer,
    rawPointData.byteOffset,
    rawPointData.byteLength
  );
  const positions = new Float64Array(metadata.pointCount * 3);
  const intensities = new Uint16Array(metadata.pointCount);
  const classifications = new Uint8Array(metadata.pointCount);
  const syntheticFlags = new Uint8Array(metadata.pointCount);
  const keyPointFlags = new Uint8Array(metadata.pointCount);
  const withheldFlags = new Uint8Array(metadata.pointCount);
  const overlapFlags = new Uint8Array(metadata.pointCount);
  const rawColors = new Uint16Array(metadata.pointCount * 3);

  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const recordOffset = pointIndex * metadata.pointDataRecordLength;
    const positionOffset = pointIndex * 3;
    positions[positionOffset] = dataView.getInt32(recordOffset, true);
    positions[positionOffset + 1] = dataView.getInt32(recordOffset + 4, true);
    positions[positionOffset + 2] = dataView.getInt32(recordOffset + 8, true);
    intensities[pointIndex] = dataView.getUint16(recordOffset + 12, true);
    classifications[pointIndex] = dataView.getUint8(recordOffset + 16);
    const classificationFlags = dataView.getUint8(recordOffset + 15);
    syntheticFlags[pointIndex] = classificationFlags & 1;
    keyPointFlags[pointIndex] = (classificationFlags >> 1) & 1;
    withheldFlags[pointIndex] = (classificationFlags >> 2) & 1;
    overlapFlags[pointIndex] = (classificationFlags >> 3) & 1;
    if ([7, 8, 10].includes(metadata.pointDataRecordFormat)) {
      rawColors[positionOffset] = dataView.getUint16(recordOffset + 30, true);
      rawColors[positionOffset + 1] = dataView.getUint16(recordOffset + 32, true);
      rawColors[positionOffset + 2] = dataView.getUint16(recordOffset + 34, true);
    }
  }
  return {
    positions,
    intensities,
    classifications,
    syntheticFlags,
    keyPointFlags,
    withheldFlags,
    overlapFlags,
    rawColors
  };
}

/** Collect represented attributes from one Arrow table. */
function collectTableAttributes(table: LASArrowTable): CollectedAttributes {
  const {attributes} = convertTableToMesh(table);
  return {
    positions: Array.from(attributes.POSITION.value),
    intensities: Array.from(attributes.intensity.value),
    classifications: Array.from(attributes.classification.value),
    colors: Array.from(attributes.COLOR_0?.value || [])
  };
}

/** Collect represented attributes from an Arrow table batch iterator. */
async function collectBatchAttributes(
  batches: AsyncIterable<LASArrowTable>
): Promise<CollectedAttributes> {
  const result: CollectedAttributes = {
    positions: [],
    intensities: [],
    classifications: [],
    colors: []
  };
  for await (const batch of batches) {
    const attributes = collectTableAttributes(batch);
    result.positions.push(...attributes.positions);
    result.intensities.push(...attributes.intensities);
    result.classifications.push(...attributes.classifications);
    result.colors.push(...attributes.colors);
  }
  return result;
}

/** Yield independent copies at deterministic streaming boundaries. */
async function* splitArrayBuffer(
  arrayBuffer: ArrayBuffer,
  chunkSize: number
): AsyncIterable<ArrayBuffer> {
  const bytes = new Uint8Array(arrayBuffer);
  for (let byteOffset = 0; byteOffset < bytes.byteLength; byteOffset += chunkSize) {
    yield bytes.slice(byteOffset, Math.min(byteOffset + chunkSize, bytes.byteLength)).buffer;
  }
}

/** Concatenate raw output batches for byte-for-byte parity assertions. */
function concatenateUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const byteLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const chunk of chunks) {
    result.set(chunk, byteOffset);
    byteOffset += chunk.byteLength;
  }
  return result;
}

/** Find the LASzip VLR payload in a fixture. */
function findLASZipVLRDataOffset(arrayBuffer: ArrayBuffer): number {
  const dataView = new DataView(arrayBuffer);
  let byteOffset = dataView.getUint16(94, true);
  const variableLengthRecordCount = dataView.getUint32(100, true);
  for (let recordIndex = 0; recordIndex < variableLengthRecordCount; recordIndex++) {
    const recordId = dataView.getUint16(byteOffset + 18, true);
    const recordLength = dataView.getUint16(byteOffset + 20, true);
    const dataOffset = byteOffset + 54;
    if (recordId === 22204) {
      return dataOffset;
    }
    byteOffset = dataOffset + recordLength;
  }
  throw new Error('LASzip VLR not found');
}

/** Find one LASzip item descriptor in a fixture. */
function findLASZipItemOffset(arrayBuffer: ArrayBuffer, targetItemType: number): number {
  const dataView = new DataView(arrayBuffer);
  const dataOffset = findLASZipVLRDataOffset(arrayBuffer);
  const itemCount = dataView.getUint16(dataOffset + 32, true);
  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const itemOffset = dataOffset + 34 + itemIndex * 6;
    if (dataView.getUint16(itemOffset, true) === targetItemType) {
      return itemOffset;
    }
  }
  throw new Error(`LASzip item type ${targetItemType} not found`);
}
