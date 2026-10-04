// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {encode} from '@loaders.gl/core';
import {validateWriter} from 'test/common/conformance';
import JSZip from 'jszip';
import {MD5Hash} from '@loaders.gl/crypto';
import {Tiles3DArchiveWriter as RootWriter} from '@loaders.gl/3d-tiles';
import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';
import {ZipWriter} from '@loaders.gl/zip/zip-writer';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {parse3DTilesArchive} from '../src/3d-tiles-archive/3d-tiles-archive-parser';

/** Small payloads exercising nested and case-sensitive paths, and numeric object-key ordering. */
const FILES = {
  'tileset.json': new TextEncoder().encode(
    '{"asset":{"version":"1.1"},"geometricError":0,"root":{"boundingVolume":{"sphere":[0,0,0,1]},"geometricError":0,"content":{"uri":"Models/A.glb"}}}'
  ).buffer,
  'Models/A.glb': new Uint8Array([1, 2, 3]).buffer,
  '10': new ArrayBuffer(0),
  '2': new ArrayBuffer(0)
};
/** One archive shared by immutable reader/structure assertions. */
let archive: ArrayBuffer;
/** CRC-checked ZIP entries, loaded once. */
let zip: JSZip;

beforeAll(async () => {
  archive = await Tiles3DArchiveWriter.encode(FILES);
  zip = await JSZip.loadAsync(archive, {checkCRC32: true});
});
afterEach(() => vi.restoreAllMocks());

test('3TZ writer is exposed at the root and implementation subpath', () => {
  validateWriter(Tiles3DArchiveWriter, 'Tiles3DArchiveWriter');
  expect(RootWriter).toBe(Tiles3DArchiveWriter);
});

test('3TZ contains exactly the original payloads and a final uncompressed index', async () => {
  expect(Object.keys(zip.files)).toEqual([
    '2',
    '10',
    'Models/A.glb',
    'tileset.json',
    '@3dtilesIndex1@'
  ]);
  for (const [path, payload] of Object.entries(FILES)) {
    expect(await zip.file(path)!.async('uint8array')).toEqual(new Uint8Array(payload));
  }
  const end = new DataView(archive, archive.byteLength - 22);
  expect(end.getUint32(0, true)).toBe(0x06054b50);
  expect(end.getUint16(10, true)).toBe(5);
  let centralOffset = end.getUint32(16, true);
  for (let index = 0; index < 5; index++) {
    const central = new DataView(archive, centralOffset);
    const local = new DataView(archive, central.getUint32(42, true));
    expect(local.getUint32(0, true)).toBe(0x04034b50);
    expect(local.getUint16(6, true) & 8).toBe(0); // No data descriptor: sizes/CRC are in local headers.
    expect(local.getUint16(8, true)).toBe(0); // STORE.
    expect(local.getUint32(14, true)).toBe(central.getUint32(16, true));
    expect(local.getUint32(18, true)).toBe(central.getUint32(20, true));
    expect(local.getUint32(22, true)).toBe(central.getUint32(24, true));
    expect(local.getUint16(12, true)).toBe(33); // 1980-01-01.
    if (index === 4) {
      const path = new TextDecoder().decode(
        new Uint8Array(archive, centralOffset + 46, central.getUint16(28, true))
      );
      expect(path).toBe('@3dtilesIndex1@');
      expect(central.getUint16(32, true)).toBe(0); // No index comment.
    }
    centralOffset +=
      46 + central.getUint16(28, true) + central.getUint16(30, true) + central.getUint16(32, true);
  }
});

test('3TZ index is sorted, excludes itself, and points to case-preserved local headers', async () => {
  const indexData = await zip.file('@3dtilesIndex1@')!.async('arraybuffer');
  expect(indexData.byteLength).toBe(24 * Object.keys(FILES).length);
  const view = new DataView(indexData);
  const names: string[] = [];
  let previous: bigint | undefined;
  for (let offset = 0; offset < view.byteLength; offset += 24) {
    const key = (view.getBigUint64(offset, true) << 64n) + view.getBigUint64(offset + 8, true);
    if (previous !== undefined) expect(key).toBeGreaterThanOrEqual(previous);
    previous = key;
    const localOffset = Number(view.getBigUint64(offset + 16, true));
    const local = new DataView(archive, localOffset);
    const path = new TextDecoder().decode(
      new Uint8Array(archive, localOffset + 30, local.getUint16(26, true))
    );
    names.push(path);
    const digest = [...new Uint8Array(indexData, offset, 16)]
      .map(value => value.toString(16).padStart(2, '0'))
      .join('');
    // Independently computed with Python hashlib, preserving the uppercase path.
    if (path === 'Models/A.glb') expect(digest).toBe('e75c1e84bcbcd225960a340ce96ce03b');
  }
  expect(names.sort()).toEqual(Object.keys(FILES).sort());
  const reader = await parse3DTilesArchive(new DataViewReadableFile(new DataView(archive)));
  expect(await reader.getFile('Models/A.glb')).toEqual(FILES['Models/A.glb']);
  expect(await reader.getFile('tileset.json')).toEqual(FILES['tileset.json']);
});

