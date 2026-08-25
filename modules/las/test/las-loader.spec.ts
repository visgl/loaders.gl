// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {validateLoader} from 'test/common/conformance';
import {parseLASHeader} from '../src/lib/typescript/parse-las';

const PDRF_4_LAS_URL = '@loaders.gl/las/test/data/pdrf4-1.3.las';
const PDRF_4_LAZ_URL = '@loaders.gl/las/test/data/pdrf4-1.3.laz';
const PDRF_7_LAS_URL = '@loaders.gl/las/test/data/pdrf7-v4-1.4.las';
const PDRF_7_LAZ_URL = '@loaders.gl/las/test/data/pdrf7-v4-1.4.laz';
const PDRF_8_LAS_URL = '@loaders.gl/las/test/data/pdrf8-1.4.las';
const PDRF_8_LAZ_URL = '@loaders.gl/las/test/data/pdrf8-1.4.laz';
const POINT_COUNT = 1024;

test('LASLoader#loader conformance', () => {
  validateLoader(LASLoader, 'LASLoader');
  validateLoader(LASWorkerLoader, 'LASWorkerLoader');
});

test('LASLoader#small uncompressed and compressed fixtures agree', async () => {
  const lasArrayBuffer = await (await fetchFile(PDRF_4_LAS_URL)).arrayBuffer();
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const loaderOptions = {core: {worker: false}};
  const uncompressed = await parse(lasArrayBuffer, LASLoader, loaderOptions);
  const compressed = await parse(lazArrayBuffer, LASLoader, loaderOptions);

  expect(compressed.header.vertexCount).toBe(POINT_COUNT);
  expect(compressed.loaderData.versionAsString).toBe('1.3');
  expect(compressed.loaderData.pointsFormatId).toBe(4);
  expect(compressed.attributes.POSITION.value).toEqual(uncompressed.attributes.POSITION.value);
  expect(compressed.attributes.intensity.value).toEqual(uncompressed.attributes.intensity.value);
  expect(compressed.attributes.classification.value).toEqual(
    uncompressed.attributes.classification.value
  );
});

test('LASLoader#small fixture streams requested mesh batches', async () => {
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const batches = await parseInBatches(lazArrayBuffer, LASLoader, {
    batchSize: 127,
    core: {worker: false}
  });
  const batchVertexCounts: number[] = [];

  for await (const batch of batches as AsyncIterable<any>) {
    batchVertexCounts.push(batch.header.vertexCount);
    expect(batch.attributes.POSITION.value.length).toBe(batch.header.vertexCount * 3);
  }

  expect(batchVertexCounts).toEqual([...new Array(8).fill(127), 8]);
});

test('LASLoader#small fixture emits an Arrow table', async () => {
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const table = await parse(lazArrayBuffer, LASLoader, {
    las: {shape: 'arrow-table'},
    core: {worker: false}
  });

  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(POINT_COUNT);
  expect(table.data.getChild('POSITION')).toBeTruthy();
  expect(table.data.getChild('intensity')).toBeTruthy();
});

test('LASLoader#columns decodes only requested PDRF 7 Arrow columns', async () => {
  const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
    fetchFile(PDRF_7_LAS_URL).then(response => response.arrayBuffer()),
    fetchFile(PDRF_7_LAZ_URL).then(response => response.arrayBuffer())
  ]);
  const options = {
    las: {
      shape: 'arrow-table' as const,
      columns: ['POSITION', 'COLOR_0', 'GPS_TIME'] as const
    },
    core: {worker: false}
  };
  const uncompressed = (await parse(lasArrayBuffer, LASLoader, options)) as MeshArrowTable;
  const compressed = (await parse(lazArrayBuffer, LASLoader, options)) as MeshArrowTable;

  expect(getArrowColumnNames(compressed)).toEqual(['POSITION', 'COLOR_0', 'GPS_TIME']);
  expect(getArrowColumnValues(compressed, 'POSITION')).toEqual(
    getArrowColumnValues(uncompressed, 'POSITION')
  );
  expect(getArrowColumnValues(compressed, 'COLOR_0')).toEqual(
    getArrowColumnValues(uncompressed, 'COLOR_0')
  );
  expect(getArrowColumnValues(compressed, 'GPS_TIME')).toEqual(
    getArrowColumnValues(uncompressed, 'GPS_TIME')
  );

  const positionsOnlyMesh = await parse(lasArrayBuffer, LASLoader, {
    las: {columns: []},
    core: {worker: false}
  });
  expect(Object.keys(positionsOnlyMesh.attributes)).toEqual(['POSITION']);
});

