// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LASLoader} from '@loaders.gl/pointclouds/las';
import {PCDLoader} from '@loaders.gl/pointclouds/pcd';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {OBJLoader} from '@loaders.gl/scene/obj';
import {USDLoader} from '@loaders.gl/scene/usd';
import {WKTLoader} from '@loaders.gl/geospatial/wkt';
import {WKBLoader} from '@loaders.gl/geospatial/wkb';
import {TWKBLoader} from '@loaders.gl/geospatial/twkb';

test.each([
  [LASLoader, 'pointclouds'],
  [PCDLoader, 'pointclouds'],
  [PLYLoader, 'pointclouds'],
  [GLTFLoader, 'scene'],
  [OBJLoader, 'scene'],
  [USDLoader, 'scene'],
  [WKTLoader, 'geospatial'],
  [WKBLoader, 'geospatial'],
  [TWKBLoader, 'geospatial']
] as const)('$0.id metadata resolves its grouped parser', async (loader, owner) => {
  expect(loader.module).toBe(owner);
  expect(loader).not.toHaveProperty('parse');
  expect(loader).not.toHaveProperty('parseSync');
  const implementation = await loader.preload!();
  expect(implementation.id).toBe(loader.id);
  expect(
    typeof implementation.parse === 'function' || typeof implementation.parseSync === 'function'
  ).toBe(true);
});
