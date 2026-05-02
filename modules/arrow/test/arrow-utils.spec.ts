// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('ArrowUtils#IndexedArrowVector exposes indexed vector values', t => {
  const vector = arrow.vectorFromArray(['zero', 'one', 'two'], new arrow.Utf8());
  const typedIndexes = Int32Array.from([2, 0, 2]);
  const indexedVector = new IndexedArrowVector(vector, typedIndexes);

  t.notEqual(indexedVector.indexes, typedIndexes, 'copies typed indexes by default');
  t.equal(indexedVector.length, 3, 'has visible value count');
  t.equal(indexedVector.get(0), 'two', 'gets visible value');
  t.equal(indexedVector.get(3), null, 'returns null for out-of-range value access');
  t.equal(indexedVector.get(0.5), null, 'returns null for fractional value access');
  t.equal(indexedVector.at(-1), 'two', 'gets relative value');
  t.equal(indexedVector.at(-4), null, 'returns null for relative value access before start');
  t.deepEqual(indexedVector.slice(1).toArray(), ['zero', 'two'], 'slices indexed values');
  t.deepEqual(Array.from(indexedVector), ['two', 'zero', 'two'], 'iterates indexed values');

  t.throws(() => new IndexedArrowVector(vector, [-1]), RangeError, 'rejects negative indexes');
  t.throws(() => new IndexedArrowVector(vector, [3]), RangeError, 'rejects out-of-range indexes');
  t.throws(() => new IndexedArrowVector(vector, [0.5]), RangeError, 'rejects fractional indexes');
  t.throws(
    () => new IndexedArrowVector(vector, [Infinity]),
    RangeError,
    'rejects infinite indexes'
  );
  t.end();
});

test('ArrowUtils#IndexedArrowTable normalizes indexes and resolves rows and columns', t => {
  const table = createTestTable();
  const indexedTable = new IndexedArrowTable(table, [2, 0, 1]);

  t.deepEqual(Array.from(indexedTable.indexes), [2, 0, 1], 'normalizes row indexes');
  t.equal(indexedTable.numRows, 3, 'has visible row count');
  t.equal(indexedTable.numCols, 5, 'has column count');
  t.equal(indexedTable.getRawIndex(1), 0, 'resolves raw row index');
  t.equal(indexedTable.getRawIndex(99), null, 'returns null for invalid raw row lookup');
  t.equal(indexedTable.getRawIndex(0.5), null, 'returns null for fractional raw row lookup');
  t.equal(indexedTable.get(0)?.name, 'gamma', 'gets visible row');
  t.equal(indexedTable.get(3), null, 'returns null for out-of-range row access');
  t.equal(indexedTable.at(-1)?.name, 'beta', 'gets relative row');
  t.equal(indexedTable.at(-4), null, 'returns null for relative row access before start');
  t.equal(indexedTable.getValue(0, 'score'), 30, 'gets typed column value');
  t.equal(indexedTable.getValue(0.5, 'score'), null, 'returns null for fractional value access');
  t.equal(indexedTable.getValue(0, 'missing' as never), null, 'returns null for missing columns');
  t.deepEqual(
    indexedTable.getChild('name')?.toArray(),
    ['gamma', 'alpha', 'beta'],
    'gets child view'
  );
  t.equal(indexedTable.getChild('name'), indexedTable.getChild('name'), 'caches child views');
  t.equal(indexedTable.getChild('missing' as never), null, 'returns null for missing child view');
  t.end();
});

test('ArrowUtils#IndexedArrowTable validates and adopts indexes', t => {
  const table = createTestTable();

  const passthroughTable = new IndexedArrowTable(table);
  t.deepEqual(Array.from(passthroughTable.indexes), [0, 1, 2], 'defaults to all rows in raw order');

  const indexes = Int32Array.from([2, 0, 1]);
  const ownedIndexTable = IndexedArrowTable.fromOwnedIndexes(table, indexes);
  t.equal(ownedIndexTable.indexes, indexes, 'adopts owned typed row indexes');

  t.throws(() => new IndexedArrowTable(table, [0, 3]), RangeError, 'rejects out-of-range indexes');
  t.throws(() => new IndexedArrowTable(table, [0, 0.5]), RangeError, 'rejects fractional indexes');
  t.end();
});

