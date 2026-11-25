// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

const formatPackages = [
  'arcgis',
  'archives',
  'core',
  'documents',
  'geospatial',
  'graphs',
  'images',
  'ogc',
  'pointclouds',
  'raster',
  'scene',
  'scientific',
  'splats',
  'tables',
  'tiles',
  'tiles-3d',
  'traces'
];

test.each(formatPackages)('%s publishes deferred and bundled format loaders', owner => {
  const manifest = JSON.parse(readFileSync(`modules/${owner}/package.json`, 'utf8'));
  const formats = Object.keys(manifest.exports)
    .filter(key => /^\.\/[^/]+\/bundled$/.test(key))
    .map(key => manifest.name + key.slice(1, -'/bundled'.length));
  expect(formats.length).toBeGreaterThan(0);
  // Run native Node resolution against emitted modules, bypassing Vitest source aliases.
  const consumer = `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const owner = ${JSON.stringify(manifest.name)};
    if (owner !== '@loaders.gl/core') {
      assert.deepEqual(Object.keys(await import(owner)), []);
      assert.deepEqual(Object.keys(require(owner)), []);
    }
    for (const format of ${JSON.stringify(formats)}) {
      const metadata = await import(format);
      const bundled = await import(format + '/bundled');
      const loaders = Object.entries(metadata).filter(([name]) => /^_?[A-Z].*Loader$/.test(name));
      assert.ok(loaders.length, format);
      for (const [name, loader] of loaders) {
        const context = format + ' ' + name;
        for (const method of ['parse', 'parseSync', 'parseTextSync', 'parseInBatches']) {
          assert.equal(loader[method], undefined, context);
        }
        assert.equal(typeof loader.preload, 'function', context);
        const implementation = await loader.preload();
        assert.ok(bundled[name], context);
        // Backend-selecting loaders can return one of several published implementations.
        assert.ok(Object.values(bundled).includes(implementation), context);
        assert.ok(['parse', 'parseSync', 'parseTextSync', 'parseInBatches', 'createDataSourceSync']
          .some(method => typeof bundled[name][method] === 'function') || bundled[name].worker, context);
      }
    }`;
  execFileSync(process.execPath, ['--input-type=module', '-e', consumer], {timeout: 30_000});
}, 35_000);
