// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import JSZip from 'jszip';
import {
  encodeZip,
  encodeZipInBatches,
  openZipArchive,
  type ZipByteSource,
  type ZipEncodeOptions
} from '@loaders.gl/zip';
import {
  encodeZipLocalHeader,
  encodeZipCentralHeader,
  encodeZipDescriptor,
  encodeZipEndRecords,
  encodeZipTimestamp,
  type ZipHeaderEntry
} from '../src/lib/zip-serialization';

/** Small immutable payload used across source variants. */
const BYTES = new TextEncoder().encode('abc');
/** Header-only boundary tests never allocate the declared payload sizes. */
const HEADER: ZipHeaderEntry = {
  nameBytes: new TextEncoder().encode('abc.txt'),
  date: new Date('1980-01-01T00:00:00Z'),
  method: 0,
  flags: 0,
  crc32: 0x352441c2,
  size: 3n,
  compressedSize: 3n,
  localHeaderOffset: 0n,
  zip64: false
};
afterEach(() => vi.restoreAllMocks());

/** Copies output only in tests; production callers can write each chunk directly to storage. */
async function collect(chunks: AsyncIterable<Uint8Array>): Promise<ArrayBuffer> {
  const parts: ArrayBuffer[] = [];
  for await (const chunk of chunks) parts.push(new Uint8Array(chunk).buffer);
  return new Blob(parts).arrayBuffer();
}

/** Creates fresh sources because streamed inputs are consumed once. */
function createSource(kind: string): ZipByteSource {
  const backing = new Uint8Array([7, 97, 98, 99, 8]);
  switch (kind) {
    case 'buffer':
      return BYTES.slice().buffer;
    case 'typed-view':
      return backing.subarray(1, 4);
    case 'data-view':
      return new DataView(backing.buffer, 1, 3);
    case 'blob':
      return new Blob([BYTES]);
    case 'iterable':
      return [BYTES.subarray(0, 1), BYTES.subarray(1)];
    case 'async-iterable':
      return (async function* () {
        yield BYTES.subarray(0, 1);
        yield BYTES.subarray(1);
      })();
    default:
      return new ReadableStream({
        start(controller) {
          controller.enqueue(BYTES);
          controller.close();
        }
      });
  }
}

test.each([
  'buffer',
  'typed-view',
  'data-view',
  'blob',
  'iterable',
  'async-iterable',
  'stream'
])('writes %s input with STORE and DEFLATE, qualified by JSZip', async kind => {
  for (const compression of ['store', 'deflate'] as const) {
    const encoded = await encodeZip({'abc.txt': createSource(kind)}, {compression, chunkBytes: 2});
    const zip = await JSZip.loadAsync(encoded, {checkCRC32: true});
    expect(await zip.file('abc.txt')!.async('string')).toBe('abc');
    const archive = await openZipArchive(encoded);
    try {
      const entry = (await archive.getEntry('abc.txt'))!;
      expect(entry.compression).toBe(compression);
      expect(entry.size).toBe(3n);
      expect(entry.crc32).toBe(0x352441c2);
      expect(new TextDecoder().decode(await archive.read(entry))).toBe('abc');
    } finally {
      await archive.close();
    }
  }
});

test.each([
  'auto',
  'always',
  'never'
] as const)('writes empty ZIP with %s ZIP64 policy', async zip64 => {
  const encoded = await encodeZip({}, {zip64, comment: 'café'});
  expect(Object.keys((await JSZip.loadAsync(encoded)).files)).toEqual([]);
  const archive = await openZipArchive(encoded);
  try {
    expect(archive.comment).toBe('café');
    expect(await archive.getEntry('absent')).toBeUndefined();
  } finally {
    await archive.close();
  }
  expect(encoded.byteLength).toBe(zip64 === 'always' ? 102 : 26);
});

test.each([
  'store',
  'deflate'
] as const)('writes forced ZIP32 and ZIP64 %s descriptors', async compression => {
  for (const zip64 of ['always', 'never'] as const) {
    const encoded = await encodeZip({abc: BYTES}, {compression, zip64});
    expect(new DataView(encoded).getUint16(4, true)).toBe(zip64 === 'always' ? 45 : 20);
    expect(
      await (await JSZip.loadAsync(encoded, {checkCRC32: true})).file('abc')!.async('string')
    ).toBe('abc');
  }
});