test('ArrowUtils#IndexedArrowTable supports temporary rows and array-like transforms', t => {
  const table = createTestTable();
  const indexedTable = new IndexedArrowTable(table);

  const firstTemporaryRow = indexedTable.getTemporaryRow(2);
  const secondTemporaryRow = indexedTable.getTemporaryRow(0);
  t.equal(secondTemporaryRow, firstTemporaryRow, 'reuses the same temporary row object');
  t.equal(secondTemporaryRow?.name, 'alpha', 'updates temporary row values');
  t.deepEqual(secondTemporaryRow?.payload, new Uint8Array([1, 2, 3]), 'updates binary row values');
  t.equal(indexedTable.getTemporaryRow(99), null, 'returns null for invalid temporary row');

  const filteredTable = indexedTable.filter(
    (currentTable, rowIndex) => currentTable.getValue(rowIndex, 'active') ?? false
  );
  const sortedTable = filteredTable.sort(
    (currentTable, leftRowIndex, rightRowIndex) =>
      (currentTable.getValue(rightRowIndex, 'score') ?? 0) -
      (currentTable.getValue(leftRowIndex, 'score') ?? 0)
  );

  t.deepEqual(Array.from(filteredTable.indexes), [0, 2], 'filters rows by indexed column value');
  t.deepEqual(Array.from(sortedTable.indexes), [2, 0], 'sorts visible rows');
  t.equal(indexedTable.find(row => row?.name === 'alpha')?.score, 10, 'finds matching row');
  t.equal(
    indexedTable.findIndex(row => row?.active === false),
    1,
    'finds matching row index'
  );
  t.equal(
    indexedTable.find(row => row?.name === 'missing'),
    undefined,
    'find returns undefined'
  );
  t.equal(
    indexedTable.findIndex(row => row?.name === 'missing'),
    -1,
    'findIndex returns -1'
  );
  t.deepEqual(
    indexedTable
      .slice(1)
      .toArray()
      .map(row => row?.name),
    ['beta', 'gamma'],
    'slices and materializes visible rows'
  );
  t.end();
});

test('ArrowUtils#IndexedArrowTable concatenates and materializes indexed views', t => {
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

  t.equal(concatenated.table.numRows, 5, 'concatenates backing tables');
  t.deepEqual(Array.from(concatenated.indexes), [2, 0, 4, 3], 'preserves visible row indexes');
  t.deepEqual(
    Array.from(concatenated, row => row?.name),
    ['gamma', 'alpha', 'epsilon', 'delta'],
    'iterates concatenated rows'
  );

  const sameTableConcatenated = new IndexedArrowTable(leftTable, [2]).concat(
    new IndexedArrowTable(leftTable, [0, 1])
  );
  t.equal(sameTableConcatenated.table.numRows, 6, 'duplicates same backing table batches');
  t.deepEqual(
    Array.from(sameTableConcatenated.indexes),
    [2, 3, 4],
    'offsets same-table concat indexes'
  );
  t.deepEqual(
    Array.from(sameTableConcatenated, row => row?.name),
    ['gamma', 'alpha', 'beta'],
    'keeps same-table concat row access'
  );

  const emptyConcatenated = new IndexedArrowTable(leftTable, [1]).concat();
  t.deepEqual(
    Array.from(emptyConcatenated, row => row?.name),
    ['beta'],
    'supports empty concat'
  );

  const materializedTable = new IndexedArrowTable(leftTable, [2, 0, 2]).materializeArrowTable();
  t.deepEqual(
    Array.from(materializedTable, row => row.name),
    ['gamma', 'alpha', 'gamma'],
    'materializes indexed row order and duplicate indexes'
  );
  t.deepEqual(
    Array.from(materializedTable.getChild('score') ?? []),
    [30, 10, 30],
    'materializes child column values'
  );

  const incompatibleTable = createArrowTable(
    new arrow.Schema([new arrow.Field('name', new arrow.Utf8(), false)]),
    {name: arrow.vectorFromArray(['delta'], new arrow.Utf8())}
  );
  t.throws(
    () => new IndexedArrowTable(leftTable).concat(new IndexedArrowTable(incompatibleTable as any)),
    /identical Arrow schemas/,
    'rejects incompatible schemas'
  );

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
  t.throws(
    () =>
      new IndexedArrowTable(leftTable).concat(new IndexedArrowTable(incompatibleNullabilityTable)),
    /identical Arrow schemas/,
    'rejects schemas with incompatible nullability'
  );
  t.end();
});

