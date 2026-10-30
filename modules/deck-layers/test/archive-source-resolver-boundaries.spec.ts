// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';
import {deflateRaw, inflateRaw, gzip} from 'pako';
import {encodeZip, type ZipEncodeEntry} from '@loaders.gl/archives/zip';
import {encodeIndexedZip} from '@loaders.gl/archives/indexed-zip-writer';
import {BlobFile} from '@loaders.gl/core/loader-utils';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';

const archiveMocks = vi.hoisted(() => ({fetchFile: vi.fn()}));
/** Small real members replace obsolete raw-header mocks. */
let members: Record<string, ZipEncodeEntry>;
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
  vi.restoreAllMocks();
  members = {};
  archiveMocks.fetchFile
    .mockReset()
    .mockImplementation(async () => new Response(await encodeZip(members)));
});

/** Adds one format resource to a real tiny ZIP fixture. */
async function addArchiveEntry(
  name: string,
  bytes: Uint8Array,
  compressionMethod = 0
): Promise<void> {
  members[name] = {
    data: compressionMethod === 8 ? inflateRaw(bytes) : bytes,
    compression: compressionMethod === 8 ? 'deflate' : 'store'
  };
}

/** Creates portable input bytes for a resolver without any public-network access. */
async function createArchiveBlob(): Promise<Blob> {
  return new Blob([await encodeZip(members)]);
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
  expect(archiveMocks.fetchFile).toHaveBeenCalledOnce();
  expect(archiveMocks.fetchFile).toHaveBeenCalledWith('/archive');
});

test('3TZ resolver accepts case-sensitive entries and deflated members', async () => {
  await addArchiveEntry('Tiles.BIN', deflateRaw(new Uint8Array([7, 8])), 8);
  const {resolver} = createTiles3DArchiveResolver(await createArchiveBlob(), BYTE_LOADER);
  expect(await resolver.loadResource!('memory://tileset.3tz/Tiles.BIN', BYTE_LOADER, {})).toEqual([
    7, 8
  ]);
  await expect(
    resolver.loadResource!('memory://tileset.3tz/missing.bin', BYTE_LOADER, {})
  ).rejects.toThrow('No such file in the archive: missing.bin');
});

test.each([
  '3tz',
  'slpk'
])('archive resolver closes and caches failed %s initialization', async kind => {
  const close = vi.spyOn(BlobFile.prototype, 'close');
  const {resolver} =
    kind === '3tz'
      ? createTiles3DArchiveResolver(new Blob([]), BYTE_LOADER)
      : createSLPKArchiveResolver(new Blob([]), BYTE_LOADER);
  await expect(resolver.loadRoot!('ignored', BYTE_LOADER, {})).rejects.toThrow('minimum header');
  await expect(resolver.loadRoot!('ignored', BYTE_LOADER, {})).rejects.toThrow('minimum header');
  expect(close).toHaveBeenCalledOnce();
});

test('SLPK resolver reads a reserved index and tries texture extension fallbacks', async () => {
  await addArchiveEntry('3dSceneLayer.json.gz', gzip(new Uint8Array([9])));
  await addArchiveEntry('nodes/1/textures/texture.png', new Uint8Array([4, 5]));
  const indexed = await encodeIndexedZip(
    Object.fromEntries(
      Object.entries(members).map(([name, entry]) => [
        name,
        new Uint8Array(entry.data as Uint8Array).buffer
      ])
    ),
    {indexPath: '@specialIndexFileHASH128@', lowercasePaths: true, maxArchiveBytes: 4096}
  );
  const {resolver} = createSLPKArchiveResolver(new File([indexed], 'scene.slpk'), BYTE_LOADER);
  expect(await resolver.loadRoot!('ignored', BYTE_LOADER, {})).toEqual([9]);
  expect(
    await resolver.loadResource!('memory://scene.slpk/nodes/1/textures/texture', BYTE_LOADER, {})
  ).toEqual([4, 5]);
  await expect(
    resolver.loadResource!('memory://scene.slpk/unknown/path', BYTE_LOADER, {})
  ).rejects.toThrow('No such file in the archive: unknown/path');
});

test('3TZ resolver accepts archive URLs without extensions', async () => {
  await addArchiveEntry('child.bin', new Uint8Array([6]));
  const {resolver} = createTiles3DArchiveResolver('local-archive', BYTE_LOADER);
  expect(
    await resolver.loadResource!('local-archive/child.bin?version=1', BYTE_LOADER, {})
  ).toEqual([6]);
  expect(archiveMocks.fetchFile).toHaveBeenCalledWith('local-archive');
});

test('default archive loaders diagnose missing format parsers', async () => {
  await addArchiveEntry('tileset.json', new Uint8Array([1]));
  await addArchiveEntry('3dSceneLayer.json.gz', gzip(new Uint8Array([1])));
  const tiles = createTiles3DArchiveResolver(await createArchiveBlob());
  await expect(tiles.resolver.loadRoot!('ignored', tiles.loader, {})).rejects.toThrow(
    'require a 3D Tiles loader'
  );
  const scene = createSLPKArchiveResolver(await createArchiveBlob());
  await expect(scene.resolver.loadRoot!('ignored', scene.loader, {})).rejects.toThrow(
    'require an I3S loader'
  );
});
