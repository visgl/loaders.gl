// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';

import {IndexedArrowVector, IndexedArrowTable, MappedArrowTable} from '@loaders.gl/arrow';
import {normalizeIndexedArrowIndexes} from '../src/lib/utils/indexed-arrow-helpers';

import type {
  IndexedArrowTableComparator,
  IndexedArrowTableFindPredicate,
  IndexedArrowTablePredicate,
  IndexedArrowTableRow,
  MappedArrowTableComparator,
  MappedArrowTablePredicate
} from '@loaders.gl/arrow';

/** Arrow column types used by the generic indexed and mapped view fixtures. */
type TestArrowColumns = {
  /** Human-readable record label. */
  name: arrow.Utf8;
  /** Numeric value used to filter and order records. */
  score: arrow.Float64;
  /** Whether a record participates in the filtered view. */
  active: arrow.Bool;
  /** Small binary payload retained in the backing Arrow table. */
  payload: arrow.Binary;
  /** Category used to verify derived column views. */
  group: arrow.Utf8;
};

/** One synthetic record used to construct the generic Arrow test tables. */
type TestArrowRow = {
  /** Human-readable record label. */
  name: string;
  /** Numeric value used to filter and order records. */
  score: number;
  /** Whether a record participates in the filtered view. */
  active: boolean;
  /** Small binary payload retained in the backing Arrow table. */
  payload: Uint8Array;
  /** Category used to verify derived column views. */
  group: string;
};

