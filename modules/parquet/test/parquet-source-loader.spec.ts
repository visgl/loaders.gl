// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile, load} from '@loaders.gl/core';
import {
  ParquetSource,
  ParquetSourceLoader,
  type ParquetSourceBatch
} from '@loaders.gl/parquet';

const FRUITS_URL = '@loaders.gl/parquet/test/data/fruits.parquet';

test('ParquetSourceLoader#create reusable source with cached metadata', async t => {
  const source = await createParquetSource();

  t.ok(source instanceof ParquetSource, 'load returns a ParquetSource');

  const metadata = await source.getMetadata();
  const secondMetadata = await source.getMetadata();
  const schema = await source.getSchema();

  t.equal(secondMetadata, metadata, 'reuses the cached metadata object');
  t.equal(schema, metadata.schema, 'reuses the cached schema object');
  t.equal(metadata.rowCount, 40_000, 'reports total row count');
  t.equal(metadata.rowGroups.length, 10, 'reports every row group');
  t.equal(metadata.rowGroups[0].rowOffset, 0, 'first row group starts at row zero');
  t.equal(metadata.rowGroups[1].rowOffset, 4_096, 'row offsets are cumulative');
  t.equal(metadata.rowGroups[9].rowOffset, 36_864, 'last row-group offset is correct');
  t.equal(metadata.rowGroups[9].rowCount, 3_136, 'last row-group size is correct');
  t.ok(metadata.rowGroups[0].compressedSize > 0, 'reports compressed row-group size');
  t.ok(metadata.rowGroups[0].uncompressedSize > 0, 'reports uncompressed row-group size');
  t.ok(
    metadata.rowGroups[0].columns.some(column => column.path.join('.') === 'name'),
    'reports column paths'
  );
  t.ok(schema.fields.some(field => field.name === 'name'), 'returns the Arrow-compatible schema');

  t.ok(Object.isFrozen(metadata), 'freezes the cached metadata object');
  t.ok(Object.isFrozen(metadata.rowGroups), 'freezes the cached row-group list');
  t.throws(
    () => Array.prototype.reverse.call(metadata.rowGroups),
    /read only|Cannot assign/i,
    'prevents callers from reordering canonical row-group metadata'
  );

  await source.close();
  await source.close();
  await t.rejects(source.getMetadata(), /ParquetSource is closed/, 'operations fail after close');
  t.end();
});

test('ParquetSource#preserves opaque WASM inputs by identity', async t => {
  const wasmUrl = Promise.resolve(new URL('https://example.com/parquet_wasm_bg.wasm'));
  const source = new ParquetSource(new Blob(), {parquet: {wasmUrl}});

  t.equal(source.options.parquet.wasmUrl, wasmUrl, 'does not recursively merge the WASM input');

  await source.close();
  t.end();
});

test('ParquetSource#read selects row groups and columns with exact provenance', async t => {
  const source = await createParquetSource();
  const batches = await collectBatches(
    source.read({
      rowGroups: [1, 9],
      columns: ['name', 'price'],
      batchSize: 1_000,
      concurrency: 1
    })
  );

  t.equal(
    batches.reduce((rowCount, batch) => rowCount + batch.length, 0),
    7_232,
    'returns only selected row groups'
  );
  t.deepEqual(
    Array.from(new Set(batches.map(batch => batch.metadata.rowGroupIndex))),
    [1, 9],
    'preserves requested row-group order'
  );

  const firstBatchByRowGroup = new Map<number, ParquetSourceBatch>();
  const nextOffsetByRowGroup = new Map<number, number>();
  for (const batch of batches) {
    const metadata = batch.metadata;
    firstBatchByRowGroup.set(metadata.rowGroupIndex, firstBatchByRowGroup.get(metadata.rowGroupIndex) || batch);
    t.equal(
      metadata.rowGroupRowOffset,
      nextOffsetByRowGroup.get(metadata.rowGroupIndex) || 0,
      'row-group-relative offsets are contiguous'
    );
    t.equal(
      metadata.rowOffset,
      (metadata.rowGroupIndex === 1 ? 4_096 : 36_864) + metadata.rowGroupRowOffset,
      'absolute source row offset is correct'
    );
    t.deepEqual(
      batch.schema?.fields.map(field => field.name),
      ['name', 'price'],
      'projects only requested columns'
    );
    t.equal(batch.data.numRows, batch.length, 'Arrow table length matches batch length');
    nextOffsetByRowGroup.set(metadata.rowGroupIndex, metadata.rowGroupRowOffset + batch.length);
  }

  t.equal(firstBatchByRowGroup.get(1)?.metadata.rowOffset, 4_096, 'group 1 provenance starts at 4,096');
  t.equal(firstBatchByRowGroup.get(9)?.metadata.rowOffset, 36_864, 'group 9 provenance starts at 36,864');

  await source.close();
  t.end();
});

test('ParquetSource#read snapshots mutable selections before yielding', async t => {
  const source = await createParquetSource();
  const rowGroups = [0, 1];
  const columns = ['name'];
  const iterator = source.read({rowGroups, columns, batchSize: 5_000})[Symbol.asyncIterator]();
  const batches: ParquetSourceBatch[] = [];

  const firstResult = await iterator.next();
  if (firstResult.value) {
    batches.push(firstResult.value);
  }
  rowGroups[1] = 9;
  columns[0] = 'price';

  for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
    batches.push(result.value);
  }

  t.deepEqual(
    batches.map(batch => batch.metadata.rowGroupIndex),
    [0, 1],
    'caller mutation does not change the selected row groups'
  );
  t.ok(
    batches.every(batch => batch.schema?.fields[0]?.name === 'name'),
    'caller mutation does not change the projected columns'
  );

  await source.close();
  t.end();
});

test('ParquetSource#read validates row-group selections and supports early return', async t => {
  const source = await createParquetSource();

  t.deepEqual(await collectBatches(source.read({rowGroups: []})), [], 'empty selection yields no batches');
  await t.rejects(
    collectBatches(source.read({rowGroups: [10]})),
    /row group index 10 is out of range/,
    'rejects out-of-range row groups'
  );
  await t.rejects(
    collectBatches(source.read({rowGroups: [1, 1]})),
    /row group index 1 is duplicated/,
    'rejects duplicate row groups'
  );

  const iterator = source.read({rowGroups: [0], batchSize: 100})[Symbol.asyncIterator]();
  const firstResult = await iterator.next();
  t.equal(firstResult.value?.metadata.rowOffset, 0, 'first early-return batch has provenance');
  await t.rejects(
    source.close(),
    /cannot close while a read is active/,
    'close rejects instead of deadlocking behind a paused read'
  );
  await t.rejects(
    collectBatches(source.read({rowGroups: [1]})),
    /already has an active read/,
    'a second read rejects instead of queueing behind a paused read'
  );
  await iterator.return?.();

  await source.close();
  t.pass('source closes after an early iterator return');
  t.end();
});

async function createParquetSource(): Promise<ParquetSource> {
  const response = await fetchFile(FRUITS_URL);
  const blob = await response.blob();
  return await load(blob, ParquetSourceLoader);
}

async function collectBatches(
  batches: AsyncIterable<ParquetSourceBatch>
): Promise<ParquetSourceBatch[]> {
  const collectedBatches: ParquetSourceBatch[] = [];
  for await (const batch of batches) {
    collectedBatches.push(batch);
  }
  return collectedBatches;
}
