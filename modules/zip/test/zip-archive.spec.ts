// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {BlobFile, type ReadableFile} from '@loaders.gl/loader-utils';
import {openZipArchive, type ZipArchive, type ZipArchiveOptions} from '@loaders.gl/zip';
import {createZipFixture, concatenateZipBytes, type FixtureEntry} from './zip-reader-fixture';
import {decodeZipHeader, decodeZipText, calculateZipChecksum} from '../src/lib/zip-entry-metadata';

/** Owned files closed after each case, including expected failures. */
const archives: ZipArchive[] = [];
/** Immutable independent fixtures parsed once when used in more than one assertion. */
const fixtures = new Map<string, ArrayBuffer>();
/** Small fixture names; each independently generated archive is less than 1 KiB. */
const FIXTURES = [
  'python',
  'python-descriptor',
  'python-descriptor64',
  'python-local64',
  'infozip',
  '7zip'
];
beforeAll(async () => {
  for (const name of FIXTURES) {
    const response = await fetch(
      `/__loaders_gl_test_fixtures__/modules/zip/test/fixtures/${name}.zip`
    );
    expect(response.ok).toBe(true);
    fixtures.set(name, await response.arrayBuffer());
  }
});
afterEach(async () => {
  await Promise.all(archives.splice(0).map(archive => archive.close()));
  vi.restoreAllMocks();
});

/** Opens a tracked synthetic or independent archive. */
async function open(input = createZipFixture(), options: ZipArchiveOptions = {}) {
  const archive = await openZipArchive(input, options);
  archives.push(archive);
  return archive;
}

/** Collects a bounded iterator without materializing large inputs. */
async function collect<T>(items: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of items) result.push(item);
  return result;
}

/** Opens and requests a synthetic entry, preserving close on expected validation failure. */
async function readFixture(entry: FixtureEntry, options: ZipArchiveOptions = {}) {
  return (await open(createZipFixture([entry]), options)).read('abc.txt');
}

test.each(FIXTURES)('reads independent %s output', async name => {
  const archive = await open(new Uint8Array(fixtures.get(name)!));
  const entries = await collect(archive.entries());
  for (const entry of entries) {
    expect(Object.isFrozen(entry)).toBe(true);
    expect(entry.size).toBe(entry.directory ? 0n : 3n);
    expect(new TextDecoder().decode(await archive.read(entry))).toBe(entry.directory ? '' : 'abc');
  }
  if (name === 'python') {
    expect(archive.comment).toBe('archive comment');
    expect(entries.map(entry => entry.path)).toEqual(['folder/', 'folder/abc.txt', 'café.txt']);
    expect(entries.every(entry => entry.comment === 'entry comment')).toBe(true);
  }
});

test.each([
  'signed',
  'unsigned'
] as const)('validates %s descriptors in ZIP32 and ZIP64', async descriptor => {
  for (const zip64 of [false, true]) {
    const archive = await open(createZipFixture([{descriptor, zip64}], {zip64}));
    const entry = await archive.getEntryAt(0n);
    expect(entry.path).toBe('abc.txt');
    expect(new TextDecoder().decode(await archive.read(entry))).toBe('abc');
  }
});

test('accepts empty archives and ignores an empty EOCD signature in a nonempty archive comment', async () => {
  const empty = await open(createZipFixture([], {comment: new TextEncoder().encode('empty')}));
  expect(await collect(empty.entries())).toEqual([]);
  const archive = await open(createZipFixture([{}], {comment: createZipFixture([])}));
  expect((await collect(archive.entries())).length).toBe(1);
});

test('respects ArrayBuffer, Blob, typed-array and DataView subview bounds', async () => {
  const bytes = createZipFixture();
  const backing = concatenateZipBytes(new Uint8Array([7, 7]), bytes, new Uint8Array([8]));
  for (const input of [
    bytes.buffer,
    new Blob([bytes]),
    backing.subarray(2, -1),
    new DataView(backing.buffer, 2, bytes.length)
  ]) {
    const archive = await openZipArchive(input);
    archives.push(archive);
    expect(new TextDecoder().decode(await archive.read('abc.txt'))).toBe('abc');
  }
});

