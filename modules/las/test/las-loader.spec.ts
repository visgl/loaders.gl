// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {validateLoader} from 'test/common/conformance';

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
