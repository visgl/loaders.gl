// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PotreeSourceLoader, encodePotreeDataset} from '@loaders.gl/potree';
import {getPathPrefix, setPathPrefix} from '@loaders.gl/loader-utils';
import {createPoints, createDatasetFetch} from './potree-format-fixtures';
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
      assert.equal(root.PotreeLoader.parse, undefined);
      assert.equal(root.Potree2Loader, undefined);
      assert.equal(root.Potree2SourceLoader, undefined);
      assert.equal(root.Potree2Source, undefined);
      assert.equal(typeof root.PotreeLoader.preload, 'function');
      assert.equal(typeof root.encodePotreeDataset, 'function');
      const dataset = await root.encodePotreeDataset({topology: 'point-list', mode: 0, schema: {fields: [], metadata: {}}, attributes: {POSITION: {value: new Float64Array([1, 2, 3]), size: 3}}});
      assert.equal(dataset.metadata.version, '2.0');
      assert.equal((await root.PotreeLoader.preload()).parseTextSync(JSON.stringify(dataset.metadata)).points, 1);
    }
    for (const root of [await import('@loaders.gl/potree'), require('@loaders.gl/potree')]) {
      const source = root.PotreeSourceLoader.createDataSource('https://example.com/dataset/metadata.json', {core: {fetch: async () => new Response(null, {status: 404})}});
      await assert.rejects(source.initialize(), /404/);
      source.close();
    }
    console.log('published Potree entrypoints passed');
  `
    ],
    {cwd: fileURLToPath(new URL('../../../', import.meta.url)), encoding: 'utf8'}
  );
  expect(output).toContain('published Potree entrypoints passed');
});

test.each([
  'dataset/metadata.json',
  '/dataset/metadata.json',
  './dataset/metadata.json',
  'dataset/metadata.json?token=1'
])('opens Node dataset path %s through the unified source', async input => {
  const transport = createDatasetFetch(await encodePotreeDataset(createPoints()));
  const prefix = getPathPrefix();
  setPathPrefix('');
  const paths: string[] = [];
  const source = PotreeSourceLoader.createDataSource(input, {
    core: {
      fetch: async (resource, options) => {
        paths.push(String(resource));
        return transport.fetch(new URL(String(resource), 'https://example.com/').href, options);
      }
    }
  });
  try {
    const root = await source.getRootTile();
    expect((await source.loadTileContent(root))?.pointCount).toBe(2);
    expect(paths).toEqual([
      input,
      input.replace('metadata.json', 'hierarchy.bin'),
      input.replace('metadata.json', 'octree.bin')
    ]);
  } finally {
    source.close();
    setPathPrefix(prefix);
  }
});