test('caches concurrent named lookups and supports direct lookup without a directory scan', async () => {
  const bytes = createZipFixture([{}], {comment: new Uint8Array(256)});
  const file = new BlobFile(bytes.buffer);
  const read = vi.spyOn(file, 'read');
  const archive = await openZipArchive(file);
  archives.push(archive);
  read.mockClear();
  const direct = await archive.getEntryAt(0n);
  expect(read.mock.calls.every(([offset]) => BigInt(offset!) < 40n)).toBe(true);
  expect(await archive.getEntryAt(0n)).toBe(direct);
  read.mockClear();
  const [first, second] = await Promise.all([
    archive.getEntry('abc.txt'),
    archive.getEntry('abc.txt')
  ]);
  expect(first).toBe(second);
  expect(read.mock.calls.filter(([offset]) => BigInt(offset!) === 40n)).toHaveLength(1);
  expect(await archive.getEntry('absent')).toBeUndefined();
});

test('streams STORE and DEFLATE with exact CRC and bounded physical reads', async () => {
  for (const method of [0, 8]) {
    const file = new BlobFile(createZipFixture([{method}]).buffer);
    const read = vi.spyOn(file, 'read');
    const archive = await openZipArchive(file, {chunkBytes: 1, maxReadBytes: 2});
    archives.push(archive);
    const chunks = await collect(archive.readInBatches('abc.txt'));
    expect(new TextDecoder().decode(concatenateZipBytes(...chunks))).toBe('abc');
    expect(read.mock.calls.every(([, length]) => length! <= 2)).toBe(true);
  }
});

test('STORE ranges use exclusive ends and bypass complete-entry budgets', async () => {
  const archive = await open(createZipFixture(), {maxDecodedBytes: 0n, maxCompressedBytes: 0n});
  expect(new TextDecoder().decode(await archive.readRange('abc.txt', {start: 1n, end: 3n}))).toBe(
    'bc'
  );
  expect(await archive.readRange('abc.txt', {start: 3n, end: 3n})).toEqual(new ArrayBuffer(0));
  await expect(archive.read('abc.txt')).rejects.toThrow('byte limit');
  await expect(
    (await open(createZipFixture([{method: 8}]))).readRange('abc.txt', {start: 0n, end: 1n})
  ).rejects.toThrow('STORE');
});

test.each([
  [-1n, 1n],
  [2n, 1n],
  [0n, 4n],
  [0n, 3n]
])('rejects invalid or over-budget STORE range %s:%s', async (start, end) => {
  await expect(
    (await open(createZipFixture(), {maxReadBytes: 2})).readRange('abc.txt', {start, end})
  ).rejects.toThrow('byte-range');
});

test('rejects a forged entry or metadata issued by another archive', async () => {
  const first = await open();
  const second = await open();
  const entry = (await first.getEntry('abc.txt'))!;
  await expect(second.read(entry)).rejects.toThrow('another archive');
  await expect(first.read({...entry})).rejects.toThrow('another archive');
  await expect(first.read('missing')).rejects.toThrow('not found');
});

test('complete reads verify CRC; partial and stopped streams do not claim whole-entry integrity', async () => {
  const archive = await open(createZipFixture([{payload: new Uint8Array([1, 2, 3])}]), {
    chunkBytes: 1
  });
  expect(new Uint8Array(await archive.readRange('abc.txt', {start: 0n, end: 1n}))).toEqual(
    new Uint8Array([1])
  );
  for await (const chunk of archive.readInBatches('abc.txt')) {
    expect(chunk).toEqual(new Uint8Array([1]));
    break;
  }
  await expect(archive.read('abc.txt')).rejects.toThrow('CRC-32');
});

test.each([2, 4])('rejects actual DEFLATE decoded size differing from declared %s', async size => {
  const patchLocal = (view: DataView) => view.setUint32(22, size, true);
  const patchCentral = (view: DataView) => view.setUint32(24, size, true);
  await expect(readFixture({method: 8, patchLocal, patchCentral})).rejects.toThrow(
    size === 2 ? 'size limit' : 'size mismatch'
  );
});

