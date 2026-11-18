// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  canParseWithWorker,
  parseFromContext,
  parseWithWorker,
  parseWithWorkerInBatches
} from '@loaders.gl/core/loader-utils';
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
const PARENT_LOADER = {
  ...CHILD_LOADER,
  id: 'nested-parent',
  worker: new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href
};

// The bytes have no identifying signature; only the explicit loader hint selects a parser.

test.each([
  false,
  true
])('nested worker preserves explicit loader selection (array: %s)', async loaderIsArray => {
  const fetchNested = vi.fn(async () => new Response('nested fixture'));
  const parser = vi.fn(async (_data, _options, context) => {
    expect(context.url).toBe('nested');
    expect(context.signal).toBeInstanceOf(AbortSignal);
    expect(await (await context.fetch('/nested-data')).text()).toBe('nested fixture');
    expect(fetchNested).toHaveBeenCalledWith(
      '/nested-data',
      expect.objectContaining({signal: context.signal})
    );
    expect(context).not.toHaveProperty('_loaderIds');
    return 'decoded';
  });
  const preload = vi.fn(async () => ({...CHILD_LOADER, parse: parser}));
  const child = {...CHILD_LOADER, preload};
  const result = await parseWithWorker(
    {...PARENT_LOADER, subloaders: {ChildLoader: child}},
    new ArrayBuffer(1),
    {core: {worker: true, reuseWorkers: false}, nested: true, loaderIds: [child.id], loaderIsArray},
    {fetch: fetchNested} as any,
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
        nested: true,
        loaderIds: [CHILD_LOADER.id, contextual.id],
        loaderIsArray: true,
        core: {subloaders: {ChildLoader: replacement}, worker: true, reuseWorkers: false}
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
      {core: {worker: true, reuseWorkers: false}, nested: true, loaderIds: ['missing']},
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
    {core: {worker: true, reuseWorkers: false}, nested: true, loaderIds: [CHILD_LOADER.id]},
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
    nested: true,
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
    {core: {worker: true, reuseWorkers: false}, nested: true, emptyContext: true},
    undefined,
    callback
  );
  expect(result).toEqual({worker: false});
});

test('caller-only loaders do not serialize bigint options when checking worker eligibility', () => {
  expect(canParseWithWorker(CHILD_LOADER, {core: {worker: true}, limits: {bytes: 1024n}})).toBe(
    false
  );
  expect(canParseWithWorker(PARENT_LOADER, {core: {worker: false}, limits: {bytes: 1024n}})).toBe(
    false
  );
  expect(
    canParseWithWorker(CHILD_LOADER, {
      core: {worker: true},
      [CHILD_LOADER.id]: {workerUrl: 'worker.js'}
    })
  ).toBe(true);
});

test('shared bigint ZIP options survive unrelated worker selection and transport exactly', async () => {
  const zip = {maxTotalDecodedBytes: 2n ** 63n + 1n, nested: [1n, null, '1n'], callback: () => {}};
  expect(canParseWithWorker(PARENT_LOADER, {core: {worker: true}, zip})).toBe(true);
  const result = await parseWithWorker(PARENT_LOADER, new ArrayBuffer(0), {
    core: {worker: true, reuseWorkers: false},
    zip,
    echoZip: true
  });
  expect(result).toEqual({maxTotalDecodedBytes: 2n ** 63n + 1n, nested: [1n, null, '1n']});
  expect(zip.callback).toBeTypeOf('function');
});