test('LASLoader#parseInBatches preserves selected columns across chunked PDRF 7 input', async () => {
  const lazArrayBuffer = await fetchFile(PDRF_7_LAZ_URL).then(response => response.arrayBuffer());
  const expected = (await parse(lazArrayBuffer, LASLoader, {
    las: {shape: 'arrow-table', columns: ['intensity', 'classification']},
    core: {worker: false}
  })) as MeshArrowTable;
  const batches = await parseInBatches(splitArrayBuffer(lazArrayBuffer, 257), LASLoader, {
    batchSize: 127,
    las: {shape: 'arrow-table', columns: ['intensity', 'classification']},
    core: {worker: false}
  });
  const streamedColumns = {
    POSITION: [] as unknown[],
    intensity: [] as unknown[],
    classification: [] as unknown[]
  };

  for await (const batch of batches as AsyncIterable<MeshArrowTable>) {
    expect(getArrowColumnNames(batch)).toEqual(['POSITION', 'intensity', 'classification']);
    streamedColumns.POSITION.push(...getArrowColumnValues(batch, 'POSITION'));
    streamedColumns.intensity.push(...getArrowColumnValues(batch, 'intensity'));
    streamedColumns.classification.push(...getArrowColumnValues(batch, 'classification'));
  }

  expect(streamedColumns.POSITION).toEqual(getArrowColumnValues(expected, 'POSITION'));
  expect(streamedColumns.intensity).toEqual(getArrowColumnValues(expected, 'intensity'));
  expect(streamedColumns.classification).toEqual(getArrowColumnValues(expected, 'classification'));
});

test('LASLoader#columns decodes GPS time and NIR for PDRF 8', async () => {
  const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
    fetchFile(PDRF_8_LAS_URL).then(response => response.arrayBuffer()),
    fetchFile(PDRF_8_LAZ_URL).then(response => response.arrayBuffer())
  ]);
  const options = {
    las: {shape: 'arrow-table' as const, columns: ['POSITION', 'GPS_TIME', 'NIR'] as const},
    core: {worker: false}
  };
  const uncompressed = (await parse(lasArrayBuffer, LASLoader, options)) as MeshArrowTable;
  const compressed = (await parse(lazArrayBuffer, LASLoader, options)) as MeshArrowTable;

  expect(getArrowColumnNames(compressed)).toEqual(['POSITION', 'GPS_TIME', 'NIR']);
  expect(getArrowColumnValues(compressed, 'POSITION')).toEqual(
    getArrowColumnValues(uncompressed, 'POSITION')
  );
  expect(getArrowColumnValues(compressed, 'GPS_TIME')).toEqual(
    getArrowColumnValues(uncompressed, 'GPS_TIME')
  );
  expect(getArrowColumnValues(compressed, 'NIR')).toEqual(
    getArrowColumnValues(uncompressed, 'NIR')
  );
  const metadata = compressed.loaderData.metadata;
  expect(
    metadata?.vlrs.some(record => record.userId === 'LASF_Spec' && record.recordId === 4)
  ).toBe(true);
  expect(metadata?.extraBytes).toHaveLength(4);
  expect(metadata?.extraBytes[0].data.byteLength).toBe(192);

  const batches = await parseInBatches(splitArrayBuffer(lazArrayBuffer, 257), LASLoader, {
    batchSize: 127,
    las: {shape: 'arrow-table', columns: ['POSITION', 'GPS_TIME', 'NIR']},
    core: {worker: false}
  });
  const streamedValues = {
    POSITION: [] as unknown[],
    GPS_TIME: [] as unknown[],
    NIR: [] as unknown[]
  };
  for await (const batch of batches as AsyncIterable<MeshArrowTable>) {
    expect(getArrowColumnNames(batch)).toEqual(['POSITION', 'GPS_TIME', 'NIR']);
    streamedValues.POSITION.push(...getArrowColumnValues(batch, 'POSITION'));
    streamedValues.GPS_TIME.push(...getArrowColumnValues(batch, 'GPS_TIME'));
    streamedValues.NIR.push(...getArrowColumnValues(batch, 'NIR'));
  }
  expect(streamedValues.POSITION).toEqual(getArrowColumnValues(uncompressed, 'POSITION'));
  expect(streamedValues.GPS_TIME).toEqual(getArrowColumnValues(uncompressed, 'GPS_TIME'));
  expect(streamedValues.NIR).toEqual(getArrowColumnValues(uncompressed, 'NIR'));
});

test('LASLoader#columns validates unsupported names', async () => {
  const lasArrayBuffer = await fetchFile(PDRF_4_LAS_URL).then(response => response.arrayBuffer());

  await expect(
    parse(lasArrayBuffer, LASLoader, {
      las: {shape: 'arrow-table', columns: ['unsupported' as never]},
      core: {worker: false}
    })
  ).rejects.toThrow('LASLoader: unsupported column unsupported');
});

