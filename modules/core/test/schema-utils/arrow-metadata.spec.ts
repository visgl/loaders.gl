// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {getTransferList} from '@loaders.gl/core/worker-utils';
import {
  makeArrowTableFromBatches,
  isArrowRecordBatch,
  convertTableToArrow,
  makeArrowRecordBatchIterator,
  mergeArrowSchemas,
  updateArrowTableSchema,
  refineArrowTableBatches,
  serializeArrowSchema
} from '@loaders.gl/core/schema-utils';
import {
  serializeArrowWorkerResult,
  deserializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

test('Native Arrow worker transfers preserve the parser’s input buffers by default', () => {
  const values = new Int32Array([17, 42]);
  const table = arrow.tableFromArrays({value: values});
  const payload = serializeArrowWorkerResult(table, {core: {}});
  const result = deserializeArrowWorkerResult(
    structuredClone(payload, {transfer: getTransferList(payload)})
  );
  expect(result.getChild('value').toArray()).toEqual(new Int32Array([17, 42]));
  expect(values).toEqual(new Int32Array([17, 42]));
});

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
  ).rejects.toThrow('expected field value, got other');
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
    serializeArrowWorkerResult(table, {core: {workerTransferBufferCopy: copy}})
  ) as {columns: {arrowBatchMetadata?: unknown}};
  const restored = deserializeArrowWorkerResult(payload) as arrow.Table;
  expect(restored.schema.metadata.get('stage')).toBe('table');
  expect(restored.batches[0].schema.metadata.get('stage')).toBe('batch');
  expect(restored.batches[0].schema.fields[0].metadata.get('stage')).toBe('batch');
  expect(restored.batches[0].metadata.get('local')).toBe('1');
  delete payload.columns.arrowBatchMetadata;
  const withoutSchemaSnapshot = deserializeArrowWorkerResult(payload) as arrow.Table;
  expect(withoutSchemaSnapshot.batches[0].schema.metadata.get('stage')).toBe('table');
  expect(withoutSchemaSnapshot.batches[0].metadata.get('local')).toBe('1');
});

test('Native Arrow chunks collect cumulative and batch-local bounds', async () => {
  const first = makeBatch(1, {boundingBox: '[[1,2,3],[1,2,3]]'});
  const second = makeBatch(2, {boundingBox: '[[-1,4,0],[-1,4,0]]'});
  const chunks = await Array.fromAsync(
    refineArrowTableBatches([first, second].map(batch => new arrow.Table(batch.schema, [batch])))
  );
  expect(chunks[0].schema.metadata.get('boundingBox')).toBe('[[1,2,3],[1,2,3]]');
  expect(chunks[1].schema.metadata.get('boundingBox')).toBe('[[-1,2,0],[1,4,3]]');
  expect(chunks[1].batches[0].metadata.get('boundingBox')).toBe('[[-1,4,0],[-1,4,0]]');
  const table = await makeArrowTableFromBatches(chunks.flatMap(chunk => chunk.batches));
  expect(table?.schema.metadata.get('boundingBox')).toBe('[[-1,2,0],[1,4,3]]');
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

test('native table conversion works without Arrow static type guards', () => {
  const table = arrow.tableFromArrays({id: new Int32Array([1, 2])});
  const original = Object.getOwnPropertyDescriptor(arrow.Table, 'isTable');
  Object.defineProperty(arrow.Table, 'isTable', {value: undefined, configurable: true});
  try {
    expect(convertTableToArrow(table)).toBe(table);
  } finally {
    if (original) Object.defineProperty(arrow.Table, 'isTable', original);
    else Reflect.deleteProperty(arrow.Table, 'isTable');
  }
});

test('native Arrow batch iteration retains identity and metadata when splitting', () => {
  const table = arrow.tableFromArrays({id: new Int32Array([1, 2, 3])});
  const batch = table.batches[0];
  batch.metadata.set('source', 'original');
  expect([...makeArrowRecordBatchIterator(table)][0]).toBe(batch);
  const split = [...makeArrowRecordBatchIterator(table, {batchSize: 2})];
  expect(split.map(part => part.numRows)).toEqual([2, 1]);
  expect(split.flatMap(part => Array.from(part.getChild('id')!))).toEqual([1, 2, 3]);
  expect(split.map(part => part.metadata.get('source'))).toEqual(['original', 'original']);
  expect(() => [...makeArrowRecordBatchIterator(table, {batchSize: 0})]).toThrow(RangeError);
});

test('schema updates supply batch metadata when the Arrow runtime has no metadata accessor', () => {
  const table = arrow.tableFromArrays({id: new Int32Array([1, 2])});
  const batch = table.batches[0];
  const metadataAccessor = Object.getOwnPropertyDescriptor(arrow.RecordBatch.prototype, 'metadata');
  expect(metadataAccessor).toBeDefined();
  batch.metadata.set('source', 'original');
  Object.defineProperty(batch, 'metadata', {value: batch.metadata});
  Reflect.deleteProperty(arrow.RecordBatch.prototype, 'metadata');
  try {
    const snapshot = updateArrowTableSchema(table, table.schema).batches[0];
    expect(snapshot).toBeInstanceOf(arrow.RecordBatch);
    expect(Array.from(snapshot.getChild('id')!)).toEqual([1, 2]);
    expect(snapshot.metadata.get('source')).toBe('original');
    snapshot.metadata.set('source', 'snapshot');
    expect(batch.metadata.get('source')).toBe('original');
  } finally {
    Object.defineProperty(arrow.RecordBatch.prototype, 'metadata', metadataAccessor!);
  }
});

test('native record batch detection accepts older unbranded Arrow batches', () => {
  const table = arrow.tableFromArrays({id: new Int32Array([1, 2])});
  const batch = table.batches[0];
  Object.defineProperty(batch, Symbol.for('apache-arrow/RecordBatch'), {value: undefined});
  expect(isArrowRecordBatch(batch)).toBe(true);
  expect(isArrowRecordBatch(table)).toBe(false);
});
