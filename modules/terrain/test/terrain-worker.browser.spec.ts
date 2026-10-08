// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {TerrainLoader} from '@loaders.gl/terrain';

test('terrain worker resolves its nested image decoder without registered loaders', async () => {
  const canvas = new OffscreenCanvas(2, 2);
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgb(10, 0, 0)';
  context.fillRect(0, 0, 2, 2);
  const blob = await canvas.convertToBlob({type: 'image/png'});
  const mesh = await parse(await blob.arrayBuffer(), TerrainLoader, {
    core: {worker: true, _workerType: 'test', ignoreRegisteredLoaders: true},
    terrain: {shape: 'mesh', tesselator: 'delatin', bounds: [0, 0, 1, 1]}
  });
  expect(mesh.mode).toBe(4);
  expect(mesh.indices.value.length).toBe(6);
  expect(mesh.attributes.POSITION.value.length).toBe(12);
  expect(mesh.attributes.POSITION.value[2]).toBe(10);
});
