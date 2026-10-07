// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  parseFromContext,
  parseWithWorker,
  parseWithWorkerInBatches
} from '@loaders.gl/loader-utils';
import {parse} from '@loaders.gl/core';

const CHILD_LOADER = {
  id: 'nested-child',
  name: 'Nested child',
  module: 'test',
  version: '1',
  extensions: [],
  mimeTypes: [],
  tests: [() => true],
  options: {}
};
const PARENT_LOADER = {...CHILD_LOADER, id: 'nested-parent', worker: true};

// The bytes have no identifying signature. Only the explicit loader hint can select the parser.
const NESTED_WORKER_SOURCE = `
  self.onmessage = ({data: {type, payload}}) => {
    if (type === 'process' || type === 'process-in-batches') {
      self.postMessage({source: 'loaders.gl', type: 'process', payload: {
        id: 17, input: new ArrayBuffer(1), options: {core: {worker: false}},
        context: payload.options.emptyContext ? {} : {_loaderIds: payload.options.loaderIds, _loaderIsArray: payload.options.loaderIsArray, url: 'nested'}
      }});
    } else if (type === 'done' && payload.id === 17) {
      if (payload.result.batch) {
        self.postMessage({source: 'loaders.gl', type: 'output-batch', payload: {result: payload.result}});
      } else {
        self.postMessage({source: 'loaders.gl', type: 'done', payload: {result: payload.result}});
      }
    } else if (type === 'output-ack') {
      self.postMessage({source: 'loaders.gl', type: 'done', payload: {}});
    } else if (type === 'error') {
      self.postMessage({source: 'loaders.gl', type: 'error', payload: {error: payload.error}});
    }
  };
`;

test.each([
  false,
  true
])('nested worker preserves explicit loader selection (array: %s)', async loaderIsArray => {
  const parser = vi.fn(async (_data, _options, context) => {
    expect(context.url).toBe('nested');
    expect(context.fetch).toBe(fetch);
    expect(context).not.toHaveProperty('_loaderIds');
    return 'decoded';
  });
  const preload = vi.fn(async () => ({...CHILD_LOADER, parse: parser}));
  const child = {...CHILD_LOADER, preload};
  const result = await parseWithWorker(
    {...PARENT_LOADER, subloaders: {ChildLoader: child}},
    new ArrayBuffer(1),
    {
      source: NESTED_WORKER_SOURCE,
      worker: true,
      reuseWorkers: false,
      loaderIds: [child.id],
      loaderIsArray
    },
    {fetch} as any,
    parse
  );
  expect(result).toBe('decoded');
  expect(preload).toHaveBeenCalledOnce();
  expect(parser).toHaveBeenCalledOnce();
});

test('nested worker resolves caller loaders and named overrides without cloning functions', async () => {
  const replacement = {...CHILD_LOADER, id: 'replacement', parse: async () => 'replacement'};
  const contextual = {...CHILD_LOADER, id: 'contextual', parse: async () => 'contextual'};
  const cyclic = {...PARENT_LOADER, subloaders: {} as Record<string, any>};
  cyclic.subloaders.Parent = cyclic;
  cyclic.subloaders.ChildLoader = CHILD_LOADER;
  const callback = vi.fn(async (_data, loaders, _options, context) => {
    expect(loaders).toEqual([replacement, contextual]);
    expect(context.url).toBe('nested');
    return 'selected';
  });
  expect(
    await parseWithWorker(
      cyclic,
      new ArrayBuffer(1),
      {
        source: NESTED_WORKER_SOURCE,
        worker: true,
        reuseWorkers: false,
        loaderIds: [CHILD_LOADER.id, contextual.id],
        loaderIsArray: true,
        core: {subloaders: {ChildLoader: replacement}}
      },
      {loaders: [contextual]} as any,
      callback
    )
  ).toBe('selected');
  expect(callback).toHaveBeenCalledOnce();
});

test('nested worker fails explicitly for an unavailable loader', async () => {
  await expect(
    parseWithWorker(
      PARENT_LOADER,
      new ArrayBuffer(1),
      {source: NESTED_WORKER_SOURCE, worker: true, reuseWorkers: false, loaderIds: ['missing']},
      undefined,
      parse
    )
  ).rejects.toThrow('Worker requested unknown loader "missing"');
});

test('batched workers retain nested loader selection and worker-only context', async () => {
  const callback = vi.fn(async (_data, loaders, _options, context) => {
    expect(loaders).toBe(CHILD_LOADER);
    expect(context.url).toBe('nested');
    expect(context).not.toHaveProperty('_loaderIds');
    return {batch: true};
  });
  const batches = [];
  for await (const batch of parseWithWorkerInBatches(
    {...PARENT_LOADER, subloaders: {ChildLoader: CHILD_LOADER}},
    [new ArrayBuffer(1)],
    {source: NESTED_WORKER_SOURCE, worker: true, reuseWorkers: false, loaderIds: [CHILD_LOADER.id]},
    undefined,
    callback
  ))
    batches.push(batch);
  expect(batches).toEqual([{batch: true}]);
  expect(callback).toHaveBeenCalledOnce();
});

test.each([
  {batched: false, emptyContext: false},
  {batched: true, emptyContext: false},
  {batched: false, emptyContext: true},
  {batched: true, emptyContext: true}
])('context-free worker requests support a second nested parse (batched: $batched, empty: $emptyContext)', async ({
  batched,
  emptyContext
}) => {
  const leaf = {...CHILD_LOADER, id: 'leaf', parse: async () => ({batch: batched, decoded: true})};
  const child = {
    ...CHILD_LOADER,
    async parse(data, options, context) {
      expect(context.coreApi.parse).toBe(parse);
      return await parseFromContext(data, leaf, options, context);
    }
  };
  const options = {
    source: NESTED_WORKER_SOURCE,
    worker: true,
    reuseWorkers: false,
    loaderIds: [child.id],
    emptyContext,
    core: {ignoreRegisteredLoaders: true}
  };
  const parent = {...PARENT_LOADER, subloaders: {ChildLoader: child}};
  const parseCallback = emptyContext
    ? async (data, _loaders, parseOptions, context) =>
        await parse(data, child, parseOptions, context)
    : parse;
  if (batched) {
    const batches = [];
    for await (const batch of parseWithWorkerInBatches(
      parent,
      [new ArrayBuffer(1)],
      options,
      undefined,
      parseCallback
    )) {
      batches.push(batch);
    }
    expect(batches).toEqual([{batch: true, decoded: true}]);
  } else {
    expect(
      await parseWithWorker(parent, new ArrayBuffer(1), options, undefined, parseCallback)
    ).toEqual({
      batch: false,
      decoded: true
    });
  }
});

test('empty worker contexts retain legacy callback options without an outer context', async () => {
  const callback = vi.fn(async (_data, options) => ({worker: options.core.worker}));
  const result = await parseWithWorker(
    PARENT_LOADER,
    new ArrayBuffer(1),
    {
      source: NESTED_WORKER_SOURCE,
      worker: true,
      reuseWorkers: false,
      emptyContext: true
    },
    undefined,
    callback
  );
  expect(result).toEqual({worker: false});
});
