import {expect, test, vi} from 'vitest';
import {validateLoader, validateWriter} from 'test/common/conformance';
import {ZipWriter, ZipLoader, encodeZip} from '@loaders.gl/archives/zip';
import {encode, parse} from '@loaders.gl/core';
import {readZip} from 'test/common/read-zip';
const FILE_MAP = {
  src: 'abc',
  dist: 'cba',
  'README.md': 'This is a module',
  package: '{"name": "module"}'
};
test('Zip#loader/writer conformance', () => {
  validateLoader(ZipLoader, 'ZipLoader');
  validateWriter(ZipWriter, 'ZipWriter');
});
test('Zip#encode/decode', async () => {
  const arrayBuffer = await encode(FILE_MAP, ZipWriter);
  const fileMap = await parse(arrayBuffer, ZipLoader);
  for (const key in FILE_MAP) {
    const text = new TextDecoder().decode(fileMap[key]);
    expect(text, `Subfile ${key} encoded/decoded correctly`).toBe(FILE_MAP[key]);
  }
});
test('ZipLoader handles directory entries', async () => {
  const arrayBuffer = await encode(
    {
      'AgData/Implements/': '',
      'AgData/Implements/README.txt': 'folder entry should not crash'
    },
    ZipWriter
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);
  expect(
    new TextDecoder().decode(fileMap['AgData/Implements/README.txt']),
    'Loads file content in directory entry'
  ).toBe('folder entry should not crash');
  expect(fileMap['AgData/Implements/'], 'Skips directory entry in file map').toBeFalsy();
});
test('ZipWriter creates parent directory entries for nested files', async () => {
  const arrayBufferWithoutDirectoryEntries = await encode(
    {
      'folder1/folder2/file.txt': 'nested file'
    },
    ZipWriter
  );
  const zipWithoutDirectoryEntries = await readZip(arrayBufferWithoutDirectoryEntries);
  const directoryEntriesWithoutOption = zipWithoutDirectoryEntries.entries
    .filter(entry => entry.directory)
    .map(entry => entry.path)
    .sort();
  expect(directoryEntriesWithoutOption, 'No parent directory entries by default').toEqual([]);
  const arrayBuffer = await encode(
    {
      'folder1/folder2/file.txt': 'nested file',
      'folder1/folder2/file2.txt': 'nested file 2'
    },
    ZipWriter,
    {zip: {createFolders: true}}
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);
  const zipWithDirectoryEntries = await readZip(arrayBuffer);
  const directoryEntriesWithOption = zipWithDirectoryEntries.entries
    .filter(entry => entry.directory)
    .map(entry => entry.path)
    .sort();
  expect(directoryEntriesWithOption, 'Writes parent directory entries when enabled').toEqual([
    'folder1/',
    'folder1/folder2/'
  ]);
  expect(new TextDecoder().decode(fileMap['folder1/folder2/file.txt'])).toBe('nested file');
  expect(new TextDecoder().decode(fileMap['folder1/folder2/file2.txt'])).toBe('nested file 2');
  expect(fileMap['folder1/'], 'Skips first-level directory entry in file map').toBeFalsy();
  expect(fileMap['folder1/folder2/'], 'Skips nested directory entry in file map').toBeFalsy();
});
test('ZipWriter preserves explicit slash directory keys even when parent directory generation is disabled', async () => {
  const arrayBuffer = await encode(
    {
      'images/avatars/': '',
      'images/avatars/user-1.txt': '1',
      'images/avatars/user-2.txt': '2'
    },
    ZipWriter
  );
  const zipWithoutDirectoryEntries = await readZip(arrayBuffer);
  const directoryEntries = zipWithoutDirectoryEntries.entries
    .filter(entry => entry.directory)
    .map(entry => entry.path)
    .sort();
  expect(directoryEntries, 'Explicitly included slash keys are still written').toEqual([
    'images/',
    'images/avatars/'
  ]);
});
test('ZipWriter and ZipLoader keep directory keys out of the decoded file map', async () => {
  const arrayBuffer = await encode(
    {
      'assets/': '',
      'assets/readme.txt': 'hello',
      'assets/docs/guide.txt': 'guide'
    },
    ZipWriter
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);
  expect(new TextDecoder().decode(fileMap['assets/readme.txt'])).toBe('hello');
  expect(new TextDecoder().decode(fileMap['assets/docs/guide.txt'])).toBe('guide');
  expect(
    Object.keys(fileMap).sort(),
    'Directory entries are not present in output file map'
  ).toEqual(['assets/docs/guide.txt', 'assets/readme.txt']);
});
test('ZipWriter emits generated directory entries when explicitly enabled', async () => {
  const arrayBuffer = await encode(
    {
      'images/avatars/user-1.txt': '1',
      'images/avatars/user-2.txt': '2'
    },
    ZipWriter,
    {zip: {createFolders: true}}
  );
  const zip = await readZip(arrayBuffer);
  const directoryEntries = zip.entries.filter(entry => entry.directory).map(entry => entry.path);
  expect(directoryEntries.sort(), 'Writes one entry for each generated parent directory').toEqual([
    'images/',
    'images/avatars/'
  ]);
});

