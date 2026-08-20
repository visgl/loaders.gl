// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {encode, isBrowser, load} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {
  ParquetJSWriter,
  type ParquetPredicate,
  ParquetSourceLoader,
  type ParquetSourceBatch,
  type ParquetRowGroupMetadata
} from '@loaders.gl/parquet';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';

import {
  canParquetRowGroupMatch,
  copyParquetPredicate,
  filterParquetRowIndices,
  gatherParquetColumns,
  getParquetPredicateColumns,
  validateParquetPredicate
} from '../src/lib/parquet-predicate';
import {Statistics} from '../src/parquetjs/parquet-thrift/Statistics';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';
import {Uint8ArrayCompactProtocol} from '../src/parquetjs/utils/uint8-array-compact-protocol';
import {Uint8ArrayTransport} from '../src/parquetjs/utils/uint8-array-transport';

test('Parquet predicates validate, expose filter columns, and preserve exact row indexes', () => {
  const predicate: ParquetPredicate = {
    op: 'and',
    args: [
      {op: '>=', args: [{property: 'id'}, 2]},
      {
        op: 'or',
        args: [
          {op: '=', args: [{property: 'category'}, 'a']},
          {op: 'isNull', args: [{property: 'category'}]}
        ]
      }
    ]
  };
  const columns = {
    id: new BigInt64Array([1n, 2n, 3n, 4n]),
    category: ['a', 'b', null, 'a'],
    payload: ['one', 'two', 'three', 'four']
  };

  expect(getParquetPredicateColumns(predicate)).toEqual(['id', 'category']);
  expect(() => validateParquetPredicate(predicate, new Set(Object.keys(columns)))).not.toThrow();
  expect(filterParquetRowIndices(predicate, columns, 4)).toEqual([2, 3]);
  expect(gatherParquetColumns(columns, [2, 3], new Set(['payload']))).toEqual({
    payload: ['three', 'four']
  });
  expect(() =>
    validateParquetPredicate({op: '=', args: [{property: 'missing'}, 1]}, new Set(['id']))
  ).toThrow(/predicate column not found: missing/);
  expect(() =>
    validateParquetPredicate({op: 'or', args: []}, new Set(['id']))
  ).toThrow(/requires at least two child/);
  expect(() =>
    validateParquetPredicate({op: 'in', args: [{property: 'id'}, []]}, new Set(['id']))
  ).toThrow(/requires at least one value/);
});

test.each([
  [{op: '=' as const, args: [{property: 'value'}, 2] as const}, [1]],
  [{op: '<>' as const, args: [{property: 'value'}, 2] as const}, [0, 3]],
  [{op: '<' as const, args: [{property: 'value'}, 2] as const}, [0]],
  [{op: '<=' as const, args: [{property: 'value'}, 2] as const}, [0, 1]],
  [{op: '>' as const, args: [{property: 'value'}, 2] as const}, [3]],
  [{op: '>=' as const, args: [{property: 'value'}, 2] as const}, [1, 3]],
  [{op: 'isNull' as const, args: [{property: 'value'}] as const}, [2]],
  [
    {
      op: 'not' as const,
      args: [{op: 'isNull' as const, args: [{property: 'value'}] as const}] as const
    },
    [0, 1, 3]
  ]
])('Parquet exact predicate %o selects expected rows', (predicate, expectedRowIndices) => {
  expect(filterParquetRowIndices(predicate, {value: [1, 2, null, 3]}, 4)).toEqual(
    expectedRowIndices
  );
});

test('Parquet predicates compare binary values and snapshot mutable values', () => {
  const binaryValue = new Uint8Array([1, 2]);
  const dateValue = new Date('2026-08-20T00:00:00Z');
  const predicate: ParquetPredicate = {
    op: 'and',
    args: [
      {op: '=', args: [{property: 'binary'}, binaryValue]},
      {op: '>=', args: [{property: 'date'}, dateValue]}
    ]
  };
  const copiedPredicate = copyParquetPredicate(predicate);
  binaryValue[0] = 9;
  dateValue.setUTCFullYear(2030);

  expect(
    filterParquetRowIndices(
      copiedPredicate,
      {
        binary: [new Uint8Array([1, 2]), new Uint8Array([1, 3])],
        date: [new Date('2026-08-21T00:00:00Z'), new Date('2026-08-21T00:00:00Z')]
      },
      2
    )
  ).toEqual([0]);
  expect(gatherParquetColumns({binary: [binaryValue]}, [0])).toEqual({binary: [binaryValue]});
});

