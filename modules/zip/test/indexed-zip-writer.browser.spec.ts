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

test('Indexed ZIP serializes each Blob before reading the next and retains byte-identical output', async () => {
  const events: string[] = [];
  const read = Blob.prototype.arrayBuffer;
  vi.spyOn(Blob.prototype, 'arrayBuffer').mockImplementation(function () {
    events.push('read');
    return read.call(this);
  });
  const encode = ZipWriter.encode;
  vi.spyOn(ZipWriter, 'encode').mockImplementation(async (files, options) => {
    events.push(`encode:${Object.keys(files).join(',')}`);
    return encode(files, options);
  });
  const encoded = await encodeArchive({
    'tileset.json': new Blob(['{}']),
    'Models/A.glb': new Blob([new Uint8Array([1, 2, 3])])
  });
  expect(events).toEqual([
    'read',
    'encode:Models/A.glb',
    'read',
    'encode:tileset.json',
    'encode:@3dtilesIndex1@'
  ]);
  const index = await (await JSZip.loadAsync(encoded))
    .file('@3dtilesIndex1@')!
    .async('arraybuffer');
  expect(encoded).toEqual(
    await encode(
      {
        'Models/A.glb': new Uint8Array([1, 2, 3]).buffer,
        'tileset.json': new TextEncoder().encode('{}').buffer,
        '@3dtilesIndex1@': index
      },
      {
        jszip: {
          compression: 'STORE',
          streamFiles: false,
          platform: 'DOS',
          date: new Date('1980-01-01T00:00:00Z')
        }
      }
    )
  );
});

test('Indexed ZIP rejects an already cancelled operation before reading or encoding', async () => {
  const reason = new Error('cancelled before packaging');
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  const encode = vi.spyOn(ZipWriter, 'encode');
  await expect(
    encodeIndexedZip(
      {root: new Blob(['data'])},
      {
        indexPath: 'index',
        maxArchiveBytes: 1000,
        signal: AbortSignal.abort(reason)
      }
    )
  ).rejects.toBe(reason);
  expect(read).not.toHaveBeenCalled();
  expect(encode).not.toHaveBeenCalled();
});

test('Indexed ZIP observes cancellation after a pending read and starts no encoding or further reads', async () => {
  const controller = new AbortController();
  const reason = new Error('cancelled during read');
  let finishRead!: (data: ArrayBuffer) => void;
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer').mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishRead = resolve;
      })
  );
  const encode = vi.spyOn(ZipWriter, 'encode');
  const pending = encodeIndexedZip(
    {a: new Blob(['a']), b: new Blob(['b'])},
    {
      indexPath: 'index',
      maxArchiveBytes: 1000,
      signal: controller.signal
    }
  );
  controller.abort(reason);
  finishRead(new Uint8Array([97]).buffer);
  await expect(pending).rejects.toBe(reason);
  expect(read).toHaveBeenCalledTimes(1);
  expect(encode).not.toHaveBeenCalled();
});

test.each([
  'hash',
  'entry',
  'index'
] as const)('Indexed ZIP observes cancellation after %s without publishing a partial archive', async phase => {
  const controller = new AbortController();
  const reason = new Error(`cancelled during ${phase}`);
  const hash = MD5Hash.prototype.hash;
  vi.spyOn(MD5Hash.prototype, 'hash').mockImplementation(async (...arguments_) => {
    const digest = await hash.apply(new MD5Hash(), arguments_);
    if (phase === 'hash') controller.abort(reason);
    return digest;
  });
  const encode = ZipWriter.encode;
  const serialize = vi.spyOn(ZipWriter, 'encode').mockImplementation(async (files, options) => {
    const bytes = await encode(files, options);
    if (phase === 'entry' || (phase === 'index' && 'index' in files)) controller.abort(reason);
    return bytes;
  });
  await expect(
    encodeIndexedZip(
      {a: new ArrayBuffer(0)},
      {
        indexPath: 'index',
        maxArchiveBytes: 1000,
        signal: controller.signal
      }
    )
  ).rejects.toBe(reason);
  expect(serialize).toHaveBeenCalledTimes(phase === 'hash' ? 0 : phase === 'entry' ? 1 : 2);
});

test('Indexed ZIP propagates a Blob read failure without starting another entry', async () => {
  const failure = new Error('read failed');
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer').mockRejectedValueOnce(failure);
  await expect(encodeArchive({a: new Blob(), b: new Blob()})).rejects.toBe(failure);
  expect(read).toHaveBeenCalledTimes(1);
});

test('Indexed ZIP rejects a current resource detached while hashing its path', async () => {
  const data = new ArrayBuffer(1);
  vi.spyOn(MD5Hash.prototype, 'hash').mockImplementationOnce(async () => {
    structuredClone(data, {transfer: [data]});
    return '00000000000000000000000000000000';
  });
  await expect(encodeArchive({a: data})).rejects.toThrow('size changed');
});
