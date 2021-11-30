// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, fetchFile, load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';
import {isBrowser} from '@loaders.gl/core';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';
const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';
const ACTUAL_B3DM =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithVertexColors/batchedWithVertexColors.b3dm';
const DEPRECATED_B3DM_1 =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedDeprecated1/batchedDeprecated1.b3dm';
const DEPRECATED_B3DM_2 =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedDeprecated2/batchedDeprecated2.b3dm';
const GLTF_CONTENT_TILESET_URL = '@loaders.gl/3d-tiles/test/data/VNext/agi-ktx2/tileset.json';

const IMPLICIT_OCTREE_TILESET_URL = '@loaders.gl/3d-tiles/test/data/SparseOctree/tileset.json';
const IMPLICIT_FULL_AVAILABLE_QUADTREE_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/FullQuadtree/tileset.json';
const IMPLICIT_QUADTREE_TILESET_URL = '@loaders.gl/3d-tiles/test/data/BasicExample/tileset.json';

test('Tiles3DLoader#Tileset file', async (t) => {
  const response = await fetchFile(TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  t.ok(tileset);

  t.equals(tileset.type, 'TILES3D');
  t.equals(tileset.lodMetricType, 'geometricError');
  t.equals(tileset.lodMetricValue, 0);
  t.equals(tileset.loader, Tiles3DLoader);

  t.equals(tileset.root.refine, 1);
  t.deepEqual(
    tileset.root.boundingVolume.region,
    [-1.3197004795898053, 0.6988582109, -1.3196595204101946, 0.6988897891, 0, 20]
  );

  t.equals(tileset.root.geometricError, 0);
  t.equals(tileset.root.content.uri, 'batchedColors.b3dm');
  t.equals(tileset.root.lodMetricType, 'geometricError');
  t.equals(tileset.root.lodMetricValue, 0);
  t.equals(tileset.root.type, 'scenegraph');

  t.end();
});

test('Tiles3DLoader#Tile with GLB w/ Draco bufferviews', async (t) => {
  const response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  const tile = await parse(response, [Tiles3DLoader, DracoLoader]);
  t.ok(tile);
  t.ok(tile.gltf);
  t.equals(tile.type, 'b3dm', 'Should parse the correct tiles type.');
  t.end();
});

test('Tiles3DLoader#Tile with actual b3dm file', async (t) => {
  const response = await fetchFile(ACTUAL_B3DM);
  const tile = await parse(response, Tiles3DLoader);
  t.ok(tile);
  t.ok(tile.batchTableJson);
  t.deepEqual(tile.batchTableJson.id, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.ok(tile.gltf);
  t.end();
});

test('Tiles3DLoader#Tile with deprecated 1 b3dm file', async (t) => {
  const response = await fetchFile(DEPRECATED_B3DM_1);
  const tile = await parse(response, Tiles3DLoader);
  t.ok(tile);
  t.ok(tile.batchTableJson);
  t.deepEqual(tile.batchTableJson.id, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.ok(tile.gltf);
  t.end();
});

test('Tiles3DLoader#Tile with deprecated 2 b3dm file', async (t) => {
  const response = await fetchFile(DEPRECATED_B3DM_2);
  const tile = await parse(response, Tiles3DLoader);
  t.ok(tile);
  t.ok(tile.batchTableJson);
  t.deepEqual(tile.batchTableJson.id, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.ok(tile.gltf);
  t.end();
});

test('Tiles3DLoader#loads json from base64 URL', async (t) => {
  // fetching base64 doesn't work in NodeJS
  if (!isBrowser) {
    t.end();
  }
  const tilesetJson = {
    asset: {
      version: 2.0
    }
  };

  const uri = `data:text/plain;base64,${btoa(JSON.stringify(tilesetJson))}`;

  const response = await fetchFile(uri);
  const tilesetHeader = await parse(response, Tiles3DLoader, {'3d-tiles': {isTileset: true}});
  t.ok(tilesetHeader.asset, 'should contain asset');
  t.ok(tilesetHeader.asset.version, 'asset should contain version');
  t.ok(tilesetHeader.loader, 'should contain loader the header loaded with');
  t.equals(tilesetHeader.loader.id, '3d-tiles', 'loaded with supported tiles 3D format loader');
  t.equals(typeof tilesetHeader.url, 'string', 'url should be string');
  t.equals(typeof tilesetHeader.basePath, 'string', 'basePath should be string');
  t.ok('root' in tilesetHeader, 'should contain root tile');
  t.equals(tilesetHeader.type, 'TILES3D');
  t.end();
});

test('Tiles3DLoader#Tile GLTF content extension', async (t) => {
  const tileset = await load(GLTF_CONTENT_TILESET_URL, Tiles3DLoader);
  const glbTileContent = await load(tileset.root.children[0].contentUrl, Tiles3DLoader);
  t.equals(glbTileContent.type, 'glTF');
  t.ok(glbTileContent.gltf);
});

// eslint-disable-next-line max-statements
test('Tiles3DLoader#Implicit Octree Tileset with bitstream availability and subtrees', async (t) => {
  const ROOT_EXTENSION_EXPECTED = {
    '3DTILES_implicit_tiling': {
      subdivisionScheme: 'OCTREE',
      subtreeLevels: 2,
      maximumLevel: 5,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}/{z}.subtree'}
    }
  };

  const response = await fetchFile(IMPLICIT_OCTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);

  // root
  t.ok(tileset);
  t.equal(tileset.extensionsRequired[0], '3DTILES_implicit_tiling');
  t.equal(tileset.extensionsUsed[0], '3DTILES_implicit_tiling');
  t.ok(tileset.root);
  t.equal(tileset.root.content.uri, 'content/0/0/0/0.pnts');
  t.equal(tileset.root.lodMetricValue, 5000);
  t.equal(tileset.root.type, 'pointcloud');
  t.equal(tileset.root.refine, 1);
  t.equal(tileset.root.children.length, 1);
  t.deepEqual(tileset.root.extensions, ROOT_EXTENSION_EXPECTED);

  // children level 1
  t.equal(tileset.root.children[0].content.uri, 'content/1/0/0/0.pnts');
  t.equal(tileset.root.children[0].lodMetricValue, 2500);
  t.equal(tileset.root.children[0].refine, 1);
  t.equal(tileset.root.children[0].type, 'pointcloud');
  t.equal(tileset.root.children[0].children.length, 1);

  // children level 2
  t.equal(tileset.root.children[0].children[0].content.uri, 'content/2/1/0/0.pnts');
  t.equal(tileset.root.children[0].children[0].lodMetricValue, 1250);
  t.equal(tileset.root.children[0].children[0].refine, 1);
  t.equal(tileset.root.children[0].children[0].type, 'pointcloud');
  t.equal(tileset.root.children[0].children[0].children.length, 1);

  // children level 3
  t.equal(tileset.root.children[0].children[0].children[0].content.uri, 'content/3/2/0/1.pnts');
  t.equal(tileset.root.children[0].children[0].children[0].lodMetricValue, 625);
  t.equal(tileset.root.children[0].children[0].children[0].refine, 1);
  t.equal(tileset.root.children[0].children[0].children[0].type, 'pointcloud');
  t.equal(tileset.root.children[0].children[0].children[0].children.length, 0);

  t.end();
});

// eslint-disable-next-line max-statements
test('Tiles3DLoader#Implicit Quadtree Tileset with full content availability', async (t) => {
  const ROOT_EXTENSION_EXPECTED = {
    '3DTILES_implicit_tiling': {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 3,
      maximumLevel: 2,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };

  const response = await fetchFile(IMPLICIT_FULL_AVAILABLE_QUADTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);

  // root
  t.ok(tileset);
  t.equal(tileset.extensionsRequired[0], '3DTILES_implicit_tiling');
  t.equal(tileset.extensionsUsed[0], '3DTILES_implicit_tiling');
  t.ok(tileset.root);
  t.equal(tileset.root.content.uri, 'content/0/0/0.b3dm');
  t.equal(tileset.root.lodMetricValue, 5000);
  t.equal(tileset.root.type, 'scenegraph');
  t.equal(tileset.root.refine, 1);
  t.equal(tileset.root.children.length, 4);
  t.deepEqual(tileset.root.extensions, ROOT_EXTENSION_EXPECTED);

  // first children tree
  t.equal(tileset.root.children[0].content.uri, 'content/1/0/0.b3dm');
  t.equal(tileset.root.children[0].children[0].content.uri, 'content/2/0/0.b3dm');
  t.equal(tileset.root.children[0].children[1].content.uri, 'content/2/1/0.b3dm');
  t.equal(tileset.root.children[0].children[2].content.uri, 'content/2/0/1.b3dm');
  t.equal(tileset.root.children[0].children[3].content.uri, 'content/2/1/1.b3dm');

  // second children tree
  t.equal(tileset.root.children[1].content.uri, 'content/1/1/0.b3dm');
  t.equal(tileset.root.children[1].children[0].content.uri, 'content/2/2/0.b3dm');
  t.equal(tileset.root.children[1].children[1].content.uri, 'content/2/3/0.b3dm');
  t.equal(tileset.root.children[1].children[2].content.uri, 'content/2/2/1.b3dm');
  t.equal(tileset.root.children[1].children[3].content.uri, 'content/2/3/1.b3dm');

  // third children tree
  t.equal(tileset.root.children[2].content.uri, 'content/1/0/1.b3dm');
  t.equal(tileset.root.children[2].children[0].content.uri, 'content/2/0/2.b3dm');
  t.equal(tileset.root.children[2].children[1].content.uri, 'content/2/1/2.b3dm');
  t.equal(tileset.root.children[2].children[2].content.uri, 'content/2/0/3.b3dm');
  t.equal(tileset.root.children[2].children[3].content.uri, 'content/2/1/3.b3dm');

  // fourth children tree
  t.equal(tileset.root.children[3].content.uri, 'content/1/1/1.b3dm');
  t.equal(tileset.root.children[3].children[0].content.uri, 'content/2/2/2.b3dm');
  t.equal(tileset.root.children[3].children[1].content.uri, 'content/2/3/2.b3dm');
  t.equal(tileset.root.children[3].children[2].content.uri, 'content/2/2/3.b3dm');
  t.equal(tileset.root.children[3].children[3].content.uri, 'content/2/3/3.b3dm');

  t.end();
});

test('Tiles3DLoader#Implicit Quadtree Tileset with bitstream availability', async (t) => {
  const response = await fetchFile(IMPLICIT_QUADTREE_TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);

  const ROOT_EXTENSION_EXPECTED = {
    '3DTILES_implicit_tiling': {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 2,
      maximumLevel: 1,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };

  // root
  t.ok(tileset);
  t.equal(tileset.extensionsRequired[0], '3DTILES_implicit_tiling');
  t.equal(tileset.extensionsUsed[0], '3DTILES_implicit_tiling');
  t.ok(tileset.root);
  t.equal(tileset.root.content.uri, 'content/0/0/0.b3dm');
  t.equal(tileset.root.lodMetricValue, 5000);
  t.equal(tileset.root.type, 'scenegraph');
  t.equal(tileset.root.refine, 2);
  t.equal(tileset.root.children.length, 2);
  t.deepEqual(tileset.root.extensions, ROOT_EXTENSION_EXPECTED);

  // children
  t.equal(tileset.root.children[0].content.uri, 'content/1/1/0.b3dm');
  t.equal(tileset.root.children[0].lodMetricValue, 2500);
  t.equal(tileset.root.children[0].children.length, 0);

  t.equal(tileset.root.children[1].content.uri, 'content/1/0/1.b3dm');
  t.equal(tileset.root.children[1].lodMetricValue, 2500);
  t.equal(tileset.root.children[1].children.length, 0);

  t.end();
});