test('checks compressed and decoded budgets before payload allocation', async () => {
  for (const options of [{maxCompressedBytes: 2n}, {maxDecodedBytes: 2n}]) {
    await expect(readFixture({}, options)).rejects.toThrow('byte limit');
  }
});

test.each([
  {maxEntries: 0},
  {maxReadBytes: 1.5},
  {chunkBytes: NaN},
  {maxDirectoryBytes: Infinity},
  {maxArchiveBytes: -1n}
])('rejects invalid options %# and releases the input', async options => {
  const file = new BlobFile(createZipFixture().buffer);
  const close = vi.spyOn(file, 'close');
  await expect(openZipArchive(file, options)).rejects.toThrow('limit');
  expect(close).toHaveBeenCalledTimes(1);
});

test.each([
  {maxArchiveBytes: 22n},
  {maxEntries: 1},
  {maxDirectoryBytes: 45}
])('enforces archive/directory bounds %#', async options => {
  await expect(
    open(createZipFixture([{}, {name: new TextEncoder().encode('other')}]), options)
  ).rejects.toThrow('limit');
});

test('close is idempotent, rejects cached operations and interrupts an active stream', async () => {
  const file = new BlobFile(createZipFixture().buffer);
  const close = vi.spyOn(file, 'close');
  const archive = await openZipArchive(file, {chunkBytes: 1});
  const entry = (await archive.getEntry('abc.txt'))!;
  const stream = archive.readInBatches(entry)[Symbol.asyncIterator]();
  expect((await stream.next()).done).toBe(false);
  expect(archive.close()).toBe(archive.close());
  await expect(stream.next()).rejects.toThrow('closed');
  await expect(archive.getEntry('abc.txt')).rejects.toThrow('closed');
  await expect(archive.getEntryAt(0n)).rejects.toThrow('closed');
  await expect(archive.read(entry)).rejects.toThrow('closed');
  await expect(archive.readRange(entry, {start: 0n, end: 1n})).rejects.toThrow('closed');
  expect(close).toHaveBeenCalledTimes(1);
});

test('cancellation before open, per-read and during transport is observed', async () => {
  const controller = new AbortController();
  controller.abort(new Error('cancelled'));
  await expect(openZipArchive(createZipFixture(), {signal: controller.signal})).rejects.toThrow(
    'cancelled'
  );
  const archive = await open();
  await expect(archive.read('abc.txt', {signal: controller.signal})).rejects.toThrow('cancelled');
  await expect(
    archive.readRange('abc.txt', {start: 0n, end: 1n, signal: controller.signal})
  ).rejects.toThrow('cancelled');
  const file = new BlobFile(createZipFixture().buffer);
  const pendingController = new AbortController();
  const original = file.read.bind(file);
  vi.spyOn(file, 'read').mockImplementation(async (...arguments_) => {
    const bytes = await original(...arguments_);
    pendingController.abort(new Error('interrupted'));
    return bytes;
  });
  await expect(openZipArchive(file, {signal: pendingController.signal})).rejects.toThrow(
    'interrupted'
  );
});

test('failed initialization closes truncated transports and failed stat inputs', async () => {
  const file = new BlobFile(createZipFixture().buffer);
  const close = vi.spyOn(file, 'close');
  vi.spyOn(file, 'read').mockResolvedValue(new ArrayBuffer(0));
  await expect(openZipArchive(file)).rejects.toThrow('truncated');
  expect(close).toHaveBeenCalledTimes(1);
  const statFile = {
    bigsize: undefined,
    stat: vi.fn().mockRejectedValue(new Error('stat failed')),
    close: vi.fn().mockResolvedValue(undefined)
  } as unknown as ReadableFile;
  await expect(openZipArchive(statFile)).rejects.toThrow('stat failed');
  expect(statFile.close).toHaveBeenCalledTimes(1);
});

