// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  extractGLTF,
  GLTF_FORMAT
} from '../../../../../src/3d-tiles/lib/parsers/helpers/parse-3d-tile-gltf-view';
import type {Tiles3DTileContent} from '../../../../../src/3d-tiles/types';

test('extractGLTF trims repeated URI padding without altering the path', async () => {
  const url = 'models/example.gltf';
  const paddedUrl = `${url}${'\0 \t\n'.repeat(10000)}`;
  const tile = {
    gltfArrayBuffer: new TextEncoder().encode(paddedUrl).buffer,
    gltfByteOffset: 0
  } as Tiles3DTileContent;

  await extractGLTF(tile, GLTF_FORMAT.URI);

  expect(tile.gltfUrl).toBe(url);
  expect(tile.gltfArrayBuffer).toBeUndefined();
});
