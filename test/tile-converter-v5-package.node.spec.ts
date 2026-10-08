import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
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

test('tile-converter v5 built core and adapters share identities in ESM and CommonJS', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import * as core from '@loaders.gl/tile-converter/v5/core';
    import * as adapters from '@loaders.gl/tile-converter/v5/adapters';
    import * as index from '@loaders.gl/tile-converter/v5';
    import * as browser from '@loaders.gl/tile-converter/v5/browser';
    const require = createRequire(import.meta.url);
    const commonJsCore = require('@loaders.gl/tile-converter/v5/core');
    const commonJsAdapters = require('@loaders.gl/tile-converter/v5/adapters');
    for (const [portable, formats, combined] of [
      [core, adapters, index], [core, adapters, browser],
      [commonJsCore, commonJsAdapters, require('@loaders.gl/tile-converter/v5')],
      [commonJsCore, commonJsAdapters, require('@loaders.gl/tile-converter/v5/browser')]
    ]) {
      for (const name of ['convertTileset', 'inspectTileset', 'validateTileset', 'TileConversionError', 'createTilesetConversionSource', 'traversePointCloudSource']) {
        assert.equal(combined[name], portable[name]);
      }
      assert.equal(combined.encodeMeshTile, formats.encodeMeshTile);
      assert.equal(portable.encodeMeshTile, undefined);
      assert.equal(formats.convertTileset, undefined);
      assert.throws(() => formats.createSingleMeshI3SSink({maxTotalBytes: -1}), portable.TileConversionError);
      const report = await portable.convertTileset({
        source: {inspect: async () => null, read: async function* () {}},
        codec: {convert: async function* () {}},
        sink: {write: async () => {}, finalize: async () => {}, abort: async () => {}},
        measureInputBytes: () => 0, measureOutputBytes: () => 0
      });
      assert.equal(report.state, 'completed');
    }
    const sink = commonJsAdapters.createI3SMeshSink({maxMeshes: 2, maxTotalBytes: 65536, maxResourceBytes: 65536});
    await commonJsCore.convertTileset({
      source: {
        inspect: async () => null,
        read: async function* () {
          yield {id: 'mesh', origin: [0, 0, 0], mesh: {topology: 'triangle-list', mode: 4, attributes: {POSITION: {size: 3, value: new Float64Array([6378137, 0, 0, 6378137, 1, 0, 6378137, 0, 1])}}}};
        }
      },
      codec: commonJsAdapters.createI3SMeshConversionCodec({
        spatialContext: commonJsCore.createTiles3DConversionSpatialContext({sourceCrs: 'EPSG:4978', coordinateFrame: 'geocentric', heightReference: 'ellipsoidal'}),
        maxResourceBytes: 65536, maxPositionError: 0.01, draco: false
      }),
      sink,
      measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
      measureOutputBytes: resource => Object.values(resource.files).reduce((total, bytes) => total + bytes.byteLength, 0)
    });
    assert.ok(sink.getFiles().some(file => file.resourceId === '3dSceneLayer.json.gz'));
    console.log('split entrypoints passed');
  `
    ],
    {cwd: process.cwd(), encoding: 'utf8'}
  );
  expect(output).toContain('split entrypoints passed');
});

test('tile-converter core browser bundle excludes format adapters and Node APIs', async () => {
  const bundle = await build({
    entryPoints: [
      createRequire(import.meta.url)
        .resolve('@loaders.gl/tile-converter/v5/core')
        .replace(/\.cjs$/, '.js')
    ],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    packages: 'external',
    tsconfigRaw: {compilerOptions: {}},
    metafile: true,
    write: false,
    logLevel: 'silent'
  });
  const imports = Object.values(bundle.metafile!.outputs).flatMap(output =>
    output.imports.map(entry => entry.path)
  );
  expect([...new Set(imports)].sort()).toEqual(['@loaders.gl/tiles', '@math.gl/core']);
  expect(Object.keys(bundle.metafile!.inputs).some(path => path.includes('dist/v5/core.js'))).toBe(
    true
  );
  expect(Object.keys(bundle.metafile!.inputs).some(path => path.includes('adapters'))).toBe(false);
});
