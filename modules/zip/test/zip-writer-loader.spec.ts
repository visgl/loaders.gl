// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('Zip#loader/writer conformance', (t) => {
  validateLoader(t, ZipLoader, 'ZipLoader');
  validateWriter(t, ZipWriter, 'ZipWriter');
  t.end();
});

test('Zip#encode/decode', async (t) => {
  const arrayBuffer = await encode(FILE_MAP, ZipWriter);
  const fileMap = await parse(arrayBuffer, ZipLoader);
  for (const key in FILE_MAP) {
    const text = new TextDecoder().decode(fileMap[key]);
    t.equal(text, FILE_MAP[key], `Subfile ${key} encoded/decoded correctly`);
  }
  t.end();
});

test('ZipLoader handles directory entries', async (t) => {
  const arrayBuffer = await encode(
    {
      'AgData/Implements/': '',
      'AgData/Implements/README.txt': 'folder entry should not crash'
    },
    ZipWriter
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);

  t.equal(
    new TextDecoder().decode(fileMap['AgData/Implements/README.txt']),
    'folder entry should not crash',
    'Loads file content in directory entry'
  );
  t.notOk(fileMap['AgData/Implements/'], 'Skips directory entry in file map');
  t.end();
});

test('ZipWriter creates parent directory entries for nested files', async (t) => {
  const arrayBufferWithoutDirectoryEntries = await encode(
    {
      'folder1/folder2/file.txt': 'nested file'
    },
    ZipWriter
  );
  const zipWithoutDirectoryEntries = await new JSZip().loadAsync(arrayBufferWithoutDirectoryEntries);
  const directoryEntriesWithoutOption = Object.keys(zipWithoutDirectoryEntries.files)
    .filter((fileName) => zipWithoutDirectoryEntries.files[fileName].dir)
    .sort();

  t.deepEqual(directoryEntriesWithoutOption, [], 'No parent directory entries by default');

  const arrayBuffer = await encode(
    {
      'folder1/folder2/file.txt': 'nested file',
      'folder1/folder2/file2.txt': 'nested file 2'
    },
    ZipWriter,
    {zip: {createDirectoryEntries: true}}
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);
  const zipWithDirectoryEntries = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntriesWithOption = Object.keys(zipWithDirectoryEntries.files)
    .filter((fileName) => zipWithDirectoryEntries.files[fileName].dir)
    .sort();

  t.deepEqual(
    directoryEntriesWithOption,
    ['folder1/', 'folder1/folder2/'],
    'Writes parent directory entries when enabled'
  );
  t.equal(new TextDecoder().decode(fileMap['folder1/folder2/file.txt']), 'nested file');
  t.equal(new TextDecoder().decode(fileMap['folder1/folder2/file2.txt']), 'nested file 2');
  t.notOk(fileMap['folder1/'], 'Skips first-level directory entry in file map');
  t.notOk(fileMap['folder1/folder2/'], 'Skips nested directory entry in file map');
  t.end();
});

test('ZipWriter preserves explicit slash directory keys even when parent directory generation is disabled', async (t) => {
  const arrayBuffer = await encode(
    {
      'images/avatars/': '',
      'images/avatars/user-1.txt': '1',
      'images/avatars/user-2.txt': '2'
    },
    ZipWriter
  );

  const zipWithoutDirectoryEntries = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntries = Object.keys(zipWithoutDirectoryEntries.files).filter(
    (fileName) => zipWithoutDirectoryEntries.files[fileName].dir
  ).sort();

  t.deepEqual(
    directoryEntries,
    ['images/', 'images/avatars/'],
    'Explicitly included slash keys are still written'
  );
  t.end();
});

test('ZipWriter and ZipLoader keep directory keys out of the decoded file map', async (t) => {
  const arrayBuffer = await encode(
    {
      'assets/': '',
      'assets/readme.txt': 'hello',
      'assets/docs/guide.txt': 'guide'
    },
    ZipWriter
  );
  const fileMap = await parse(arrayBuffer, ZipLoader);

  t.equal(new TextDecoder().decode(fileMap['assets/readme.txt']), 'hello');
  t.equal(new TextDecoder().decode(fileMap['assets/docs/guide.txt']), 'guide');
  t.deepEqual(
    Object.keys(fileMap).sort(),
    ['assets/docs/guide.txt', 'assets/readme.txt'],
    'Directory entries are not present in output file map'
  );
  t.end();
});

test('ZipWriter emits generated directory entries when explicitly enabled', async (t) => {
  const arrayBuffer = await encode(
    {
      'images/avatars/user-1.txt': '1',
      'images/avatars/user-2.txt': '2'
    },
    ZipWriter,
    {zip: {createDirectoryEntries: true}}
  );

  const zip = await new JSZip().loadAsync(arrayBuffer);
  const directoryEntries = Object.keys(zip.files).filter((fileName) => zip.files[fileName].dir);
  t.deepEqual(
    directoryEntries.sort(),
    ['images/', 'images/avatars/'],
    'Writes one entry for each generated parent directory'
  );
  t.end();
});
