// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  IndexedArrowVector,
  IndexedArrowTable,
  MappedArrowTable,
  splitArrowBuffers,
  splitArrowTableBuffers,
  dehydrateArrowTable,
  hydrateArrowTable,
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC,
  renameArrowColumns,
  validateArrowTableSchema
} from '@loaders.gl/arrow';
import * as arrowTransport from '@loaders.gl/arrow/transport';
type TestArrowColumns = {
  name: arrow.Utf8;
  score: arrow.Float64;
  active: arrow.Bool;
  payload: arrow.Binary;
  group: arrow.Utf8;
};
const RECORD_ID_FIELD = 'record_id';
const DISPLAY_NAME_FIELD = 'display_name';
const NEW_FIELD = 'new_field';
const ITEM_COUNT_FIELD = 'item_count';
const SOURCE_FLAG_FIELD = 'source_flag';
test('ArrowUtils#IndexedArrowVector exposes indexed vector values', () => {
  const vector = arrow.vectorFromArray(['zero', 'one', 'two'], new arrow.Utf8());
  const typedIndexes = Int32Array.from([2, 0, 2]);
  const indexedVector = new IndexedArrowVector(vector, typedIndexes);
  expect(indexedVector.indexes, 'copies typed indexes by default').not.toBe(typedIndexes);
  expect(indexedVector.length, 'has visible value count').toBe(3);
  expect(indexedVector.get(0), 'gets visible value').toBe('two');
  expect(indexedVector.get(3), 'returns null for out-of-range value access').toBe(null);
  expect(indexedVector.get(0.5), 'returns null for fractional value access').toBe(null);
  expect(indexedVector.at(-1), 'gets relative value').toBe('two');
  expect(indexedVector.at(-4), 'returns null for relative value access before start').toBe(null);
  expect(indexedVector.slice(1).toArray(), 'slices indexed values').toEqual(['zero', 'two']);
  expect(Array.from(indexedVector), 'iterates indexed values').toEqual(['two', 'zero', 'two']);
  expect(() => new IndexedArrowVector(vector, [-1]), 'rejects negative indexes').toThrow(
    RangeError
  );
  expect(() => new IndexedArrowVector(vector, [3]), 'rejects out-of-range indexes').toThrow(
    RangeError
  );
  expect(() => new IndexedArrowVector(vector, [0.5]), 'rejects fractional indexes').toThrow(
    RangeError
  );
  expect(() => new IndexedArrowVector(vector, [Infinity]), 'rejects infinite indexes').toThrow(
    RangeError
  );
});
test('ArrowUtils#IndexedArrowTable normalizes indexes and resolves rows and columns', () => {
  const table = createTestTable();
  const indexedTable = new IndexedArrowTable(table, [2, 0, 1]);
  expect(Array.from(indexedTable.indexes), 'normalizes row indexes').toEqual([2, 0, 1]);
  expect(indexedTable.numRows, 'has visible row count').toBe(3);
  expect(indexedTable.numCols, 'has column count').toBe(5);
  expect(indexedTable.getRawIndex(1), 'resolves raw row index').toBe(0);
  expect(indexedTable.getRawIndex(99), 'returns null for invalid raw row lookup').toBe(null);
  expect(indexedTable.getRawIndex(0.5), 'returns null for fractional raw row lookup').toBe(null);
  expect(indexedTable.get(0)?.name, 'gets visible row').toBe('gamma');
  expect(indexedTable.get(3), 'returns null for out-of-range row access').toBe(null);
  expect(indexedTable.at(-1)?.name, 'gets relative row').toBe('beta');
  expect(indexedTable.at(-4), 'returns null for relative row access before start').toBe(null);
  expect(indexedTable.getValue(0, 'score'), 'gets typed column value').toBe(30);
  expect(indexedTable.getValue(0.5, 'score'), 'returns null for fractional value access').toBe(
    null
  );
  expect(indexedTable.getValue(0, 'missing' as never), 'returns null for missing columns').toBe(
    null
  );
  expect(indexedTable.getChild('name')?.toArray(), 'gets child view').toEqual([
    'gamma',
    'alpha',
    'beta'
  ]);
  expect(indexedTable.getChild('name'), 'caches child views').toBe(indexedTable.getChild('name'));
  expect(indexedTable.getChild('missing' as never), 'returns null for missing child view').toBe(
    null
  );
});
test('ArrowUtils#IndexedArrowTable validates and adopts indexes', () => {
  const table = createTestTable();
  const passthroughTable = new IndexedArrowTable(table);
  expect(Array.from(passthroughTable.indexes), 'defaults to all rows in raw order').toEqual([
    0, 1, 2
  ]);
  const indexes = Int32Array.from([2, 0, 1]);
  const ownedIndexTable = IndexedArrowTable.fromOwnedIndexes(table, indexes);
  expect(ownedIndexTable.indexes, 'adopts owned typed row indexes').toBe(indexes);
  expect(() => new IndexedArrowTable(table, [0, 3]), 'rejects out-of-range indexes').toThrow(
    RangeError
  );
  expect(() => new IndexedArrowTable(table, [0, 0.5]), 'rejects fractional indexes').toThrow(
    RangeError
  );
});
test('ArrowUtils#IndexedArrowTable supports temporary rows and array-like transforms', () => {
  const table = createTestTable();
  const indexedTable = new IndexedArrowTable(table);
  const firstTemporaryRow = indexedTable.getTemporaryRow(2);
  const secondTemporaryRow = indexedTable.getTemporaryRow(0);
  expect(secondTemporaryRow, 'reuses the same temporary row object').toBe(firstTemporaryRow);
  expect(secondTemporaryRow?.name, 'updates temporary row values').toBe('alpha');
  expect(secondTemporaryRow?.payload, 'updates binary row values').toEqual(
    new Uint8Array([1, 2, 3])
  );
  expect(indexedTable.getTemporaryRow(99), 'returns null for invalid temporary row').toBe(null);
  const filteredTable = indexedTable.filter(
    (currentTable, rowIndex) => currentTable.getValue(rowIndex, 'active') ?? false
  );
  const sortedTable = filteredTable.sort(
    (currentTable, leftRowIndex, rightRowIndex) =>
      (currentTable.getValue(rightRowIndex, 'score') ?? 0) -
      (currentTable.getValue(leftRowIndex, 'score') ?? 0)
  );
  expect(Array.from(filteredTable.indexes), 'filters rows by indexed column value').toEqual([0, 2]);
  expect(Array.from(sortedTable.indexes), 'sorts visible rows').toEqual([2, 0]);
  expect(indexedTable.find(row => row?.name === 'alpha')?.score, 'finds matching row').toBe(10);
  expect(
    indexedTable.findIndex(row => row?.active === false),
    'finds matching row index'
  ).toBe(1);
  expect(
    indexedTable.find(row => row?.name === 'missing'),
    'find returns undefined'
  ).toBe(undefined);
  expect(
    indexedTable.findIndex(row => row?.name === 'missing'),
    'findIndex returns -1'
  ).toBe(-1);
  expect(
    indexedTable
      .slice(1)
      .toArray()
      .map(row => row?.name),
    'slices and materializes visible rows'
  ).toEqual(['beta', 'gamma']);
});
test('ArrowUtils#IndexedArrowTable concatenates and materializes indexed views', () => {
  const leftTable = createTestTable();
  const rightTable = createTestTableFromRows([
    {
      name: 'delta',
      score: 40,
      active: false,
      payload: new Uint8Array([10, 11, 12]),
      group: 'cool'
    },
    {
      name: 'epsilon',
      score: 50,
      active: true,
      payload: new Uint8Array([13, 14, 15]),
      group: 'warm'
    }
  ]);
  const concatenated = new IndexedArrowTable(leftTable, [2, 0]).concat(
    new IndexedArrowTable(rightTable, [1, 0])
  );
  expect(concatenated.table.numRows, 'concatenates backing tables').toBe(5);
  expect(Array.from(concatenated.indexes), 'preserves visible row indexes').toEqual([2, 0, 4, 3]);
  expect(
    Array.from(concatenated, row => row?.name),
    'iterates concatenated rows'
  ).toEqual(['gamma', 'alpha', 'epsilon', 'delta']);
  const sameTableConcatenated = new IndexedArrowTable(leftTable, [2]).concat(
    new IndexedArrowTable(leftTable, [0, 1])
  );
  expect(sameTableConcatenated.table.numRows, 'duplicates same backing table batches').toBe(6);
  expect(Array.from(sameTableConcatenated.indexes), 'offsets same-table concat indexes').toEqual([
    2, 3, 4
  ]);
  expect(
    Array.from(sameTableConcatenated, row => row?.name),
    'keeps same-table concat row access'
  ).toEqual(['gamma', 'alpha', 'beta']);
  const emptyConcatenated = new IndexedArrowTable(leftTable, [1]).concat();
  expect(
    Array.from(emptyConcatenated, row => row?.name),
    'supports empty concat'
  ).toEqual(['beta']);
  const materializedTable = new IndexedArrowTable(leftTable, [2, 0, 2]).materializeArrowTable();
  expect(
    Array.from(materializedTable, row => row.name),
    'materializes indexed row order and duplicate indexes'
  ).toEqual(['gamma', 'alpha', 'gamma']);
  expect(
    Array.from(materializedTable.getChild('score') ?? []),
    'materializes child column values'
  ).toEqual([30, 10, 30]);
  const incompatibleTable = createArrowTable(
    new arrow.Schema([new arrow.Field('name', new arrow.Utf8(), false)]),
    {name: arrow.vectorFromArray(['delta'], new arrow.Utf8())}
  );
  expect(
    () => new IndexedArrowTable(leftTable).concat(new IndexedArrowTable(incompatibleTable as any)),
    'rejects incompatible schemas'
  ).toThrow(/identical Arrow schemas/);
  const incompatibleNullabilityTable = createArrowTable(
    new arrow.Schema<TestArrowColumns>([
      new arrow.Field('name', new arrow.Utf8(), true),
      new arrow.Field('score', new arrow.Float64(), false),
      new arrow.Field('active', new arrow.Bool(), false),
      new arrow.Field('payload', new arrow.Binary(), false),
      new arrow.Field('group', new arrow.Utf8(), false)
    ]),
    {
      name: arrow.vectorFromArray(['delta'], new arrow.Utf8()),
      score: arrow.vectorFromArray([40], new arrow.Float64()),
      active: arrow.vectorFromArray([true], new arrow.Bool()),
      payload: arrow.vectorFromArray([new Uint8Array([10])], new arrow.Binary()),
      group: arrow.vectorFromArray(['warm'], new arrow.Utf8())
    }
  );
  expect(
    () =>
      new IndexedArrowTable(leftTable).concat(new IndexedArrowTable(incompatibleNullabilityTable)),
    'rejects schemas with incompatible nullability'
  ).toThrow(/identical Arrow schemas/);
});
test('ArrowUtils#IndexedArrowTable concatenates filtered and sliced indexed views', () => {
  const leftView = new IndexedArrowTable(createTestTable()).filter(
    (table, rowIndex) => table.getValue(rowIndex, 'active') ?? false
  );
  const rightView = new IndexedArrowTable(
    createTestTableFromRows([
      {
        name: 'delta',
        score: 40,
        active: true,
        payload: new Uint8Array([10, 11, 12]),
        group: 'warm'
      },
      {
        name: 'epsilon',
        score: 50,
        active: false,
        payload: new Uint8Array([13, 14, 15]),
        group: 'cool'
      },
      {
        name: 'zeta',
        score: 60,
        active: true,
        payload: new Uint8Array([16, 17, 18]),
        group: 'warm'
      }
    ])
  ).slice(1);
  const concatenated = leftView.concat(rightView);
  expect(Array.from(concatenated.indexes), 'offsets derived view indexes').toEqual([0, 2, 4, 5]);
  expect(concatenated.get(2)?.name, 'gets row after derived concat').toBe('epsilon');
  expect(concatenated.getValue(3, 'score'), 'gets column value after derived concat').toBe(60);
  expect(
    concatenated.getChild('group')?.toArray(),
    'gets indexed child column after derived concat'
  ).toEqual(['warm', 'warm', 'cool', 'warm']);
});
test('ArrowUtils#MappedArrowTable supports keyed lookup and mapped transforms', () => {
  const leftTable = createTestTableFromRows([
    {
      name: 'alpha-dup',
      score: 10,
      active: true,
      payload: new Uint8Array([1]),
      group: 'warm'
    },
    {
      name: 'alpha-left',
      score: 20,
      active: true,
      payload: new Uint8Array([2]),
      group: 'cool'
    }
  ]);
  const rightTable = createTestTableFromRows([
    {
      name: 'beta-dup',
      score: 30,
      active: false,
      payload: new Uint8Array([3]),
      group: 'cool'
    },
    {
      name: 'beta-right',
      score: 40,
      active: true,
      payload: new Uint8Array([4]),
      group: 'warm'
    }
  ]);
  const concatenated = new MappedArrowTable(
    leftTable,
    new Map([
      ['dup', 0],
      ['left', 1]
    ])
  ).concat(
    new MappedArrowTable(
      rightTable,
      new Map([
        ['dup', 0],
        ['right', 1]
      ])
    )
  );
  expect(concatenated.rowKeys, 'preserves duplicate keys').toEqual(['dup', 'left', 'dup', 'right']);
  expect(Array.from(concatenated.indexes), 'offsets raw row indexes').toEqual([0, 1, 2, 3]);
  expect(concatenated.getRowIndex('dup'), 'uses last-wins keyed lookup').toBe(2);
  expect(concatenated.getRowIndex('missing'), 'returns null for missing key index').toBe(null);
  expect(concatenated.getByKey('dup')?.name, 'gets row by key').toBe('beta-dup');
  expect(concatenated.getByKey('missing'), 'returns null for missing keyed row').toBe(null);
  expect(concatenated.getRowKey(99), 'returns null for invalid key lookup').toBe(null);
  expect(concatenated.getRowKey(0.5), 'returns null for fractional key lookup').toBe(null);
  expect(concatenated.atMapped(-1)?.name, 'supports relative mapped access').toBe('beta-right');
  expect(concatenated.atMapped(-5), 'returns null for invalid relative mapped access').toBe(null);
  const sliced = concatenated.slice(1, 3);
  const filtered = concatenated.filter((table, rowIndex) => table.getRowKey(rowIndex) === 'dup');
  const sorted = concatenated.sort(
    (table, leftRowIndex, rightRowIndex) =>
      (table.getValue(rightRowIndex, 'score') ?? 0) - (table.getValue(leftRowIndex, 'score') ?? 0)
  );
  expect(sliced.rowKeys, 'preserves mapped entries through slice').toEqual(['left', 'dup']);
  expect(sliced.getByKey('dup')?.name, 'keeps sliced keyed lookup').toBe('beta-dup');
  expect(filtered.rowKeys, 'preserves duplicate mapped keys through filter').toEqual([
    'dup',
    'dup'
  ]);
  expect(
    Array.from(filtered, row => row?.name),
    'keeps filtered row order'
  ).toEqual(['alpha-dup', 'beta-dup']);
  expect(sorted.rowKeys, 'sorts mapped row entries').toEqual(['right', 'dup', 'left', 'dup']);
  expect(sorted.getByKey('dup')?.name, 'keeps last-wins lookup after sort').toBe('alpha-dup');
  expect(
    () => new MappedArrowTable(leftTable, new Map([['bad', 2]])),
    'rejects out-of-range mapped indexes'
  ).toThrow(RangeError);
});
test('ArrowUtils#MappedArrowTable inherits indexed table materialization', () => {
  const table = createTestTable();
  const mappedTable = new MappedArrowTable(
    table,
    new Map([
      ['gamma', 2],
      ['alpha', 0]
    ])
  );
  const materializedTable = mappedTable.materializeArrowTable();
  expect(
    Array.from(materializedTable, row => row.name),
    'materializes mapped row order'
  ).toEqual(['gamma', 'alpha']);
  expect(
    Array.from(materializedTable.getChild('group') ?? []),
    'materializes mapped child column'
  ).toEqual(['warm', 'warm']);
});
test('ArrowUtils#splitArrowBuffers reuses whole buffers', () => {
  const values = new Float64Array([1, 2, 3]);
  const table = createFloat64Table(values);
  const splitTable = splitArrowBuffers(table);
  const originalDataBuffer = getDataBuffer(table);
  const splitDataBuffer = getDataBuffer(splitTable);
  expect(splitTable instanceof arrow.Table, 'returns a real Arrow table').toBeTruthy();
  expect(Array.from(splitTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
  expect(splitDataBuffer, 'reuses whole-buffer typed array').toBe(originalDataBuffer);
  expect(splitDataBuffer?.buffer, 'reuses whole backing ArrayBuffer').toBe(values.buffer);
  expect(splitTable.batches.length, 'preserves batch count').toBe(table.batches.length);
  expect(splitTable.numRows, 'preserves row count').toBe(table.numRows);
});
test('ArrowUtils#splitArrowBuffers copies sliced primitive buffers', () => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const splitTable = splitArrowTableBuffers(table);
  const originalDataBuffer = getDataBuffer(table);
  const splitDataBuffer = getDataBuffer(splitTable);
  expect(Array.from(splitTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
  expect(originalDataBuffer?.byteOffset, 'original table remains sliced').toBe(
    Float64Array.BYTES_PER_ELEMENT
  );
  expect(originalDataBuffer?.buffer, 'original table keeps backing buffer').toBe(
    backingValues.buffer
  );
  expect(splitDataBuffer?.buffer, 'copies into a different ArrayBuffer').not.toBe(
    backingValues.buffer
  );
  expect(splitDataBuffer?.byteOffset, 'copied typed array starts at byte offset zero').toBe(0);
  expect(splitDataBuffer?.byteLength, 'copied typed array spans its backing buffer').toBe(
    splitDataBuffer?.buffer.byteLength
  );
});
test('ArrowUtils#splitArrowBuffers accepts RecordBatch Vector and Data', () => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const recordBatch = table.batches[0];
  const vector = table.getChild('value')!;
  const data = vector.data[0];
  const splitRecordBatch = splitArrowBuffers(recordBatch);
  const splitVector = splitArrowBuffers(vector);
  const splitData = splitArrowBuffers(data);
  expect(
    splitRecordBatch instanceof arrow.RecordBatch,
    'returns a real Arrow record batch'
  ).toBeTruthy();
  expect(splitVector instanceof arrow.Vector, 'returns a real Arrow vector').toBeTruthy();
  expect(splitData instanceof arrow.Data, 'returns a real Arrow data node').toBeTruthy();
  expect(Array.from(splitVector), 'preserves vector values').toEqual([1, 2, 3]);
  expect(
    splitRecordBatch.data.children[0].buffers[arrow.BufferType.DATA]?.buffer,
    'copies sliced record batch child buffer'
  ).not.toBe(backingValues.buffer);
  expect(
    splitVector.data[0].buffers[arrow.BufferType.DATA]?.buffer,
    'copies sliced vector buffer'
  ).not.toBe(backingValues.buffer);
  expect(splitData.buffers[arrow.BufferType.DATA]?.buffer, 'copies sliced data buffer').not.toBe(
    backingValues.buffer
  );
});
test('ArrowUtils#splitArrowBuffers copies sliced nested string buffers', () => {
  const offsetsBacking = new Int32Array([99, 0, 1, 3, 99]);
  const valuesBacking = new Uint8Array([99, 65, 66, 67, 99]);
  const offsets = offsetsBacking.subarray(1, 4);
  const values = valuesBacking.subarray(1, 4);
  const table = createUtf8Table(offsets, values);
  const splitTable = splitArrowBuffers(table);
  const originalData = table.getChild('name')!.data[0];
  const splitData = splitTable.getChild('name')!.data[0];
  const splitOffsetBuffer = splitData.buffers[arrow.BufferType.OFFSET];
  const splitValueBuffer = splitData.buffers[arrow.BufferType.DATA];
  expect(Array.from(splitTable.getChild('name') ?? []), 'preserves strings').toEqual(['A', 'BC']);
  expect(originalData.buffers[arrow.BufferType.OFFSET]?.buffer).toBe(offsetsBacking.buffer);
  expect(originalData.buffers[arrow.BufferType.DATA]?.buffer).toBe(valuesBacking.buffer);
  expect(splitOffsetBuffer?.buffer, 'copies sliced offset buffer').not.toBe(offsetsBacking.buffer);
  expect(splitValueBuffer?.buffer, 'copies sliced string value buffer').not.toBe(
    valuesBacking.buffer
  );
  expect(splitOffsetBuffer?.byteOffset, 'copied offset buffer starts at byte offset zero').toBe(0);
  expect(splitValueBuffer?.byteOffset, 'copied value buffer starts at byte offset zero').toBe(0);
  expect(splitOffsetBuffer?.byteLength, 'copied offset buffer spans its backing buffer').toBe(
    splitOffsetBuffer?.buffer.byteLength
  );
  expect(splitValueBuffer?.byteLength, 'copied value buffer spans its backing buffer').toBe(
    splitValueBuffer?.buffer.byteLength
  );
});
test('ArrowUtils#splitArrowBuffers can copy every internal buffer', () => {
  const values = new Float64Array([1, 2, 3]);
  const table = createFloat64Table(values);
  const splitTable = splitArrowBuffers(table, {copy: 'all'});
  const splitDataBuffer = getDataBuffer(splitTable);
  expect(Array.from(splitTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
  expect(splitDataBuffer?.buffer, 'copies whole-buffer typed arrays on request').not.toBe(
    values.buffer
  );
});
test('ArrowUtils#splitArrowBuffers can skip buffer copying', () => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const splitTable = splitArrowBuffers(table, {copy: 'none'});
  const splitDataBuffer = getDataBuffer(splitTable);
  expect(Array.from(splitTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
  expect(splitDataBuffer?.buffer, 'reuses sliced backing buffer').toBe(backingValues.buffer);
  expect(splitDataBuffer?.byteOffset, 'preserves sliced byte offset').toBe(
    Float64Array.BYTES_PER_ELEMENT
  );
});
test('ArrowUtils#dehydrateArrowTable and hydrateArrowTable round trip structured payloads', () => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const dehydratedTable = dehydrateArrowTable(table);
  const clonedPayload = structuredClone(dehydratedTable);
  const hydratedTable = hydrateArrowTable(clonedPayload);
  const hydratedDataBuffer = getDataBuffer(hydratedTable);
  expect(dehydratedTable.shape, 'marks table shape').toBe('arrow-table');
  expect(dehydratedTable.transport, 'marks Arrow JS transport').toBe('arrow-js');
  expect(hydratedTable instanceof arrow.Table, 'hydrates a real Arrow table').toBeTruthy();
  expect(Array.from(hydratedTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
  expect(hydratedDataBuffer?.buffer, 'isolates sliced backing buffer').not.toBe(
    backingValues.buffer
  );
  expect(hydratedDataBuffer?.byteOffset, 'hydrated buffer starts at byte offset zero').toBe(0);
  expect(hydratedDataBuffer?.byteLength, 'hydrated buffer spans its backing buffer').toBe(
    hydratedDataBuffer?.buffer.byteLength
  );
});
test('ArrowUtils#transport subpath exports Arrow table transport utilities', () => {
  expect(arrowTransport.dehydrateArrowTable, 'exports dehydrateArrowTable').toBe(
    dehydrateArrowTable
  );
  expect(arrowTransport.hydrateArrowTable, 'exports hydrateArrowTable').toBe(hydrateArrowTable);
  expect(arrowTransport.serializeArrowTableToIPC, 'exports serializeArrowTableToIPC').toBe(
    serializeArrowTableToIPC
  );
  expect(arrowTransport.deserializeArrowTableFromIPC, 'exports deserializeArrowTableFromIPC').toBe(
    deserializeArrowTableFromIPC
  );
  expect(arrowTransport.splitArrowBuffers, 'exports splitArrowBuffers').toBe(splitArrowBuffers);
  expect(arrowTransport.splitArrowTableBuffers, 'exports splitArrowTableBuffers').toBe(
    splitArrowTableBuffers
  );
});
test('ArrowUtils#transport subpath round trips Arrow JS payloads', () => {
  const table = createFloat64Table(new Float64Array([1, 2, 3]));
  const dehydratedTable = arrowTransport.dehydrateArrowTable(table);
  const hydratedTable = arrowTransport.hydrateArrowTable(structuredClone(dehydratedTable));
  expect(hydratedTable instanceof arrow.Table, 'hydrates a real Arrow table').toBeTruthy();
  expect(Array.from(hydratedTable.getChild('value') ?? []), 'preserves values').toEqual([1, 2, 3]);
});
test('ArrowUtils#serializeArrowTableToIPC and deserializeArrowTableFromIPC round trip IPC payloads', () => {
  const table = createUtf8Table(new Int32Array([0, 1, 3]), new Uint8Array([65, 66, 67]));
  const serializedTable = serializeArrowTableToIPC(table);
  const clonedPayload = structuredClone(serializedTable);
  const deserializedTable = deserializeArrowTableFromIPC(clonedPayload);
  const deserializedRawTable = deserializeArrowTableFromIPC(clonedPayload.data);
  expect(serializedTable.shape, 'marks table shape').toBe('arrow-table');
  expect(serializedTable.transport, 'marks Arrow IPC transport').toBe('arrow-ipc');
  expect(serializedTable.data instanceof Uint8Array, 'returns IPC bytes').toBeTruthy();
  expect(deserializedTable instanceof arrow.Table, 'deserializes a real Arrow table').toBeTruthy();
  expect(
    Array.from(deserializedTable.getChild('name') ?? []),
    'preserves values from payload'
  ).toEqual(['A', 'BC']);
  expect(
    Array.from(deserializedRawTable.getChild('name') ?? []),
    'preserves values from raw IPC bytes'
  ).toEqual(['A', 'BC']);
});
test('ArrowUtils#validateArrowTableSchema validates expected Arrow schema fields', () => {
  const expectedSchema = new arrow.Schema([
    new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false),
    new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true)
  ]);
  const extraFieldSchema = new arrow.Schema([
    new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false),
    new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true),
    new arrow.Field(NEW_FIELD, new arrow.Utf8(), true)
  ]);
  const extraFieldTable = createArrowTable(extraFieldSchema, {
    [RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8()),
    [DISPLAY_NAME_FIELD]: arrow.vectorFromArray(['Example record'], new arrow.Utf8()),
    [NEW_FIELD]: arrow.vectorFromArray(['value'], new arrow.Utf8())
  });
  expect(
    () => validateArrowTableSchema(extraFieldTable, expectedSchema, {schemaName: 'test schema'}),
    'accepts extra trailing fields by default'
  ).not.toThrow();
  expect(
    () =>
      validateArrowTableSchema(extraFieldTable, expectedSchema, {
        rejectExtraFields: true,
        schemaName: 'test strict schema'
      }),
    'rejects extra fields in strict mode'
  ).toThrow(/Unexpected fields: new_field/);
  const missingFieldTable = createArrowTable(
    new arrow.Schema([new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false)]),
    {[RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8())}
  );
  expect(
    () =>
      validateArrowTableSchema(missingFieldTable, expectedSchema, {
        schemaName: 'sample records table'
      }),
    'rejects missing expected fields'
  ).toThrow(/Missing fields: display_name/);
  const wrongOrderTable = createArrowTable(
    new arrow.Schema([
      new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true),
      new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false)
    ]),
    {
      [DISPLAY_NAME_FIELD]: arrow.vectorFromArray(['Example record'], new arrow.Utf8()),
      [RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8())
    }
  );
  expect(
    () => validateArrowTableSchema(wrongOrderTable, expectedSchema),
    'rejects fields in the wrong order'
  ).toThrow(/expected field record_id, got display_name/);
  const wrongTypeTable = createArrowTable(
    new arrow.Schema([
      new arrow.Field(RECORD_ID_FIELD, new arrow.Float64(), false),
      new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true)
    ]),
    {
      [RECORD_ID_FIELD]: arrow.vectorFromArray([1], new arrow.Float64()),
      [DISPLAY_NAME_FIELD]: arrow.vectorFromArray(['Example record'], new arrow.Utf8())
    }
  );
  expect(
    () => validateArrowTableSchema(wrongTypeTable, expectedSchema),
    'rejects fields with the wrong Arrow type id'
  ).toThrow(/record_id: expected type/);
  const wrongNestedTypeTable = createArrowTable(
    new arrow.Schema([
      new arrow.Field(
        RECORD_ID_FIELD,
        new arrow.List(new arrow.Field('value', new arrow.Float32())),
        false
      ),
      new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true)
    ]),
    {
      [RECORD_ID_FIELD]: arrow.vectorFromArray(
        [[1]],
        new arrow.List(new arrow.Field('value', new arrow.Float32()))
      ),
      [DISPLAY_NAME_FIELD]: arrow.vectorFromArray(['Example record'], new arrow.Utf8())
    }
  );
  const nestedExpectedSchema = new arrow.Schema([
    new arrow.Field(
      RECORD_ID_FIELD,
      new arrow.List(new arrow.Field('value', new arrow.Int32())),
      false
    ),
    new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true)
  ]);
  expect(
    () => validateArrowTableSchema(wrongNestedTypeTable, nestedExpectedSchema),
    'rejects fields with the wrong nested Arrow type'
  ).toThrow(/record_id: expected type List<Int32> .* got List<Float32>/);
  const wrongNullabilityTable = createArrowTable(
    new arrow.Schema([
      new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), true),
      new arrow.Field(DISPLAY_NAME_FIELD, new arrow.Utf8(), true)
    ]),
    {
      [RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8()),
      [DISPLAY_NAME_FIELD]: arrow.vectorFromArray(['Example record'], new arrow.Utf8())
    }
  );
  expect(
    () => validateArrowTableSchema(wrongNullabilityTable, expectedSchema),
    'rejects fields with wrong nullability'
  ).toThrow(/record_id: expected nullable=false, got nullable=true/);
});
test('ArrowUtils#renameArrowColumns renames selected fields', () => {
  const sourceSchema = new arrow.Schema([
    new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false),
    new arrow.Field(ITEM_COUNT_FIELD, new arrow.Float64(), true),
    new arrow.Field(SOURCE_FLAG_FIELD, new arrow.Bool(), true)
  ]);
  const targetSchema = new arrow.Schema([
    new arrow.Field('recordId', new arrow.Utf8(), false),
    new arrow.Field('itemCount', new arrow.Float64(), true)
  ]);
  const table = createArrowTable(sourceSchema, {
    [RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8()),
    [ITEM_COUNT_FIELD]: arrow.vectorFromArray([3], new arrow.Float64()),
    [SOURCE_FLAG_FIELD]: arrow.vectorFromArray([true], new arrow.Bool())
  });
  const renamedTable = renameArrowColumns(table, sourceSchema, targetSchema, {
    [RECORD_ID_FIELD]: 'recordId',
    [ITEM_COUNT_FIELD]: 'itemCount'
  });
  const row = renamedTable.get(0);
  expect(
    renamedTable.schema.fields.map(field => field.name),
    'renames mapped columns and preserves untouched columns'
  ).toEqual(['recordId', 'itemCount', SOURCE_FLAG_FIELD]);
  expect(row?.recordId, 'reads renamed string column').toBe('record-1');
  expect(row?.itemCount, 'reads renamed number column').toBe(3);
  expect(row?.[SOURCE_FLAG_FIELD], 'reads untouched column').toBe(true);
  expect(
    () =>
      renameArrowColumns(table, sourceSchema, targetSchema, {
        [RECORD_ID_FIELD]: 'recordId',
        [ITEM_COUNT_FIELD]: 'recordId'
      }),
    'rejects duplicate output column names'
  ).toThrow(/Duplicate Arrow column name after rename: recordId/);
  const mismatchedTargetSchema = new arrow.Schema([
    new arrow.Field('recordId', new arrow.Float64(), false)
  ]);
  expect(
    () =>
      renameArrowColumns(table, sourceSchema, mismatchedTargetSchema, {
        [RECORD_ID_FIELD]: 'recordId'
      }),
    'rejects renamed columns with mismatched target type'
  ).toThrow(/Unexpected Arrow schema for renamed field recordId/);
  const missingSourceFieldSchema = new arrow.Schema([
    new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false),
    new arrow.Field(ITEM_COUNT_FIELD, new arrow.Float64(), true),
    new arrow.Field(NEW_FIELD, new arrow.Utf8(), true)
  ]);
  const missingSourceFieldTable = createArrowTable(missingSourceFieldSchema, {
    [RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8()),
    [ITEM_COUNT_FIELD]: arrow.vectorFromArray([3], new arrow.Float64()),
    [NEW_FIELD]: arrow.vectorFromArray(['value'], new arrow.Utf8())
  });
  expect(
    () =>
      renameArrowColumns(missingSourceFieldTable, sourceSchema, targetSchema, {
        [RECORD_ID_FIELD]: 'recordId'
      }),
    'rejects tables that do not match the source schema'
  ).toThrow(/source Arrow schema before column rename/);
});
/**
 * Builds one small Arrow table used by indexed and mapped view tests.
 */
