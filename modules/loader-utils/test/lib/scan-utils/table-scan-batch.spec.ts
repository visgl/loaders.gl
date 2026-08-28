import {expect, test} from 'vitest';
import type {ArrowTable, TableBatch} from '@loaders.gl/schema';
import {
  executeTableScanBatches,
  filterTableBatch,
  makeTableScanBatch,
  projectTableBatch,
  truncateTableBatch
} from '../../../src/lib/scan-utils/table-scan-batch';

const schema = {
  fields: [
    {name: 'id', type: 'int32', nullable: false},
    {name: 'value', type: 'float64', nullable: true}
  ]
} as TableBatch['schema'];

test('shared table executor filters, projects, limits, and reports bytes', async () => {
  const telemetry: unknown[] = [];
  const batch: TableBatch = {
    shape: 'object-row-table',
    schema,
    data: [
      {id: 1, value: 10},
      {id: 2, value: 20},
      {id: 3, value: 30}
    ],
    length: 3
  };
  async function* readBatches(
    _signal?: AbortSignal,
    onByteLength?: (byteLength: number) => void
  ): AsyncIterable<TableBatch> {
    onByteLength?.(12);
    yield batch;
  }
  const result: TableBatch[] = [];
  for await (const output of executeTableScanBatches(readBatches, {
    predicate: {op: '>', args: [{property: 'value'}, 10]},
    columns: ['id'],
    limit: 1,
    onTelemetry: snapshot => telemetry.push(snapshot)
  }))
    result.push(output);
  expect(result[0]?.data).toEqual([{id: 2}]);
  expect(result[0]?.length).toBe(1);
  expect(telemetry).toHaveLength(1);
  expect(telemetry[0]).toMatchObject({status: 'early-terminated', rowsRead: 3, rowsReturned: 1});
});

test('shared batch helpers preserve columnar, array, geojson, and arrow shapes', () => {
  const arrowTable = {
    shape: 'arrow-table',
    schema,
    data: {numRows: 2}
  } as unknown as ArrowTable;
  expect(makeTableScanBatch(arrowTable)).toMatchObject({
    shape: 'arrow-table',
    batchType: 'data',
    length: 2
  });

  const columnar: TableBatch = {
    shape: 'columnar-table',
    schema,
    data: {id: [1, 2], value: [10, 20]},
    length: 2
  };
  expect(truncateTableBatch(columnar, 1)).toMatchObject({length: 1, data: {id: [1]}});
  expect(projectTableBatch(columnar, ['value'])).toMatchObject({data: {value: [10, 20]}});

  const arrayRows: TableBatch = {shape: 'array-row-table', data: [[1], [2]], length: 2};
  expect(truncateTableBatch(arrayRows, 1)).toMatchObject({length: 1, data: [[1]]});

  const geojson: TableBatch = {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: [],
    length: 0
  };
  expect(truncateTableBatch(geojson, 0)).toMatchObject({length: 0, features: []});
  expect(projectTableBatch(geojson, ['id'])).toBe(geojson);
  expect(projectTableBatch({shape: 'object-row-table', data: [], length: 0}, ['id'])).toMatchObject(
    {
      length: 0,
      data: []
    }
  );

  const arrowData = {
    slice: (_start: number, length: number) => ({length}),
    select: (columns: string[]) => ({columns})
  };
  const arrow = {
    shape: 'arrow-table',
    data: arrowData,
    length: 2
  } as unknown as TableBatch;
  expect(truncateTableBatch(arrow, 1)).toMatchObject({length: 1, data: {length: 1}});
  expect(projectTableBatch(arrow, ['id'])).toMatchObject({data: {columns: ['id']}});
});

test('shared table executor reports cancellation and consumer return', async () => {
  const batch: TableBatch = {shape: 'object-row-table', data: [{id: 1}], length: 1};
  const controller = new AbortController();
  controller.abort();
  const cancelled: unknown[] = [];
  async function* readCancelled(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    yield batch;
  }
  await expect(
    (async () => {
      for await (const _batch of executeTableScanBatches(readCancelled, {
        signal: controller.signal,
        onTelemetry: snapshot => cancelled.push(snapshot)
      })) {
        // expected to abort before yielding
      }
    })()
  ).rejects.toThrow();
  expect(cancelled[0]).toMatchObject({status: 'cancelled'});

  const returned: unknown[] = [];
  async function* readMany(): AsyncIterable<TableBatch> {
    yield batch;
    yield batch;
  }
  for await (const _batch of executeTableScanBatches(readMany, {
    onTelemetry: snapshot => returned.push(snapshot)
  }))
    break;
  expect(returned[0]).toMatchObject({
    status: 'early-terminated',
    earlyTerminationReason: 'consumer-return'
  });

  const zeroLimit: unknown[] = [];
  for await (const _batch of executeTableScanBatches(readMany, {
    limit: 0,
    onTelemetry: snapshot => zeroLimit.push(snapshot)
  })) {
    // expected to stop before opening the reader
  }
  expect(zeroLimit[0]).toMatchObject({status: 'early-terminated', sourcesRead: 0});

  const failed: unknown[] = [];
  async function* readFailed(): AsyncIterable<TableBatch> {
    throw new Error('reader failed');
  }
  await expect(
    (async () => {
      for await (const _batch of executeTableScanBatches(readFailed, {
        onTelemetry: snapshot => failed.push(snapshot)
      })) {
        // expected to throw before yielding
      }
    })()
  ).rejects.toThrow('reader failed');
  expect(failed[0]).toMatchObject({status: 'failed'});
});

test('filterTableBatch validates predicate columns', () => {
  const batch: TableBatch = {
    shape: 'object-row-table',
    schema,
    data: [{id: 1, value: 2}],
    length: 1
  };
  expect(filterTableBatch(batch, undefined)).toBe(batch);
  expect(
    filterTableBatch(
      {shape: 'array-row-table', data: [[1]], length: 1},
      {
        op: '=',
        args: [1, 1]
      }
    )
  ).toMatchObject({shape: 'array-row-table'});
  expect(() => filterTableBatch(batch, {op: '=', args: [{property: 'missing'}, 1]})).toThrow(
    'column not found'
  );
});
