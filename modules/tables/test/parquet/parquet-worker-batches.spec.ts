// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {encode, parse, parseInBatches} from '@loaders.gl/core';
import type {ArrowTableBatch, ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {ParquetLoader, ParquetJSWriter} from '@loaders.gl/tables/parquet';
import {ParquetLoaderWithParser} from '@loaders.gl/tables/parquet-loader';

const rows = [
  {id: 1n, label: 'repeat', bytes: new Uint8Array([1]), unused: 10, tags: ['first']},
  {id: 2n, label: null, bytes: null, unused: 20, tags: []},
  {id: 3n, label: 'repeat', bytes: new Uint8Array([3, 4]), unused: 30, tags: ['a', 'b']},
  {id: 4n, label: 'last', bytes: new Uint8Array([5]), unused: 40, tags: null},
  {id: 5n, label: 'repeat', bytes: new Uint8Array([6]), unused: 50, tags: ['last']}
];
const table: ObjectRowTable = {
  shape: 'object-row-table',
  data: rows,
  schema: {
    fields: [
      {name: 'id', type: 'int64'},
      {name: 'label', type: 'utf8', nullable: true},
      {name: 'bytes', type: 'binary', nullable: true},
      {name: 'unused', type: 'int32'},
      {
        name: 'tags',
        type: {type: 'list', children: [{name: 'element', type: 'utf8', nullable: false}]},
        nullable: true
      }
    ],
    metadata: {origin: 'worker-batches'}
  }
};
let input: ArrayBuffer;
beforeAll(async () => {
  input = await encode(table, ParquetJSWriter, {
    core: {worker: false},
    parquet: {compression: 'UNCOMPRESSED', dictionary: true, rowGroupSize: 3}
  });
});
afterEach(() => WorkerFarm.getWorkerFarm().destroy());

/** Makes main-thread fallback observable while retaining metadata-loader preloading. */
function createObservedLoader() {
  const parseInBatches = vi.fn(ParquetLoaderWithParser.parseInBatches);
  const loader = {
    ...ParquetLoader,
    preload: async () => ({...ParquetLoaderWithParser, parseInBatches})
  };
  return {loader, parseInBatches};
}

/** Collects output without hiding the concrete Arrow instances returned by worker transport. */
async function collectBatches(batches: AsyncIterable<ArrowTableBatch | ObjectRowTableBatch>) {
  const results: Array<ArrowTableBatch | ObjectRowTableBatch> = [];
  for await (const batch of batches) results.push(batch);
  return results;
}

test.each([
  'arrow-table',
  'object-row-table'
] as const)('Parquet %s batches run in a worker and preserve selection, schema, binary data, and progress', async shape => {
  const {loader, parseInBatches: mainParser} = createObservedLoader();
  const onProgress = vi.fn();
  const batches = await collectBatches(
    await parseInBatches([input.slice(0, 7), input.slice(7, 19), input.slice(19)], loader, {
      core: {worker: true, maxConcurrency: 1},
      parquet: {
        shape,
        columns: ['id', 'label', 'bytes', 'tags'],
        offset: 1,
        limit: 3,
        batchSize: 1
      },
      onProgress
    })
  );
  expect(mainParser).not.toHaveBeenCalled();
  expect(batches.map(batch => batch.length)).toEqual([1, 1, 1]);
  const actualRows = [];
  for (const batch of batches) {
    expect(batch.batchType).toBe('data');
    expect(batch.schema.fields.map(field => field.name)).toEqual(['id', 'label', 'bytes', 'tags']);
    expect(batch.schema.metadata?.origin).toBe('worker-batches');
    if (batch.shape === 'arrow-table') {
      expect(batch.data).toBeInstanceOf(Table);
      actualRows.push(...Array.from(batch.data, row => row.toJSON()));
    } else {
      actualRows.push(...batch.data);
    }
  }
  expect(
    actualRows.map(row => ({...row, tags: row.tags === null ? null : Array.from(row.tags)}))
  ).toEqual(rows.slice(1, 4).map(({unused, ...row}) => row));
  expect(onProgress).toHaveBeenLastCalledWith({phase: 'decode', completed: 3, unit: 'rows'});
  const completed = onProgress.mock.calls.map(([progress]) => progress.completed);
  expect(completed).toEqual([...completed].sort((left, right) => left - right));
});

test('cancelling paused Parquet worker batches rejects and restores pool capacity', async () => {
  const {loader, parseInBatches: mainParser} = createObservedLoader();
  const controller = new AbortController();
  const batches = await parseInBatches(input.slice(0), loader, {
    core: {worker: true, maxConcurrency: 1},
    parquet: {shape: 'arrow-table', batchSize: 1},
    signal: controller.signal
  });
  const iterator = batches[Symbol.asyncIterator]();
  expect((await iterator.next()).value.length).toBe(1);
  const reason = new Error('stop Parquet batches');
  controller.abort(reason);
  await expect(iterator.next()).rejects.toBe(reason);
  const replacement = await collectBatches(
    await parseInBatches(input.slice(0), loader, {
      core: {worker: true, maxConcurrency: 1},
      parquet: {shape: 'arrow-table', batchSize: 2}
    })
  );
  expect(replacement.reduce((total, batch) => total + batch.length, 0)).toBe(rows.length);
  expect(mainParser).not.toHaveBeenCalled();
});

test('encrypted Parquet batches retain their key callback on the caller', async () => {
  const keyRetriever = vi.fn(() => new Uint8Array(16).fill(7));
  const encryptedInput = await encode(table, ParquetJSWriter, {
    core: {worker: false},
    parquet: {compression: 'UNCOMPRESSED', encryption: {keyRetriever}}
  });
  keyRetriever.mockClear();
  const {loader, parseInBatches: mainParser} = createObservedLoader();
  const batches = await collectBatches(
    await parseInBatches(encryptedInput, loader, {
      core: {worker: true},
      parquet: {shape: 'arrow-table', keyRetriever, batchSize: 2}
    })
  );
  expect(mainParser).toHaveBeenCalledOnce();
  expect(keyRetriever).toHaveBeenCalled();
  expect(batches.reduce((total, batch) => total + batch.length, 0)).toBe(rows.length);
});

test('Parquet atomic object rows are materialized after receiving Arrow columns', async () => {
  const deserialize = vi.fn(ParquetLoaderWithParser.deserializeWorkerResult);
  const result = await parse(
    input.slice(0),
    {
      ...ParquetLoader,
      preload: async () => ({...ParquetLoaderWithParser, deserializeWorkerResult: deserialize})
    },
    {core: {worker: true}, parquet: {shape: 'object-row-table'}}
  );
  expect(deserialize).toHaveBeenCalledOnce();
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-js'}
  });
  expect(result.shape).toBe('object-row-table');
  expect(result.data).toHaveLength(5);
  expect(result.data[0].id).toBe(1n);
});
