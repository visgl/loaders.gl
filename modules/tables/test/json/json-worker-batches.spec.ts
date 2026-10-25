// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Field, Int32, Schema, Table, Utf8} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import type {Loader, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {JSONLoader, JSONTableLoader, NDJSONLoader} from '@loaders.gl/tables/json';
import {JSONLoaderWithParser} from '@loaders.gl/tables/json/json-loader';
import {JSONTableLoaderWithParser} from '@loaders.gl/tables/json/json-table-loader';
import {NDJSONLoaderWithParser} from '@loaders.gl/tables/json/ndjson-loader';

const encoder = new TextEncoder();
afterEach(() => WorkerFarm.getWorkerFarm().destroy());

/** Makes accidental caller-side parsing fail visibly while retaining public preloading. */
function observeLoader(metadata: Loader, implementation: LoaderWithParser) {
  const mainParser = vi.fn(implementation.parseInBatches);
  return {
    mainParser,
    loader: {...metadata, preload: async () => ({...implementation, parseInBatches: mainParser})}
  };
}

/** Collects streamed batches without changing their native Arrow instances. */
async function collectBatches(batches: AsyncIterable<any>): Promise<any[]> {
  const results = [];
  for await (const batch of batches) results.push(batch);
  return results;
}

test.each([
  ['JSON', JSONLoader, JSONLoaderWithParser, '[{"id":1},', '{"id":2}]'],
  ['JSONTable', JSONTableLoader, JSONTableLoaderWithParser, '[{"id":1},', '{"id":2}]'],
  ['NDJSON', NDJSONLoader, NDJSONLoaderWithParser, '{"id":1}\n', '{"id":2}\n']
] as const)('%s yields before EOF, applies backpressure, and closes input on return', async (_name, metadata, implementation, firstChunk, lastChunk) => {
  const {loader, mainParser} = observeLoader(metadata, implementation);
  let pulls = 0;
  let closed = false;
  const input = (async function* streamInput() {
    try {
      pulls++;
      yield encoder.encode(firstChunk);
      pulls++;
      yield encoder.encode(lastChunk);
    } finally {
      closed = true;
    }
  })();
  const batches = await parseInBatches(input, loader, {core: {worker: true, batchSize: 1}});
  const iterator = batches[Symbol.asyncIterator]();
  const first = await iterator.next();
  expect(first.value.length).toBe(1);
  expect(pulls).toBe(1);
  expect(closed).toBe(false);
  expect(mainParser).not.toHaveBeenCalled();
  await iterator.return?.();
  await vi.waitFor(() => expect(closed).toBe(true));
  expect(pulls).toBe(1);
  const replacement = await collectBatches(
    await parseInBatches([encoder.encode(firstChunk + lastChunk)], loader, {
      core: {worker: true, maxConcurrency: 1, batchSize: 1}
    })
  );
  expect(replacement.reduce((total, batch) => total + batch.length, 0)).toBe(2);
});

test.each([
  ['JSONTable', JSONTableLoader, JSONTableLoaderWithParser, 'json'],
  ['NDJSON', NDJSONLoader, NDJSONLoaderWithParser, 'ndjson']
] as const)('%s preserves Arrow schemas, UTF-8 boundaries, progress, and atomic output', async (_name, metadata, implementation, namespace) => {
  const schema = new Schema(
    [
      new Field('id', new Int32(), false, new Map([['meaning', 'identifier']])),
      new Field('label', new Utf8(), true)
    ],
    new Map([['origin', 'worker-test']])
  );
  const rows = [
    {id: 1, label: '雪😀'},
    {id: 2, label: null}
  ];
  const text =
    namespace === 'json' ? JSON.stringify(rows) : rows.map(row => JSON.stringify(row)).join('\n');
  const bytes = encoder.encode(text);
  const onProgress = vi.fn();
  const options = {core: {worker: true, batchSize: 1}, [namespace]: {schema}, onProgress};
  const {loader, mainParser} = observeLoader(metadata, implementation);
  const chunks = Array.from(bytes, byte => new Uint8Array([byte]));
  const batches = await collectBatches(await parseInBatches(chunks, loader, options));
  expect(mainParser).not.toHaveBeenCalled();
  expect(batches).toHaveLength(2);
  expect(batches.every(batch => batch.data instanceof Table)).toBe(true);
  expect(batches.flatMap(batch => Array.from(batch.data, (row: any) => row.toJSON()))).toEqual(
    rows
  );
  expect(batches[0].data.schema.fields[0].type).toBeInstanceOf(Int32);
  expect(batches[0].schema.metadata.origin).toBe('worker-test');
  expect(batches[0].data.schema.fields[0].metadata.get('meaning')).toBe('identifier');
  expect(onProgress).toHaveBeenLastCalledWith({phase: 'decode', completed: 2, unit: 'rows'});
  expect(schema).toBeInstanceOf(Schema);
  expect(schema.metadata.get('origin')).toBe('worker-test');
  const atomic: any = await parse(encoder.encode(text), loader, {
    ...options,
    core: {...options.core, _workerType: 'classic'}
  });
  expect(atomic.data).toBeInstanceOf(Table);
  expect(Array.from(atomic.data, (row: any) => row.toJSON())).toEqual(rows);
});

