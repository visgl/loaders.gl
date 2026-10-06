// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {encode} from '@loaders.gl/core';
import {validateWriter} from 'test/common/conformance';
import {SLPKWriter as RootWriter, parseSLPKArchive} from '@loaders.gl/i3s';
import {SLPKWriter} from '@loaders.gl/i3s/i3s-slpk-writer';
import {GZipCompressor} from '@loaders.gl/compression';
import {DataViewReadableFile} from '@loaders.gl/zip';
import JSZip from 'jszip';

/** Small caller-authored root used only to qualify packaging and archive reader interoperability. */
const ROOT = new TextEncoder().encode('{"version":"1.7","layerType":"3DObject"}').buffer;
/** Already encoded resources with the I3S archive layout. */
let files: Record<string, ArrayBuffer>;
/** Shared immutable archive and CRC-checked entries. */
let archive: ArrayBuffer;
let zip: JSZip;

beforeAll(async () => {
  files = {
    '3dSceneLayer.json.gz': await new GZipCompressor().compress(ROOT),
    'nodes/0/textures/A.png': new Uint8Array([1, 2, 3]).buffer
  };
  archive = await SLPKWriter.encode(files);
  zip = await JSZip.loadAsync(archive, {checkCRC32: true});
});
afterEach(() => vi.restoreAllMocks());

test('SLPK writer is exposed at root/subpath and supports core encode', async () => {
  validateWriter(SLPKWriter, 'SLPKWriter');
  expect(RootWriter).toBe(SLPKWriter);
  expect(await encode(files, SLPKWriter)).toEqual(archive);
});

test('SLPK stores supplied GZIP/image bytes unchanged with the index last', async () => {
  expect(Object.keys(zip.files)).toEqual([
    '3dSceneLayer.json.gz',
    'nodes/0/textures/A.png',
    '@specialIndexFileHASH128@'
  ]);
  for (const [path, bytes] of Object.entries(files)) {
    expect(await zip.file(path)!.async('arraybuffer')).toEqual(bytes);
  }
  const index = new DataView(await zip.file('@specialIndexFileHASH128@')!.async('arraybuffer'));
  expect(index.byteLength).toBe(48);
  const names: string[] = [];
  let previous = -1n;
  for (let offset = 0; offset < index.byteLength; offset += 24) {
    const key = (index.getBigUint64(offset, true) << 64n) + index.getBigUint64(offset + 8, true);
    expect(key).toBeGreaterThanOrEqual(previous);
    previous = key;
    const localOffset = Number(index.getBigUint64(offset + 16, true));
    const local = new DataView(archive, localOffset);
    expect(local.getUint32(0, true)).toBe(0x04034b50);
    expect(local.getUint16(8, true)).toBe(0); // STORE, including index.
    expect(local.getUint16(6, true) & 8).toBe(0); // Populated headers; no descriptor.
    const name = new TextDecoder().decode(
      new Uint8Array(archive, localOffset + 30, local.getUint16(26, true))
    );
    const digest = [...new Uint8Array(index.buffer, offset, 16)]
      .map(value => value.toString(16).padStart(2, '0'))
      .join('');
    // Independent Python hashlib values use lowercase names, including the root exception in older writers.
    expect(digest).toBe(
      name === '3dSceneLayer.json.gz'
        ? '95a7343b7235af78303de63812c70018'
        : '60e75ca7d33e17b0b63ed34846b96fac'
    );
    names.push(name);
  }
  expect(names.sort()).toEqual(Object.keys(files).sort());
  const reader = await parseSLPKArchive(new DataViewReadableFile(new DataView(archive)));
  expect(await reader.getFile('', 'http')).toEqual(ROOT);
  expect(await reader.getFile('nodes/0/textures/a.png')).toEqual(files['nodes/0/textures/A.png']);
});

test('SLPK bytes are deterministic across input order and native Blob inputs', async () => {
  const reordered = Object.fromEntries(
    Object.entries(files)
      .reverse()
      .map(([path, bytes]) => [path, new Blob([bytes])])
  );
  expect(await SLPKWriter.encode(reordered, {slpk: {maxArchiveBytes: archive.byteLength}})).toEqual(
    archive
  );
  await expect(
    SLPKWriter.encode(reordered, {slpk: {maxArchiveBytes: archive.byteLength - 1}})
  ).rejects.toThrow('byte limit');
});

test('SLPK requires the canonical root and rejects duplicate lowercase paths', async () => {
  await expect(SLPKWriter.encode({})).rejects.toThrow('root 3dSceneLayer.json.gz');
  await expect(
    SLPKWriter.encode({...files, 'nodes/0/textures/a.png': new ArrayBuffer(0)})
  ).rejects.toThrow('duplicate canonical paths');
});

test.each([
  -1,
  0.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1
])('SLPK rejects invalid archive limit %s', async maxArchiveBytes => {
  await expect(SLPKWriter.encode(files, {slpk: {maxArchiveBytes}})).rejects.toThrow('safe integer');
});

test('SLPK requires ZIP64 for archives above its 2 GiB ceiling', async () => {
  vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(0x7fffffff);
  await expect(
    SLPKWriter.encode(
      {'3dSceneLayer.json.gz': new Blob()},
      {slpk: {maxArchiveBytes: Number.MAX_SAFE_INTEGER}}
    )
  ).rejects.toThrow('byte limit');
});

test('SLPKWriter forwards packaging cancellation', async () => {
  const reason = new Error('cancel packaging');
  await expect(SLPKWriter.encode(files, {slpk: {signal: AbortSignal.abort(reason)}})).rejects.toBe(
    reason
  );
});
