// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';
import {deflateRaw, gzip} from 'pako';
import {MD5Hash} from '@loaders.gl/crypto';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';

const archiveMocks = vi.hoisted(() => ({
  search: vi.fn(),
  centralHeader: vi.fn(),
  localHeader: vi.fn(),
  readRange: vi.fn(),
  buildIndex: vi.fn(),
  parseIndex: vi.fn(),
  fetchFile: vi.fn(),
  hashTable: {} as Record<string, bigint>,
  headers: new Map<
    bigint,
    {fileDataOffset: bigint; compressedSize: bigint; compressionMethod: number}
  >(),
  bytes: new Map<bigint, ArrayBuffer>()
}));

vi.mock('@loaders.gl/zip', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/zip')>();
  return {
    ...original,
    searchFromTheEnd: archiveMocks.search,
    parseZipCDFileHeader: archiveMocks.centralHeader,
    parseZipLocalFileHeader: archiveMocks.localHeader,
    readRange: archiveMocks.readRange,
    makeHashTableFromZipHeaders: archiveMocks.buildIndex,
    parseHashTable: archiveMocks.parseIndex
  };
});

vi.mock('@loaders.gl/core', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/core')>();
  return {...original, fetchFile: archiveMocks.fetchFile};
});

import {
  createSLPKArchiveResolver,
  createTiles3DArchiveResolver
} from '../src/archive-source-resolver';

const BYTE_LOADER: LoaderWithParser<number[]> = {
  id: 'archive-test',
  name: 'Archive bytes',
  module: 'test',
  version: '1',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  options: {},
  /** Returns decoded bytes without interpreting archive contents. */
  parse: async arrayBuffer => Array.from(new Uint8Array(arrayBuffer))
};

beforeEach(() => {
  vi.clearAllMocks();
  archiveMocks.hashTable = {};
  archiveMocks.headers.clear();
  archiveMocks.bytes.clear();
  archiveMocks.search.mockResolvedValue(0n);
  archiveMocks.centralHeader.mockResolvedValue({fileName: 'ordinary.bin'});
  archiveMocks.localHeader.mockImplementation(async offset => archiveMocks.headers.get(offset));
  archiveMocks.readRange.mockImplementation(async (_file, start) => archiveMocks.bytes.get(start));
  archiveMocks.buildIndex.mockImplementation(async () => archiveMocks.hashTable);
  archiveMocks.parseIndex.mockImplementation(() => archiveMocks.hashTable);
  archiveMocks.fetchFile.mockResolvedValue(new Response(new Uint8Array([0])));
});

/** Registers one tiny archive member behind the ZIP parser boundary. */
async function addArchiveEntry(
  name: string,
  bytes: Uint8Array,
  compressionMethod = 0
): Promise<bigint> {
  const headerOffset = BigInt(archiveMocks.headers.size * 100 + 10);
  const fileDataOffset = headerOffset + 30n;
  const nameHash = await new MD5Hash().hash(new TextEncoder().encode(name).buffer, 'hex');
  archiveMocks.hashTable[nameHash] = headerOffset;
  archiveMocks.headers.set(headerOffset, {
    fileDataOffset,
    compressedSize: BigInt(bytes.byteLength),
    compressionMethod
  });
  archiveMocks.bytes.set(fileDataOffset, bytes.slice().buffer);
  return headerOffset;
}

test('3TZ resolver shares archive initialization and fetches parser dependencies', async () => {
  await addArchiveEntry('tileset.json', new Uint8Array([1]));
  await addArchiveEntry('child.bin', new Uint8Array([2, 3]));
  const dependencyLoader: LoaderWithParser = {
    ...BYTE_LOADER,
    /** Exercises fetch input forms provided to a parser inside an archive. */
    parse: async (_data, _options, context) => {
      const requests = [
        'child.bin?version=1',
        new URL('https://archive.invalid/test.3tz/child.bin?version=2'),
        new Request('https://archive.invalid/test.3tz/child.bin?version=3')
      ];
      const values: number[][] = [];
      for (const request of requests) {
        const response = await (context!.fetch as typeof fetch)(request);
        values.push(Array.from(new Uint8Array(await response.arrayBuffer())));
      }
      return values;
    }
  };
  const {resolver} = createTiles3DArchiveResolver('/archive', dependencyLoader);
  const [root, child] = await Promise.all([
    resolver.loadRoot!('ignored', dependencyLoader, {worker: false}),
    resolver.loadResource!('/archive/child.bin', BYTE_LOADER, {worker: false})
  ]);
  expect(root).toEqual([
    [2, 3],
    [2, 3],
    [2, 3]
  ]);
  expect(child).toEqual([2, 3]);
  expect(archiveMocks.search).toHaveBeenCalledOnce();
  expect(archiveMocks.buildIndex).toHaveBeenCalledOnce();
  expect(archiveMocks.fetchFile).toHaveBeenCalledOnce();
  expect(archiveMocks.fetchFile).toHaveBeenCalledWith('/archive');
});

