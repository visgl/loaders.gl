import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);

test('TAR package subpaths expose metadata and parser APIs', async () => {
  const archivePackage = require('@loaders.gl/archives');
  const tarPackage = require('@loaders.gl/archives/tar');
  const parserPackage = require('@loaders.gl/archives/tar/tar-loader');
  const writerPackage = require('@loaders.gl/archives/tar/tar-writer');

  expect(archivePackage.TarLoader.parse).toBeUndefined();
  expect(tarPackage.TarLoader.parse).toBeUndefined();
  expect(parserPackage.TarLoaderWithParser.parse).toBeTypeOf('function');
  expect(writerPackage.TarWriter.encode).toBeTypeOf('function');
  expect(tarPackage.readTarArchive).toBeTypeOf('function');
});
