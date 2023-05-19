// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {WebMercatorViewport} from '@deck.gl/core';
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
// import {loadTileset} from '../utils/load-utils';

// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json';

/*
// Parent tile with no content and four child tiles with content
const TILESET_EMPTY_ROOT_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetEmptyRoot/tileset.json';

// Tileset with 3 levels of uniform subdivision
const TILESET_UNIFORM = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetUniform/tileset.json';

const TILESET_REPLACEMENT_1_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement1/tileset.json';
const TILESET_REPLACEMENT_2_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement2/tileset.json';
const TILESET_REPLACEMENT_3_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacement3/tileset.json';

// 3 level tree with mix of additive and replacement refinement
const TILESET_REFINEMENT_MIX =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetRefinementMix/tileset.json';

// tileset.json : root content points to tiles2.json
// tiles2.json: root with b3dm content, three children with b3dm content, one child points to tiles3.json
// tiles3.json: root with b3dm content
const TILESET_OF_TILESETS_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';

const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithoutBatchTable/tileset.json';
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBatchTable/tileset.json';
const NO_BATCH_IDS_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedNoBatchIds/tileset.json';
*

const TILESET_WITH_BATCH_TABLE_HIERARCHY_URL =
  '@loaders.gl/3d-tiles/test/data/Hierarchy/BatchTableHierarchy/tileset.json';

const WITH_TRANSFORM_BOX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformBox/tileset.json';
const WITH_TRANSFORM_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformSphere/tileset.json';
const WITH_TRANSFORM_REGION_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformRegion/tileset.json';
const WITH_BOUNDING_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBoundingSphere/tileset.json';

const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/Composite/Composite/tileset.json';
const INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithBatchTable/tileset.json';
const INSTANCED_RED_MATERIAL_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedRedMaterial/tileset.json';

// 1 tile where each feature is a different source color
const COLORS_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';

// 1 tile where each feature has a reddish texture
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTextured/tileset.json';

// 1 tile with translucent features
const TRANSLUCENT_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucent/tileset.json';

// 1 tile with opaque and translucent features
const TRANSLUCENT_OPAQUE_MIX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucentOpaqueMix/tileset.json';

// Root tile is transformed from local space to wgs84, child tile is rotated, scaled, and translated locally
const TILESET_WITH_TRANSFORMS_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithTransforms/tileset.json';

// Root tile with 4 b3dm children and 1 pnts child with a viewer request volume
const TILESET_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithViewerRequestVolume/tileset.json';

// Parent tile with content and four child tiles with content with viewer request volume for each child
const TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetReplacementWithViewerRequestVolume/tileset.json';

const TILESET_WITH_EXTERNAL_RESOURCES_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetWithExternalResources/tileset.json';
const TILESET_URL_WITH_CONTENT_URI =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithContentDataUri/tileset.json';

const TILESET_SUBTREE_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetSubtreeExpiration/tileset.json';
const TILESET_SUBTREE_URL =
  '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetSubtreeExpiration/subtree.json';
const BATCHED_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedExpiration/tileset.json';
const BATCHED_COLORS_B3DM_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/batchedColors.b3dm';
const BATCHED_VERTEX_COLORS_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithVertexColors/tileset.json';

const STYLE_URL = '@loaders.gl/3d-tiles/test/data/Style/style.json';

const POINT_CLOUD_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/tileset.json';
const POINT_CLOUD_BATCHED_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudBatched/tileset.json';
*/

const VIEWPORTS = [
  new WebMercatorViewport({
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
  }),
  new WebMercatorViewport({
    altitude: 1.5,
    bearing: 0,
    far: 1000,
    fovy: 50,
    height: 600,
    id: 'view1',
    latitude: 40.04263801150246,
    longitude: -75.61214643071165,
    maxPitch: 85,
    maxZoom: 30,
    minPitch: 0,
    minZoom: 2,
    modelMatrix: null,
    near: 0.1,
    pitch: 45,
    projectionMatrix: null,
    width: 1848,
    zoom: 14.687765254329607
  })
];

