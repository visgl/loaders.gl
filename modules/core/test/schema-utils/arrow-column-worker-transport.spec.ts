// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTransferList} from '@loaders.gl/core/worker-utils';
import {expect, test} from 'vitest';
import {
  Data,
  Schema,
  Struct,
  Table,
  vectorFromArray,
  List,
  Field,
  Int32,
  tableFromArrays
} from 'apache-arrow';
import {
  createRecordBatchWithMetadata,
  hydrateArrowTable as hydrateMathArrowTable
} from '@math.gl/arrow';
import {
  deserializeNativeArrowWorkerResult,
  serializeNativeArrowWorkerResult,
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

test.each([
  null,
  {shape: 'mesh', attributes: {}},
  {transport: 'arrow-ipc', data: new Uint8Array()}
])('Native column hydration rejects other wire formats %j', payload => {
  expect(() => deserializeNativeArrowWorkerResult(payload)).toThrow('Arrow column transport');
});

test('Worker adapters pass non-Arrow results through', () => {
  const mesh = {attributes: {}};
  expect(serializeArrowWorkerResult(mesh)).toBe(mesh);
  expect(deserializeArrowWorkerResult(mesh)).toBe(mesh);
});

test('Owned column copies preserve shared views within a message', () => {
  const table = tableFromArrays({values: new Int32Array([1, 2, 3])});
  const vector = table.getChild('values')!;
  const aliased = new Table({first: vector, second: vector});
  const payload = serializeNativeArrowWorkerResult(aliased) as any;
  const columns = payload.columns.data;
  expect(columns.schema).toBeInstanceOf(Uint8Array);
  expect(columns.version).toBe(1);
  expect(Array.from(hydrateMathArrowTable(columns).getChild('first')!)).toEqual([1, 2, 3]);
  const children = columns.batches[0].children;
  expect(children[0].buffers[1]).toBe(children[1].buffers[1]);
  const hydrated = deserializeNativeArrowWorkerResult(
    structuredClone(payload, {transfer: getTransferList(payload)})
  );
  expect(Array.from(hydrated.getChild('first')!)).toEqual([1, 2, 3]);
  expect(Array.from(hydrated.getChild('second')!)).toEqual([1, 2, 3]);
  expect(Array.from(vector)).toEqual([1, 2, 3]);
});

test.each([
  0, 1
])('Nested column transfers preserve offset %s, nulls, metadata and retained batches', offset => {
  const data = new Table({
    nested: vectorFromArray([[1, 2], null, [3]], new List(new Field('item', new Int32(), true))),
    label: vectorFromArray(['first', 'second', 'third'])
  });
  data.schema.fields[0].metadata.set('test:extension', 'preserved');
  const slice = data.slice(offset, offset + 2);
  const payload = serializeNativeArrowWorkerResult(slice);
  const buffers = getTransferList(payload) as ArrayBuffer[];
  const received = deserializeNativeArrowWorkerResult(
    structuredClone(payload, {transfer: buffers})
  );
  expect(buffers.every(buffer => buffer.byteLength === 0)).toBe(true);
  const rows = (table: Table) =>
    table.toArray().map(row => ({
      label: row.label,
      nested: row.nested === null ? null : Array.from(row.nested)
    }));
  expect(rows(received as Table)).toEqual(rows(slice));
  expect(received.schema.fields[0].metadata.get('test:extension')).toBe('preserved');
  expect(data.getChild('label')!.get(2)).toBe('third');
});

test.each([
  false,
  true
])('Native Arrow transport retains independent metadata with batch output %s', batchOutput => {
  const table = tableFromArrays({value: [1, 2]});
  table.schema.metadata.set('stage', 'complete');
  const batch = table.batches[0];
  batch.schema.metadata = new Map([['stage', 'partial']]);
  batch.schema.fields[0].metadata.set('units', 'count');
  batch.metadata.set('local', 'first');
  const input = batchOutput ? batch : table;
  const payload = serializeNativeArrowWorkerResult(input);
  expect(payload).toMatchObject({columns: {data: {transport: 'arrow-js'}}});
  expect(payload).not.toHaveProperty('columns.shape');
  const received = deserializeNativeArrowWorkerResult(
    structuredClone(payload, {
      transfer: getTransferList(payload)
    })
  );
  expect(received.numRows).toBe(2);
  expect(received.getChild('value')?.get(1)).toBe(2);
  expect(input.getChild('value')?.get(0)).toBe(1);
  const receivedBatch = received instanceof Table ? received.batches[0] : received;
  expect(receivedBatch.schema.metadata.get('stage')).toBe('partial');
  expect(receivedBatch.schema.fields[0].metadata.get('units')).toBe('count');
  expect(receivedBatch.metadata.get('local')).toBe('first');
});

test('worker round trip preserves zero-column rows and separate batch schemas', () => {
  const batchSchema = new Schema([], new Map([['stage', 'batch']]));
  const batch = createRecordBatchWithMetadata(
    batchSchema,
    new Data(new Struct([]), 0, 3, 0, undefined, []),
    new Map([['partition', 'first']])
  );
  const table = new Table(new Schema([], new Map([['stage', 'table']])), [batch]);
  const payload = serializeNativeArrowWorkerResult(table);
  const restored = deserializeNativeArrowWorkerResult(structuredClone(payload)) as Table;
  expect(restored.numRows).toBe(3);
  expect(restored.numCols).toBe(0);
  expect(restored.schema.metadata.get('stage')).toBe('table');
  expect(restored.batches[0].schema.metadata.get('stage')).toBe('batch');
  expect(restored.batches[0].metadata.get('partition')).toBe('first');
});
