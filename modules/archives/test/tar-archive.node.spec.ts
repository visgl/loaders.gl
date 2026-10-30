import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);

test('TAR package subpaths expose metadata and parser APIs', async () => {
  const archivePackage = require('@loaders.gl/archives');
  const tarPackage = require('@loaders.gl/archives/tar');
  const parserPackage = require('@loaders.gl/archives/tar-loader');
  const writerPackage = require('@loaders.gl/archives/tar-writer');

  expect(archivePackage.TarLoader.parse).toBeUndefined();
  expect(tarPackage.TarLoader.parse).toBeUndefined();
  expect(parserPackage.TarLoaderWithParser.parse).toBeTypeOf('function');
  expect(writerPackage.TarWriter.encode).toBeTypeOf('function');
  expect(tarPackage.readTarArchive).toBeTypeOf('function');
});

test('TAR writer preserves the exact bytes of a Node Buffer slice', async () => {
  const {TarWriter, readTarArchive} = require('@loaders.gl/archives/tar');
  const pooled = Buffer.from([99, 1, 2, 3, 99]);
  const archive = await TarWriter.encode({'buffer.bin': pooled.subarray(1, 4)});
  expect(new Uint8Array(readTarArchive(archive)['buffer.bin'])).toEqual(new Uint8Array([1, 2, 3]));
});