test('metadata is deterministic, sorted, UTF-8, and independent of host timezone', async () => {
  const files = {
    'é.txt': {data: BYTES, comment: '点', date: new Date('2020-02-03T04:05:07Z')},
    'folder/': new ArrayBuffer(0),
    'folder/a': BYTES
  };
  const first = await encodeZip(files, {comment: 'café'});
  expect(
    await encodeZip(Object.fromEntries(Object.entries(files).reverse()), {comment: 'café'})
  ).toEqual(first);
  const zip = await JSZip.loadAsync(first, {checkCRC32: true});
  expect(Object.keys(zip.files)).toEqual(['folder/', 'folder/a', 'é.txt']);
  expect(zip.file('é.txt')!.comment).toBe('点');
  const archive = await openZipArchive(first);
  try {
    expect((await archive.getEntry('folder/'))!.directory).toBe(true);
    expect((await archive.getEntry('é.txt'))!.comment).toBe('点');
  } finally {
    await archive.close();
  }
  expect(encodeZipTimestamp(new Date('2020-02-03T04:05:07Z'))).toBe(0x504320a3);
});

test('per-entry compression and timestamps override defaults', async () => {
  const bytes = await encodeZip(
    {stored: {data: BYTES, compression: 'store'}, deflated: {data: BYTES, compression: 'deflate'}},
    {compression: 'deflate', zip64: 'never'}
  );
  const archive = await openZipArchive(bytes);
  try {
    expect((await archive.getEntry('stored'))!.compression).toBe('store');
    expect((await archive.getEntry('deflated'))!.compression).toBe('deflate');
  } finally {
    await archive.close();
  }
});

test.each([
  '../a',
  '/a',
  'a//b',
  'a\\b',
  'a/./b',
  'a\0b',
  ''
])('rejects noncanonical path %s before source pulls', async path => {
  const next = vi.fn();
  await expect(encodeZip({[path]: {[Symbol.asyncIterator]: () => ({next})}})).rejects.toThrow();
  expect(next).not.toHaveBeenCalled();
});

test.each([
  {compression: 'bzip2'},
  {zip64: 'sometimes'},
  {maxArchiveBytes: 1},
  {maxEntryBytes: -1n},
  {chunkBytes: 0},
  {maxEntries: NaN},
  {maxDirectoryBytes: 0},
  {maxDirectoryBytes: 1},
  {maxEntries: 1},
  {date: new Date('1979-12-31')},
  {date: new Date('2108-01-01')},
  {date: new Date('invalid')},
  {comment: '🌍'},
  {comment: 'a'.repeat(65536)},
  {comment: 7}
])('rejects invalid or exceeded options %# before Blob reads', async options => {
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  await expect(
    encodeZip({a: new Blob([BYTES]), b: BYTES}, options as unknown as ZipEncodeOptions)
  ).rejects.toThrow();
  expect(read).not.toHaveBeenCalled();
});

test.each([
  {a: {data: BYTES, compression: 'bzip2'}},
  {'folder/': BYTES},
  {a: {data: new ArrayBuffer(0), comment: 'x'.repeat(65536)}},
  {['x'.repeat(65536)]: BYTES},
  {a: 7}
])('rejects invalid entry metadata %#', async files => {
  await expect(encodeZip(files as unknown as Parameters<typeof encodeZip>[0])).rejects.toThrow();
});

test('enforces entry budgets for buffers, Blobs and streams', async () => {
  for (const kind of ['buffer', 'blob', 'async-iterable'])
    await expect(encodeZip({a: createSource(kind)}, {maxEntryBytes: 2n})).rejects.toThrow(
      'entry byte limit'
    );
  await expect(encodeZip({'folder/': createSource('stream')})).rejects.toThrow(
    'nonempty directory'
  );
});

test('archive budget is inclusive and includes descriptors, directory and footer', async () => {
  const encoded = await encodeZip({a: BYTES});
  expect(await encodeZip({a: BYTES}, {maxArchiveBytes: BigInt(encoded.byteLength)})).toEqual(
    encoded
  );
  await expect(
    encodeZip({a: BYTES}, {maxArchiveBytes: BigInt(encoded.byteLength - 1)})
  ).rejects.toThrow('output byte limit');
  await expect(encodeZip({a: BYTES}, {maxArchiveBytes: 0n})).rejects.toThrow('output byte limit');
});

