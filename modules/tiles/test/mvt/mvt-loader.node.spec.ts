// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {readFile} from 'node:fs/promises';
import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {MVTLoader} from '@loaders.gl/tiles/mvt';

test('MVTLoader parses a tile in a Node test worker', async () => {
  const tile = await readFile(new URL('./data/mvt/points_4-2-6.mvt', import.meta.url));
  const table = await parse(tile, MVTLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'},
    mvt: {shape: 'geojson-table'}
  });
  expect(table.shape).toBe('geojson-table');
  expect(table.features).toHaveLength(1);
});
