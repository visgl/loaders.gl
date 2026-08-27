import {expect, test} from 'vitest';
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
  expect(stats.fileName).toBe('test-file.txt');
  expect(stats.fileNameLength).toBe(13);
  expect(stats.extraFieldLength).toBe(24);
  expect(stats.extraOffset).toBe(59n);
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
    ).toBe('data descriptor contents');
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
  await await expect(
    centralDirectoryFileSystem.readdir(),
    'readdir rejects malformed central-directory ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await await expect(
    centralDirectoryFileSystem.stat('test.json'),
    'stat rejects malformed central-directory ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await centralDirectoryFileSystem.destroy();
  const localHeaderArchive = createMalformedZip64Archive('local-header');
  const localHeaderFileSystem = new ZipFileSystem(localHeaderArchive);
  await await expect(
    localHeaderFileSystem.fetch('test.json'),
    'fetch rejects malformed local-header ZIP64 data'
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
  await localHeaderFileSystem.destroy();
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
/**
 * Creates an in-memory stored ZIP whose local header defers sizes to a data descriptor.
 * @param includeSignature whether to include the optional data descriptor signature
 * @returns ZIP archive bytes
 */
function createDataDescriptorArchive(includeSignature: boolean): ArrayBuffer {
  const fileName = 'test.txt';
  const contents = new TextEncoder().encode('data descriptor contents');
  const localHeader = generateLocalHeader({crc32: 0, fileName, length: 0});
  new DataView(localHeader).setUint16(6, 0x0008, true);
  const descriptor = new DataView(new ArrayBuffer(includeSignature ? 16 : 12));
  let descriptorOffset = 0;
  if (includeSignature) {
    descriptor.setUint32(descriptorOffset, 0x08074b50, true);
    descriptorOffset += 4;
  }
  descriptor.setUint32(descriptorOffset, 0, true);
  descriptor.setUint32(descriptorOffset + 4, contents.byteLength, true);
  descriptor.setUint32(descriptorOffset + 8, contents.byteLength, true);
  const centralDirectoryOffset = BigInt(
    localHeader.byteLength + contents.byteLength + descriptor.byteLength
  );
  const centralDirectoryHeader = generateCDHeader({
    crc32: 0,
    fileName,
    length: contents.byteLength,
    offset: 0n
  });
  new DataView(centralDirectoryHeader).setUint16(8, 0x0008, true);
  const endOfCentralDirectoryOffset =
    centralDirectoryOffset + BigInt(centralDirectoryHeader.byteLength);
  const endOfCentralDirectory = generateEoCD({
    recordsNumber: 1,
    cdSize: centralDirectoryHeader.byteLength,
    cdOffset: centralDirectoryOffset,
    eoCDStart: endOfCentralDirectoryOffset
  });
  return concatenateArrayBuffers(
    localHeader,
    contents.buffer,
    descriptor.buffer,
    centralDirectoryHeader,
    endOfCentralDirectory
  );
}