test('native loader/writer options support compressed ZIP64 and completion notifications', async () => {
  const onUpdate = vi.fn();
  const encoded = await encode({['__proto__']: new Uint8Array([1])}, ZipWriter, {
    zip: {compression: 'deflate', zip64: 'always', onUpdate}
  });
  expect(onUpdate.mock.calls).toEqual([[{percent: 0}], [{percent: 100}]]);
  const files = await parse(encoded, ZipLoader);
  expect(Object.getPrototypeOf(files)).toBeNull();
  expect(Object.keys(files)).toEqual(['__proto__']);
  expect(new Uint8Array(files.__proto__)).toEqual(new Uint8Array([1]));
});

test('file-map loader bounds total decoded bytes and propagates CRC failures', async () => {
  const encoded = await encodeZip({a: new Uint8Array([1, 2]), b: new Uint8Array([3, 4])});
  await expect(parse(encoded, ZipLoader, {zip: {maxTotalDecodedBytes: 3n}})).rejects.toThrow(
    'total decoded-byte limit'
  );
  const files = await parse(encoded, ZipLoader, {zip: {maxTotalDecodedBytes: 4n}});
  expect(Object.keys(files)).toEqual(['a', 'b']);
  const damaged = encoded.slice(0);
  new Uint8Array(damaged)[31] ^= 1;
  await expect(parse(damaged, ZipLoader)).rejects.toThrow(/CRC/);
});

test('writer rejects obsolete passthrough and bounds generated directory entries', async () => {
  await expect(ZipWriter.encode({}, {jszip: {}} as never)).rejects.toThrow(
    'jszip options were removed'
  );
  await expect(
    ZipWriter.encode({'a/b/c': ''}, {zip: {createFolders: true, maxEntries: 2}})
  ).rejects.toThrow('entry limit');
  await expect(ZipWriter.encode({}, {zip: {maxEntries: 0}})).rejects.toThrow('entry limit');
});

test.each([
  -1n,
  0.5,
  undefined
])('loader validates the total allocation limit %s', async maximum => {
  const encoded = await encodeZip({a: new Uint8Array([1])});
  if (maximum === undefined) {
    expect(Object.keys(await parse(encoded, ZipLoader))).toEqual(['a']);
  } else {
    await expect(
      parse(encoded, ZipLoader, {zip: {maxTotalDecodedBytes: maximum}} as never)
    ).rejects.toThrow('total decoded-byte limit');
  }
});

test('file-map and per-entry ZIP budgets remain independent', async () => {
  const encoded = await encodeZip({a: new Uint8Array([1, 2, 3])});
  const zip = {maxTotalDecodedBytes: 8n, maxDecodedBytes: 2n, maxCompressedBytes: 3n};
  await expect(parse(encoded, ZipLoader, {zip})).rejects.toThrow('compressed/decoded byte limit');
  await expect(
    parse(encoded, ZipLoader, {zip: {...zip, maxDecodedBytes: 3n, maxCompressedBytes: 2n}})
  ).rejects.toThrow('compressed/decoded byte limit');
  const files = await parse(encoded, ZipLoader, {zip: {...zip, maxDecodedBytes: 3n}});
  expect(new Uint8Array(files.a)).toEqual(new Uint8Array([1, 2, 3]));
});
