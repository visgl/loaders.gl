// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {WebMercatorViewport} from '@deck.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {coreApi} from '@loaders.gl/core';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';
import {getFrameState} from '../../src/tileset-3d/helpers/frame-state';
// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json';
test('Tileset3D#traverser base class', async () => {
  const source = new Tiles3DSource({url: TILESET_URL, loader: Tiles3DLoader, coreApi});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  expect(
    tileset.options.progressiveResolutionHeightFraction,
    'uses the progressive-resolution default'
  ).toBe(0.3);
  expect(tileset.options.foveatedScreenSpaceError, 'enables foveated priority by default').toBe(
    true
  );
  expect(tileset.options.foveatedTimeDelay, 'uses the moving-camera delay default').toBe(0.2);
  const traverser = new TilesetTraverser({
    basePath: tileset.basePath,
    onTraversalEnd: traversalEnd
  });
  const viewport = new WebMercatorViewport({
    altitude: 1.5,
    bearing: 0,
    far: 1000,
    fovy: 50,
    height: 600,
    id: 'view0',
    latitude: 40.049483884253355,
    longitude: -75.60783109310839,
    maxPitch: 85,
    maxZoom: 30,
    minPitch: 0,
    minZoom: 2,
    modelMatrix: null,
    near: 0.1,
    pitch: 45,
    projectionMatrix: null,
    width: 1848,
    zoom: 12.660812211760435
  });
  traverser.traverse(tileset.root, getFrameState(viewport, 0), {});
  function traversalEnd() {
    expect(traverser).toBeTruthy();
  }
});