test('3TZ resolver accepts case-sensitive entries and deflated members', async () => {
  await addArchiveEntry('Tiles.BIN', deflateRaw(new Uint8Array([7, 8])), 8);
  const {resolver} = createTiles3DArchiveResolver(new Blob([]), BYTE_LOADER);
  expect(await resolver.loadResource!('memory://tileset.3tz/Tiles.BIN', BYTE_LOADER, {})).toEqual([
    7, 8
  ]);
  await expect(
    resolver.loadResource!('memory://tileset.3tz/missing.bin', BYTE_LOADER, {})
  ).rejects.toThrow('No such file in the archive: missing.bin');
});

test('3TZ resolver validates member headers and unsupported compression methods', async () => {
  const headerOffset = await addArchiveEntry('bad.bin', new Uint8Array([1]), 12);
  const {resolver} = createTiles3DArchiveResolver(new Blob([]), BYTE_LOADER);
  await expect(
    resolver.loadResource!('memory://tileset.3tz/bad.bin', BYTE_LOADER, {})
  ).rejects.toThrow('Only Deflation compression is supported');
  archiveMocks.headers.delete(headerOffset);
  await expect(
    resolver.loadResource!('memory://tileset.3tz/bad.bin', BYTE_LOADER, {})
  ).rejects.toThrow('No such file in the archive');
});

test.each([
  ['3tz', '@3dtilesIndex1@', 'corrupted 3tz zip archive'],
  ['slpk', '@specialIndexFileHASH128@', 'corrupted SLPK']
])('archive resolver validates reserved %s index headers and caches failed initialization', async (kind, name, message) => {
  archiveMocks.centralHeader.mockResolvedValue({fileName: name, localHeaderOffset: 99n});
  const {resolver} =
    kind === '3tz'
      ? createTiles3DArchiveResolver(new Blob([]), BYTE_LOADER)
      : createSLPKArchiveResolver(new Blob([]), BYTE_LOADER);
  await expect(resolver.loadRoot!('ignored', BYTE_LOADER, {})).rejects.toThrow(message);
  await expect(resolver.loadRoot!('ignored', BYTE_LOADER, {})).rejects.toThrow(message);
  expect(archiveMocks.search).toHaveBeenCalledOnce();
  expect(archiveMocks.buildIndex).not.toHaveBeenCalled();
});

test('SLPK resolver reads a reserved index and tries texture extension fallbacks', async () => {
  await addArchiveEntry('3dSceneLayer.json.gz', gzip(new Uint8Array([9])));
  await addArchiveEntry('nodes/1/textures/texture.png', new Uint8Array([4, 5]));
  archiveMocks.centralHeader.mockResolvedValue({
    fileName: '@specialIndexFileHASH128@',
    localHeaderOffset: 99n
  });
  archiveMocks.headers.set(99n, {fileDataOffset: 500n, compressedSize: 1n, compressionMethod: 0});
  archiveMocks.bytes.set(500n, new Uint8Array([0]).buffer);
  const {resolver} = createSLPKArchiveResolver(new File([], 'scene.slpk'), BYTE_LOADER);
  expect(await resolver.loadRoot!('ignored', BYTE_LOADER, {})).toEqual([9]);
  expect(
    await resolver.loadResource!('memory://scene.slpk/nodes/1/textures/texture', BYTE_LOADER, {})
  ).toEqual([4, 5]);
  await expect(
    resolver.loadResource!('memory://scene.slpk/unknown/path', BYTE_LOADER, {})
  ).rejects.toThrow('No such file in the archive: unknown/path');
  expect(archiveMocks.parseIndex).toHaveBeenCalledOnce();
});

test('3TZ resolver reads reserved indexes and archive URLs without extensions', async () => {
  await addArchiveEntry('child.bin', new Uint8Array([6]));
  archiveMocks.centralHeader.mockResolvedValue({
    fileName: '@3dtilesIndex1@',
    localHeaderOffset: 99n
  });
  archiveMocks.headers.set(99n, {fileDataOffset: 500n, compressedSize: 1n, compressionMethod: 0});
  archiveMocks.bytes.set(500n, new Uint8Array([0]).buffer);
  const {resolver} = createTiles3DArchiveResolver('local-archive', BYTE_LOADER);
  expect(
    await resolver.loadResource!('local-archive/child.bin?version=1', BYTE_LOADER, {})
  ).toEqual([6]);
  expect(archiveMocks.fetchFile).toHaveBeenCalledWith('local-archive');
  expect(archiveMocks.parseIndex).toHaveBeenCalledOnce();
});

test('default archive loaders diagnose missing format parsers', async () => {
  await addArchiveEntry('tileset.json', new Uint8Array([1]));
  await addArchiveEntry('3dSceneLayer.json.gz', gzip(new Uint8Array([1])));
  const tiles = createTiles3DArchiveResolver(new Blob([]));
  await expect(tiles.resolver.loadRoot!('ignored', tiles.loader, {})).rejects.toThrow(
    'require a 3D Tiles loader'
  );
  const scene = createSLPKArchiveResolver(new Blob([]));
  await expect(scene.resolver.loadRoot!('ignored', scene.loader, {})).rejects.toThrow(
    'require an I3S loader'
  );
});