test('Parquet footer statistics only prune predicates proven impossible', () => {
  const rowGroup = createRowGroupMetadata({minimum: 10, maximum: 19, nullCount: 0});

  expect(canParquetRowGroupMatch({op: '<', args: [{property: 'id'}, 10]}, rowGroup)).toBe(false);
  expect(canParquetRowGroupMatch({op: '=', args: [{property: 'id'}, 15]}, rowGroup)).toBe(true);
  expect(canParquetRowGroupMatch({op: 'in', args: [{property: 'id'}, [1, 20]]}, rowGroup)).toBe(
    false
  );
  expect(canParquetRowGroupMatch({op: 'isNull', args: [{property: 'id'}]}, rowGroup)).toBe(false);
  expect(
    canParquetRowGroupMatch(
      {op: 'not', args: [{op: 'isNull', args: [{property: 'id'}]}]},
      rowGroup
    )
  ).toBe(true);
  expect(canParquetRowGroupMatch({op: '<>', args: [{property: 'id'}, 15]}, rowGroup)).toBe(true);
  expect(canParquetRowGroupMatch({op: '>', args: [{property: 'id'}, 19]}, rowGroup)).toBe(false);
  expect(canParquetRowGroupMatch({op: '>=', args: [{property: 'id'}, 20]}, rowGroup)).toBe(false);
  expect(canParquetRowGroupMatch({op: '<=', args: [{property: 'id'}, 9]}, rowGroup)).toBe(false);
  expect(
    canParquetRowGroupMatch(
      {
        op: 'or',
        args: [
          {op: '<', args: [{property: 'id'}, 10]},
          {op: '=', args: [{property: 'unknown'}, 1]}
        ]
      },
      rowGroup
    )
  ).toBe(true);

  const allNullRowGroup = createRowGroupMetadata({minimum: 0, maximum: 0, nullCount: 10});
  expect(canParquetRowGroupMatch({op: 'isNull', args: [{property: 'id'}]}, allNullRowGroup)).toBe(
    true
  );
  expect(canParquetRowGroupMatch({op: '=', args: [{property: 'id'}, 0]}, allNullRowGroup)).toBe(
    false
  );

  const inexactRowGroup = createRowGroupMetadata({minimum: 10, maximum: 19, nullCount: 0});
  inexactRowGroup.columns[0].statistics!.minIsExact = false;
  inexactRowGroup.columns[0].statistics!.maxIsExact = false;
  expect(canParquetRowGroupMatch({op: '<', args: [{property: 'id'}, 10]}, inexactRowGroup)).toBe(
    true
  );
  expect(canParquetRowGroupMatch({op: '>', args: [{property: 'id'}, 19]}, inexactRowGroup)).toBe(
    true
  );
});

test('Parquet predicate negation preserves CQL2 null semantics', () => {
  const predicate: ParquetPredicate = {
    op: 'not',
    args: [{op: '=', args: [{property: 'value'}, 2]}]
  };

  expect(filterParquetRowIndices(predicate, {value: [1, 2, null]}, 3)).toEqual([0]);
});

test('Parquet Thrift statistics retain modern exactness flags', () => {
  const statistics = new Statistics({is_min_value_exact: false, is_max_value_exact: true});
  const protocol = new Uint8ArrayCompactProtocol(
    new Uint8ArrayTransport(serializeThrift(statistics))
  );
  const decodedStatistics = Statistics.read(protocol);

  expect(decodedStatistics.is_min_value_exact).toBe(false);
  expect(decodedStatistics.is_max_value_exact).toBe(true);
});