test('streams lazily with backpressure and cancels a source on early return', async () => {
  const pull = vi.fn(controller => controller.enqueue(BYTES));
  const cancel = vi.fn();
  const source = new ReadableStream({pull, cancel}, {highWaterMark: 0});
  const iterator = encodeZipInBatches({a: source})[Symbol.asyncIterator]();
  expect(pull).not.toHaveBeenCalled();
  expect((await iterator.next()).done).toBe(false); // local header
  expect(pull).not.toHaveBeenCalled();
  expect((await iterator.next()).value).toEqual(BYTES); // first payload
  expect(pull).toHaveBeenCalledTimes(1);
  await iterator.return?.();
  expect(pull).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(source.locked).toBe(false);
});

test('cancellation interrupts a pending stream pull and releases its lock', async () => {
  const controller = new AbortController();
  const reason = new Error('cancel encoding');
  let notifyPull!: () => void;
  const pulled = new Promise<void>(resolve => {
    notifyPull = resolve;
  });
  const cancel = vi.fn();
  const source = new ReadableStream(
    {
      pull() {
        notifyPull();
        return new Promise(() => {});
      },
      cancel
    },
    {highWaterMark: 0}
  );
  const iterator = encodeZipInBatches({a: source}, {signal: controller.signal})[
    Symbol.asyncIterator
  ]();
  await iterator.next();
  const pending = iterator.next();
  await pulled;
  controller.abort(reason);
  await expect(pending).rejects.toBe(reason);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(source.locked).toBe(false);
  await expect(encodeZip({a: BYTES}, {signal: controller.signal})).rejects.toBe(reason);
});

test('cancellation after a yielded header starts no Blob read', async () => {
  const controller = new AbortController();
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  const iterator = encodeZipInBatches({a: new Blob([BYTES])}, {signal: controller.signal})[
    Symbol.asyncIterator
  ]();
  await iterator.next();
  controller.abort(new Error('stop'));
  await expect(iterator.next()).rejects.toThrow('stop');
  expect(read).not.toHaveBeenCalled();
});

test('reused source views and transferred output buffers preserve payload and metadata', async () => {
  const reused = new Uint8Array(2);
  async function* input() {
    reused.set([97, 98]);
    yield reused;
    reused.set([99, 100]);
    yield reused;
  }
  const parts: ArrayBuffer[] = [];
  for await (const chunk of encodeZipInBatches({a: input()}, {chunkBytes: 8})) {
    expect(chunk.length).toBeLessThanOrEqual(8);
    parts.push(structuredClone(chunk.buffer, {transfer: [chunk.buffer]}));
  }
  const zip = await JSZip.loadAsync(await new Blob(parts).arrayBuffer(), {checkCRC32: true});
  expect(await zip.file('a')!.async('string')).toBe('abcd');
});

test('stream errors, invalid chunks and truncated Blob reads propagate', async () => {
  const failure = new Error('source failure');
  async function* input() {
    yield BYTES;
    throw failure;
  }
  await expect(encodeZip({a: input()})).rejects.toBe(failure);
  await expect(encodeZip({a: [7] as unknown as ZipByteSource})).rejects.toThrow('binary');
  vi.spyOn(Blob.prototype, 'arrayBuffer').mockResolvedValueOnce(new ArrayBuffer(0));
  await expect(encodeZip({a: new Blob([BYTES])})).rejects.toThrow('truncated');
});

test('buffer detachment after the header rejects instead of writing inconsistent sizes', async () => {
  const buffer = BYTES.slice().buffer;
  const iterator = encodeZipInBatches({a: buffer})[Symbol.asyncIterator]();
  await iterator.next();
  structuredClone(buffer, {transfer: [buffer]});
  await expect(iterator.next()).rejects.toThrow();
});

test('ZIP64 serializers preserve sizes and offsets above Number precision', () => {
  const large = 2n ** 53n + 1n;
  const header = {
    ...HEADER,
    zip64: true,
    size: large,
    compressedSize: large + 1n,
    localHeaderOffset: large + 2n
  };
  const local = new DataView(encodeZipLocalHeader(header).buffer);
  const central = new DataView(encodeZipCentralHeader(header).buffer);
  const descriptor = new DataView(encodeZipDescriptor(header).buffer);
  const end = new DataView(encodeZipEndRecords(65536n, large, large + 2n, true).buffer);
  expect(local.getBigUint64(41, true)).toBe(large);
  expect(central.getBigUint64(57, true)).toBe(large);
  expect(central.getBigUint64(73, true)).toBe(large + 2n);
  expect(descriptor.getBigUint64(8, true)).toBe(large + 1n);
  expect(end.getBigUint64(32, true)).toBe(65536n);
  expect(end.getBigUint64(64, true)).toBe(large * 2n + 2n);
  expect(encodeZipEndRecords(65535n, 46n, 30n, false).length).toBe(22);
});