test('3TZ bytes are deterministic across input order and Blob/ArrayBuffer inputs', async () => {
  const reordered = Object.fromEntries(
    Object.entries(FILES)
      .reverse()
      .map(([path, payload]) => [path, new Blob([payload])])
  );
  expect(await Tiles3DArchiveWriter.encode(reordered)).toEqual(archive);
  expect(await encode(FILES, Tiles3DArchiveWriter)).toEqual(archive);
});

test('3TZ archive budget is inclusive and checked before Blob reads', async () => {
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  const files = Object.fromEntries(
    Object.entries(FILES).map(([path, payload]) => [path, new Blob([payload])])
  );
  await expect(
    Tiles3DArchiveWriter.encode(files, {'3tz': {maxArchiveBytes: archive.byteLength - 1}})
  ).rejects.toThrow('byte limit');
  expect(read).not.toHaveBeenCalled();
  expect(
    await Tiles3DArchiveWriter.encode(files, {'3tz': {maxArchiveBytes: archive.byteLength}})
  ).toEqual(archive);
});

test.each([
  -1,
  0.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1
])('3TZ rejects invalid byte limit %s', async maxArchiveBytes => {
  await expect(Tiles3DArchiveWriter.encode(FILES, {'3tz': {maxArchiveBytes}})).rejects.toThrow(
    'safe integer'
  );
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
  'nested.3tz/file',
  'A.3DTILES.ZIP',
  '@3dtilesIndex1@',
  'x'.repeat(65536)
])('3TZ rejects invalid resource path %#', async path => {
  await expect(Tiles3DArchiveWriter.encode({...FILES, [path]: new ArrayBuffer(0)})).rejects.toThrow(
    'canonical relative ASCII'
  );
});

test('3TZ rejects missing root tileset and ZIP32 file-count overflow before encoding', async () => {
  await expect(Tiles3DArchiveWriter.encode({})).rejects.toThrow('requires tileset.json');
  const files = Object.fromEntries(
    Array.from({length: 65533}, (_, index) => [`${index}`, new ArrayBuffer(0)])
  );
  await expect(
    Tiles3DArchiveWriter.encode({...files, 'tileset.json': new ArrayBuffer(0)})
  ).rejects.toThrow('fewer than 65534');
});

test('3TZ measures native Blob sizes rather than caller-overridden size properties', async () => {
  const blob = new Blob([new Uint8Array(10)]);
  Object.defineProperty(blob, 'size', {value: 0});
  await expect(
    Tiles3DArchiveWriter.encode({'tileset.json': blob}, {'3tz': {maxArchiveBytes: 252}})
  ).rejects.toThrow('byte limit');
});

test('3TZ rejects ZIP32 size overflow without allocating a large payload', async () => {
  const measure = vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(0xffffffff);
  await expect(
    Tiles3DArchiveWriter.encode(
      {'tileset.json': new Blob()},
      {'3tz': {maxArchiveBytes: Number.MAX_SAFE_INTEGER}}
    )
  ).rejects.toThrow('ZIP32 capacity');
  measure.mockRestore();
});

test('3TZ rejects an ArrayBuffer detached during asynchronous packaging', async () => {
  const detached = new ArrayBuffer(1);
  const hash = vi.spyOn(MD5Hash.prototype, 'hash').mockImplementationOnce(async () => {
    structuredClone(detached, {transfer: [detached]});
    return '00000000000000000000000000000000';
  });
  await expect(
    Tiles3DArchiveWriter.encode({a: new ArrayBuffer(0), 'tileset.json': detached})
  ).rejects.toThrow('size changed');
  hash.mockRestore();
});

test('3TZ sorts by the second little-endian integer and retains hash collisions', async () => {
  const digests = [
    '00000000000000000300000000000000',
    '00000000000000000100000000000000',
    '00000000000000000200000000000000',
    '00000000000000000200000000000000'
  ];
  vi.spyOn(MD5Hash.prototype, 'hash').mockImplementation(async () => digests.shift()!);
  const encoded = await Tiles3DArchiveWriter.encode({
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

test('3TZ rejects an unexpected ZIP layout and propagates encoder failures', async () => {
  const encode = vi.spyOn(ZipWriter, 'encode').mockResolvedValueOnce(new ArrayBuffer(0));
  await expect(Tiles3DArchiveWriter.encode(FILES)).rejects.toThrow('Unexpected 3TZ ZIP layout');
  encode.mockRejectedValueOnce(new Error('encoder failure'));
  await expect(Tiles3DArchiveWriter.encode(FILES)).rejects.toThrow('encoder failure');
});
