// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  makeArrowTableFromBatches,
  makeTableFromBatches,
  mergeArrowSchemas,
  updateArrowTableSchema,
  refineArrowTableBatches,
  serializeArrowSchema
} from '@loaders.gl/core/schema-utils';
import {
  serializeArrowWorkerResult,
  deserializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

/** Builds structurally identical batches with independently owned metadata snapshots. */
function makeBatch(value: number, metadata: Record<string, string>): arrow.RecordBatch {
  const source = arrow.tableFromArrays({value: new Int32Array([value])});
  const field = new arrow.Field(
    'value',
    new arrow.Int32(),
    true,
    new Map(Object.entries(metadata))
  );
  return new arrow.RecordBatch(
    new arrow.Schema([field], new Map(Object.entries(metadata))),
    source.batches[0].data,
    new Map([['local', String(value)]])
  );
}

test('Arrow collection refines metadata without rewriting earlier batches', async () => {
  const first = makeBatch(1, {retained: 'yes', stage: 'first'});
  const second = makeBatch(2, {stage: 'second'});
  const final = new arrow.RecordBatch(
    new arrow.Schema(second.schema.fields, new Map([['stage', 'final']])),
    undefined
  );
  const table = (await makeArrowTableFromBatches([first, second, final]))!;
  expect(table.numRows).toBe(2);
  expect(Object.fromEntries(table.schema.metadata)).toEqual({retained: 'yes', stage: 'final'});
  expect(Object.fromEntries(table.schema.fields[0].metadata)).toEqual({
    retained: 'yes',
    stage: 'second'
  });
  expect(table.batches[0].schema.metadata.get('stage')).toBe('first');
  expect(table.batches[0].metadata.get('local')).toBe('1');
  first.schema.metadata.set('stage', 'mutated');
  expect(table.batches[0].schema.metadata.get('stage')).toBe('first');
  expect(table.schema.metadata.has('local')).toBe(false);
  expect(await makeArrowTableFromBatches([])).toBeNull();
  expect((await makeArrowTableFromBatches([final]))!.schema.metadata.get('stage')).toBe('final');
  await expect(
    makeArrowTableFromBatches([second, arrow.tableFromArrays({other: [1]}).batches[0]])
  ).rejects.toThrow('schemas must be equivalent');
});

test.each([
  'none',
  'sliced',
  'all'
] as const)('Arrow %s buffer transport retains table, batch schema, and custom metadata', copy => {
  const batch = makeBatch(1, {stage: 'batch'});
  const schema = new arrow.Schema(batch.schema.fields, new Map([['stage', 'table']]));
  const table = new arrow.Table(schema, [batch]);
  const payload = structuredClone(
    serializeArrowWorkerResult(
      {shape: 'arrow-table', data: table},
      {core: {workerTransferBufferCopy: copy}}
    )
  ) as {arrowBatchMetadata?: unknown};
  const restored = deserializeArrowWorkerResult(payload).data;
  expect(restored.schema.metadata.get('stage')).toBe('table');
  expect(restored.batches[0].schema.metadata.get('stage')).toBe('batch');
  expect(restored.batches[0].schema.fields[0].metadata.get('stage')).toBe('batch');
  expect(restored.batches[0].metadata.get('local')).toBe('1');
  delete payload.arrowBatchMetadata;
  const legacy = deserializeArrowWorkerResult(payload).data;
  expect(legacy.batches[0].schema.metadata.get('stage')).toBe('table');
  expect(legacy.batches[0].metadata.size).toBe(0);
});

test('Arrow wrappers collect cumulative bounds and retain local bounds', async () => {
  const first = makeBatch(1, {boundingBox: '[[1,2,3],[1,2,3]]'});
  const second = makeBatch(2, {boundingBox: '[[-1,4,0],[-1,4,0]]'});
  const batches = [];
  for await (const batch of refineArrowTableBatches(
    [first, second].map(recordBatch => ({
      shape: 'arrow-table' as const,
      batchType: 'data' as const,
      length: 1,
      data: new arrow.Table([recordBatch])
    }))
  ))
    batches.push(batch);
  expect(batches[0].data.schema.metadata.get('boundingBox')).toBe('[[1,2,3],[1,2,3]]');
  expect(batches[1].data.schema.metadata.get('boundingBox')).toBe('[[-1,2,0],[1,4,3]]');
  expect(batches[1].data.batches[0].metadata.get('boundingBox')).toBe('[[-1,4,0],[-1,4,0]]');
  const table = await makeTableFromBatches(batches);
  expect(table?.schema?.metadata?.boundingBox).toBe('[[-1,2,0],[1,4,3]]');
});

test.each([
  false,
  true
])('Schema snapshots preserve nested metadata including dictionary=%s', dictionary => {
  const first = new arrow.Schema([
    new arrow.Field(
      'nested',
      new arrow.Struct([
        new arrow.Field('value', new arrow.Int32(), true, new Map([['retained', 'yes']]))
      ]),
      true
    )
  ]);
  const second = new arrow.Schema([
    new arrow.Field(
      'nested',
      new arrow.Struct([
        new arrow.Field('value', new arrow.Int32(), true, new Map([['stage', 'final']]))
      ]),
      true
    )
  ]);
  if (dictionary) {
    first.fields[0] = new arrow.Field(
      'nested',
      new arrow.Dictionary(first.fields[0].type, new arrow.Int32(), 0),
      true
    );
    second.fields[0] = new arrow.Field(
      'nested',
      new arrow.Dictionary(second.fields[0].type, new arrow.Int32(), 0),
      true
    );
  }
  const merged = mergeArrowSchemas(first, second);
  expect(
    Object.fromEntries(
      (arrow.DataType.isDictionary(merged.fields[0].type)
        ? merged.fields[0].type.dictionary
        : merged.fields[0].type
      ).children[0].metadata
    )
  ).toEqual({
    retained: 'yes',
    stage: 'final'
  });
  const table = updateArrowTableSchema(new arrow.Table(first), merged);
  expect(table.numRows).toBe(0);
  expect(serializeArrowSchema(table.batches[0].schema)).toEqual(serializeArrowSchema(merged));
});
