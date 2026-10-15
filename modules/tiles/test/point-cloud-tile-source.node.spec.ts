// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

test('installed ESM and CommonJS point sources expose the same decoded-data API', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const runtimes = [await import('@loaders.gl/tiles/point-cloud-tile-source-loader'), require('@loaders.gl/tiles/point-cloud-tile-source-loader')];
    const classes = [await import('@loaders.gl/tiles/point-cloud-tile-source'), require('@loaders.gl/tiles/point-cloud-tile-source')];
    for (const [index, runtime] of runtimes.entries()) {
      assert.equal(runtime.PointCloudTileSource, undefined);
      const source = runtime.PointCloudTileSourceLoaderWithParser.createDataSource({
        topology: 'point-list', mode: 0, schema: {fields: [], metadata: {}},
        attributes: {POSITION: {value: new Float64Array([1, 2, 3]), size: 3}}
      });
      try {
        assert.ok(source instanceof classes[index].PointCloudTileSource);
        assert.deepEqual(await source.getMetadata(), {pointCount: 1, refinement: 'ADD'});
        assert.equal((await source.getRootTile()).id, 'r');
      } finally { source.close(); }
    }
    for (const metadata of [await import('@loaders.gl/tiles'), require('@loaders.gl/tiles')]) {
      assert.equal(metadata.PointCloudTileSource, undefined);
      assert.throws(() => metadata.PointCloudTileSourceLoader.createDataSource(), /preload/);
    }
    console.log('published point source entrypoints passed');
  `
    ],
    {cwd: fileURLToPath(new URL('../../../', import.meta.url)), encoding: 'utf8'}
  );
  expect(output).toContain('published point source entrypoints passed');
});