function createTestTable(): arrow.Table<TestArrowColumns> {
  return createTestTableFromRows([
    {
      name: 'alpha',
      score: 10,
      active: true,
      payload: new Uint8Array([1, 2, 3]),
      group: 'warm'
    },
    {
      name: 'beta',
      score: 20,
      active: false,
      payload: new Uint8Array([4, 5, 6]),
      group: 'cool'
    },
    {
      name: 'gamma',
      score: 30,
      active: true,
      payload: new Uint8Array([7, 8, 9]),
      group: 'warm'
    }
  ]);
}
/**
 * Builds one small Arrow table from explicit row objects for concat-oriented tests.
 */
function createTestTableFromRows(
  rows: ReadonlyArray<{
    name: string;
    score: number;
    active: boolean;
    payload: Uint8Array;
    group: string;
  }>
): arrow.Table<TestArrowColumns> {
  return createArrowTable(
    new arrow.Schema<TestArrowColumns>([
      new arrow.Field('name', new arrow.Utf8(), false),
      new arrow.Field('score', new arrow.Float64(), false),
      new arrow.Field('active', new arrow.Bool(), false),
      new arrow.Field('payload', new arrow.Binary(), false),
      new arrow.Field('group', new arrow.Utf8(), false)
    ]),
    {
      name: arrow.vectorFromArray(
        rows.map(row => row.name),
        new arrow.Utf8()
      ),
      score: arrow.vectorFromArray(
        rows.map(row => row.score),
        new arrow.Float64()
      ),
      active: arrow.vectorFromArray(
        rows.map(row => row.active),
        new arrow.Bool()
      ),
      payload: arrow.vectorFromArray(
        rows.map(row => row.payload),
        new arrow.Binary()
      ),
      group: arrow.vectorFromArray(
        rows.map(row => row.group),
        new arrow.Utf8()
      )
    }
  );
}
/**
 * Builds an Arrow table with an explicit schema and column vector map.
 */