test.each([-1n, 0xffffffffffffffffn + 1n])('serializers reject invalid unsigned size %s', size => {
  for (const serialize of [encodeZipLocalHeader, encodeZipCentralHeader, encodeZipDescriptor])
    expect(() => serialize({...HEADER, size, zip64: true})).toThrow('unsigned integer');
  expect(() => encodeZipEndRecords(1n, size, 0n, true)).toThrow('unsigned integer');
});

test('serializers reject ZIP32 overflows and metadata capacity without allocating payloads', () => {
  for (const key of ['size', 'compressedSize', 'localHeaderOffset'] as const)
    expect(() => encodeZipLocalHeader({...HEADER, [key]: 0xffffffffn})).toThrow('ZIP32 entry');
  for (const args of [
    [65536n, 46n, 30n],
    [1n, 0xffffffffn, 30n],
    [1n, 46n, 0xffffffffn]
  ] as const)
    expect(() => encodeZipEndRecords(...args, false)).toThrow('ZIP32 end');
  expect(() => encodeZipEndRecords(0n, 0n, 0n, false, new Uint8Array(65536))).toThrow('comment');
  expect(() => encodeZipLocalHeader({...HEADER, nameBytes: new Uint8Array()})).toThrow(
    'name/comment'
  );
});

test('populated native STORE headers match the independent Info-ZIP fixture fields', () => {
  const local = new DataView(encodeZipLocalHeader(HEADER).buffer);
  expect(local.getUint16(4, true)).toBe(10);
  expect(local.getUint32(10, true)).toBe(0x00210000);
  expect(local.getUint32(14, true)).toBe(0x352441c2);
  expect(local.getUint32(18, true)).toBe(3);
  expect(local.getUint32(22, true)).toBe(3);
  expect(new DataView(encodeZipDescriptor(HEADER).buffer).getUint32(12, true)).toBe(3);
});

test('buffered and streamed encoders emit identical bytes', async () => {
  expect(await collect(encodeZipInBatches({a: BYTES}, {compression: 'deflate'}))).toEqual(
    await encodeZip({a: BYTES}, {compression: 'deflate'})
  );
});

test('an input iterator aborting inside next does not leave an unhandled rejection', async () => {
  const controller = new AbortController();
  const reason = new Error('abort in source');
  const returned = vi.fn().mockRejectedValue(new Error('cleanup failure'));
  const source = {
    [Symbol.asyncIterator]: () => ({
      next() {
        controller.abort(reason);
        return Promise.reject(new Error('read failure'));
      },
      return: returned
    })
  };
  await expect(encodeZip({a: source}, {signal: controller.signal})).rejects.toBe(reason);
  expect(returned).toHaveBeenCalledTimes(1);
});

test('ZIP64 local fields can be emitted for a large Blob without reading or allocating its payload', async () => {
  vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(0xffffffff);
  const read = vi.spyOn(Blob.prototype, 'arrayBuffer');
  const iterator = encodeZipInBatches({a: new Blob()})[Symbol.asyncIterator]();
  const header = (await iterator.next()).value!;
  expect(new DataView(header.buffer).getUint16(4, true)).toBe(45);
  expect(read).not.toHaveBeenCalled();
  await iterator.return?.();
});

test.each([
  'store',
  'deflate'
] as const)('writes empty %s payloads with valid descriptors and CRC', async compression => {
  const bytes = await encodeZip({empty: new ArrayBuffer(0)}, {compression});
  const zip = await JSZip.loadAsync(bytes, {checkCRC32: true});
  expect(await zip.file('empty')!.async('string')).toBe('');
  const archive = await openZipArchive(bytes);
  try {
    expect((await archive.getEntry('empty'))!.crc32).toBe(0);
    expect(await archive.read('empty')).toEqual(new ArrayBuffer(0));
  } finally {
    await archive.close();
  }
});