test('ArrowUtils#IndexedArrowTable concatenates filtered and sliced indexed views', t => {
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

  t.deepEqual(Array.from(concatenated.indexes), [0, 2, 4, 5], 'offsets derived view indexes');
  t.equal(concatenated.get(2)?.name, 'epsilon', 'gets row after derived concat');
  t.equal(concatenated.getValue(3, 'score'), 60, 'gets column value after derived concat');
  t.deepEqual(
    concatenated.getChild('group')?.toArray(),
    ['warm', 'warm', 'cool', 'warm'],
    'gets indexed child column after derived concat'
  );
  t.end();
});

test('ArrowUtils#MappedArrowTable supports keyed lookup and mapped transforms', t => {
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

  t.deepEqual(concatenated.rowKeys, ['dup', 'left', 'dup', 'right'], 'preserves duplicate keys');
  t.deepEqual(Array.from(concatenated.indexes), [0, 1, 2, 3], 'offsets raw row indexes');
  t.equal(concatenated.getRowIndex('dup'), 2, 'uses last-wins keyed lookup');
  t.equal(concatenated.getRowIndex('missing'), null, 'returns null for missing key index');
  t.equal(concatenated.getByKey('dup')?.name, 'beta-dup', 'gets row by key');
  t.equal(concatenated.getByKey('missing'), null, 'returns null for missing keyed row');
  t.equal(concatenated.getRowKey(99), null, 'returns null for invalid key lookup');
  t.equal(concatenated.getRowKey(0.5), null, 'returns null for fractional key lookup');
  t.equal(concatenated.atMapped(-1)?.name, 'beta-right', 'supports relative mapped access');
  t.equal(concatenated.atMapped(-5), null, 'returns null for invalid relative mapped access');

  const sliced = concatenated.slice(1, 3);
  const filtered = concatenated.filter((table, rowIndex) => table.getRowKey(rowIndex) === 'dup');
  const sorted = concatenated.sort(
    (table, leftRowIndex, rightRowIndex) =>
      (table.getValue(rightRowIndex, 'score') ?? 0) - (table.getValue(leftRowIndex, 'score') ?? 0)
  );

  t.deepEqual(sliced.rowKeys, ['left', 'dup'], 'preserves mapped entries through slice');
  t.equal(sliced.getByKey('dup')?.name, 'beta-dup', 'keeps sliced keyed lookup');
  t.deepEqual(filtered.rowKeys, ['dup', 'dup'], 'preserves duplicate mapped keys through filter');
  t.deepEqual(
    Array.from(filtered, row => row?.name),
    ['alpha-dup', 'beta-dup'],
    'keeps filtered row order'
  );
  t.deepEqual(sorted.rowKeys, ['right', 'dup', 'left', 'dup'], 'sorts mapped row entries');
  t.equal(sorted.getByKey('dup')?.name, 'alpha-dup', 'keeps last-wins lookup after sort');

  t.throws(
    () => new MappedArrowTable(leftTable, new Map([['bad', 2]])),
    RangeError,
    'rejects out-of-range mapped indexes'
  );
  t.end();
});

