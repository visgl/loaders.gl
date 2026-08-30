// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch} from '@loaders.gl/schema';
import {expect, test} from 'vitest';
import {convertBatch, convertBatches} from '../../../src/lib/table/batches/convert-batches';
import {makeTableFromBatches} from '../../../src/lib/table/batches/make-table-from-batches';
import {
  convertTable,
  convertToArrayRowTable,
  convertToColumnarTable,
  convertToObjectRowTable
} from '../../../src/lib/table/tables/convert-table';

const schema = {
  fields: [
    {name: 'id', type: 'int32' as const, nullable: false},
    {name: 'name', type: 'utf8' as const, nullable: true}
  ],
  metadata: {}
};

const objectTable = {
  shape: 'object-row-table' as const,
  schema,
  data: [
    {id: 1, name: 'one'},
    {id: 2, name: null}
  ]
};

const arrayTable = {
  shape: 'array-row-table' as const,
  schema,
  data: [
    [1, 'one'],
    [2, null]
  ]
};

const columnarTable = {
  shape: 'columnar-table' as const,
  schema,
  data: {id: new Int32Array([1, 2]), name: ['one', null]}
};

test('table converters cover every supported shape and identity path', () => {
  expect(convertToObjectRowTable(objectTable)).toBe(objectTable);
  expect(convertToArrayRowTable(arrayTable)).toBe(arrayTable);
  expect(convertToColumnarTable(columnarTable)).toEqual(columnarTable);

  expect(convertTable(objectTable, 'array-row-table').data).toEqual(arrayTable.data);
  expect(convertTable(arrayTable, 'object-row-table').data).toEqual(objectTable.data);
  expect(convertTable(objectTable, 'columnar-table').data).toEqual({
    id: new Int32Array([1, 2]),
    name: ['one', null]
  });
  const arrowTable = convertTable(objectTable, 'arrow-table');
  expect(arrowTable.shape).toBe('arrow-table');
  expect(arrowTable.data.numRows).toBe(2);
  expect(() => convertTable(objectTable, 'invalid' as never)).toThrow('invalid');
});

test('columnar conversion uses a schema deduced from object rows', () => {
  const converted = convertToColumnarTable({
    shape: 'object-row-table',
    data: [
      {id: 1, label: 'a'},
      {id: 2, label: 'b'}
    ]
  });

  expect(converted.schema.fields.map(field => field.name)).toEqual(['id', 'label']);
  expect(Array.from(converted.data.id)).toEqual([1, 2]);
  expect(Array.from(converted.data.label)).toEqual(['a', 'b']);
});

test('batch conversion preserves metadata across all target shapes', async () => {
  const batch: TableBatch = {
    ...objectTable,
    batchType: 'data',
    length: 2,
    bytesUsed: 42
  };

  for (const shape of [
    'object-row-table',
    'array-row-table',
    'columnar-table',
    'arrow-table'
  ] as const) {
    const converted = convertBatch(batch, shape);
    expect(converted.shape).toBe(shape);
    expect(converted.bytesUsed).toBe(42);

    const collected = [];
    for await (const convertedBatch of convertBatches([batch], shape)) {
      collected.push(convertedBatch);
    }
    expect(collected).toHaveLength(1);
    expect(collected[0].shape).toBe(shape);
  }

  expect(() => convertBatch(batch, 'invalid' as never)).toThrow('invalid');
  const invalidIterator = convertBatches([batch], 'invalid' as never);
  await expect(invalidIterator.next()).rejects.toThrow('invalid');
});

test('makeTableFromBatches assembles every row-oriented batch shape', async () => {
  const arrayBatch: TableBatch = {
    ...arrayTable,
    batchType: 'data',
    length: 2
  };
  await expect(makeTableFromBatches([arrayBatch, arrayBatch])).resolves.toMatchObject({
    shape: 'array-row-table',
    data: [...arrayTable.data, ...arrayTable.data]
  });

  const objectBatch: TableBatch = {
    ...objectTable,
    batchType: 'data',
    length: 2
  };
  await expect(makeTableFromBatches([objectBatch])).resolves.toMatchObject(objectTable);

  const feature = {
    type: 'Feature' as const,
    geometry: {type: 'Point' as const, coordinates: [1, 2]},
    properties: {id: 1}
  };
  await expect(
    makeTableFromBatches([
      {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: [feature],
        batchType: 'data',
        length: 1
      }
    ])
  ).resolves.toMatchObject({shape: 'geojson-table', features: [feature]});

  await expect(makeTableFromBatches([])).resolves.toBeNull();
  await expect(
    makeTableFromBatches([{...columnarTable, batchType: 'data', length: 2} as TableBatch])
  ).rejects.toThrow('shape');
});
