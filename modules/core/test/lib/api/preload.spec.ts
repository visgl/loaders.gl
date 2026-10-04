// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {parse, parseInBatches, parseSync, preload, preloadSync, load} from '@loaders.gl/core';
import {CSVLoader as UnbundledCSVLoader} from '@loaders.gl/csv/unbundled';

const CSV_TEXT = 'city,population\nParis,2148000\nBerlin,3769000';
const CSV_ARRAY_BUFFER = new TextEncoder().encode(CSV_TEXT).buffer;

const SyncTextLoader = {
  id: 'sync-text',
  name: 'SyncText',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true,
  parseTextSync: text => text.toUpperCase()
};

const ParseSyncBeforePreloadLoader = {
  id: 'parse-sync-before-preload',
  name: 'ParseSyncBeforePreload',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true,
  preload: async () => SyncTextLoader
};

const ParseSyncAfterPreloadLoader = {
  id: 'parse-sync-after-preload',
  name: 'ParseSyncAfterPreload',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true,
  preload: async () => SyncTextLoader
};

const PreloadSyncCacheLoader = {
  id: 'preload-sync-cache',
  name: 'PreloadSyncCache',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true,
  preload: async () => SyncTextLoader
};

const NoParserLoader = {
  id: 'no-parser',
  name: 'NoParser',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true
};

const SyncBinaryOnlyLoader = {
  id: 'sync-binary-only',
  name: 'SyncBinaryOnly',
  module: 'core',
  version: 'latest',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  parseSync: (arrayBuffer: ArrayBuffer) => arrayBuffer.byteLength
};

const InvalidPreloadLoader = {
  id: 'invalid-preload',
  name: 'InvalidPreload',
  module: 'core',
  version: 'latest',
  extensions: ['txt'],
  mimeTypes: ['text/plain'],
  text: true,
  preload: async () => NoParserLoader
};

