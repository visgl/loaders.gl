// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {isBrowser} from '@loaders.gl/core';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {
  createReadableFileFromBuffer,
  createReadableFileFromPath,
  loadArrayBufferFromFile
} from 'test/utils/readable-files';
import {ZipFileSystem} from '../../src/filesystems/zip-filesystem';
import {generateCDHeader} from '../../src/parse-zip/cd-file-header';
import {generateEoCD} from '../../src/parse-zip/end-of-central-directory';
import {generateLocalHeader} from '../../src/parse-zip/local-file-header';

const ZIP_FILE_PATH = '@loaders.gl/zip/test/data/test-store.zip';

test('zip#ZipFileSystem - initialize from existing fileHandler', async t => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  await fileSystem.destroy();
  t.ok(fileSystem);
  t.deepEqual(files, ['test-file.txt']);
  t.end();
});

test('zip#ZipFileSystem - initialize with zip file path', async t => {
  if (isBrowser) {
    t.throws(() => new ZipFileSystem(ZIP_FILE_PATH));
  } else {
    const fileSystem = new ZipFileSystem(ZIP_FILE_PATH);
    const files = await fileSystem.readdir();
    await fileSystem.destroy();
    t.ok(fileSystem);
    t.deepEqual(files, ['test-file.txt']);
  }
  t.end();
});

test('zip#ZipFileSystem - get stat for the first file', async t => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  const stats = await fileSystem.stat(files[0]);
  await fileSystem.destroy();
  t.ok(stats);
  t.equal(stats.compressedSize, 15n);
  t.equal(stats.uncompressedSize, 15n);
  t.equal(stats.fileName, 'test-file.txt');
  t.equal(stats.fileNameLength, 13);
  t.equal(stats.extraFieldLength, 24);
  t.equal(stats.extraOffset, 59n);
  t.equal(stats.localHeaderOffset, 0n);
  t.equal(stats.size, 15);
  t.end();
});

test('zip#ZipFileSystem - get stat should fail', async t => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  t.rejects(() => fileSystem.stat('not-existing-file.xyz'));
  await fileSystem.destroy();
  t.end();
});

test('zip#ZipFileSystem - fetch the file', async t => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const fileResponse = await fileSystem.fetch('test-file.txt');
  const text = await fileResponse.text();
  await fileSystem.destroy();
  t.equal(text, 'test file data\n');
  t.end();
});

test('zip#ZipFileSystem - fetch should fail', async t => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  t.rejects(() => fileSystem.fetch('not-existing-file.xyz'));
  await fileSystem.destroy();
  t.end();
});

const getFileProvider = async (_fileName: string) => {
  return await createReadableFileFromPath(ZIP_FILE_PATH);
};

test('zip#ZipFileSystem - buffer-backed readable file', async t => {
  const arrayBuffer = await loadArrayBufferFromFile(ZIP_FILE_PATH);
  const fileProvider = await createReadableFileFromBuffer(arrayBuffer);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  t.deepEqual(files, ['test-file.txt'], 'reads file listing from in-memory source');

  const stats = await fileSystem.stat(files[0]);
  t.equal(stats.uncompressedSize, 15n, 'stat resolves sizes via readable file');

  const fileResponse = await fileSystem.fetch(files[0]);
  t.equal(await fileResponse.text(), 'test file data\n', 'fetch returns correct contents');

  await fileSystem.destroy();
  t.end();
});

test('zip#ZipFileSystem - malformed ZIP64 metadata produces controlled errors', async t => {
  const centralDirectoryArchive = createMalformedZip64Archive('central-directory');
  const centralDirectoryFileSystem = new ZipFileSystem(centralDirectoryArchive);
  await t.rejects(
    () => centralDirectoryFileSystem.readdir(),
    /Invalid ZIP archive:.*ZIP64/,
    'readdir rejects malformed central-directory ZIP64 data'
  );
  await t.rejects(
    () => centralDirectoryFileSystem.stat('test.json'),
    /Invalid ZIP archive:.*ZIP64/,
    'stat rejects malformed central-directory ZIP64 data'
  );
  await centralDirectoryFileSystem.destroy();

  const localHeaderArchive = createMalformedZip64Archive('local-header');
  const localHeaderFileSystem = new ZipFileSystem(localHeaderArchive);
  await t.rejects(
    () => localHeaderFileSystem.fetch('test.json'),
    /Invalid ZIP archive:.*ZIP64/,
    'fetch rejects malformed local-header ZIP64 data'
  );
  await localHeaderFileSystem.destroy();
  t.end();
});

/**
 * Creates an in-memory ZIP whose selected header requires missing ZIP64 size data.
 * @param malformedHeader header to mark with ZIP64 sentinels
 * @returns malformed ZIP archive bytes
 */
function createMalformedZip64Archive(
  malformedHeader: 'central-directory' | 'local-header'
): ArrayBuffer {
  const fileName = 'test.json';
  const localHeader = generateLocalHeader({crc32: 0, fileName, length: 0});
  const centralDirectoryHeader = generateCDHeader({
    crc32: 0,
    fileName,
    length: 0,
    offset: 0n
  });

  const header =
    malformedHeader === 'local-header'
      ? new DataView(localHeader)
      : new DataView(centralDirectoryHeader);
  const compressedSizeOffset = malformedHeader === 'local-header' ? 18 : 20;
  const uncompressedSizeOffset = malformedHeader === 'local-header' ? 22 : 24;
  header.setUint32(compressedSizeOffset, 0xffffffff, true);
  header.setUint32(uncompressedSizeOffset, 0xffffffff, true);

  const centralDirectoryOffset = BigInt(localHeader.byteLength);
  const endOfCentralDirectoryOffset =
    centralDirectoryOffset + BigInt(centralDirectoryHeader.byteLength);
  const endOfCentralDirectory = generateEoCD({
    recordsNumber: 1,
    cdSize: centralDirectoryHeader.byteLength,
    cdOffset: centralDirectoryOffset,
    eoCDStart: endOfCentralDirectoryOffset
  });

  return concatenateArrayBuffers(localHeader, centralDirectoryHeader, endOfCentralDirectory);
}
