// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeTerrainMeshFromImage} from '../../src/terrain/lib/parse-terrain';

test('detailed 1024-pixel terrain fits the grid-scaled validation budget', () => {
  const width = 1024;
  const data = new Uint8Array(width * width * 4);
  for (let index = 0; index < width * width; index++) {
    data[index * 4] = (index * 13) % 17;
    data[index * 4 + 3] = 255;
  }
  const mesh = makeTerrainMeshFromImage(
    {data, width, height: width},
    {
      bounds: [0, 0, width, width],
      elevationDecoder: {rScaler: 1, gScaler: 0, bScaler: 0, offset: 0},
      meshMaxError: 0,
      tesselator: 'martini'
    }
  );
  expect(mesh.indices!.value.length).toBeGreaterThan(0);
  expect(mesh.attributes.POSITION.value.every(Number.isFinite)).toBe(true);
});