test('LASLoader#metadata parses LAS 1.4 CRS and waveform records', () => {
  const wktMathTransform = new TextEncoder().encode('PARAM_MT["transform"]');
  const wktCoordinateSystem = new TextEncoder().encode('GEOGCS["coordinate-system"]');
  const geoKeyDirectory = new Uint8Array(8);
  new DataView(geoKeyDirectory.buffer).setUint16(0, 1, true);
  new DataView(geoKeyDirectory.buffer).setUint16(2, 1, true);
  const geoDoubleParameters = new ArrayBuffer(8);
  new DataView(geoDoubleParameters).setFloat64(0, 4326, true);
  const geoAsciiParameters = new TextEncoder().encode('WGS 84|');
  const waveform = new ArrayBuffer(28);
  const waveformView = new DataView(waveform);
  waveformView.setUint8(2, 16);
  waveformView.setUint8(3, 0);
  waveformView.setUint32(4, 128, true);
  waveformView.setUint32(8, 250, true);
  waveformView.setFloat64(12, 1.5, true);
  waveformView.setFloat64(20, -2.5, true);

  const records = [
    makeLASVLR('LASF_Projection', 2111, wktMathTransform),
    makeLASVLR('LASF_Projection', 2112, wktCoordinateSystem),
    makeLASVLR('LASF_Projection', 34735, geoKeyDirectory),
    makeLASVLR('LASF_Projection', 34736, new Uint8Array(geoDoubleParameters)),
    makeLASVLR('LASF_Projection', 34737, geoAsciiParameters),
    makeLASVLR('LASF_Spec', 100, new Uint8Array(waveform))
  ];
  const headerSize = 375;
  const pointsOffset = headerSize + records.reduce((size, record) => size + record.byteLength, 0);
  const arrayBuffer = new ArrayBuffer(pointsOffset);
  const bytes = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 0x4653414c, true);
  bytes[24] = 1;
  bytes[25] = 4;
  dataView.setUint16(94, headerSize, true);
  dataView.setUint32(96, pointsOffset, true);
  dataView.setUint32(100, records.length, true);
  bytes[104] = 0;
  dataView.setUint16(105, 20, true);
  bytes.set(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0x34, 0x12, 0x78, 0x56]), 8);
  bytes.set(Uint8Array.from([0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78]), 16);
  let offset = headerSize;
  for (const record of records) {
    bytes.set(record, offset);
    offset += record.byteLength;
  }

  const metadata = parseLASHeader(arrayBuffer).metadata!;
  expect(metadata.projectId).toBe('12345678-1234-5678-9abcdef012345678');
  expect(metadata.wkt).toBe('GEOGCS["coordinate-system"]');
  expect(metadata.wktMathTransform).toBe('PARAM_MT["transform"]');
  expect(metadata.geotiff?.keys).toEqual(new Uint16Array([1, 1, 0, 0]));
  expect(metadata.geotiff?.doubles).toEqual(new Float64Array([4326]));
  expect(metadata.geotiff?.ascii).toBe('WGS 84|');
  expect(metadata.waveformPacketDescriptors[0]).toMatchObject({
    bitsPerSample: 16,
    numberOfSamples: 128,
    temporalSampleSpacing: 250,
    digitizerGain: 1.5,
    digitizerOffset: -2.5
  });
});

/** Return Arrow field names in schema order. */
function getArrowColumnNames(table: MeshArrowTable): string[] {
  return table.data.schema.fields.map(field => field.name);
}

/** Materialize one Arrow column for parity assertions. */
function getArrowColumnValues(table: MeshArrowTable, columnName: string): unknown[] {
  const column = table.data.getChild(columnName);
  if (!column) {
    throw new Error(`Missing Arrow column ${columnName}`);
  }
  return Array.from(column, value =>
    value && typeof value === 'object' && Symbol.iterator in value
      ? Array.from(value as Iterable<unknown>)
      : value
  );
}

/** Split fixture bytes at deterministic non-record-aligned boundaries. */
function splitArrayBuffer(arrayBuffer: ArrayBuffer, chunkByteLength: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  for (let byteOffset = 0; byteOffset < arrayBuffer.byteLength; byteOffset += chunkByteLength) {
    chunks.push(arrayBuffer.slice(byteOffset, byteOffset + chunkByteLength));
  }
  return chunks;
}

function makeLASVLR(userId: string, recordId: number, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(54 + data.byteLength);
  const dataView = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode(userId).subarray(0, 16), 2);
  dataView.setUint16(18, recordId, true);
  dataView.setUint16(20, data.byteLength, true);
  bytes.set(data, 54);
  return bytes;
}