describe('preload', () => {
  test('resolves a parser-bearing loader and caches it', async () => {
    const firstLoader = await preload(UnbundledCSVLoader);
    const secondLoader = await preload(UnbundledCSVLoader);

    expect(firstLoader).toBe(secondLoader);
    expect(firstLoader.id).toBe(UnbundledCSVLoader.id);
    expect(firstLoader.parse).toBeTypeOf('function');
    expect(firstLoader.parseInBatches).toBeTypeOf('function');
  });

  test('preloadSync returns cached parser-bearing loaders', async () => {
    expect(preloadSync(PreloadSyncCacheLoader)).toBeNull();

    await preload(PreloadSyncCacheLoader);

    expect(preloadSync(PreloadSyncCacheLoader)).toBe(SyncTextLoader);
    expect(preloadSync(SyncTextLoader)).toBe(SyncTextLoader);
  });

  test('shares concurrent preload requests', async () => {
    let preloadCalls = 0;
    const ConcurrentPreloadSyncTextLoader = {
      id: 'concurrent-preload-sync-text',
      name: 'ConcurrentPreloadSyncText',
      module: 'core',
      version: 'latest',
      extensions: ['txt'],
      mimeTypes: ['text/plain'],
      text: true,
      preload: async () => {
        preloadCalls++;
        await Promise.resolve();
        return SyncTextLoader;
      }
    };

    const [firstLoader, secondLoader] = await Promise.all([
      preload(ConcurrentPreloadSyncTextLoader),
      preload(ConcurrentPreloadSyncTextLoader)
    ]);

    expect(preloadCalls).toBe(1);
    expect(firstLoader).toBe(SyncTextLoader);
    expect(secondLoader).toBe(SyncTextLoader);
  });

  test('caches backend-selected preload implementations separately', async () => {
    let firstBackendCalls = 0;
    let secondBackendCalls = 0;
    const FirstBackendLoader = {
      ...SyncTextLoader,
      id: 'backend-cache'
    };
    const SecondBackendLoader = {
      ...SyncTextLoader,
      id: 'backend-cache',
      parseTextSync: text => text.toLowerCase()
    };
    const BackendCacheLoader = {
      id: 'backend-cache',
      name: 'BackendCache',
      module: 'core',
      version: 'latest',
      extensions: ['txt'],
      mimeTypes: ['text/plain'],
      text: true,
      options: {
        'backend-cache': {
          backend: 'first'
        }
      },
      preload: async (_url: string, options?: Record<string, any>) => {
        if (options?.['backend-cache']?.backend === 'second') {
          secondBackendCalls++;
          return SecondBackendLoader;
        }
        firstBackendCalls++;
        return FirstBackendLoader;
      }
    };

    const defaultBackendLoader = await preload(BackendCacheLoader);
    const firstBackendLoader = await preload(BackendCacheLoader, {
      'backend-cache': {backend: 'first'}
    });
    const secondBackendLoader = await preload(BackendCacheLoader, {
      'backend-cache': {backend: 'second'}
    });
    const secondBackendLoaderAgain = await preload(BackendCacheLoader, {
      'backend-cache': {backend: 'second'}
    });

    expect(defaultBackendLoader).toBe(FirstBackendLoader);
    expect(firstBackendLoader).toBe(FirstBackendLoader);
    expect(secondBackendLoader).toBe(SecondBackendLoader);
    expect(secondBackendLoaderAgain).toBe(SecondBackendLoader);
    expect(firstBackendCalls).toBe(1);
    expect(secondBackendCalls).toBe(1);
  });

  test('rejects loaders without parser implementations', async () => {
    await expect(preload(NoParserLoader)).rejects.toThrow(/parser implementation/);
    await expect(preload(InvalidPreloadLoader)).rejects.toThrow(/parser-bearing loader/);
  });

  test('failed preload attempts do not poison the cache', async () => {
    let preloadCalls = 0;
    const RetryingPreloadLoader = {
      id: 'retrying-preload',
      name: 'RetryingPreload',
      module: 'core',
      version: 'latest',
      extensions: ['txt'],
      mimeTypes: ['text/plain'],
      text: true,
      preload: async () => {
        preloadCalls++;
        if (preloadCalls === 1) {
          return NoParserLoader;
        }
        return SyncTextLoader;
      }
    };

    await expect(preload(RetryingPreloadLoader)).rejects.toThrow(/parser-bearing loader/);
    await expect(preload(RetryingPreloadLoader)).resolves.toBe(SyncTextLoader);
    expect(preloadCalls).toBe(2);
  });

  test('parse upgrades CSVLoader through preload', async () => {
    const table = await parse(CSV_ARRAY_BUFFER, UnbundledCSVLoader, {
      csv: {header: true, shape: 'object-row-table'}
    });

    expect(table).toMatchObject({
      shape: 'object-row-table',
      data: [
        {city: 'Paris', population: 2148000},
        {city: 'Berlin', population: 3769000}
      ]
    });
  });

  test('parse rejects parser-bearing sync loaders without async parse', async () => {
    await expect(parse(CSV_ARRAY_BUFFER, SyncBinaryOnlyLoader)).rejects.toThrow(
      /Add an async 'parse' function/
    );
  });

  test('parseInBatches upgrades CSVLoader through preload', async () => {
    const iterator = await parseInBatches([new Uint8Array(CSV_ARRAY_BUFFER)], UnbundledCSVLoader, {
      csv: {header: true, shape: 'object-row-table'}
    });
    const rows: unknown[] = [];

    for await (const batch of iterator) {
      if (batch.shape === 'object-row-table') {
        rows.push(...batch.data);
      }
    }

    expect(rows).toEqual([
      {city: 'Paris', population: 2148000},
      {city: 'Berlin', population: 3769000}
    ]);
  });

  test('parseSync accepts a parser-bearing loader returned by preload', async () => {
    const csvLoaderWithParser = await preload(UnbundledCSVLoader);
    const table = parseSync(CSV_ARRAY_BUFFER, csvLoaderWithParser, {
      csv: {header: true, shape: 'object-row-table'}
    });

    expect(table).toMatchObject({
      shape: 'object-row-table',
      data: [
        {city: 'Paris', population: 2148000},
        {city: 'Berlin', population: 3769000}
      ]
    });
  });

  test('parseSync uses the cached CSV parser-bearing loader after preload', async () => {
    await preload(UnbundledCSVLoader);
    const table = parseSync(CSV_ARRAY_BUFFER, UnbundledCSVLoader, {
      csv: {header: true, shape: 'object-row-table'}
    });

    expect(table).toMatchObject({
      shape: 'object-row-table',
      data: [
        {city: 'Paris', population: 2148000},
        {city: 'Berlin', population: 3769000}
      ]
    });
  });

  test('parseSync rejects metadata-only loaders before preload', () => {
    expect(parseSync('abc', SyncTextLoader)).toBe('ABC');
    expect(() => parseSync('abc', ParseSyncBeforePreloadLoader)).toThrow(/preload\(loader\)/);
  });

  test('parseSync uses a cached parser-bearing loader after preload', async () => {
    await preload(ParseSyncAfterPreloadLoader);

    expect(parseSync('abc', ParseSyncAfterPreloadLoader)).toBe('ABC');
  });
});

