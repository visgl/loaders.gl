// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table, tableFromArrays, tableToIPC} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {ArrowLoader} from '../../src/arrow/arrow-loader-types';
import {GeoArrowLoader} from '../../src/arrow/geoarrow-loader-types';
import {
  serializeArrowIPCResult,
  deserializeArrowIPCBatch
} from '../../src/arrow/lib/arrow-worker-transport';

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  ArrowLoader,
  GeoArrowLoader
])('$format streams Arrow batches through workers with shared dictionaries', async metadata => {
  const original = tableFromArrays({id: new Int32Array([1, 2]), label: ['first', 'second']});
  const table = new Table([original.slice(0, 1).batches[0], original.slice(1).batches[0]]);
  const bytes = tableToIPC(table, 'stream');
  const parser = await metadata.preload();
  const mainParser = vi.fn(parser.parseInBatches);
  const loader = {...metadata, preload: async () => ({...parser, parseInBatches: mainParser})};
  const batches = await parseInBatches([bytes], loader, {core: {worker: true}});
  const results: number[] = [];
  const labels: string[] = [];
  for await (const batch of batches) {
    expect(batch.data).toBeInstanceOf(Table);
    results.push(...Array.from(batch.data.getChild('id')!));
    labels.push(...Array.from(batch.data.getChild('label')!));
  }
  expect(mainParser).not.toHaveBeenCalled();
  expect(results).toEqual([1, 2]);
  expect(labels).toEqual(['first', 'second']);
});

test('Arrow atomic worker returns IPC before caller-side row conversion', async () => {
  const bytes = tableToIPC(tableFromArrays({id: new Int32Array([1, 2])}));
  const parser = await ArrowLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const result = await parse(
    bytes,
    {...ArrowLoader, preload: async () => ({...parser, deserializeWorkerResult: deserialize})},
    {
      core: {worker: true},
      arrow: {shape: 'object-row-table'}
    }
  );
  expect(deserialize).toHaveBeenCalledOnce();
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-ipc'}
  });
  expect(result).toMatchObject({shape: 'object-row-table', data: [{id: 1}, {id: 2}]});
});

test('Arrow batch serialization transfers owned IPC without detaching parser state', () => {
  const table = tableFromArrays({label: ['first', 'second']});
  const serialized = serializeArrowIPCResult({
    shape: 'arrow-table',
    batchType: 'data',
    length: 1,
    data: table.slice(0, 1)
  });
  const transferred = structuredClone(serialized, {
    transfer: [serialized.data.data.buffer as ArrayBuffer]
  });
  const received = deserializeArrowIPCBatch(transferred);
  expect(received.data.getChild('label')?.get(0)).toBe('first');
  expect(table.getChild('label')?.get(1)).toBe('second');
  expect(() => serializeArrowIPCResult({shape: 'object-row-table', data: [{id: 1}]})).toThrow(
    'Arrow table output'
  );
});

test('GeoArrow atomic feature conversion happens after transferring extension metadata', async () => {
  const table = tableFromArrays({geometry: ['POINT (1 2)'], label: ['example']});
  table.schema.fields[0].metadata.set('ARROW:extension:name', 'geoarrow.wkt');
  const parser = await GeoArrowLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const result = await parse(
    tableToIPC(table),
    {
      ...GeoArrowLoader,
      preload: async () => ({...parser, deserializeWorkerResult: deserialize})
    },
    {core: {worker: true}, arrow: {shape: 'geojson-table'}}
  );
  expect(deserialize).toHaveBeenCalledOnce();
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-ipc'}
  });
  expect(result).toMatchObject({
    shape: 'geojson-table',
    features: [{geometry: {type: 'Point', coordinates: [1, 2]}, properties: {label: 'example'}}]
  });
});
