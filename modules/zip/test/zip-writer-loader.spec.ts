import {expect, test} from 'vitest';
import {validateLoader, validateWriter} from 'test/common/conformance';
import {ZipWriter, ZipLoader} from '@loaders.gl/zip';
import {encode, parse} from '@loaders.gl/core';
import JSZip from 'jszip';
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
  const zipWithoutDirectoryEntries = await new JSZip().loadAsync(
    arrayBufferWithoutDirectoryEntries
  );
  const directoryEntriesWithoutOption = Object.keys(zipWithoutDirectoryEntries.files)
    .filter(fileName => zipWithoutDirectoryEntries.files[fileName].dir)
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
  const zipWithDirectoryEntries = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntriesWithOption = Object.keys(zipWithDirectoryEntries.files)
    .filter(fileName => zipWithDirectoryEntries.files[fileName].dir)
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
  const zipWithoutDirectoryEntries = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntries = Object.keys(zipWithoutDirectoryEntries.files)
    .filter(fileName => zipWithoutDirectoryEntries.files[fileName].dir)
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
  const zip = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntries = Object.keys(zip.files).filter(fileName => zip.files[fileName].dir);
  expect(directoryEntries.sort(), 'Writes one entry for each generated parent directory').toEqual([
    'images/',
    'images/avatars/'
  ]);
});
