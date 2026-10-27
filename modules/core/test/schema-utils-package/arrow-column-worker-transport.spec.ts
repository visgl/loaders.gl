// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTransferList} from '@loaders.gl/core/worker-utils';
import {expect, test} from 'vitest';
import {Table, vectorFromArray, List, Field, Int32, tableFromArrays} from 'apache-arrow';
import {
  deserializeArrowWorkerTable,
  serializeArrowWorkerTable
} from '@loaders.gl/core/schema-utils/arrow-transport';

test('Column worker transport owns dictionary and mesh index buffers across batch transfers', () => {
  const data = tableFromArrays({label: ['first', 'second']});
  const indices = {value: new Uint16Array([0, 1]), size: 1};
  const payload = serializeArrowWorkerTable({
    shape: 'arrow-table',
    data: data.slice(0, 1),
    indices,
    batchType: 'data',
    length: 1
  }) as any;
  const received = structuredClone(payload, {
    transfer: getTransferList(payload)
  });
  const table = deserializeArrowWorkerTable(received);
  expect(table.data.getChild('label').get(0)).toBe('first');
  expect(table).toMatchObject({batchType: 'data', length: 1});
  expect(Array.from(table.indices.value)).toEqual([0, 1]);
  expect(data.getChild('label')!.get(1)).toBe('second');
  expect(Array.from(indices.value)).toEqual([0, 1]);
});

test.each([
  null,
  {shape: 'mesh', attributes: {}},
  {shape: 'arrow-table', data: {transport: 'arrow-ipc', data: new Uint8Array()}}
])('Column hydration rejects other wire formats %j', payload => {
  expect(() => deserializeArrowWorkerTable(payload)).toThrow('Arrow column transport');
});

test.each([
  null,
  {shape: 'mesh'},
  {shape: 'arrow-table', data: {}}
])('Column worker serialization rejects non-columnar output %j', result => {
  expect(() => serializeArrowWorkerTable(result)).toThrow('Arrow table output');
});

test('Owned column copies preserve shared views within a message', () => {
  const table = tableFromArrays({values: new Int32Array([1, 2, 3])});
  const vector = table.getChild('values')!;
  const aliased = new Table({first: vector, second: vector});
  const payload = serializeArrowWorkerTable({shape: 'arrow-table', data: aliased}) as any;
  const children = payload.data.batches[0].data.children;
  expect(children[0].buffers[1]).toBe(children[1].buffers[1]);
  const hydrated = deserializeArrowWorkerTable(
    structuredClone(payload, {transfer: getTransferList(payload)})
  );
  expect(Array.from(hydrated.data.getChild('first'))).toEqual([1, 2, 3]);
  expect(Array.from(hydrated.data.getChild('second'))).toEqual([1, 2, 3]);
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
  const payload = serializeArrowWorkerTable({
    shape: 'arrow-table',
    data: data.slice(offset, offset + 2),
    batchType: 'data',
    length: 2
  }) as any;
  const buffers = getTransferList(payload) as ArrayBuffer[];
  const received = deserializeArrowWorkerTable(structuredClone(payload, {transfer: buffers}));
  expect(buffers.every(buffer => buffer.byteLength === 0)).toBe(true);
  expect(
    received.data
      .toArray()
      .map(row => ({label: row.label, nested: row.nested === null ? null : Array.from(row.nested)}))
  ).toEqual(
    data
      .slice(offset, offset + 2)
      .toArray()
      .map(row => ({label: row.label, nested: row.nested === null ? null : Array.from(row.nested)}))
  );
  expect(received.data.schema.fields[0].metadata.get('test:extension')).toBe('preserved');
  expect(data.getChild('label')!.get(2)).toBe('third');
  expect(received).toMatchObject({batchType: 'data', length: 2});
});

test('Column worker transport owns retained header and sidecar buffers as well as columns', () => {
  const data = tableFromArrays({value: [1, 2]});
  const headerBytes = new Uint8Array([7, 8]);
  const sidecarIndex = new Int32Array([100, 200]);
  const metadata = {header: {bytes: headerBytes}, shx: {offsets: sidecarIndex}};
  for (const offset of [0, 1]) {
    const payload = serializeArrowWorkerTable({
      shape: 'arrow-table',
      data: data.slice(offset, offset + 1),
      loaderData: metadata
    });
    const transferred = structuredClone(payload, {transfer: getTransferList(payload)});
    const result = deserializeArrowWorkerTable(transferred);
    expect(result.loaderData).toEqual(metadata);
    expect(result.data.getChild('value').get(0)).toBe(offset + 1);
  }
  expect(Array.from(headerBytes)).toEqual([7, 8]);
  expect(Array.from(sidecarIndex)).toEqual([100, 200]);
});
