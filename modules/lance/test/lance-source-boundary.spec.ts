// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

const lanceMocks = vi.hoisted(() => ({
  parseFileMetadata: vi.fn(),
  parseFileToArrow: vi.fn(),
  readRemoteFileToArrow: vi.fn()
}));

vi.mock('../src/lance-file', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lance-file')>();
  return {...original, parseLanceFileMetadata: lanceMocks.parseFileMetadata};
});

vi.mock('../src/lance-arrow', () => ({
  parseLanceFileToArrow: lanceMocks.parseFileToArrow,
  readLanceRemoteFileToArrow: lanceMocks.readRemoteFileToArrow
}));

import {LanceSourceLoader} from '../src/lance-source-loader';

const MOCK_TABLE = {shape: 'arrow-table', data: {numRows: 2}};
const MOCK_FILE_METADATA = {majorVersion: 2, minorVersion: 0, fileSizeBytes: 64};

beforeEach(() => {
  lanceMocks.parseFileMetadata.mockReset().mockReturnValue(MOCK_FILE_METADATA);
  lanceMocks.parseFileToArrow.mockReset().mockReturnValue(MOCK_TABLE);
  lanceMocks.readRemoteFileToArrow.mockReset().mockResolvedValue(MOCK_TABLE);
});

test('LanceSource reads direct Blob data files and wraps decoded Arrow batches', async () => {
  const source = LanceSourceLoader.createDataSource(new Blob([new Uint8Array([1, 2, 3])]), {
    lance: {columnTypes: ['int32'], columnNames: ['value'], limit: 2}
  });

  const batches = await collect(source.readBatches());

  expect(lanceMocks.parseFileToArrow).toHaveBeenCalledWith(expect.any(ArrayBuffer), {
    columnTypes: ['int32'],
    columnNames: ['value'],
    limit: 2
  });
  expect(batches).toEqual([{...MOCK_TABLE, batchType: 'data', length: 2}]);
  await expect(source.getFileMetadata()).resolves.toBe(MOCK_FILE_METADATA);
});

test('LanceSource uses ranged remote reads when manifest file sizes are available', async () => {
  const fetch = vi.fn();
  const source = LanceSourceLoader.createDataSource('https://example.com/dataset', {
    lance: {columnTypes: ['float32', 'int64'], columnNames: ['x'], limit: 5},
    core: {loadOptions: {core: {fetch}}}
  } as any) as any;
  source.getMetadata = vi.fn(async () => ({
    fields: [],
    fragments: [{files: [{path: 'part.lance', fileSizeBytes: 1024}]}]
  }));

  await collect(source.readBatches());

  expect(lanceMocks.readRemoteFileToArrow).toHaveBeenCalledWith(
    'https://example.com/dataset/data/part.lance',
    1024,
    [
      {index: 0, name: 'x', type: 'float32'},
      {index: 1, name: 'column1', type: 'int64'}
    ],
    5,
    0,
    expect.any(Function)
  );
  expect(fetch).not.toHaveBeenCalled();
});

test('LanceSource falls back to whole-file reads when manifests omit file sizes', async () => {
  const fetch = vi.fn(async () => new Response(new Uint8Array([4, 5, 6])));
  const source = LanceSourceLoader.createDataSource('https://example.com/dataset/', {
    lance: {columnTypes: ['uint8']},
    core: {loadOptions: {core: {fetch}}}
  } as any) as any;
  source.getMetadata = vi.fn(async () => ({
    fields: [],
    fragments: [{files: [{path: 'part.lance'}]}]
  }));

  await collect(source.readBatches());

  expect(fetch).toHaveBeenCalledWith('https://example.com/dataset/data/part.lance', undefined);
  expect(lanceMocks.parseFileToArrow).toHaveBeenCalledWith(expect.any(ArrayBuffer), {
    columnTypes: ['uint8'],
    columnNames: undefined,
    limit: undefined
  });
});

test('LanceSource validates manifest data files and reports HTTP failures', async () => {
  const source = LanceSourceLoader.createDataSource('https://example.com/dataset', {
    lance: {columnTypes: ['int32']}
  }) as any;
  source.getMetadata = vi.fn(async () => ({fields: [], fragments: []}));
  await expect(source.getFileMetadata()).rejects.toThrow('does not contain a data file');
  await expect(collect(source.readBatches())).rejects.toThrow('does not contain a data file');

  const directFile = LanceSourceLoader.createDataSource(
    'https://example.com/dataset/data/part.lance?version=1',
    {}
  ) as any;
  directFile.fetch = vi.fn(async () => new Response('missing', {status: 404}));
  await expect(directFile.getFileMetadata()).rejects.toThrow('404');

  directFile.fetch = vi.fn(async () => new Response(new Uint8Array([1])));
  await directFile.getFileMetadata('/replacement.lance');
  expect(directFile.fetch).toHaveBeenCalledWith(
    'https://example.com/dataset/data/part.lance?version=1/replacement.lance'
  );
});

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}
