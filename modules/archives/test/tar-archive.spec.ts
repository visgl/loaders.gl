import {expect, test} from 'vitest';
import {TarBuilder, TarLoader, TarWriter, readTarArchive} from '@loaders.gl/archives/tar';
import {TarLoaderWithParser} from '@loaders.gl/archives/tar/tar-loader';

test('TAR round trip through loader and writer', async () => {
  const archive = await TarWriter.encode({
    'hello.txt': 'Hello',
    'folder/data.bin': new Uint8Array([1, 2, 3])
  });
  const files = readTarArchive(archive);
  expect(new TextDecoder().decode(files['hello.txt'])).toBe('Hello');
  expect(new Uint8Array(files['folder/data.bin'])).toEqual(new Uint8Array([1, 2, 3]));
  expect(await TarLoaderWithParser.parse(archive)).toEqual(files);
  expect(await TarLoader.preload()).toBe(TarLoaderWithParser);
});

test('TAR rejects damaged headers and limits', async () => {
  const archive = await TarWriter.encode({'hello.txt': 'Hello'});
  const damaged = archive.slice(0);
  new Uint8Array(damaged)[0] ^= 1;
  expect(() => readTarArchive(damaged)).toThrow(/checksum/);
  expect(() => readTarArchive(archive, {tar: {maxEntries: 0}})).toThrow(/entry limit/);
  expect(() => readTarArchive(archive, {tar: {maxTotalDecodedBytes: 4}})).toThrow(
    /decoded-byte limit/
  );
  expect(() => readTarArchive(archive.slice(0, 515))).toThrow(/Truncated/);
});

test('TAR rejects unsafe paths and links', async () => {
  const builder = new TarBuilder();
  builder.addFile('../escape', new Uint8Array([1]).buffer);
  const unsafeArchive = await builder.build();
  expect(() => readTarArchive(unsafeArchive)).toThrow(/Unsafe TAR path/);
  const archive = await TarWriter.encode({'file.txt': 'data'});
  const bytes = new Uint8Array(archive);
  bytes[156] = 50;
  let sum = 0;
  for (let index = 0; index < 512; index++) sum += index >= 148 && index < 156 ? 32 : bytes[index];
  const checksum = sum.toString(8).padStart(6, '0');
  bytes.set(new TextEncoder().encode(`${checksum}\0 `), 148);
  expect(() => readTarArchive(archive)).toThrow(/Unsupported TAR entry type/);
});
