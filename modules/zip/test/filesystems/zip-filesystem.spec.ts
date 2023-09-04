import test from 'tape-promise/tape';

import {fetchFile, isBrowser} from '@loaders.gl/core';
import {FileHandleFile} from '@loaders.gl/loader-utils';
import {DataViewFile} from '@loaders.gl/loader-utils';
import {FileProvider} from '@loaders.gl/loader-utils';
import {ZipFileSystem} from '../../src/filesystems/zip-filesystem';

const ZIP_FILE_PATH = './modules/zip/test/data/test-store.zip';

test('zip#ZipFileSystem - initialize from existing fileHandler', async (t) => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const files = await fileSystem.readdir();
  await fileSystem.destroy();
  t.ok(fileSystem);
  t.deepEqual(files, ['test-file.txt']);
  t.end();
});

test('zip#ZipFileSystem - initialize with zip file path', async (t) => {
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

test('zip#ZipFileSystem - get stat for the first file', async (t) => {
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
  t.equal(stats.extraOffset, 145n);
  t.equal(stats.localHeaderOffset, 0n);
  t.equal(stats.size, 15);
  t.end();
});

test('zip#ZipFileSystem - get stat should fail', async (t) => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  t.rejects(() => fileSystem.stat('not-existing-file.xyz'));
  await fileSystem.destroy();
  t.end();
});

test('zip#ZipFileSystem - fetch the file', async (t) => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const fileResponse = await fileSystem.fetch('test-file.txt');
  const text = await fileResponse.text();
  await fileSystem.destroy();
  t.equal(text, 'test file data\n');
  t.end();
});

test('zip#ZipFileSystem - fetch should fail', async (t) => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  t.rejects(() => fileSystem.fetch('not-existing-file.xyz'));
  await fileSystem.destroy();
  t.end();
});

const getFileProvider = async (fileName: string) => {
  let fileProvider: FileProvider;
  if (isBrowser) {
    const fileResponse = await fetchFile(ZIP_FILE_PATH);
    const file = await fileResponse.arrayBuffer();
    fileProvider = new DataViewFile(new DataView(file));
  } else {
    fileProvider = await FileHandleFile.from(ZIP_FILE_PATH);
  }
  return fileProvider;
};
