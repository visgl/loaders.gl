// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test('XML consumers depend on native documents rather than fast-xml-parser', () => {
  for (const name of ['documents', 'graphs', 'raster', 'scientific']) {
    const manifest = JSON.parse(readFileSync(`modules/${name}/package.json`, 'utf8'));
    expect(manifest.dependencies || {}).not.toHaveProperty('fast-xml-parser');
    if (name !== 'documents') expect(manifest.dependencies).toHaveProperty('@loaders.gl/documents');
  }
});

test.each([
  'esm',
  'commonjs'
])('installed %s scientific root remains metadata-only and preloads flat NPY', format => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const scientific = ${format === 'esm' ? "await import('@loaders.gl/scientific')" : "require('@loaders.gl/scientific')"};
    assert.equal(scientific.NPYLoader.module, 'scientific');
    assert.equal(scientific.NPYLoader.parse, undefined);
    assert.equal(scientific.NPYLoaderWithParser, undefined);
    assert.equal(typeof (await scientific.NPYLoader.preload()).parseSync, 'function');
    assert.equal(typeof require('@loaders.gl/scientific/npy-loader').NPYLoaderWithParser.parseSync, 'function');
    assert.equal(require('@loaders.gl/images').NPYLoader, undefined);
    console.log('verified');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(output.trim()).toBe('verified');
});

test('scientific metadata graph excludes parsers and optional scientific runtimes', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/scientific/src/index.ts'],
    bundle: true,
    packages: 'external',
    tsconfigRaw: {},
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true
  });
  expect(
    Object.keys(result.metafile!.inputs).filter(filename =>
      /\/lib\/parsers\/|netcdfjs|hdf5\/|vtk\/|grib2\//.test(filename)
    )
  ).toEqual([]);
  const map = JSON.parse(readFileSync('modules/scientific/dist/index.cjs.map', 'utf8'));
  expect(
    map.sources.filter((filename: string) =>
      /parse-npy|netcdfjs|ome-zarr-source-loader|zarr-array-source\.ts/.test(filename)
    )
  ).toEqual([]);
});

test('graph metadata CommonJS root excludes graph and XML parser implementations', () => {
  const map = JSON.parse(readFileSync('modules/graphs/dist/index.cjs.map', 'utf8'));
  expect(
    map.sources.filter((filename: string) =>
      /parse-graphml|parse-gexf|parse-dot|sax\.ts/.test(filename)
    )
  ).toEqual([]);
});