test('Tileset3D#one viewport traversal', async (t) => {
  t.plan(1);
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const viewport = VIEWPORTS[0];
  let tileLoadCounter = 0;
  const tileset = new Tileset3D(tilesetJson, {
    onTileLoad: () => {
      tileset.update(viewport);
      tileLoadCounter++;
    }
  });
  tileset.update(viewport);

  t.timeoutAfter(1000);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 0) {
      clearInterval(setIntervalId);
      tileset.update(viewport);
      t.equals(tileset.selectedTiles.length, 1);
    }
  }, 100);
});

test('Tileset3D#onTraversalComplete', async (t) => {
  t.plan(1);
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const viewport = VIEWPORTS[1];
  let tileLoadCounter = 0;
  const tileset = new Tileset3D(tilesetJson, {
    onTileLoad: () => {
      tileset.update(viewport);
      tileLoadCounter++;
    },
    onTraversalComplete: (selectedTiles) => {
      return selectedTiles.filter((tile) => tile.depth === 1);
    }
  });
  tileset.update(viewport);

  t.timeoutAfter(1000);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 0) {
      clearInterval(setIntervalId);
      tileset.update(viewport);
      t.equals(tileset.selectedTiles.length, 4);
    }
  }, 100);
});

test('Tileset3D#two viewports traversal', async (t) => {
  t.plan(3);
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const viewports = VIEWPORTS;
  let tileLoadCounter = 0;
  const tileset = new Tileset3D(tilesetJson, {
    onTileLoad: () => {
      tileset.update(viewports);
      tileLoadCounter++;
    }
  });
  tileset.update(viewports);

  t.timeoutAfter(1000);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 2) {
      clearInterval(setIntervalId);
      tileset.update(viewports);
      t.equals(tileset.selectedTiles.length, 6);
      t.equals(
        tileset.selectedTiles.filter((tile) => tile.viewportIds.includes('view0')).length,
        1
      );
      t.equals(
        tileset.selectedTiles.filter((tile) => tile.viewportIds.includes('view1')).length,
        5
      );
    }
  }, 100);
});

test('Tileset3D#viewportTraversersMap (one viewport shows tiles selected for another viewport)', async (t) => {
  t.plan(3);
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const viewports = VIEWPORTS;
  let tileLoadCounter = 0;
  const tileset = new Tileset3D(tilesetJson, {
    onTileLoad: () => {
      tileset.update(viewports);
      tileLoadCounter++;
    },
    viewportTraversersMap: {
      view0: 'view1',
      view1: 'view1'
    }
  });
  tileset.update(viewports);

  // TODO/ActionEngine - wait for onTraversalComplete or onTilesetLoad or similar
  t.timeoutAfter(1500);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 1) {
      clearInterval(setIntervalId);
      tileset.update(viewports);
      t.equals(tileset.selectedTiles.length, 5);
      t.equals(
        tileset.selectedTiles.filter((tile) => tile.viewportIds.includes('view0')).length,
        5
      );
      t.equals(
        tileset.selectedTiles.filter((tile) => tile.viewportIds.includes('view1')).length,
        5
      );
    }
  }, 100);
});

test('Tileset3D#loadTiles option', async (t) => {
  t.plan(2);
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  let viewport = VIEWPORTS[0];
  let tileLoadCounter = 0;
  const tileset = new Tileset3D(tilesetJson, {
    onTileLoad: () => {
      tileset.update(viewport);
      tileLoadCounter++;
    },
    loadTiles: true
  });
  tileset.update(viewport);

  t.timeoutAfter(1000);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 0) {
      clearInterval(setIntervalId);
      tileset.update(viewport);
      t.equals(tileset.selectedTiles.length, 1);
      tileLoadCounter = 0;

      viewport = VIEWPORTS[1];
      tileset.setProps({loadTiles: false});
      tileset.update(viewport);
      setTimeout(() => {
        t.equals(tileLoadCounter, 0);
      }, 300);
    }
  }, 100);
});
