import test from 'tape-promise/tape';
import {WebMercatorViewport} from '@deck.gl/core';
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tileset3D} from '@loaders.gl/tiles';

import {TilesetTraverser} from '../../src/tileset/tileset-traverser';
import {getFrameState} from '../../src/tileset/helpers/frame-state';

// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json';

test('Tileset3D#traverser base class', async (t) => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);

  // Create Tileset3D to have initialized Tile3Ds tree
  const tileset = new Tileset3D(tilesetJson);

  const traverser = new TilesetTraverser({
    basePath: tilesetJson.basePath,
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
    t.ok(traverser);
    t.end();
  }
});