function createArrowTable<T extends arrow.TypeMap>(
  schema: arrow.Schema<T>,
  columns: {
    [P in keyof T]: arrow.Vector<T[P]>;
  }
): arrow.Table<T> {
  return new (arrow.Table as any)(schema, columns) as arrow.Table<T>;
}
/**
 * Builds a one-column Float64 Arrow table from a caller-provided typed array.
 */
function createFloat64Table(values: Float64Array): arrow.Table<{
  value: arrow.Float64;
}> {
  const type = new arrow.Float64();
  const vector = new arrow.Vector([
    new arrow.Data(type, 0, values.length, 0, {[arrow.BufferType.DATA]: values} as any)
  ]);
  const schema = new arrow.Schema<{
    value: arrow.Float64;
  }>([new arrow.Field('value', type, false)]);
  return createArrowTable(schema, {value: vector});
}
/**
 * Builds a one-column Utf8 Arrow table from caller-provided offset and value buffers.
 */
function createUtf8Table(
  offsets: Int32Array,
  values: Uint8Array
): arrow.Table<{
  name: arrow.Utf8;
}> {
  const type = new arrow.Utf8();
  const vector = new arrow.Vector([
    new arrow.Data(type, 0, offsets.length - 1, 0, {
      [arrow.BufferType.OFFSET]: offsets,
      [arrow.BufferType.DATA]: values
    } as any)
  ]);
  const schema = new arrow.Schema<{
    name: arrow.Utf8;
  }>([new arrow.Field('name', type, false)]);
  return createArrowTable(schema, {name: vector});
}
/**
 * Gets the internal DATA buffer for the Float64 test table.
 */
function getDataBuffer(
  table: arrow.Table<{
    value: arrow.Float64;
  }>
): Float64Array | undefined {
  return table.getChild('value')?.data[0].buffers[arrow.BufferType.DATA];
}