test.each([
  'clarinet',
  'fast'
] as const)('JSON worker preserves path/container metadata with %s backend', async backend => {
  const batches = await collectBatches(
    await parseInBatches(
      [
        encoder.encode('{"label":"before","rows":[{"id":1},'),
        encoder.encode('{"id":2}],"tail":true}')
      ],
      JSONLoader,
      {core: {worker: true, batchSize: 1, metadata: true}, json: {backend, jsonpaths: ['$.rows']}}
    )
  );
  expect(batches.map(batch => batch.batchType)).toEqual([
    'metadata',
    'partial-result',
    'data',
    'data',
    'final-result'
  ]);
  expect(batches.filter(batch => batch.batchType === 'data').flatMap(batch => batch.data)).toEqual([
    {id: 1},
    {id: 2}
  ]);
  const callerBatches = await collectBatches(
    await parseInBatches(
      [encoder.encode('{"label":"before","rows":[{"id":1},{"id":2}],"tail":true}')],
      JSONLoader,
      {core: {worker: false, batchSize: 1, metadata: true}, json: {backend, jsonpaths: ['$.rows']}}
    )
  );
  expect(batches.at(-1)).toEqual(callerBatches.at(-1));
  expect(batches.at(-1)).toMatchObject({
    jsonpath: '$.rows',
    container: {label: 'before', ...(backend === 'clarinet' ? {tail: true} : {})}
  });
});

test('NDJSON worker propagates parse failure and supports cancellation while input is blocked', async () => {
  await expect(
    collectBatches(
      await parseInBatches([encoder.encode('{"id":1}\nbad\n')], NDJSONLoader, {
        core: {worker: true, batchSize: 1}
      })
    )
  ).rejects.toThrow('line 2');
  const controller = new AbortController();
  let requestInput!: () => void;
  const requested = new Promise<void>(resolve => {
    requestInput = resolve;
  });
  const closeInput = vi.fn(async () => ({done: true as const, value: undefined}));
  const input = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      requestInput();
      return new Promise<IteratorResult<ArrayBuffer>>(() => {});
    },
    return: closeInput
  };
  const batches = await parseInBatches(input, NDJSONLoader, {
    core: {worker: true, maxConcurrency: 1},
    signal: controller.signal
  });
  const pending = batches[Symbol.asyncIterator]().next();
  const reason = new Error('cancel blocked JSON input');
  const rejection = expect(pending).rejects.toBe(reason);
  await requested;
  controller.abort(reason);
  await rejection;
  expect(closeInput).toHaveBeenCalledOnce();
});

test.each([
  ['JSONTable', JSONTableLoader, 'json', 'array-row-table', '[{"id":1},{"id":2}]', [[1], [2]]],
  ['NDJSON', NDJSONLoader, 'ndjson', 'object-row-table', '{"id":1}\n{"id":2}\n', [{id: 1}, {id: 2}]]
] as const)('%s returns requested row batches', async (_name, loader, namespace, shape, text, expected) => {
  const batches = await collectBatches(
    await parseInBatches([encoder.encode(text)], loader, {
      core: {worker: true, batchSize: 1},
      [namespace]: {shape}
    })
  );
  expect(batches.map(batch => batch.shape)).toEqual([shape, shape]);
  expect(batches.flatMap(batch => batch.data)).toEqual(expected);
});
