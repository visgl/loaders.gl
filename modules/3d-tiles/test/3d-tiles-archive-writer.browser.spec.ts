// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import {validateWriter} from 'test/common/conformance';
import JSZip from 'jszip';
import {Tiles3DArchiveWriter as RootWriter} from '@loaders.gl/3d-tiles';
import {
  Tiles3DArchiveWriter,
  encodeTiles3DArchiveInBatches
} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';
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

test('3TZ rejects a missing root and nested archives', async () => {
  await expect(Tiles3DArchiveWriter.encode({})).rejects.toThrow('requires tileset.json');
  for (const path of ['nested.3tz/file', 'A.3DTILES.ZIP']) {
    await expect(
      Tiles3DArchiveWriter.encode({...FILES, [path]: new ArrayBuffer(0)})
    ).rejects.toThrow('without nested archives');
  }
});

test('Tiles3DArchiveWriter forwards packaging cancellation', async () => {
  const reason = new Error('cancel packaging');
  await expect(
    Tiles3DArchiveWriter.encode(FILES, {'3tz': {signal: AbortSignal.abort(reason)}})
  ).rejects.toBe(reason);
});

test('Tiles3DArchiveWriter streaming matches buffered bytes and retains format validation', async () => {
  const chunks: ArrayBuffer[] = [];
  for await (const chunk of encodeTiles3DArchiveInBatches(FILES))
    chunks.push(new Uint8Array(chunk).buffer);
  expect(await new Blob(chunks).arrayBuffer()).toEqual(archive);
  const invalid = encodeTiles3DArchiveInBatches({})[Symbol.asyncIterator]();
  await expect(invalid.next()).rejects.toThrow('requires');
});

test('Tiles3DArchiveWriter forwards cancellation to streaming', async () => {
  const reason = new Error('cancel streaming');
  const iterator = encodeTiles3DArchiveInBatches(FILES, {
    '3tz': {signal: AbortSignal.abort(reason)}
  })[Symbol.asyncIterator]();
  await expect(iterator.next()).rejects.toBe(reason);
});
