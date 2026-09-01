// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  processLoaderWorkerBatches,
  processLoaderWorkerData
} from '../../../src/lib/worker-loader-utils/create-loader-worker';

const BASE_LOADER = {
  id: 'test',
  name: 'Test',
  module: 'test',
  version: '1',
  extensions: ['test'],
  mimeTypes: ['application/test']
};

describe('processLoaderWorkerData', () => {
  test('merges modules, disables nested workers, and serializes results', async () => {
    const parse = vi.fn(async (_data, options, context) => {
      expect(options).toMatchObject({
        modules: {defaultModule: 'default', override: 'call'},
        core: {worker: false}
      });
      await expect(context.coreApi.fetchFile('data:text/plain,worker')).resolves.toBeInstanceOf(
        Response
      );
      expect(() => context.coreApi.parseSync()).toThrow('unavailable inside worker loaders');
      expect(() => context.coreApi.parse()).toThrow('unavailable inside worker loaders');
      expect(() => context.coreApi.parseFile()).toThrow('unavailable inside worker loaders');
      expect(() => context.coreApi.parseInBatches()).toThrow('unavailable inside worker loaders');
      expect(() => context.coreApi.load()).toThrow('unavailable inside worker loaders');
      expect(() => context.coreApi.loadInBatches()).toThrow('unavailable inside worker loaders');
      return {parsed: true};
    });
    const serializeWorkerResult = vi.fn(result => ({...result, serialized: true}));
    const result = await processLoaderWorkerData(
      {
        ...BASE_LOADER,
        options: {modules: {defaultModule: 'default', override: 'default'}},
        parse,
        serializeWorkerResult
      } as any,
      new ArrayBuffer(2),
      {modules: {override: 'call'}}
    );

    expect(result).toEqual({parsed: true, serialized: true});
    expect(parse).toHaveBeenCalledOnce();
    expect(serializeWorkerResult).toHaveBeenCalledOnce();
  });

  test('retains parser state and serializes each output batch', async () => {
    const parseInBatches = vi.fn(async function* (inputIterator: AsyncIterable<number>) {
      let total = 0;
      for await (const input of inputIterator) {
        total += input;
        yield {batchType: 'data', value: total};
      }
    });
    const serializeWorkerBatch = vi.fn((batch: {batchType: string; value: number}) => ({
      ...batch,
      serialized: true
    }));
    const batches = [];

    for await (const batch of processLoaderWorkerBatches(
      {
        ...BASE_LOADER,
        parseInBatches,
        serializeWorkerBatch
      } as any,
      [1, 2, 3] as any,
      {core: {worker: false}}
    )) {
      batches.push(batch);
    }

    expect(batches).toEqual([
      {batchType: 'data', value: 1, serialized: true},
      {batchType: 'data', value: 3, serialized: true},
      {batchType: 'data', value: 6, serialized: true}
    ]);
    expect(parseInBatches).toHaveBeenCalledOnce();
    expect(serializeWorkerBatch).toHaveBeenCalledTimes(3);
  });

  test('propagates parser errors lazily and closes the parser iterator early', async () => {
    const parserError = new Error('parser failed on second batch');
    let parserClosed = false;
    const parseInBatches = async function* (_inputIterator: AsyncIterable<number>) {
      try {
        yield {batchType: 'data', value: 1};
        throw parserError;
      } finally {
        parserClosed = true;
      }
    };
    const outputIterator = processLoaderWorkerBatches(
      {...BASE_LOADER, parseInBatches} as any,
      [1, 2] as any
    )[Symbol.asyncIterator]();

    expect(parserClosed).toBe(false);
    await expect(outputIterator.next()).resolves.toMatchObject({
      value: {batchType: 'data', value: 1},
      done: false
    });
    await expect(outputIterator.next()).rejects.toBe(parserError);
    expect(parserClosed).toBe(true);

    parserClosed = false;
    const closableIterator = processLoaderWorkerBatches(
      {...BASE_LOADER, parseInBatches} as any,
      [1, 2] as any
    )[Symbol.asyncIterator]();
    await closableIterator.next();
    await closableIterator.return?.();
    expect(parserClosed).toBe(true);
  });

  test('selects sync and text parsers', async () => {
    const parseSync = vi.fn(() => 'binary');
    await expect(
      processLoaderWorkerData({...BASE_LOADER, parseSync} as any, new Uint8Array([1]).buffer)
    ).resolves.toBe('binary');

    const parseTextSync = vi.fn(text => text);
    await expect(
      processLoaderWorkerData(
        {...BASE_LOADER, parseTextSync} as any,
        new TextEncoder().encode('text').buffer
      )
    ).resolves.toBe('text');
    expect(parseTextSync).toHaveBeenCalledWith(
      'text',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });

  test('routes overloaded nested parse calls to the main thread', async () => {
    const process = vi.fn(async (_data, options, context) => ({options, context}));
    const loader = {
      ...BASE_LOADER,
      async parse(_data, _options, context) {
        const nonSerializable = () => {};
        const nestedContext = {url: 'nested', fetch: nonSerializable, coreApi: {}, loaders: []};
        return {
          optionsOnly: await context._parse(new ArrayBuffer(0), {mvt: {shape: 'geojson-table'}}),
          explicit: await context._parse(
            new ArrayBuffer(0),
            [{...BASE_LOADER}],
            {gis: {format: 'binary'}},
            nestedContext
          ),
          loaderOnly: await context._parse(
            new ArrayBuffer(0),
            {...BASE_LOADER},
            undefined,
            nestedContext
          )
        };
      }
    };

    const result = await processLoaderWorkerData(loader as any, new ArrayBuffer(0), {}, {process});
    expect(result.optionsOnly.options).toEqual({mvt: {shape: 'geojson-table'}});
    expect(result.explicit).toEqual({options: {gis: {format: 'binary'}}, context: {url: 'nested'}});
    expect(result.loaderOnly).toEqual({context: {url: 'nested'}});
    expect(process).toHaveBeenCalledTimes(3);
  });

  test('reports missing parsers and missing main-thread routing', async () => {
    await expect(processLoaderWorkerData(BASE_LOADER as any, new ArrayBuffer(0))).rejects.toThrow(
      'Could not load data with Test loader'
    );

    await expect(
      processLoaderWorkerData(
        {
          ...BASE_LOADER,
          async parse(_data, _options, context) {
            return await context._parse(new ArrayBuffer(0));
          }
        } as any,
        new ArrayBuffer(0)
      )
    ).rejects.toThrow('Worker not set up to parse on main thread');
  });
});