/** Creates a minimal parser fixture with optional declared dependencies. */
function createDependencyLoader(id: string, subloaders = {}) {
  return {
    id,
    name: id,
    module: 'core',
    version: 'latest',
    extensions: ['bin'],
    mimeTypes: [],
    options: {},
    subloaders,
    parse: async (_data, options) => options?.[id]?.subloaders || id,
    parseSync: (_data, options) => options?.[id]?.subloaders || id
  };
}

describe('named subloaders', () => {
  test('prepares nested dependencies and preserves scoped options', async () => {
    const leaf = {
      ...createDependencyLoader('leaf'),
      parse: async (_data, options) => options.leaf.value
    };
    const middle = createDependencyLoader('middle', {LeafLoader: leaf});
    const parent = createDependencyLoader('parent', {MiddleLoader: middle});
    const prepared = await preload(parent, {leaf: {value: 42}});
    const dependencies = await prepared.parse(new ArrayBuffer(0));
    const nested = await dependencies.MiddleLoader.parse(new ArrayBuffer(0), {leaf: {value: 42}});
    expect(await nested.LeafLoader.parse(new ArrayBuffer(0))).toBe(42);
    expect(await nested.LeafLoader.parse(new ArrayBuffer(0), {leaf: {value: 43}})).toBe(43);
    expect(parent.subloaders.MiddleLoader).toBe(middle);
    expect(middle.subloaders.LeafLoader).toBe(leaf);
  });

  test('keeps concurrent overrides isolated and binds sync parsers', async () => {
    const original = createDependencyLoader('original');
    const replacement = createDependencyLoader('replacement');
    const parent = createDependencyLoader('parent', {ChildLoader: original});
    const [normal, custom] = await Promise.all([
      preload(parent),
      preload(parent, {parent: {subloaders: {ChildLoader: replacement}}})
    ]);
    expect(normal.parseSync!(new ArrayBuffer(0)).ChildLoader.id).toBe('original');
    expect(custom.parseSync!(new ArrayBuffer(0)).ChildLoader.id).toBe('replacement');
    expect(preloadSync(parent)).toBe(normal);
    expect(await preload(parent)).toBe(normal);
  });

  test('rejects cycles and unknown override names', async () => {
    const dependencies = {};
    const parent = createDependencyLoader('cycle', dependencies);
    dependencies['SelfLoader'] = parent;
    await expect(preload(parent)).rejects.toThrow('Subloader cycle: cycle -> cycle');
    const valid = createDependencyLoader('valid', {ChildLoader: createDependencyLoader('child')});
    await expect(preload(valid, {valid: {subloaders: {TypoLoader: valid}}})).rejects.toThrow(
      'unknown subloader TypoLoader'
    );
  });

  test('starts dependencies concurrently, deduplicates shared imports, and retries failures', async () => {
    let attempts = 0;
    let release;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const child = createDependencyLoader('child');
    const metadata = {
      ...child,
      parse: undefined,
      parseSync: undefined,
      preload: async () => {
        attempts++;
        await gate;
        if (attempts === 1) throw new Error('retry');
        return child;
      }
    };
    const parent = createDependencyLoader('parent', {
      FirstLoader: metadata,
      SecondLoader: metadata
    });
    const first = preload(parent);
    await Promise.resolve();
    expect(attempts).toBe(1);
    release();
    await expect(first).rejects.toThrow('retry');
    const prepared = await preload(parent);
    expect(attempts).toBe(2);
    expect(prepared.subloaders!.FirstLoader).toBe(prepared.subloaders!.SecondLoader);
  });
});

test('preloads a source dependency before synchronous source creation', async () => {
  const dependency = createDependencyLoader('dependency');
  const source = {
    ...createDependencyLoader('source', {DependencyLoader: dependency}),
    parse: undefined,
    parseSync: undefined,
    preload: vi.fn(async () => source),
    type: 'source',
    fromUrl: true,
    fromBlob: false,
    defaultOptions: {},
    testURL: () => true,
    createDataSource: (_data, options) => options.source.subloaders
  };
  const prepared = await preload(source as never);
  expect((prepared as typeof source).createDataSource('', {}).DependencyLoader.id).toBe(
    'dependency'
  );
  expect((await load('source://example', prepared as never)).DependencyLoader.id).toBe(
    'dependency'
  );
  expect(source.preload).toHaveBeenCalledTimes(1);
});