test('ArrowUtils#MappedArrowTable inherits indexed table materialization', t => {
  const table = createTestTable();
  const mappedTable = new MappedArrowTable(
    table,
    new Map([
      ['gamma', 2],
      ['alpha', 0]
    ])
  );

  const materializedTable = mappedTable.materializeArrowTable();

  t.deepEqual(
    Array.from(materializedTable, row => row.name),
    ['gamma', 'alpha'],
    'materializes mapped row order'
  );
  t.deepEqual(
    Array.from(materializedTable.getChild('group') ?? []),
    ['warm', 'warm'],
    'materializes mapped child column'
  );
  t.end();
});

test('ArrowUtils#splitArrowBuffers reuses whole buffers', t => {
  const values = new Float64Array([1, 2, 3]);
  const table = createFloat64Table(values);
  const splitTable = splitArrowBuffers(table);
  const originalDataBuffer = getDataBuffer(table);
  const splitDataBuffer = getDataBuffer(splitTable);

  t.ok(splitTable instanceof arrow.Table, 'returns a real Arrow table');
  t.deepEqual(Array.from(splitTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.equal(splitDataBuffer, originalDataBuffer, 'reuses whole-buffer typed array');
  t.equal(splitDataBuffer?.buffer, values.buffer, 'reuses whole backing ArrayBuffer');
  t.equal(splitTable.batches.length, table.batches.length, 'preserves batch count');
  t.equal(splitTable.numRows, table.numRows, 'preserves row count');
  t.end();
});

test('ArrowUtils#splitArrowBuffers copies sliced primitive buffers', t => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const splitTable = splitArrowTableBuffers(table);
  const originalDataBuffer = getDataBuffer(table);
  const splitDataBuffer = getDataBuffer(splitTable);

  t.deepEqual(Array.from(splitTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.equal(
    originalDataBuffer?.byteOffset,
    Float64Array.BYTES_PER_ELEMENT,
    'original table remains sliced'
  );
  t.equal(originalDataBuffer?.buffer, backingValues.buffer, 'original table keeps backing buffer');
  t.notEqual(splitDataBuffer?.buffer, backingValues.buffer, 'copies into a different ArrayBuffer');
  t.equal(splitDataBuffer?.byteOffset, 0, 'copied typed array starts at byte offset zero');
  t.equal(
    splitDataBuffer?.byteLength,
    splitDataBuffer?.buffer.byteLength,
    'copied typed array spans its backing buffer'
  );
  t.end();
});

test('ArrowUtils#splitArrowBuffers accepts RecordBatch Vector and Data', t => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const recordBatch = table.batches[0];
  const vector = table.getChild('value')!;
  const data = vector.data[0];

  const splitRecordBatch = splitArrowBuffers(recordBatch);
  const splitVector = splitArrowBuffers(vector);
  const splitData = splitArrowBuffers(data);

  t.ok(splitRecordBatch instanceof arrow.RecordBatch, 'returns a real Arrow record batch');
  t.ok(splitVector instanceof arrow.Vector, 'returns a real Arrow vector');
  t.ok(splitData instanceof arrow.Data, 'returns a real Arrow data node');
  t.deepEqual(Array.from(splitVector), [1, 2, 3], 'preserves vector values');
  t.notEqual(
    splitRecordBatch.data.children[0].buffers[arrow.BufferType.DATA]?.buffer,
    backingValues.buffer,
    'copies sliced record batch child buffer'
  );
  t.notEqual(
    splitVector.data[0].buffers[arrow.BufferType.DATA]?.buffer,
    backingValues.buffer,
    'copies sliced vector buffer'
  );
  t.notEqual(
    splitData.buffers[arrow.BufferType.DATA]?.buffer,
    backingValues.buffer,
    'copies sliced data buffer'
  );
  t.end();
});

test('ArrowUtils#splitArrowBuffers copies sliced nested string buffers', t => {
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

  t.deepEqual(Array.from(splitTable.getChild('name') ?? []), ['A', 'BC'], 'preserves strings');
  t.equal(originalData.buffers[arrow.BufferType.OFFSET]?.buffer, offsetsBacking.buffer);
  t.equal(originalData.buffers[arrow.BufferType.DATA]?.buffer, valuesBacking.buffer);
  t.notEqual(splitOffsetBuffer?.buffer, offsetsBacking.buffer, 'copies sliced offset buffer');
  t.notEqual(splitValueBuffer?.buffer, valuesBacking.buffer, 'copies sliced string value buffer');
  t.equal(splitOffsetBuffer?.byteOffset, 0, 'copied offset buffer starts at byte offset zero');
  t.equal(splitValueBuffer?.byteOffset, 0, 'copied value buffer starts at byte offset zero');
  t.equal(
    splitOffsetBuffer?.byteLength,
    splitOffsetBuffer?.buffer.byteLength,
    'copied offset buffer spans its backing buffer'
  );
  t.equal(
    splitValueBuffer?.byteLength,
    splitValueBuffer?.buffer.byteLength,
    'copied value buffer spans its backing buffer'
  );
  t.end();
});

test('ArrowUtils#splitArrowBuffers can copy every internal buffer', t => {
  const values = new Float64Array([1, 2, 3]);
  const table = createFloat64Table(values);
  const splitTable = splitArrowBuffers(table, {copy: 'all'});
  const splitDataBuffer = getDataBuffer(splitTable);

  t.deepEqual(Array.from(splitTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.notEqual(splitDataBuffer?.buffer, values.buffer, 'copies whole-buffer typed arrays on request');
  t.end();
});

test('ArrowUtils#splitArrowBuffers can skip buffer copying', t => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const splitTable = splitArrowBuffers(table, {copy: 'none'});
  const splitDataBuffer = getDataBuffer(splitTable);

  t.deepEqual(Array.from(splitTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.equal(splitDataBuffer?.buffer, backingValues.buffer, 'reuses sliced backing buffer');
  t.equal(
    splitDataBuffer?.byteOffset,
    Float64Array.BYTES_PER_ELEMENT,
    'preserves sliced byte offset'
  );
  t.end();
});

test('ArrowUtils#dehydrateArrowTable and hydrateArrowTable round trip structured payloads', t => {
  const backingValues = new Float64Array([99, 1, 2, 3, 100]);
  const slicedValues = backingValues.subarray(1, 4);
  const table = createFloat64Table(slicedValues);
  const dehydratedTable = dehydrateArrowTable(table);
  const clonedPayload = structuredClone(dehydratedTable);
  const hydratedTable = hydrateArrowTable(clonedPayload);
  const hydratedDataBuffer = getDataBuffer(hydratedTable);

  t.equal(dehydratedTable.shape, 'arrow-table', 'marks table shape');
  t.equal(dehydratedTable.transport, 'arrow-js', 'marks Arrow JS transport');
  t.ok(hydratedTable instanceof arrow.Table, 'hydrates a real Arrow table');
  t.deepEqual(Array.from(hydratedTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.notEqual(hydratedDataBuffer?.buffer, backingValues.buffer, 'isolates sliced backing buffer');
  t.equal(hydratedDataBuffer?.byteOffset, 0, 'hydrated buffer starts at byte offset zero');
  t.equal(
    hydratedDataBuffer?.byteLength,
    hydratedDataBuffer?.buffer.byteLength,
    'hydrated buffer spans its backing buffer'
  );
  t.end();
});

test('ArrowUtils#transport subpath exports Arrow table transport utilities', t => {
  t.equal(arrowTransport.dehydrateArrowTable, dehydrateArrowTable, 'exports dehydrateArrowTable');
  t.equal(arrowTransport.hydrateArrowTable, hydrateArrowTable, 'exports hydrateArrowTable');
  t.equal(
    arrowTransport.serializeArrowTableToIPC,
    serializeArrowTableToIPC,
    'exports serializeArrowTableToIPC'
  );
  t.equal(
    arrowTransport.deserializeArrowTableFromIPC,
    deserializeArrowTableFromIPC,
    'exports deserializeArrowTableFromIPC'
  );
  t.equal(arrowTransport.splitArrowBuffers, splitArrowBuffers, 'exports splitArrowBuffers');
  t.equal(
    arrowTransport.splitArrowTableBuffers,
    splitArrowTableBuffers,
    'exports splitArrowTableBuffers'
  );
  t.end();
});

test('ArrowUtils#transport subpath round trips Arrow JS payloads', t => {
  const table = createFloat64Table(new Float64Array([1, 2, 3]));
  const dehydratedTable = arrowTransport.dehydrateArrowTable(table);
  const hydratedTable = arrowTransport.hydrateArrowTable(structuredClone(dehydratedTable));

  t.ok(hydratedTable instanceof arrow.Table, 'hydrates a real Arrow table');
  t.deepEqual(Array.from(hydratedTable.getChild('value') ?? []), [1, 2, 3], 'preserves values');
  t.end();
});

test('ArrowUtils#serializeArrowTableToIPC and deserializeArrowTableFromIPC round trip IPC payloads', t => {
  const table = createUtf8Table(new Int32Array([0, 1, 3]), new Uint8Array([65, 66, 67]));
  const serializedTable = serializeArrowTableToIPC(table);
  const clonedPayload = structuredClone(serializedTable);
  const deserializedTable = deserializeArrowTableFromIPC(clonedPayload);
  const deserializedRawTable = deserializeArrowTableFromIPC(clonedPayload.data);

  t.equal(serializedTable.shape, 'arrow-table', 'marks table shape');
  t.equal(serializedTable.transport, 'arrow-ipc', 'marks Arrow IPC transport');
  t.ok(serializedTable.data instanceof Uint8Array, 'returns IPC bytes');
  t.ok(deserializedTable instanceof arrow.Table, 'deserializes a real Arrow table');
  t.deepEqual(
    Array.from(deserializedTable.getChild('name') ?? []),
    ['A', 'BC'],
    'preserves values from payload'
  );
  t.deepEqual(
    Array.from(deserializedRawTable.getChild('name') ?? []),
    ['A', 'BC'],
    'preserves values from raw IPC bytes'
  );
  t.end();
});

test('ArrowUtils#validateArrowTableSchema validates expected Arrow schema fields', t => {
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

  t.doesNotThrow(
    () => validateArrowTableSchema(extraFieldTable, expectedSchema, {schemaName: 'test schema'}),
    'accepts extra trailing fields by default'
  );
  t.throws(
    () =>
      validateArrowTableSchema(extraFieldTable, expectedSchema, {
        rejectExtraFields: true,
        schemaName: 'test strict schema'
      }),
    /Unexpected fields: new_field/,
    'rejects extra fields in strict mode'
  );

  const missingFieldTable = createArrowTable(
    new arrow.Schema([new arrow.Field(RECORD_ID_FIELD, new arrow.Utf8(), false)]),
    {[RECORD_ID_FIELD]: arrow.vectorFromArray(['record-1'], new arrow.Utf8())}
  );
  t.throws(
    () =>
      validateArrowTableSchema(missingFieldTable, expectedSchema, {
        schemaName: 'sample records table'
      }),
    /Missing fields: display_name/,
    'rejects missing expected fields'
  );

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
  t.throws(
    () => validateArrowTableSchema(wrongOrderTable, expectedSchema),
    /expected field record_id, got display_name/,
    'rejects fields in the wrong order'
  );

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
  t.throws(
    () => validateArrowTableSchema(wrongTypeTable, expectedSchema),
    /record_id: expected type/,
    'rejects fields with the wrong Arrow type id'
  );

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
  t.throws(
    () => validateArrowTableSchema(wrongNestedTypeTable, nestedExpectedSchema),
    /record_id: expected type List<Int32> .* got List<Float32>/,
    'rejects fields with the wrong nested Arrow type'
  );

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
  t.throws(
    () => validateArrowTableSchema(wrongNullabilityTable, expectedSchema),
    /record_id: expected nullable=false, got nullable=true/,
    'rejects fields with wrong nullability'
  );
  t.end();
});

test('ArrowUtils#renameArrowColumns renames selected fields', t => {
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

  t.deepEqual(
    renamedTable.schema.fields.map(field => field.name),
    ['recordId', 'itemCount', SOURCE_FLAG_FIELD],
    'renames mapped columns and preserves untouched columns'
  );
  t.equal(row?.recordId, 'record-1', 'reads renamed string column');
  t.equal(row?.itemCount, 3, 'reads renamed number column');
  t.equal(row?.[SOURCE_FLAG_FIELD], true, 'reads untouched column');

  t.throws(
    () =>
      renameArrowColumns(table, sourceSchema, targetSchema, {
        [RECORD_ID_FIELD]: 'recordId',
        [ITEM_COUNT_FIELD]: 'recordId'
      }),
    /Duplicate Arrow column name after rename: recordId/,
    'rejects duplicate output column names'
  );

  const mismatchedTargetSchema = new arrow.Schema([
    new arrow.Field('recordId', new arrow.Float64(), false)
  ]);
  t.throws(
    () =>
      renameArrowColumns(table, sourceSchema, mismatchedTargetSchema, {
        [RECORD_ID_FIELD]: 'recordId'
      }),
    /Unexpected Arrow schema for renamed field recordId/,
    'rejects renamed columns with mismatched target type'
  );

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
  t.throws(
    () =>
      renameArrowColumns(missingSourceFieldTable, sourceSchema, targetSchema, {
        [RECORD_ID_FIELD]: 'recordId'
      }),
    /source Arrow schema before column rename/,
    'rejects tables that do not match the source schema'
  );
  t.end();
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
  columns: {[P in keyof T]: arrow.Vector<T[P]>}
): arrow.Table<T> {
  return new (arrow.Table as any)(schema, columns) as arrow.Table<T>;
}

/**
 * Builds a one-column Float64 Arrow table from a caller-provided typed array.
 */
function createFloat64Table(values: Float64Array): arrow.Table<{value: arrow.Float64}> {
  const type = new arrow.Float64();
  const vector = new arrow.Vector([
    new arrow.Data(type, 0, values.length, 0, {[arrow.BufferType.DATA]: values} as any)
  ]);
  const schema = new arrow.Schema<{value: arrow.Float64}>([new arrow.Field('value', type, false)]);
  return createArrowTable(schema, {value: vector});
}

/**
 * Builds a one-column Utf8 Arrow table from caller-provided offset and value buffers.
 */
function createUtf8Table(offsets: Int32Array, values: Uint8Array): arrow.Table<{name: arrow.Utf8}> {
  const type = new arrow.Utf8();
  const vector = new arrow.Vector([
    new arrow.Data(type, 0, offsets.length - 1, 0, {
      [arrow.BufferType.OFFSET]: offsets,
      [arrow.BufferType.DATA]: values
    } as any)
  ]);
  const schema = new arrow.Schema<{name: arrow.Utf8}>([new arrow.Field('name', type, false)]);
  return createArrowTable(schema, {name: vector});
}

/**
 * Gets the internal DATA buffer for the Float64 test table.
 */
function getDataBuffer(table: arrow.Table<{value: arrow.Float64}>): Float64Array | undefined {
  return table.getChild('value')?.data[0].buffers[arrow.BufferType.DATA];
}
