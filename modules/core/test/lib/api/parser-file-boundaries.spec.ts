// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, ReadableFile} from '@loaders.gl/loader-utils';
import {expect, test, vi} from 'vitest';
import {parseFile} from '../../../src/lib/api/parse-file';
import {parseSync} from '../../../src/lib/api/parse-sync';
import {parse} from '../../../src/lib/api/parse';
import {parseInBatches} from '../../../src/lib/api/parse-in-batches';
import {getLoaderImplementation} from '../../../src/lib/api/load-loader';

const metadata: Loader = {
  id: 'file-boundary',
  name: 'File boundary',
  module: 'core',
  version: 'latest',
  extensions: ['boundary'],
  mimeTypes: ['application/x-boundary'],
  binary: true,
  options: {}
};

/** Provides a tiny readable file and an observable random-access read operation. */
function createFile(size: number, bigsize: bigint = BigInt(size)) {
  const read = vi.fn(async () => new Uint8Array([5, 9]).buffer);
  const file = {url: 'memory://tiny.boundary', size, bigsize, read} as unknown as ReadableFile;
  return {file, read};
}

test.each([
  [2, 0n],
  [0, 2n]
])('file parser fallback reads size %s, bigsize %s', async (size, bigsize) => {
  const {file, read} = createFile(size, bigsize);
  const parseBytes = vi.fn(async (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)));
  const loader = {...metadata, parse: parseBytes};
  await expect(parseFile(file, loader, {core: {worker: false}})).resolves.toEqual([5, 9]);
  expect(read).toHaveBeenCalledExactlyOnceWith(0n, 2);
  expect(parseBytes).toHaveBeenCalledTimes(1);
});

test('file fallback rejects missing size and parser-bearing loaders without file or async parser', async () => {
  const {file, read} = createFile(0);
  await expect(parseFile(file, {...metadata, parse: async () => 'unused'})).rejects.toThrow(
    'cannot fall back to parse without a file size'
  );
  await expect(parseFile(file, {...metadata, parseSync: () => 'unused'})).rejects.toThrow(
    'no file parser found'
  );
  expect(read).not.toHaveBeenCalled();
});

test('preloaded file implementations receive the original file and URL context', async () => {
  const {file, read} = createFile(0);
  const parseReadable = vi.fn(async () => 'file result');
  const implementation = {...metadata, parseFile: parseReadable};
  const preload = vi.fn(async () => implementation);
  const loader = {...metadata, preload};
  await expect(parseFile(file, loader)).resolves.toBe('file result');
  expect(preload).toHaveBeenCalledWith(file.url, expect.any(Object));
  expect(parseReadable).toHaveBeenCalledWith(
    file,
    expect.any(Object),
    expect.objectContaining({
      url: file.url,
      filename: 'tiny.boundary'
    })
  );
  expect(read).not.toHaveBeenCalled();
});

test('parse entrypoints return null when loader selection is explicitly nonthrowing', async () => {
  const options = {core: {nothrow: true, ignoreRegisteredLoaders: true}};
  const {file, read} = createFile(2);
  await expect(parseFile(file, options)).resolves.toBeNull();
  expect(parseSync(new ArrayBuffer(0), options)).toBeNull();
  await expect(parse(new ArrayBuffer(0), options)).resolves.toBeNull();
  await expect(parseInBatches([], [], options)).resolves.toEqual([]);
  expect(read).not.toHaveBeenCalled();
});

test('file and synchronous parsing reject source descriptors before parser invocation', async () => {
  const createSource = vi.fn();
  const loader = {...metadata, type: 'source' as const, createDataSource: createSource};
  await expect(parseFile(createFile(2).file, loader)).rejects.toThrow('SourceLoader');
  expect(() => parseSync(new ArrayBuffer(0), loader)).toThrow('SourceLoader');
  expect(createSource).not.toHaveBeenCalled();
});

test('parser preload validation handles failed backends while keeping a successful backend cached', async () => {
  const implementation = {...metadata, parse: async () => 'parsed'};
  const preload = vi.fn(async (_url: string, options?: Record<string, any>) => {
    if (options?.[metadata.id]?.backend === 'broken') {
      throw new Error('backend unavailable');
    }
    return implementation;
  });
  const loader = {...metadata, preload};
  await expect(getLoaderImplementation(loader, {[metadata.id]: {backend: 'good'}})).resolves.toBe(
    implementation
  );
  await expect(
    getLoaderImplementation(loader, {[metadata.id]: {backend: 'broken'}})
  ).rejects.toThrow('backend unavailable');
  await expect(getLoaderImplementation(loader, {[metadata.id]: {backend: 'good'}})).resolves.toBe(
    implementation
  );
  expect(preload).toHaveBeenCalledTimes(2);
});

test('synchronous parsing rejects recursive async parsing requested by a parser', () => {
  const loader = {
    ...metadata,
    parseSync: (_buffer: ArrayBuffer, _options: unknown, context: any) => context._parse()
  };
  expect(() => parseSync(new ArrayBuffer(0), loader)).toThrow('parseSync called parse');
});