test.each([
  ['missing end', (bytes: Uint8Array) => bytes.slice(0, -1)],
  [
    'prefix',
    (bytes: Uint8Array) => {
      bytes[0] = 0;
      return bytes;
    }
  ],
  [
    'directory outside',
    (bytes: Uint8Array) => {
      new DataView(bytes.buffer).setUint32(bytes.length - 6, 0xffffffff - 1, true);
      return bytes;
    }
  ],
  [
    'split',
    (bytes: Uint8Array) => {
      new DataView(bytes.buffer).setUint16(bytes.length - 18, 1, true);
      return bytes;
    }
  ],
  [
    'inconsistent entry counts',
    (bytes: Uint8Array) => {
      new DataView(bytes.buffer).setUint16(bytes.length - 14, 2, true);
      return bytes;
    }
  ],
  [
    'ZIP64 locator missing',
    (bytes: Uint8Array) => {
      new DataView(bytes.buffer).setUint32(bytes.length - 6, 0xffffffff, true);
      return bytes;
    }
  ]
])('rejects malformed end records: %s', async (_name, mutate) => {
  await expect(open(mutate(createZipFixture()))).rejects.toThrow();
});

test.each([
  ['encryption', {flags: 1}],
  ['flags', {flags: 0x10}],
  ['method', {method: 12}],
  ['local header outside', {patchCentral: (view: DataView) => view.setUint32(42, 100000, true)}],
  ['header mismatch', {patchLocal: (view: DataView) => view.setUint32(14, 7, true)}],
  [
    'STORE sizes',
    {
      patchLocal: (view: DataView) => view.setUint32(18, 2, true),
      patchCentral: (view: DataView) => view.setUint32(20, 2, true)
    }
  ],
  [
    'descriptor mismatch',
    {descriptor: 'signed', patchDescriptor: (view: DataView) => view.setUint32(4, 7, true)}
  ],
  [
    'descriptor local mismatch',
    {descriptor: 'unsigned', patchLocal: (view: DataView) => view.setUint32(22, 7, true)}
  ],
  [
    'overlap',
    {
      patchLocal: (view: DataView) => {
        view.setUint32(18, 1000, true);
        view.setUint32(22, 1000, true);
      },
      patchCentral: (view: DataView) => {
        view.setUint32(20, 1000, true);
        view.setUint32(24, 1000, true);
      }
    }
  ],
  ['ZIP64 extra missing', {patchLocal: (view: DataView) => view.setUint32(22, 0xffffffff, true)}],
  ['split entry', {patchCentral: (view: DataView) => view.setUint16(34, 1, true)}]
] as [string, FixtureEntry][])('rejects malformed entries: %s', async (_name, entry) => {
  await expect(readFixture(entry)).rejects.toThrow();
});

test.each([
  '',
  '/abc',
  '../abc',
  'a/./abc',
  'a//abc',
  'a\\abc',
  'C:abc',
  'a\0abc'
])('rejects noncanonical filename %#', async path => {
  const archive = await open(createZipFixture([{name: new TextEncoder().encode(path)}]));
  await expect(collect(archive.entries())).rejects.toThrow('relative path');
});

test('rejects duplicate names, duplicate offsets, central truncation and trailing metadata', async () => {
  for (const bytes of [
    createZipFixture([{}, {}]),
    createZipFixture([
      {},
      {name: new TextEncoder().encode('other'), patchCentral: view => view.setUint32(42, 0, true)}
    ]),
    createZipFixture([{}], {
      patchEnd: view => {
        view.setUint16(8, 2, true);
        view.setUint16(10, 2, true);
      }
    }),
    createZipFixture([{}, {name: new TextEncoder().encode('other')}], {
      patchEnd: view => {
        view.setUint16(8, 1, true);
        view.setUint16(10, 1, true);
      }
    })
  ]) {
    await expect(open(bytes).then(archive => collect(archive.entries()))).rejects.toThrow();
  }
});