test('ArrowUtils#IndexedArrowVector exposes indexed vector values', (t) => {
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

test('ArrowUtils#IndexedArrowTable normalizes indexes and resolves rows and columns', (t) => {
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

test('ArrowUtils#IndexedArrowTable validates and adopts indexes', (t) => {
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

test('ArrowUtils#index normalization rejects values beyond signed Int32 range', (t) => {
  const maximumIndex = 2 ** 31 - 1;
  const indexes = Int32Array.from([0, maximumIndex]);

  t.deepEqual(
    Array.from(normalizeIndexedArrowIndexes([maximumIndex], maximumIndex + 1)),
    [maximumIndex],
    'accepts the maximum signed Int32 index without a large allocation'
  );
  t.equal(
    normalizeIndexedArrowIndexes(indexes, maximumIndex + 1, false),
    indexes,
    'still adopts validated owned indexes without copying'
  );
  t.throws(
    () => normalizeIndexedArrowIndexes([maximumIndex + 1], maximumIndex + 2),
    RangeError,
    'rejects a valid table index that would wrap to a negative Int32 value'
  );
  t.throws(
    () => normalizeIndexedArrowIndexes([2 ** 32], 2 ** 32 + 1),
    RangeError,
    'rejects a valid table index that would wrap to zero'
  );
  t.end();
});

test('ArrowUtils#temporary rows preserve Arrow nulls and missing-child behavior', (t) => {
  const table = new arrow.Table({
    name: arrow.vectorFromArray([null, 'βeta'], new arrow.Utf8()),
    missing: arrow.vectorFromArray(['unused', 'unused'], new arrow.Utf8())
  });
  const getChild = table.getChild.bind(table);
  table.getChild = (columnName) => (columnName === 'missing' ? null : getChild(columnName));
  const indexedTable = new IndexedArrowTable(table, [1, 0]);

  const first = indexedTable.getTemporaryRow(0);
  t.equal(first?.name, 'βeta', 'reads the non-null value before scratch-row reuse');
  t.equal(first?.missing, undefined, 'returns undefined when no child vector exists');

  const second = indexedTable.getTemporaryRow(1);
  t.equal(second, first, 'reuses the same scratch-row object');
  t.equal(indexedTable.get(1)?.name, null, 'the backing Arrow row contains null');
  t.equal(second?.name, null, 'preserves null when replacing a previous non-null value');
  t.equal(second?.missing, undefined, 'keeps missing child vectors distinct from Arrow nulls');
  t.end();
});

test('ArrowUtils#IndexedArrowTable supports temporary rows and array-like transforms', (t) => {
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
  t.equal(indexedTable.find((row) => row?.name === 'alpha')?.score, 10, 'finds matching row');
  t.equal(
    indexedTable.findIndex((row) => row?.active === false),
    1,
    'finds matching row index'
  );
  t.equal(
    indexedTable.find((row) => row?.name === 'missing'),
    undefined,
    'find returns undefined'
  );
  t.equal(
    indexedTable.findIndex((row) => row?.name === 'missing'),
    -1,
    'findIndex returns -1'
  );
  t.deepEqual(
    indexedTable
      .slice(1)
      .toArray()
      .map((row) => row?.name),
    ['beta', 'gamma'],
    'slices and materializes visible rows'
  );
  t.end();
});

test('ArrowUtils#IndexedArrowTable concatenates and materializes indexed views', (t) => {
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
    Array.from(concatenated, (row) => row?.name),
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
    Array.from(sameTableConcatenated, (row) => row?.name),
    ['gamma', 'alpha', 'beta'],
    'keeps same-table concat row access'
  );

  const emptyConcatenated = new IndexedArrowTable(leftTable, [1]).concat();
  t.deepEqual(
    Array.from(emptyConcatenated, (row) => row?.name),
    ['beta'],
    'supports empty concat'
  );

  const materializedTable = new IndexedArrowTable(leftTable, [2, 0, 2]).materializeArrowTable();
  t.deepEqual(
    Array.from(materializedTable, (row) => row.name),
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

test('ArrowUtils#IndexedArrowTable concatenates filtered and sliced indexed views', (t) => {
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

test('ArrowUtils#MappedArrowTable supports keyed lookup and mapped transforms', (t) => {
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
    Array.from(filtered, (row) => row?.name),
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

test('ArrowUtils#MappedArrowTable inherits indexed table materialization', (t) => {
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
    Array.from(materializedTable, (row) => row.name),
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

test('ArrowUtils#indexed and mapped callback types are available at the public entrypoint', (t) => {
  const table = createTestTable();
  const indexedTable = new IndexedArrowTable(table);
  const predicate: IndexedArrowTablePredicate<TestArrowColumns> = (view, rowIndex) =>
    view.getValue(rowIndex, 'active') ?? false;
  const comparator: IndexedArrowTableComparator<TestArrowColumns> = (view, left, right) =>
    (view.getValue(right, 'score') ?? 0) - (view.getValue(left, 'score') ?? 0);
  const findPredicate: IndexedArrowTableFindPredicate<TestArrowColumns> = (row) =>
    row?.name === 'gamma';
  const row: IndexedArrowTableRow<TestArrowColumns> | undefined = indexedTable
    .filter(predicate)
    .sort(comparator)
    .find(findPredicate);

  t.equal(row?.score, 30, 'retains typed row values after indexed transforms');

  const mappedTable = new MappedArrowTable(
    table,
    new Map([
      ['first', 0],
      ['last', 2]
    ])
  );
  const mappedPredicate: MappedArrowTablePredicate<TestArrowColumns> = (view, rowIndex) =>
    view.getRowKey(rowIndex) !== null;
  const mappedComparator: MappedArrowTableComparator<TestArrowColumns> = (view, left, right) =>
    (view.getValue(right, 'score') ?? 0) - (view.getValue(left, 'score') ?? 0);

  t.deepEqual(
    mappedTable.filter(mappedPredicate).sort(mappedComparator).rowKeys,
    ['last', 'first'],
    'retains typed mapped callbacks and keyed order'
  );
  t.end();
});

test('ArrowUtils#indexed column transforms preserve backing buffers without materializing rows', (t) => {
  const table = createTestTable();
  const getRow = table.get.bind(table);
  let materializedRowCount = 0;
  table.get = (rowIndex) => {
    materializedRowCount++;
    return getRow(rowIndex);
  };

  const indexedTable = new IndexedArrowTable(table, [2, 0, 1]);
  const transformed = indexedTable
    .filter((view, rowIndex) => view.getValue(rowIndex, 'active') ?? false)
    .sort(
      (view, left, right) =>
        (view.getValue(left, 'score') ?? 0) - (view.getValue(right, 'score') ?? 0)
    );
  const child = transformed.getChild('score');

  t.equal(transformed.table, table, 'keeps the exact backing table');
  t.equal(transformed.schema, table.schema, 'keeps the exact backing schema');
  t.equal(
    child?.vector.data[0].values.buffer,
    table.getChild('score')?.data[0].values.buffer,
    'keeps the backing column value buffer'
  );
  t.deepEqual(child?.toArray(), [10, 30], 'reads the transformed column in visible order');
  t.equal(materializedRowCount, 0, 'does not call the backing table row accessor');
  t.end();
});

test('ArrowUtils#indexed views preserve nullable Unicode and 64-bit values across batches', (t) => {
  const schema = new arrow.Schema([
    new arrow.Field('name', new arrow.Utf8(), true),
    new arrow.Field('value', new arrow.Int64(), true)
  ]);
  // A synthetic integer beyond the safe Number range verifies lossless 64-bit access.
  const largeValue = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
  const first = createArrowTable(schema, {
    name: arrow.vectorFromArray(['βeta', null], new arrow.Utf8()),
    value: arrow.vectorFromArray([largeValue, null], new arrow.Int64())
  });
  const second = createArrowTable(schema, {
    name: arrow.vectorFromArray(['🙂', 'alpha'], new arrow.Utf8()),
    value: arrow.vectorFromArray([largeValue + 1n, 0n], new arrow.Int64())
  });
  const table = first.concat(second);
  const indexedTable = new IndexedArrowTable(table, [2, 1, 0, 3, 2]);

  t.equal(table.batches.length, 2, 'uses multiple backing record batches');
  t.deepEqual(
    indexedTable.getChild('name')?.toArray(),
    ['🙂', null, 'βeta', 'alpha', '🙂'],
    'preserves Unicode, nulls and duplicate indexes'
  );
  t.deepEqual(
    indexedTable.getChild('value')?.toArray(),
    [largeValue + 1n, null, largeValue, 0n, largeValue + 1n],
    'preserves 64-bit values without Number conversion'
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
function createTestTableFromRows(rows: ReadonlyArray<TestArrowRow>): arrow.Table<TestArrowColumns> {
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
        rows.map((row) => row.name),
        new arrow.Utf8()
      ),
      score: arrow.vectorFromArray(
        rows.map((row) => row.score),
        new arrow.Float64()
      ),
      active: arrow.vectorFromArray(
        rows.map((row) => row.active),
        new arrow.Bool()
      ),
      payload: arrow.vectorFromArray(
        rows.map((row) => row.payload),
        new arrow.Binary()
      ),
      group: arrow.vectorFromArray(
        rows.map((row) => row.group),
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
