import {describe, expect, test} from 'vitest';
import {parse, parseInBatches, parseSync, preload, preloadSync} from '@loaders.gl/core';
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
