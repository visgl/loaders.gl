// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {fetchFile, load} from '@loaders.gl/core';
import {parseBSONSync} from '@loaders.gl/bson';
import {ArrayBufferFile} from '@loaders.gl/loader-utils';
import {ParquetJSLoader, ParquetReader} from '@loaders.gl/parquet';

test('ParquetJSLoader projects nested and repeated columns directly to Arrow', async () => {
  const table = await load(
    '@loaders.gl/parquet/test/data/fruits.parquet',
    ParquetJSLoader,
    {
      core: {worker: false},
      parquet: {
        shape: 'arrow-table',
        columns: ['stock', 'colour'],
        offset: 1,
        limit: 3,
        batchSize: 2
      }
    }
  );

  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') {
    return;
  }

  expect(table.data.schema.fields.map(field => field.name)).toEqual(['stock', 'colour']);
  expect(table.data.batches.map(batch => batch.numRows)).toEqual([2, 1]);
  expect(table.data.getChild('colour')?.get(0)?.toArray()).toEqual(['orange']);
  const stock = JSON.parse(
    JSON.stringify(table.data.getChild('stock')?.toArray(), (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
  expect(stock).toEqual([
    [{quantity: ['50', '33'], warehouse: 'X'}],
    [
      {quantity: ['42'], warehouse: 'f'},
      {quantity: ['20'], warehouse: 'x'}
    ],
    []
  ]);
});

test('ParquetJSLoader retains byte-backed logical columns directly in Arrow', async () => {
  const table = await load(
    '@loaders.gl/parquet/test/data/fruits.parquet',
    ParquetJSLoader,
    {
      core: {worker: false},
      parquet: {
        shape: 'arrow-table',
        columns: ['inter', 'meta_json'],
        limit: 4
      }
    }
  );

  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') {
    return;
  }

  const interval = table.data.getChild('inter')?.get(0) as Uint8Array;
  expect(Array.from(interval)).toEqual([42, 0, 0, 0, 23, 0, 0, 0, 9, 3, 0, 0]);

  const metadata = table.data.getChild('meta_json');
  expect(metadata?.get(0)).toBeNull();
  expect(metadata?.get(1)).toBeNull();
  const expectedShipDate = metadata?.get(2) as Uint8Array;
  const curvedShape = metadata?.get(3) as Uint8Array;
  expect(parseBSONSync(toExactArrayBuffer(expectedShipDate))).toHaveProperty('expected_ship_date');
  expect(parseBSONSync(toExactArrayBuffer(curvedShape))).toEqual({shape: 'curved'});
});

test('ParquetJSLoader reuses single-page fixed byte payloads as Arrow Binary data', async () => {
  const response = await fetchFile('@loaders.gl/parquet/test/data/fruits.parquet');
  const parquet = await response.arrayBuffer();
  const table = await load(parquet, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table', columns: ['finger', 'inter']}
  });

  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') return;

  const finger = table.data.getChild('finger');
  const interval = table.data.getChild('inter');
  expect(finger?.data[0].values.buffer).toBe(parquet);
  expect(interval?.data[0].values.buffer).toBe(parquet);
  expect(Array.from(finger?.get(0) as Uint8Array)).toEqual([70, 78, 79, 82, 68]);
  expect(Array.from(interval?.get(0) as Uint8Array)).toEqual([
    42, 0, 0, 0, 23, 0, 0, 0, 9, 3, 0, 0
  ]);
});

test('ParquetReader compacts eligible PLAIN byte arrays for direct Arrow construction', async () => {
  const response = await fetchFile('@loaders.gl/parquet/test/data/fruits.parquet');
  const parquet = await response.arrayBuffer();
  const reader = new ParquetReader(new ArrayBufferFile(parquet), {
    retainByteArrayViews: true,
    useTypedValueBuffers: true,
    useTypedLevelBuffers: true,
    useArrowByteArrayBuffers: true
  });
  const firstRowGroup = await reader.rowGroupIterator({columnList: ['name']}).next();
  const name = firstRowGroup.value?.columnData.name;

  expect(name?.values).toHaveLength(0);
  expect(name?.byteArrayData?.valueOffsets).toHaveLength(4097);
  const firstEnd = name?.byteArrayData?.valueOffsets[1] || 0;
  expect(new TextDecoder().decode(name?.byteArrayData?.data.subarray(0, firstEnd))).toBe('apples');
  reader.close();
});

test('ParquetReader compacts DELTA_BYTE_ARRAY strings for direct Arrow construction', async () => {
  const response = await fetchFile(
    '@loaders.gl/parquet/test/data/apache/good/delta_byte_array.parquet'
  );
  const parquet = await response.arrayBuffer();
  const reader = new ParquetReader(new ArrayBufferFile(parquet), {
    retainByteArrayViews: true,
    useTypedValueBuffers: true,
    useTypedLevelBuffers: true,
    useArrowByteArrayBuffers: true
  });
  const firstRowGroup = await reader.rowGroupIterator({columnList: ['c_customer_id']}).next();
  const customerIdentifier = firstRowGroup.value?.columnData.c_customer_id;

  expect(customerIdentifier?.values).toHaveLength(0);
  expect(customerIdentifier?.byteArrayData?.valueOffsets.length).toBeGreaterThan(1);
  const firstEnd = customerIdentifier?.byteArrayData?.valueOffsets[1] || 0;
  expect(
    new TextDecoder().decode(customerIdentifier?.byteArrayData?.data.subarray(0, firstEnd))
  ).not.toBe('');
  reader.close();
});

/** Copies one Arrow byte view into the exact ArrayBuffer required by the BSON parser. */
function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
