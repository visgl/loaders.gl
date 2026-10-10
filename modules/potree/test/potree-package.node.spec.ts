// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

test('installed Potree metadata, writer and source subpaths work in ESM and CommonJS', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    for (const root of [await import('@loaders.gl/potree'), require('@loaders.gl/potree')]) {
      assert.equal(root.Potree2Loader.parse, undefined);
      assert.equal(typeof root.Potree2Loader.preload, 'function');
      assert.equal(typeof root.encodePotreeDataset, 'function');
      const dataset = await root.encodePotreeDataset({topology: 'point-list', mode: 0, schema: {fields: [], metadata: {}}, attributes: {POSITION: {value: new Float64Array([1, 2, 3]), size: 3}}});
      assert.equal(dataset.metadata.version, '2.0');
      assert.equal((await root.Potree2Loader.preload()).parseTextSync(JSON.stringify(dataset.metadata)).points, 1);
    }
    const runtimes = [await import('@loaders.gl/potree/potree2-source-loader'), require('@loaders.gl/potree/potree2-source-loader')];
    const classes = [await import('@loaders.gl/potree/potree2-source'), require('@loaders.gl/potree/potree2-source')];
    for (const [index, runtime] of runtimes.entries()) {
      assert.equal(runtime.Potree2Source, undefined);
      const source = runtime.Potree2SourceLoaderWithParser.createDataSource('https://example.com/dataset', {core: {fetch: async () => new Response(null, {status: 404})}});
      assert.ok(source instanceof classes[index].Potree2Source);
      await assert.rejects(source.initialize(), /404/);
    }
    console.log('published Potree entrypoints passed');
  `
    ],
    {cwd: fileURLToPath(new URL('../../../', import.meta.url)), encoding: 'utf8'}
  );
  expect(output).toContain('published Potree entrypoints passed');
});
