// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import JSZip from 'jszip';
import {MD5Hash} from '@loaders.gl/crypto';
import {encodeIndexedZip} from '@loaders.gl/zip/indexed-zip-writer';
import {ZipWriter} from '@loaders.gl/zip/zip-writer';

/** Small resources used for encoder boundary coverage. */
const FILES = {
  'tileset.json': new ArrayBuffer(0),
  'Models/A.glb': new Uint8Array([1, 2, 3]).buffer
};
/** Baseline size for inclusive budget assertions. */
let archive: ArrayBuffer;
/** Convenience adapter for the shared encoder's required profile options. */
function encodeArchive(
  files: Readonly<Record<string, ArrayBuffer | Blob>>,
  options?: {'3tz'?: {maxArchiveBytes: number}}
) {
  return encodeIndexedZip(files, {
    indexPath: '@3dtilesIndex1@',
    maxArchiveBytes: options?.['3tz']?.maxArchiveBytes ?? 0xfffffffe
  });
}
beforeAll(async () => {
  archive = await encodeArchive(FILES);
});
afterEach(() => vi.restoreAllMocks());

test('Indexed ZIP archive budget is inclusive and checked before Blob reads', async () => {
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  const files = Object.fromEntries(
    Object.entries(FILES).map(([path, payload]) => [path, new Blob([payload])])
  );
  await expect(
    encodeArchive(files, {'3tz': {maxArchiveBytes: archive.byteLength - 1}})
  ).rejects.toThrow('byte limit');
  expect(read).not.toHaveBeenCalled();
  expect(await encodeArchive(files, {'3tz': {maxArchiveBytes: archive.byteLength}})).toEqual(
    archive
  );
});

test.each([
  -1,
  0.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1
])('Indexed ZIP rejects invalid byte limit %s', async maxArchiveBytes => {
  await expect(encodeArchive(FILES, {'3tz': {maxArchiveBytes}})).rejects.toThrow('safe integer');
});

test.each([
  '',
  '/file',
  '../file',
  'a/./file',
  'a//file',
  'a\\file',
  'é.glb',
  'a\nfile',
  'x'.repeat(65536)
])('Indexed ZIP rejects invalid resource path %#', async path => {
  await expect(encodeArchive({...FILES, [path]: new ArrayBuffer(0)})).rejects.toThrow(
    'canonical relative ASCII'
  );
});

test('Indexed ZIP rejects ZIP32 file-count overflow before encoding', async () => {
  const files = Object.fromEntries(
    Array.from({length: 65533}, (_, index) => [`${index}`, new ArrayBuffer(0)])
  );
  await expect(encodeArchive({...files, 'tileset.json': new ArrayBuffer(0)})).rejects.toThrow(
    'fewer than 65534'
  );
});

test('Indexed ZIP measures native Blob sizes rather than caller-overridden size properties', async () => {
  const blob = new Blob([new Uint8Array(10)]);
  Object.defineProperty(blob, 'size', {value: 0});
  await expect(
    encodeArchive({'tileset.json': blob}, {'3tz': {maxArchiveBytes: 252}})
  ).rejects.toThrow('byte limit');
});

test('Indexed ZIP rejects ZIP32 size overflow without allocating a large payload', async () => {
  const measure = vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(0xffffffff);
  await expect(
    encodeArchive({'tileset.json': new Blob()}, {'3tz': {maxArchiveBytes: Number.MAX_SAFE_INTEGER}})
  ).rejects.toThrow('ZIP32 capacity');
  measure.mockRestore();
});

test('Indexed ZIP rejects an ArrayBuffer detached during asynchronous packaging', async () => {
  const detached = new ArrayBuffer(1);
  const hash = vi.spyOn(MD5Hash.prototype, 'hash').mockImplementationOnce(async () => {
    structuredClone(detached, {transfer: [detached]});
    return '00000000000000000000000000000000';
  });
  await expect(encodeArchive({a: new ArrayBuffer(0), 'tileset.json': detached})).rejects.toThrow(
    'size changed'
  );
  hash.mockRestore();
});

test('Indexed ZIP sorts by the second little-endian integer and retains hash collisions', async () => {
  const digests = [
    '00000000000000000300000000000000',
    '00000000000000000100000000000000',
    '00000000000000000200000000000000',
    '00000000000000000200000000000000'
  ];
  vi.spyOn(MD5Hash.prototype, 'hash').mockImplementation(async () => digests.shift()!);
  const encoded = await encodeArchive({
    a: new ArrayBuffer(0),
    b: new ArrayBuffer(0),
    c: new ArrayBuffer(0),
    'tileset.json': new ArrayBuffer(0)
  });
  const indexData = await (await JSZip.loadAsync(encoded))
    .file('@3dtilesIndex1@')!
    .async('arraybuffer');
  const view = new DataView(indexData);
  expect([0, 24, 48, 72].map(offset => view.getBigUint64(offset + 8, true))).toEqual([
    1n,
    2n,
    2n,
    3n
  ]);
});

test('Indexed ZIP rejects an unexpected ZIP layout and propagates encoder failures', async () => {
  const encode = vi.spyOn(ZipWriter, 'encode').mockResolvedValueOnce(new ArrayBuffer(0));
  await expect(encodeArchive(FILES)).rejects.toThrow('Unexpected indexed ZIP layout');
  encode.mockRejectedValueOnce(new Error('encoder failure'));
  await expect(encodeArchive(FILES)).rejects.toThrow('encoder failure');
});

test('Indexed ZIP validates the generated index path and reserved resource names', async () => {
  await expect(encodeIndexedZip({}, {indexPath: '1', maxArchiveBytes: 1000})).rejects.toThrow(
    'index path must be nonnumeric'
  );
  await expect(
    encodeIndexedZip({}, {indexPath: '../index', maxArchiveBytes: 1000})
  ).rejects.toThrow('canonical relative ASCII');
  await expect(encodeArchive({'@3dtilesIndex1@': new ArrayBuffer(0)})).rejects.toThrow(
    'reserved index path'
  );
  await expect(
    encodeIndexedZip(
      {'@SPECIALINDEXFILEHASH128@': new ArrayBuffer(0)},
      {indexPath: '@specialIndexFileHASH128@', maxArchiveBytes: 1000, lowercasePaths: true}
    )
  ).rejects.toThrow('reserved index path');
});

test('Indexed ZIP rejects case-folded duplicate paths before reading resources', async () => {
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  await expect(
    encodeIndexedZip(
      {A: new Blob(), a: new Blob()},
      {indexPath: 'index', maxArchiveBytes: 1000, lowercasePaths: true}
    )
  ).rejects.toThrow('duplicate canonical paths');
  expect(read).not.toHaveBeenCalled();
  const archive = await encodeIndexedZip({}, {indexPath: 'index', maxArchiveBytes: 1000});
  const zip = await JSZip.loadAsync(archive, {checkCRC32: true});
  expect(Object.keys(zip.files)).toEqual(['index']);
  expect((await zip.file('index')!.async('arraybuffer')).byteLength).toBe(0);
});
