import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

test('tile-converter(v5)#package export resolves to its built CommonJS entrypoint', () => {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('@loaders.gl/tile-converter/v5');
  const {
    createTilesetConversionSource,
    createMeshConversionCodec,
    createSingleMeshTilesetSink,
    createSingleMeshTilesetArchive,
    createTileConversionArchive,
    encodeMeshTile,
    convertPointCloudSource,
    convertTileset,
    inspectTileset,
    validateTileset
  } = require('@loaders.gl/tile-converter/v5');

  expect(packagePath).toMatch(/apps[\\/]tile-converter[\\/]dist[\\/]v5[\\/]index\.cjs$/);
  expect(convertTileset).toBeTypeOf('function');
  expect(createTilesetConversionSource).toBeTypeOf('function');
  expect(convertPointCloudSource).toBeTypeOf('function');
  expect(encodeMeshTile).toBeTypeOf('function');
  expect(createMeshConversionCodec).toBeTypeOf('function');
  expect(createSingleMeshTilesetSink).toBeTypeOf('function');
  expect(createSingleMeshTilesetArchive).toBeTypeOf('function');
  expect(createTileConversionArchive).toBeTypeOf('function');
  expect(inspectTileset).toBeTypeOf('function');
  expect(validateTileset).toBeTypeOf('function');
});

test('tile-converter(v5)#browser package export resolves to its browser entrypoint', () => {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('@loaders.gl/tile-converter/v5/browser');
  const {
    createMeshConversionCodec,
    createSingleMeshTilesetSink,
    createSingleMeshTilesetArchive,
    createTileConversionArchive,
    encodeMeshTile,
    convertPointCloudSource,
    createBoundedMemoryTileConversionSink,
    createBrowserTileConversionSource,
    createBrowserTilesetConversionSource,
    createTilesetConversionSource
  } = require('@loaders.gl/tile-converter/v5/browser');

  expect(packagePath).toMatch(/apps[\\/]tile-converter[\\/]dist[\\/]v5[\\/]browser\.cjs$/);
  expect(createBoundedMemoryTileConversionSink).toBeTypeOf('function');
  expect(convertPointCloudSource).toBeTypeOf('function');
  expect(encodeMeshTile).toBeTypeOf('function');
  expect(createMeshConversionCodec).toBeTypeOf('function');
  expect(createSingleMeshTilesetSink).toBeTypeOf('function');
  expect(createSingleMeshTilesetArchive).toBeTypeOf('function');
  expect(createTileConversionArchive).toBeTypeOf('function');
  expect(createBrowserTileConversionSource).toBeTypeOf('function');
  expect(createBrowserTilesetConversionSource).toBeTypeOf('function');
  expect(createTilesetConversionSource).toBeTypeOf('function');
});
