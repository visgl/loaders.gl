// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('published raster exports and packaged assets exist', () => {
  const manifest = JSON.parse(readFileSync('modules/raster/package.json', 'utf8'));
  for (const [subpath, conditions] of Object.entries(manifest.exports)) {
    for (const target of typeof conditions === 'string'
      ? [conditions]
      : Object.values(conditions as Record<string, string>)) {
      expect(existsSync(path.resolve('modules/raster', target)), subpath + ': ' + target).toBe(
        true
      );
    }
  }
  expect(manifest.dependencies).not.toHaveProperty('geotiff');
  expect(manifest.dependencies).not.toHaveProperty('lerc');
  expect(manifest.peerDependenciesMeta).toMatchObject({
    geotiff: {optional: true},
    lerc: {optional: true}
  });
});

test('native ESM metadata preloads implementations through package exports', () => {
  const source = `import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const commonJs = createRequire(import.meta.url)('@loaders.gl/raster');
    import * as metadata from '@loaders.gl/raster';
    import * as geotiff from '@loaders.gl/raster/geotiff';
    import * as lerc from '@loaders.gl/raster/lerc';
    import * as terrain from '@loaders.gl/raster/terrain';
    import * as quantized from '@loaders.gl/raster/quantized-mesh';
    for (const [name, implementation] of [['GeoTIFFLoader', geotiff.GeoTIFFLoaderWithParser], ['GeoTIFFRasterLoader', geotiff.GeoTIFFRasterLoaderWithParser], ['LERCLoader', lerc.LERCLoaderWithParser], ['TerrainLoader', terrain.TerrainLoaderWithParser], ['QuantizedMeshLoader', quantized.QuantizedMeshLoaderWithParser]]) {
      assert.equal(await metadata[name].preload(), implementation);
      assert.equal(await commonJs[name].preload(), implementation);
      assert.equal(metadata[name].parse, undefined);
    }`;
  expect(() =>
    execFileSync(process.execPath, ['--input-type=module', '-e', source], {
      encoding: 'utf8',
      timeout: 30000
    })
  ).not.toThrow();
});

test('CommonJS metadata root can asynchronously preload the ESM parser', async () => {
  const requirePackage = createRequire(path.resolve('package.json'));
  const metadata = requirePackage('@loaders.gl/raster');
  expect(metadata.TerrainLoader).not.toHaveProperty('parse');
  expect(typeof (await metadata.TerrainLoader.preload()).parse).toBe('function');
});

test('terrain metadata bundle does not eagerly include optional raster decoders', async () => {
  const result = await build({
    stdin: {
      contents: "export {TerrainLoader} from '@loaders.gl/raster';",
      resolveDir: process.cwd(),
      sourcefile: 'raster-entry.js'
    },
    bundle: true,
    format: 'esm',
    splitting: true,
    platform: 'browser',
    outdir: 'raster-bundle-test',
    write: false,
    metafile: true,
    tsconfigRaw: {},
    external: ['module'],
    logLevel: 'silent'
  });
  const entry = Object.values(result.metafile!.outputs).find(
    output => output.entryPoint === 'raster-entry.js'
  )!;
  const inputs = Object.keys(entry.inputs);
  expect(inputs.some(input => /node_modules\/(geotiff|lerc)\//.test(input))).toBe(false);
  expect(inputs.some(input => /(?:terrain|quantized-mesh)-loader\.js$/.test(input))).toBe(false);
});

test('GeoTIFF parser barrel defers the optional image decoder', async () => {
  const result = await build({
    entryPoints: ['modules/raster/src/geotiff/index.ts'],
    bundle: true,
    format: 'esm',
    splitting: true,
    platform: 'browser',
    packages: 'external',
    outdir: 'raster-geotiff-entry-test',
    write: false,
    metafile: true,
    tsconfigRaw: {},
    logLevel: 'silent'
  });
  const entry = Object.values(result.metafile!.outputs).find(
    output => output.entryPoint === 'modules/raster/src/geotiff/index.ts'
  )!;
  expect(
    entry.imports.some(item => item.path === 'geotiff' && item.kind === 'import-statement')
  ).toBe(false);
});

// Consumers must explicitly install optional decoders instead of relying on workspace hoisting.
test.each(['geotiff', 'ometiff', 'tiles'])('%s example declares its GeoTIFF engine', example => {
  const manifest = JSON.parse(readFileSync(`examples/website/${example}/package.json`, 'utf8'));
  expect(manifest.dependencies.geotiff).toBe('^2.1.0');
});

test('experimental terrain example keeps the loaders.gl runtime compatible with raster', () => {
  const manifest = JSON.parse(readFileSync('examples-experimental/terrain/package.json', 'utf8'));
  const version = manifest.dependencies['@loaders.gl/raster'];
  for (const [name, dependency] of Object.entries(manifest.dependencies)) {
    if (name.startsWith('@loaders.gl/')) expect(dependency, name).toBe(version);
  }
});