/** Encodes Unicode extra fields with independent known original CRC; payload is UTF-8. */
function unicodeExtra(
  identifier: number,
  original: Uint8Array,
  value: string,
  checksum = calculateZipChecksum(original),
  version = 1
) {
  const encoded = new TextEncoder().encode(value);
  const extra = new Uint8Array(9 + encoded.length);
  const view = new DataView(extra.buffer);
  view.setUint16(0, identifier, true);
  view.setUint16(2, 5 + encoded.length, true);
  extra[4] = version;
  view.setUint32(5, checksum, true);
  extra.set(encoded, 9);
  return extra;
}

test('decodes CP437 and valid Unicode path/comment extras; ignores invalid CRC/version overrides', async () => {
  const name = new Uint8Array([0x82, 46, 116, 120, 116]);
  const comment = new Uint8Array([0x82]);
  expect(
    decodeZipText(new Uint8Array(Array.from({length: 256}, (_, index) => index)), false).length
  ).toBe(256);
  for (const invalid of [false, 'crc', 'version']) {
    const extra = concatenateZipBytes(
      unicodeExtra(
        0x7075,
        name,
        '新.txt',
        invalid === 'crc' ? 0 : undefined,
        invalid === 'version' ? 2 : 1
      ),
      unicodeExtra(0x6375, comment, '注')
    );
    const archive = await open(createZipFixture([{name, comment, centralExtra: extra}]));
    const entry = (await collect(archive.entries()))[0];
    expect(entry.path).toBe(invalid ? 'é.txt' : '新.txt');
    expect(entry.comment).toBe('注');
    expect(new TextDecoder().decode(await archive.read(entry))).toBe('abc');
  }
});

test('rejects malformed header lengths, UTF-8 and Unicode extra fields without leaking DataView errors', async () => {
  expect(() => decodeZipHeader(new Uint8Array(2), false)).toThrow('missing entry header');
  for (const entry of [
    {name: new Uint8Array([255]), flags: 0x800},
    {centralExtra: new Uint8Array([0x75, 0x70, 4, 0, 1, 0, 0, 0])},
    {centralExtra: new Uint8Array([1])},
    {centralExtra: new Uint8Array([2, 0, 5, 0])},
    {patchCentral: (view: DataView) => view.setUint16(28, 65535, true)}
  ])
    await expect(collect((await open(createZipFixture([entry]))).entries())).rejects.toThrow();
});

/** Creates a sparse virtual archive beyond Number precision using only small retained records. */
function sparseZip64File(largeEntry = false) {
  const bytes = createZipFixture([{zip64: true}], {zip64: true});
  const originalDirectory = 60;
  const directoryOffset = 2n ** 53n + 256n;
  if (largeEntry) {
    const header = new DataView(bytes.buffer);
    for (const offset of [41, 49, originalDirectory + 57, originalDirectory + 65])
      header.setBigUint64(offset, 2n ** 53n + 1n, true);
  }
  const tail = bytes.slice(originalDirectory);
  const footer = new DataView(tail.buffer);
  const recordOffset = tail.length - 98;
  footer.setBigUint64(recordOffset + 48, directoryOffset, true);
  footer.setBigUint64(recordOffset + 64, directoryOffset + BigInt(recordOffset), true);
  const size = directoryOffset + BigInt(tail.length);
  const read = vi.fn(async (start: number | bigint = 0, length = 0) => {
    const offset = BigInt(start);
    const output = new Uint8Array(length);
    for (const [position, segment] of [
      [0n, bytes.slice(0, originalDirectory)],
      [directoryOffset, tail]
    ] as const) {
      const first = offset > position ? offset : position;
      const last =
        offset + BigInt(length) < position + BigInt(segment.length)
          ? offset + BigInt(length)
          : position + BigInt(segment.length);
      if (last > first)
        output.set(
          segment.subarray(Number(first - position), Number(last - position)),
          Number(first - offset)
        );
    }
    return output.buffer;
  });
  return {
    file: {
      size: Number(size),
      bigsize: size,
      read,
      close: vi.fn().mockResolvedValue(undefined)
    } as unknown as ReadableFile,
    directoryOffset,
    read
  };
}

