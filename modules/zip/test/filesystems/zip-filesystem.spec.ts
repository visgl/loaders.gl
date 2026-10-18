import {expect, test, vi} from 'vitest';
import {isBrowser} from '@loaders.gl/core/loader-utils';
import {
  createReadableFileFromBuffer,
  createReadableFileFromPath,
  loadArrayBufferFromFile
} from 'test/utils/readable-files';
import {ZipFileSystem} from '../../src/filesystems/zip-filesystem';
import {IndexedArchive} from '../../src/filesystems/IndexedArchive';
import {ZipArchive} from '../../src/zip-archive';
import {encodeZip} from '../../src/zip-encode';
import {createZipFixture} from '../zip-reader-fixture';
const ZIP_FILE_PATH = '@loaders.gl/zip/test/data/test-store.zip';
test('zip#ZipFileSystem - initialize from existing fileHandler', async () => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  await fileSystem.destroy();
  expect(fileSystem).toBeTruthy();
  expect(files).toEqual(['test-file.txt']);
});
test('zip#ZipFileSystem - initialize with zip file path', async () => {
  if (isBrowser) {
    expect(() => new ZipFileSystem(ZIP_FILE_PATH)).toThrow();
  } else {
    const fileSystem = new ZipFileSystem(ZIP_FILE_PATH);
    const files = await fileSystem.readdir();
    await fileSystem.destroy();
    expect(fileSystem).toBeTruthy();
    expect(files).toEqual(['test-file.txt']);
  }
});
test('zip#ZipFileSystem - get stat for the first file', async () => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  const stats = await fileSystem.stat(files[0]);
  await fileSystem.destroy();
  expect(stats).toBeTruthy();
  expect(stats.compressedSize).toBe(15n);
  expect(stats.uncompressedSize).toBe(15n);
  expect(stats.path).toBe('test-file.txt');
  expect(stats.compression).toBe('store');
  expect(stats.dataOffset).toBe(71n);
  expect(stats.localHeaderOffset).toBe(0n);
  expect(stats.size).toBe(15);
});
test('zip#ZipFileSystem - get stat should fail', async () => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  await expect(fileSystem.stat('not-existing-file.xyz')).rejects.toBeDefined();
  await fileSystem.destroy();
});
test('zip#ZipFileSystem - fetch the file', async () => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const fileResponse = await fileSystem.fetch('test-file.txt');
  const text = await fileResponse.text();
  await fileSystem.destroy();
  expect(text).toBe('test file data\n');
});
test('zip#ZipFileSystem - fetch uses central-directory sizes for data descriptors', async () => {
  for (const includeSignature of [true, false]) {
    const archive = createDataDescriptorArchive(includeSignature);
    const fileSystem = new ZipFileSystem(archive);
    const response = await fileSystem.fetch('test.txt');
    expect(
      await response.text(),
      includeSignature ? 'reads signed descriptor archive' : 'reads unsigned descriptor archive'
    ).toBe('abc');
    await fileSystem.destroy();
  }
});
test('zip#ZipFileSystem - fetch should fail', async () => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  await expect(fileSystem.fetch('not-existing-file.xyz')).rejects.toBeDefined();
  await fileSystem.destroy();
});
const getFileProvider = async (_fileName: string) => {
  return await createReadableFileFromPath(ZIP_FILE_PATH);
};
test('zip#ZipFileSystem - buffer-backed readable file', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(ZIP_FILE_PATH);
  const fileProvider = await createReadableFileFromBuffer(arrayBuffer);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  expect(files, 'reads file listing from in-memory source').toEqual(['test-file.txt']);
  const stats = await fileSystem.stat(files[0]);
  expect(stats.uncompressedSize, 'stat resolves sizes via readable file').toBe(15n);
  const fileResponse = await fileSystem.fetch(files[0]);
  expect(await fileResponse.text(), 'fetch returns correct contents').toBe('test file data\n');
  await fileSystem.destroy();
});
test('zip#ZipFileSystem - malformed ZIP64 metadata produces controlled errors', async () => {
  const centralDirectoryArchive = createMalformedZip64Archive('central-directory');
  const centralDirectoryFileSystem = new ZipFileSystem(centralDirectoryArchive);
  await expect(
    centralDirectoryFileSystem.readdir(),
    'readdir rejects malformed central-directory ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await expect(
    centralDirectoryFileSystem.stat('test.json'),
    'stat rejects malformed central-directory ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await centralDirectoryFileSystem.destroy();
  const localHeaderArchive = createMalformedZip64Archive('local-header');
  const localHeaderFileSystem = new ZipFileSystem(localHeaderArchive);
  await expect(
    localHeaderFileSystem.fetch('test.json'),
    'fetch rejects malformed local-header ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await localHeaderFileSystem.destroy();
});
/** Creates missing ZIP64 metadata using the owner's independent synthetic fixture. */
function createMalformedZip64Archive(header: 'central-directory' | 'local-header'): ArrayBuffer {
  const patch = (view: DataView) => {
    view.setUint32(header === 'local-header' ? 18 : 20, 0xffffffff, true);
    view.setUint32(header === 'local-header' ? 22 : 24, 0xffffffff, true);
  };
  return createZipFixture([
    {
      name: new TextEncoder().encode('test.json'),
      ...(header === 'local-header' ? {patchLocal: patch} : {patchCentral: patch})
    }
  ]).buffer;
}

/** One representative descriptor response through the filesystem wrapper. */
function createDataDescriptorArchive(signed: boolean): ArrayBuffer {
  return createZipFixture([
    {name: new TextEncoder().encode('test.txt'), descriptor: signed ? 'signed' : 'unsigned'}
  ]).buffer;
}

const RESOURCE_FILES = {'folder/data.txt': new TextEncoder().encode('0123456789')};

test.each([
  ['bytes=2-4', '234', 'bytes 2-4/10'],
  ['bytes=7-', '789', 'bytes 7-9/10'],
  ['bytes=-3', '789', 'bytes 7-9/10'],
  ['bytes=8-99', '89', 'bytes 8-9/10'],
  ['bytes=-99', '0123456789', 'bytes 0-9/10']
])('ZIP filesystem STORE range %s', async (range, expected, contentRange) => {
  const filesystem = new ZipFileSystem(await encodeZip(RESOURCE_FILES));
  try {
    const response = await filesystem.fetch('folder/data.txt', {headers: {Range: range}});
    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe(contentRange);
    expect(response.headers.get('Content-Length')).toBe(String(expected.length));
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(await response.text()).toBe(expected);
  } finally {
    await filesystem.destroy();
  }
});

test.each([
  '',
  'bytes=10-',
  'bytes=4-2',
  'bytes=-0',
  'bytes=-',
  'bytes=0-1,3-4',
  'items=0-1'
])('ZIP filesystem unsatisfiable or unsupported range %s', async range => {
  const filesystem = new ZipFileSystem(await encodeZip(RESOURCE_FILES));
  try {
    const response = await filesystem.fetch('folder/data.txt', {headers: {range}});
    expect(response.status).toBe(416);
    expect(response.headers.get('Content-Range')).toBe('bytes */10');
    expect(await response.text()).toBe('');
  } finally {
    await filesystem.destroy();
  }
});

test('ZIP filesystem empty and compressed range handling, streaming reads and budgets', async () => {
  const empty = new ZipFileSystem(await encodeZip({'empty.txt': new Uint8Array()}));
  const response = await empty.fetch('empty.txt', {headers: {range: 'bytes=0-'}});
  expect(response.status).toBe(416);
  expect(response.headers.get('Content-Range')).toBe('bytes */0');
  await empty.destroy();
  const compressed = new ZipFileSystem(await encodeZip(RESOURCE_FILES, {compression: 'deflate'}));
  await expect(
    compressed.fetch('folder/data.txt', {headers: {range: 'bytes=0-1'}})
  ).rejects.toThrow('STORE');
  const complete = await compressed.fetch('folder/data.txt');
  expect(complete.headers.get('Accept-Ranges')).toBe('none');
  expect(await complete.text()).toBe('0123456789');
  await compressed.destroy();
  const limited = new ZipFileSystem(await encodeZip(RESOURCE_FILES), {maxDecodedBytes: 2n});
  await expect((await limited.fetch('folder/data.txt')).arrayBuffer()).rejects.toThrow();
  await limited.destroy();
});

test('ZIP filesystem confines decoded paths and resolves its own response URLs', async () => {
  const filesystem = new ZipFileSystem(await encodeZip(RESOURCE_FILES));
  try {
    for (const path of [
      'folder/./data.txt?token=local#fragment',
      'other/../folder/data%2Etxt',
      '/folder/data.txt'
    ]) {
      const response = await filesystem.fetch(path);
      expect(await response.text()).toBe('0123456789');
      expect(await (await filesystem.fetch(response.url)).text()).toBe('0123456789');
    }
    for (const path of [
      '../folder/data.txt',
      '%2e%2e/folder/data.txt',
      '//external/data.txt',
      'https://external/data.txt',
      'file:data.txt',
      'folder%5Cdata.txt',
      '%00',
      '%2F%2Fexternal',
      '%68ttps:external',
      '%'
    ]) {
      await expect(filesystem.fetch(path)).rejects.toThrow();
    }
    await expect(filesystem.fetch('folder/data.txt', {method: 'POST'})).rejects.toThrow('GET');
  } finally {
    await filesystem.destroy();
  }
});

test('ZIP filesystem caches the directory and closes once, including active streams', async () => {
  const file = await createReadableFileFromBuffer(await encodeZip(RESOURCE_FILES));
  const read = vi.spyOn(file, 'read');
  const close = vi.spyOn(file, 'close');
  const filesystem = new ZipFileSystem(file);
  await filesystem.stat('folder/data.txt');
  const metadataReads = read.mock.calls.length;
  await filesystem.stat('folder/data.txt');
  expect(read).toHaveBeenCalledTimes(metadataReads);
  const response = await filesystem.fetch('folder/data.txt');
  await filesystem.destroy();
  await filesystem.destroy();
  expect(close).toHaveBeenCalledTimes(1);
  await expect(response.arrayBuffer()).rejects.toThrow();
  await expect(filesystem.readdir()).rejects.toThrow('closed');
  await expect(filesystem.stat('folder/data.txt')).rejects.toThrow('closed');
  await expect(filesystem.fetch('folder/data.txt')).rejects.toThrow('closed');
});

test('ZIP filesystem verifies complete-read CRC, cancellation and typed-array slice bounds', async () => {
  const bytes = await encodeZip(RESOURCE_FILES);
  const padded = new Uint8Array(bytes.byteLength + 2);
  padded.set(new Uint8Array(bytes), 1);
  const filesystem = new ZipFileSystem(padded.subarray(1, -1));
  const controller = new AbortController();
  const response = await filesystem.fetch('folder/data.txt', {signal: controller.signal});
  controller.abort(new Error('caller cancelled'));
  await expect(response.arrayBuffer()).rejects.toThrow();
  await expect(filesystem.fetch('folder/data.txt', {signal: controller.signal})).rejects.toThrow(
    'caller cancelled'
  );
  const metadata = await filesystem.stat('folder/data.txt');
  await filesystem.destroy();
  new Uint8Array(bytes)[Number(metadata.dataOffset)] ^= 1;
  const corrupt = new ZipFileSystem(bytes);
  await expect((await corrupt.fetch('folder/data.txt')).arrayBuffer()).rejects.toThrow();
  await corrupt.destroy();
});

test('ZIP filesystem stream cancellation leaves the archive usable', async () => {
  const filesystem = new ZipFileSystem(await encodeZip(RESOURCE_FILES), {chunkBytes: 2});
  const reader = (await filesystem.fetch('folder/data.txt')).body!.getReader();
  expect((await reader.read()).value).toEqual(new Uint8Array([48, 49]));
  await reader.cancel();
  expect(await (await filesystem.fetch('folder/data.txt')).text()).toBe('0123456789');
  await filesystem.destroy();
});

test.each([
  'https://example.test/archive.slpk',
  './folder/archive.slpk'
])('ZIP filesystem retains indexed format aliases for %s without scanning the directory', async fileName => {
  const file = await createReadableFileFromBuffer(await encodeZip(RESOURCE_FILES));
  const read = vi.spyOn(file, 'read');
  const getFile = vi.fn(async () => new TextEncoder().encode('format decoded').buffer);
  const adapter = new (class extends IndexedArchive {
    /** Supplies a format-decoded resource for the adapter contract test. */
    getFile = getFile;
  })(file, undefined, fileName);
  const filesystem = new ZipFileSystem(adapter);
  // A virtual archive URL is routed only through the local adapter mock, never through network fetch.
  const response = await filesystem.fetch(`${adapter.fileName}/nodes/0/shared`);
  expect(await response.text()).toBe('format decoded');
  expect(getFile).toHaveBeenCalledWith('nodes/0/shared', 'http');
  await filesystem.fetch(fileName.replace(/^\.\//, ''));
  expect(getFile).toHaveBeenLastCalledWith('', 'http');
  expect(read).not.toHaveBeenCalled();
  if (fileName.startsWith('https:'))
    await expect(filesystem.fetch(`${adapter.fileName}-other/nodes/0`)).rejects.toThrow('inside');
  await expect(filesystem.fetch('nodes/0/shared', {headers: {range: 'bytes=0-1'}})).rejects.toThrow(
    'format resource'
  );
  await filesystem.destroy();
});

test('ZIP filesystem closes failed initialization and unopened files once', async () => {
  const invalidFile = await createReadableFileFromBuffer(new ArrayBuffer(22));
  const closeInvalid = vi.spyOn(invalidFile, 'close');
  const invalid = new ZipFileSystem(invalidFile);
  await expect(invalid.readdir()).rejects.toThrow();
  await invalid.destroy();
  await invalid.destroy();
  expect(closeInvalid).toHaveBeenCalledTimes(1);
  const file = await createReadableFileFromBuffer(await encodeZip(RESOURCE_FILES));
  const close = vi.spyOn(file, 'close');
  const unopened = new ZipFileSystem(file);
  await unopened.destroy();
  await unopened.destroy();
  expect(close).toHaveBeenCalledTimes(1);
});

test('ZIP filesystem Blob inputs preserve ZIP64 metadata and directory names', async () => {
  const filesystem = new ZipFileSystem(
    new Blob([
      await encodeZip(
        {
          'folder/': new Uint8Array(),
          'folder/café.txt': new TextEncoder().encode('text')
        },
        {zip64: 'always'}
      )
    ])
  );
  expect(await filesystem.readdir()).toEqual(['folder/', 'folder/café.txt']);
  expect(await filesystem.stat('folder/')).toMatchObject({
    directory: true,
    size: 0,
    uncompressedSize: 0n
  });
  const response = await filesystem.fetch('folder/caf%C3%A9.txt');
  expect(await response.text()).toBe('text');
  expect(await (await filesystem.fetch(response.url)).text()).toBe('text');
  await filesystem.destroy();
});

test('ZIP filesystem rejects unsafe numeric stats and constructor cancellation', async () => {
  const filesystem = new ZipFileSystem(await encodeZip(RESOURCE_FILES));
  const entry = await filesystem.stat('folder/data.txt');
  const getEntry = vi.spyOn(ZipArchive.prototype, 'getEntry').mockResolvedValue({
    ...entry,
    size: BigInt(Number.MAX_SAFE_INTEGER) + 1n
  });
  try {
    await expect(filesystem.stat('folder/data.txt')).rejects.toThrow('safely representable');
  } finally {
    getEntry.mockRestore();
    await filesystem.destroy();
  }
  const controller = new AbortController();
  const cancelled = new ZipFileSystem(await encodeZip(RESOURCE_FILES), {signal: controller.signal});
  controller.abort(new Error('archive cancelled'));
  await expect(cancelled.readdir()).rejects.toThrow('archive cancelled');
  await expect(cancelled.fetch('folder/data.txt')).rejects.toThrow('archive cancelled');
  await cancelled.destroy();
});

test('ZIP filesystem preserves literal entry names and unambiguous response URLs', async () => {
  const names = ['100%.txt', 'a%2Fb', 'a/b', 'query?name.txt', 'hash#name.txt', 'archive.zip/a/b'];
  const filesystem = new ZipFileSystem(
    await encodeZip(Object.fromEntries(names.map(path => [path, new TextEncoder().encode(path)])))
  );
  // Models a relative archive name without adding filesystem I/O to the browser fixture.
  Object.defineProperty(filesystem, 'fileName', {value: 'archive.zip'});
  try {
    expect((await filesystem.readdir()).sort()).toEqual([...names].sort());
    for (const name of names) {
      expect((await filesystem.stat(name)).path).toBe(name);
      const response = await filesystem.fetch(name);
      expect(await response.text()).toBe(name);
      expect((await filesystem.stat(response.url)).path).toBe(name);
      expect(await (await filesystem.fetch(response.url)).text()).toBe(name);
    }
  } finally {
    await filesystem.destroy();
  }
});

test.each([
  'opening',
  'lookup'
])('ZIP filesystem observes request cancellation during metadata %s', async phase => {
  const file = await createReadableFileFromBuffer(await encodeZip(RESOURCE_FILES));
  const filesystem = new ZipFileSystem(file);
  let begin!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => {
    begin = resolve;
  });
  const blocked = new Promise<void>(resolve => {
    release = resolve;
  });
  const readFile = file.read.bind(file);
  const getEntry = ZipArchive.prototype.getEntry;
  if (phase === 'lookup') await filesystem.readdir();
  const intercepted =
    phase === 'opening'
      ? vi.spyOn(file, 'read').mockImplementationOnce(async (start, length) => {
          begin();
          await blocked;
          return await readFile(start, length);
        })
      : vi.spyOn(ZipArchive.prototype, 'getEntry').mockImplementationOnce(async function (
          this: ZipArchive,
          path
        ) {
          begin();
          await blocked;
          return await getEntry.call(this, path);
        });
  const controller = new AbortController();
  const response = filesystem.fetch('folder/data.txt', {signal: controller.signal});
  await started;
  controller.abort(new Error('metadata cancelled'));
  release();
  try {
    await expect(response).rejects.toThrow('metadata cancelled');
    intercepted.mockRestore();
    expect(await (await filesystem.fetch('folder/data.txt')).text()).toBe('0123456789');
  } finally {
    intercepted.mockRestore();
    await filesystem.destroy();
  }
});