test('ParquetSource applies exact predicates without returning hidden filter columns', async () => {
  const fixture = await createPredicateFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader, {
    core: {worker: false}
  })) as ParquetSource;
  const batches = await collectBatches(
    source.read({
      columns: ['payload'],
      batchSize: 2,
      predicate: {
        op: 'and',
        args: [
          {op: '>=', args: [{property: 'id'}, 3]},
          {op: '<', args: [{property: 'id'}, 10]},
          {op: 'in', args: [{property: 'category'}, ['even']]}
        ]
      }
    })
  );

  expect(batches.flatMap(batch => Array.from(batch.data.getChild('payload')?.toArray() || []))).toEqual([
    'row-4',
    'row-6',
    'row-8'
  ]);
  expect(batches.every(batch => !batch.data.getChild('id'))).toBe(true);
  expect(batches.every(batch => !batch.data.getChild('category'))).toBe(true);
  expect(batches.map(batch => batch.rowGroupRowIndices)).toEqual([[0, 2], [0]]);
  expect(batches.map(batch => batch.rowIndices)).toEqual([[4, 6], [8]]);
  expect(source.getTelemetry()).toMatchObject({
    predicateRowsTested: 12,
    predicateRowsMatched: 3,
    rowsEmitted: 3
  });
  await source.close();
});

test('ParquetSource transfers serializable predicates through worker decoding', async () => {
  if (!isBrowser) {
    return;
  }
  const fixture = await createPredicateFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'}
  })) as ParquetSource;
  const batches = await collectBatches(
    source.read({
      columns: ['payload'],
      batchSize: 2,
      predicate: {op: 'in', args: [{property: 'id'}, [1, 5, 10]]}
    })
  );

  expect(batches.flatMap(batch => Array.from(batch.data.getChild('payload')?.toArray() || []))).toEqual([
    'row-1',
    'row-5',
    'row-10'
  ]);
  expect(batches.map(batch => batch.rowIndices)).toEqual([[1], [5], [10]]);
  expect(source.getTelemetry()).toMatchObject({
    predicateRowsTested: 12,
    predicateRowsMatched: 3,
    rowsEmitted: 3
  });
  await source.close();
});

/** Creates normalized row-group metadata for conservative statistics tests. */
function createRowGroupMetadata(statistics: {
  minimum: number;
  maximum: number;
  nullCount: number;
}): ParquetRowGroupMetadata {
  return {
    index: 0,
    rowOffset: 0,
    rowCount: 10,
    uncompressedByteLength: 100,
    uncompressedSize: 100,
    compressedByteLength: 50,
    compressedSize: 50,
    columns: [
      {
        path: ['id'],
        compression: 'UNCOMPRESSED',
        encodings: ['PLAIN'],
        valueCount: 10,
        fileOffset: 4,
        compressedByteLength: 50,
        compressedSize: 50,
        uncompressedByteLength: 100,
        uncompressedSize: 100,
        dataPageOffset: 4,
        statistics: {
          min: statistics.minimum,
          max: statistics.maximum,
          nullCount: statistics.nullCount
        }
      }
    ]
  };
}

/** Encodes a deterministic multi-row-group predicate fixture. */
async function createPredicateFixture(): Promise<ArrayBuffer> {
  return await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false},
          {name: 'category', type: 'utf8', nullable: false},
          {name: 'payload', type: 'utf8', nullable: false}
        ],
        metadata: {}
      },
      data: Array.from({length: 12}, (_, index) => ({
        id: index,
        category: index % 2 === 0 ? 'even' : 'odd',
        payload: `row-${index}`
      }))
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {parquet: {rowGroupSize: 4}}
  );
}

/** Collects a Parquet source stream for focused assertions. */
async function collectBatches(
  batches: AsyncIterable<ParquetSourceBatch>
): Promise<ParquetSourceBatch[]> {
  const result: ParquetSourceBatch[] = [];
  for await (const batch of batches) {
    result.push(batch);
  }
  return result;
}