test('ZIP64 transport offsets beyond Number precision remain bigint', async () => {
  const {file, directoryOffset, read} = sparseZip64File();
  const archive = await openZipArchive(file, {maxArchiveBytes: 2n ** 54n});
  archives.push(archive);
  expect(new TextDecoder().decode(await archive.read('abc.txt'))).toBe('abc');
  expect(read.mock.calls.some(([offset]) => offset === directoryOffset)).toBe(true);
});

test.each([
  16, 24, 32, 40, 48, 56, 60, 72
])('rejects inconsistent ZIP64 footer field at %s', async offset => {
  const bytes = createZipFixture([{zip64: true}], {zip64: true});
  const footerOffset = bytes.length - 98;
  new DataView(bytes.buffer).setUint32(footerOffset + offset, 7, true);
  await expect(open(bytes)).rejects.toThrow();
});

test('large ZIP64 STORE entries support ranges while complete allocation rejects unsafe sizes', async () => {
  const {file} = sparseZip64File(true);
  const archive = await openZipArchive(file, {
    maxArchiveBytes: 2n ** 54n,
    maxCompressedBytes: 2n ** 54n,
    maxDecodedBytes: 2n ** 54n
  });
  archives.push(archive);
  const entry = (await archive.getEntry('abc.txt'))!;
  expect(entry.size).toBe(2n ** 53n + 1n);
  expect(
    new Uint8Array(await archive.readRange(entry, {start: entry.size - 2n, end: entry.size}))
  ).toEqual(new Uint8Array(2));
  await expect(archive.read(entry)).rejects.toThrow('safely representable');
});

test('descriptor direct access rejects an offset absent from the central index', async () => {
  const archive = await open(
    createZipFixture([{descriptor: 'signed', patchCentral: view => view.setUint32(42, 1, true)}])
  );
  await expect(archive.getEntryAt(0n)).rejects.toThrow('offset missing');
});

test('runtime option types are validated for JavaScript callers', async () => {
  for (const options of [{maxArchiveBytes: 1000}, {maxReadBytes: 1n}, {maxEntries: '10'}]) {
    await expect(open(createZipFixture(), options as unknown as ZipArchiveOptions)).rejects.toThrow(
      'limit'
    );
  }
});

test('ZIP64 count limits are checked before allocating or scanning a sparse directory', async () => {
  const bytes = createZipFixture([{zip64: true}], {zip64: true});
  const footer = bytes.slice(-98);
  const view = new DataView(footer.buffer);
  const count = 65536n;
  const directoryOffset = 60n;
  const footerOffset = directoryOffset + count * 46n;
  view.setBigUint64(24, count, true);
  view.setBigUint64(32, count, true);
  view.setBigUint64(40, count * 46n, true);
  view.setBigUint64(48, directoryOffset, true);
  view.setBigUint64(64, footerOffset, true);
  const read = vi.fn(async (start: number | bigint = 0, length = 0) => {
    const offset = BigInt(start);
    const output = new Uint8Array(length);
    for (const [position, segment] of [
      [0n, bytes.slice(0, -98)],
      [footerOffset, footer]
    ] as const) {
      const first = offset > position ? offset : position;
      const last =
        offset + BigInt(length) < position + BigInt(segment.length)
          ? offset + BigInt(length)
          : position + BigInt(segment.length);
      if (last > first)
        output.set(
          segment.subarray(Number(first - position), Number(last - position)),
          Number(first - offset)
        );
    }
    return output.buffer;
  });
  const file = {
    size: Number(footerOffset + 98n),
    bigsize: footerOffset + 98n,
    read,
    close: vi.fn().mockResolvedValue(undefined)
  } as unknown as ReadableFile;
  await expect(openZipArchive(file, {maxEntries: 65535})).rejects.toThrow('entry/byte limit');
  expect(read.mock.calls.every(([offset]) => offset !== directoryOffset)).toBe(true);
  expect(read.mock.calls.reduce((total, [, length]) => total + (length ?? 0), 0)).toBeLessThan(
    66000
  );
});
