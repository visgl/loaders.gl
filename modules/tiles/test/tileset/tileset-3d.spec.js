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
*/

const TILESET_WITH_BATCH_TABLE_HIERARCHY_URL =
  '@loaders.gl/3d-tiles/test/data/Hierarchy/BatchTableHierarchy/tileset.json';

/*
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

test('Tileset3D#throws with undefined url', t => {
  t.throws(() => new Tileset3D());
  t.end();
});

test.skip('Tileset3D#loads json from base64 URL', async t => {
  const tilesetJson = {
    asset: {
      version: 2.0
    }
  };

  const uri = `data:text/plain;base64,${btoa(JSON.stringify(tilesetJson))}`;

  const result = await load(uri, Tiles3DLoader);
  t.deepEquals(result, tilesetJson);
  t.end();
});

test.skip('Tileset3D#rejects invalid tileset version', async t => {
  const tilesetJson = {
    asset: {
      version: 2.0
    }
  };
  const uri = `data:text/plain;base64,${btoa(JSON.stringify(tilesetJson))}`;
  const tileset = await load(uri, Tiles3DLoader, {tileset: true});
  t.throws(() => new Tileset3D(tileset));
  t.end();
});

test('Tileset3D#url set up correctly given tileset JSON filepath', async t => {
  const path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';

  const tilesetJson = await load(path, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  t.equals(tileset.url.slice(-30), path.slice(-30));
  t.end();
});

// TODO
test.skip('Tileset3D#url set up correctly given path with query string', async t => {
  const path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';
  const param = '?param1=1&param2=2';
  // TODO - params do not work with fetchFile...
  const tilesetJson = await load(path, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  t.equals(tileset.url, path + param);
  t.end();
});

test('Tileset3D#loads and initializes with tileset JSON file', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.ok('asset' in tileset);
  t.equals(tileset.asset.version, '1.0');
  t.equals(tileset.asset.tilesetVersion, '1.2.3');

  t.ok('properties' in tileset);
  t.ok('id' in tileset.properties);
  t.equals(tileset.properties.id.minimum, 0);
  t.equals(tileset.properties.id.maximum, 9);

  t.equals(tileset.geometricError, 240.0);
  t.ok(tileset.root);
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  t.equals(tileset.url.slice(-30), TILESET_URL.slice(-30));

  t.end();
});

test('Tileset3D#loads tileset with extras', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.deepEquals(tileset.extras, {name: 'Sample Tileset'});
  t.equals(tileset.root.extras, undefined);

  let taggedChildren = 0;
  for (const child of tileset.root.children) {
    if (child.extras) {
      t.deepEquals(child.extras, {id: 'Special Tile'});
      ++taggedChildren;
    }
  }

  t.equals(taggedChildren, 1);
  t.end();
});

test('Tileset3D#gets root tile', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.ok(tileset.root);
  t.end();
});

test('Tileset3D#hasExtension returns true if the tileset JSON file uses the specified extension', async t => {
  const tilesetJson = await load(TILESET_WITH_BATCH_TABLE_HIERARCHY_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);

  t.equals(tileset.hasExtension('3DTILES_batch_table_hierarchy'), true);
  t.equals(tileset.hasExtension('3DTILES_nonexistant_extension'), false);
  t.end();
});

test.skip('Tileset3D#one viewport traversal', async t => {
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
      t.end();
    }
  }, 100);
});

test.skip('Tileset3D#two viewports traversal', async t => {
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
      t.equals(tileset.selectedTiles.filter(tile => tile.viewportIds.includes('view0')).length, 1);
      t.equals(tileset.selectedTiles.filter(tile => tile.viewportIds.includes('view1')).length, 5);
      t.end();
    }
  }, 100);
});

test.skip('Tileset3D#viewportTraversersMap (one viewport shows tiles selected for another viewport)', async t => {
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

  t.timeoutAfter(1000);
  const setIntervalId = setInterval(() => {
    if (tileLoadCounter > 1) {
      clearInterval(setIntervalId);
      tileset.update(viewports);
      t.equals(tileset.selectedTiles.length, 5);
      t.equals(tileset.selectedTiles.filter(tile => tile.viewportIds.includes('view0')).length, 5);
      t.equals(tileset.selectedTiles.filter(tile => tile.viewportIds.includes('view1')).length, 5);
      t.end();
    }
  }, 100);
});

test.skip('Tileset3D#loadTiles option', async t => {
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
      tileset.setOptions({loadTiles: false});
      tileset.update(viewport);
      setTimeout(() => {
        t.equals(tileLoadCounter, 0);
        t.end();
      }, 300);
    }
  }, 100);
});

/*
test('Tileset3D#passes version in query string to tiles', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson, TILESET_URL);

  t.equals(
    tileset.root.content._resource.url,
    getAbsoluteUri(TILESET_URL.replace('tileset.json', 'parent.b3dm?v=1.2.3'))
  );
  t.end();
});

test('Tileset3D#passes version in query string to all external resources', async t => {
  // Spy on loadWithXhr so we can verify requested urls
  spyOn(Resource._Implementations, 'loadWithXhr').and.callThrough();

  const queryParams = '?a=1&b=boy';
  const queryParamsWithVersion = '?a=1&b=boy&v=1.2.3';

  const loadTile= await scene,
    TILESET_WITH_EXTERNAL_RESOURCES_URL + queryParams
  ).then(tileset => {
    const calls = Resource._Implementations.loadWithXhr.calls.all();
    const callsLength = calls.length;
    for (const i = 0; i < callsLength; ++i) {
      const url = calls[0].args[0];
      if (url.indexOf(TILESET_WITH_EXTERNAL_RESOURCES_URL) >= 0) {
        const query = url.slice(url.indexOf('?'));
        if (url.indexOf('tileset.json') >= 0) {
          // The initial tileset.json does not have a tileset version parameter
          expect(query).toBe(queryParams);
        } else {
          expect(query).toBe(queryParamsWithVersion);
        }
      }
    }
  });
  t.end();
});

test('Tileset3D#requests tile with invalid magic', t => {
  const invalidMagicBuffer = Cesium3DTilesTester.generateBatchedTileBuffer({
    magic: [120, 120, 120, 120]
  });
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  return tileset.readyPromise.then(tileset => {
    // Start spying after the tileset json has been loaded
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      deferred.resolve(invalidMagicBuffer);
    });
    scene.renderForSpecs(); // Request root
    const root = tileset.root;
    return root.contentReadyPromise
      .then(function() {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        expect(error.message).toBe('Invalid tile content.');
        t.equals(root._contentState, Cesium3DTileContentState.FAILED);
      });
  });
  t.end();
});

test('Tileset3D#handles failed tile requests', t => {
  viewRootOnly();
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  return tileset.readyPromise.then(tileset => {
    // Start spying after the tileset json has been loaded
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      deferred.reject();
    });
    scene.renderForSpecs(); // Request root
    const root = tileset.root;
    return root.contentReadyPromise
      .then(function() {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        t.equals(root._contentState, Cesium3DTileContentState.FAILED);
        const statistics = tileset.statistics;
        expect(statistics.numberOfAttemptedRequests).toBe(0);
        expect(statistics.numberOfPendingRequests).toBe(0);
        expect(statistics.numberOfTilesProcessing).toBe(0);
        expect(statistics.numberOfTilesWithContentReady).toBe(0);
      });
  });
  t.end();
});

test('Tileset3D#handles failed tile processing', t => {
  viewRootOnly();
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  return tileset.readyPromise.then(tileset => {
    // Start spying after the tileset json has been loaded
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      deferred.resolve(
        Cesium3DTilesTester.generateBatchedTileBuffer({
          version: 0 // Invalid version
        })
      );
    });
    scene.renderForSpecs(); // Request root
    const root = tileset.root;
    return root.contentReadyPromise
      .then(function() {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        t.equals(root._contentState, Cesium3DTileContentState.FAILED);
        const statistics = tileset.statistics;
        expect(statistics.numberOfAttemptedRequests).toBe(0);
        expect(statistics.numberOfPendingRequests).toBe(0);
        expect(statistics.numberOfTilesProcessing).toBe(0);
        expect(statistics.numberOfTilesWithContentReady).toBe(0);
      });
  });
  t.end();
});
*/

test('Tileset3D#loads tiles in tileset', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  tileset.root._visible = true;
  await tileset.root.loadContent();
  t.ok(tileset.root.content);
  t.end();
});

/*
test('Tileset3D#does not render during morph', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const commandList = scene.frameState.commandList;
    scene.renderForSpecs();
    expect(commandList.length).toBeGreaterThan(0);
    scene.morphToColumbusView(1.0);
    scene.renderForSpecs();
    expect(commandList.length).toBe(0);
  });
  t.end();
});

test('Tileset3D#renders tileset with empty root tile', t => {
  const tileset = await loadTileset(scene, TILESET_EMPTY_ROOT_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 4); // Empty tile doesn't issue a command
  });
  t.end();
});

test('Tileset3D#verify statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );

  // Verify initial values
  const statistics = tileset._statistics;
  t.equals(statistics.visited, 0);
  t.equals(statistics.numberOfCommands, 0);
  t.equals(statistics.numberOfPendingRequests, 0);
  t.equals(statistics.numberOfTilesProcessing, 0);

  return Cesium3DTilesTester.waitForReady(scene, tileset).then(function() {
    // Check that root and children are requested
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 0);
    t.equals(statistics.numberOfPendingRequests, 5);
    t.equals(statistics.numberOfTilesProcessing, 0);

    // Wait for all tiles to load and check that they are all visited and rendered
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.visited, 5);
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfPendingRequests, 0);
      t.equals(statistics.numberOfTilesProcessing, 0);
    });
  });
});

function checkPointAndFeatureCounts(tileset, features, points, triangles) {
  const statistics = tileset._statistics;

  t.equals(statistics.numberOfFeaturesSelected, 0);
  t.equals(statistics.numberOfFeaturesLoaded, 0);
  t.equals(statistics.numberOfPointsSelected, 0);
  t.equals(statistics.numberOfPointsLoaded, 0);
  t.equals(statistics.numberOfTrianglesSelected, 0);

  return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
    t.equals(statistics.numberOfFeaturesSelected, features);
    t.equals(statistics.numberOfFeaturesLoaded, features);
    t.equals(statistics.numberOfPointsSelected, points);
    t.equals(statistics.numberOfPointsLoaded, points);
    t.equals(statistics.numberOfTrianglesSelected, triangles);

    viewNothing();
    scene.renderForSpecs();

    t.equals(statistics.numberOfFeaturesSelected, 0);
    t.equals(statistics.numberOfFeaturesLoaded, features);
    t.equals(statistics.numberOfPointsSelected, 0);
    t.equals(statistics.numberOfPointsLoaded, points);
    t.equals(statistics.numberOfTrianglesSelected, 0);

    tileset.trimLoadedTiles();
    scene.renderForSpecs();

    t.equals(statistics.numberOfFeaturesSelected, 0);
    t.equals(statistics.numberOfFeaturesLoaded, 0);
    t.equals(statistics.numberOfPointsSelected, 0);
    t.equals(statistics.numberOfPointsLoaded, 0);
    t.equals(statistics.numberOfTrianglesSelected, 0);
  });
  t.end();
}

test('Tileset3D#verify batched features statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: WITH_BATCH_TABLE_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 10, 0, 120);
  t.end();
});

test('Tileset3D#verify no batch table features statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: NO_BATCH_IDS_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 0, 0, 120);
  t.end();
});

test('Tileset3D#verify instanced features statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: INSTANCED_RED_MATERIAL_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 25, 0, 12);
  t.end();
});

test('Tileset3D#verify composite features statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: COMPOSITE_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 35, 0, 132);
  t.end();
});

test('Tileset3D#verify tileset of tilesets features statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_OF_TILESETS_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 50, 0, 600);
  t.end();
});

test('Tileset3D#verify points statistics', t => {
  viewPointCloud();

  const tileset = scene.primitives.add(
    new Tileset3D({
      url: POINT_CLOUD_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 0, 1000, 0);
  t.end();
});

test('Tileset3D#verify triangle statistics', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_EMPTY_ROOT_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 40, 0, 480);
  t.end();
});

test('Tileset3D#verify batched points statistics', t => {
  viewPointCloud();

  const tileset = scene.primitives.add(
    new Tileset3D({
      url: POINT_CLOUD_BATCHED_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 8, 1000, 0);
  t.end();
});

test('Tileset3D#verify memory usage statistics', t => {
  // Calculations in Batched3DModel3DTileContentSpec, minus uvs
  const singleTileGeometryMemory = 7440;
  const singleTileTextureMemory = 0;
  const singleTileBatchTextureMemory = 40;
  const singleTilePickTextureMemory = 40;
  const tilesLength = 5;

  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;

    // No tiles loaded
    t.equals(statistics.geometryByteLength, 0);
    t.equals(statistics.texturesByteLength, 0);
    t.equals(statistics.batchTableByteLength, 0);

    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      // Root tile loaded
      t.equals(statistics.geometryByteLength, singleTileGeometryMemory);
      t.equals(statistics.texturesByteLength, singleTileTextureMemory);
      t.equals(statistics.batchTableByteLength, 0);

      viewAllTiles();
      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
        // All tiles loaded
        t.equals(statistics.geometryByteLength, singleTileGeometryMemory * tilesLength);
        t.equals(statistics.texturesByteLength, singleTileTextureMemory * tilesLength);
        t.equals(statistics.batchTableByteLength, 0);

        // One feature colored, the batch table memory is now higher
        tileset.root.content.getFeature(0).color = Color.RED;
        scene.renderForSpecs();
        t.equals(statistics.geometryByteLength, singleTileGeometryMemory * tilesLength);
        t.equals(statistics.texturesByteLength, singleTileTextureMemory * tilesLength);
        t.equals(statistics.batchTableByteLength, singleTileBatchTextureMemory);

        // All tiles picked, the texture memory is now higher
        scene.pickForSpecs();
        t.equals(statistics.geometryByteLength, singleTileGeometryMemory * tilesLength);
        t.equals(statistics.texturesByteLength, singleTileTextureMemory * tilesLength);
        t.equals(
          statistics.batchTableByteLength,
          singleTileBatchTextureMemory + singleTilePickTextureMemory * tilesLength
        );

        // Tiles are still in memory when zoomed out
        viewNothing();
        scene.renderForSpecs();
        t.equals(statistics.geometryByteLength, singleTileGeometryMemory * tilesLength);
        t.equals(statistics.texturesByteLength, singleTileTextureMemory * tilesLength);
        t.equals(
          statistics.batchTableByteLength,
          singleTileBatchTextureMemory + singleTilePickTextureMemory * tilesLength
        );

        // Trim loaded tiles, expect the memory statistics to be 0
        tileset.trimLoadedTiles();
        scene.renderForSpecs();
        t.equals(statistics.geometryByteLength, 0);
        t.equals(statistics.texturesByteLength, 0);
        t.equals(statistics.batchTableByteLength, 0);
      });
    });
  });
  t.end();
});

test('Tileset3D#verify memory usage statistics for shared resources', t => {
  // Six tiles total:
  // * Two b3dm tiles - no shared resources
  // * Two i3dm tiles with embedded glTF - no shared resources
  // * Two i3dm tiles with external glTF - shared resources
  // Expect to see some saving with memory usage since two of the tiles share resources
  // All tiles reference the same external texture but texture caching is not supported yet
  // TODO : tweak test when #5051 is in

  const b3dmGeometryMemory = 840; // Only one box in the tile, unlike most other test tiles
  const i3dmGeometryMemory = 840;

  // Texture is 128x128 RGBA bytes, not mipmapped
  const texturesByteLength = 65536;

  const expectedGeometryMemory = b3dmGeometryMemory * 2 + i3dmGeometryMemory * 3;
  const expectedTextureMemory = texturesByteLength * 5;

  const S_URL).t= await loadTileset(scene, TILESET_WITH_EXTERNAL_RE;
    tileset => {
      const statistics = tileset._statistics;
      expect(statistics.geometryByteLength).toBe(expectedGeometryMemory);
      expect(statistics.texturesByteLength).toBe(expectedTextureMemory);
    }
  );
  t.end();
});

test('Tileset3D#does not process tileset when screen space error is not met', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);

    // Set zoom far enough away to not meet sse
    viewNothing();
    scene.renderForSpecs();
    t.equals(statistics.visited, 0);
    t.equals(statistics.numberOfCommands, 0);
  });
  t.end();
});

test('Tileset3D#does not select tiles when outside of view frustum', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);

    viewSky();

    scene.renderForSpecs();
    t.equals(statistics.visited, 0);
    t.equals(statistics.numberOfCommands, 0);
    t.equals(
      tileset.root.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE),
      CullingVolume.MASK_OUTSIDE
    );
  });
  t.end();
});

test('Tileset3D#does not load additive tiles that are out of view', t => {
  viewBottomLeft();
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.numberOfTilesWithContentReady, 2);
  });
  t.end();
});

test('Tileset3D#culls with content box', t => {
  // Root tile has a content box that is half the extents of its box
  // Expect to cull root tile and three child tiles
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);

    viewBottomLeft();
    scene.renderForSpecs();
    t.equals(statistics.visited, 2); // Visits root, but does not render it
    t.equals(statistics.numberOfCommands, 1);
    expect(tileset._selectedTiles[0]).not.toBe(tileset.root);

    // Set contents box to undefined, and now root won't be culled
    tileset.root._contentBoundingVolume = undefined;
    scene.renderForSpecs();
    t.equals(statistics.visited, 2);
    t.equals(statistics.numberOfCommands, 2);
  });
});

function findTileByUri(tiles, uri) {
  const length = tiles.length;
  for (const i = 0; i < length; ++i) {
    const tile = tiles[i];
    const contentHeader = tile._header.content;
    if (defined(contentHeader)) {
      if (contentHeader.uri.indexOf(uri) >= 0) {
        return tile;
      }
    }
  }
  return undefined;
  t.end();
}

test('Tileset3D#selects children in front to back order', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    // After moving the camera left by 1.0 and down by 0.5, the distance from the camera should be in the order:
    // 1. lower left
    // 2. upper left
    // 3. lower right
    // 4. upper right

    scene.camera.moveLeft(1.0);
    scene.camera.moveDown(0.5);
    scene.renderForSpecs();

    const root = tileset.root;
    const llTile = findTileByUri(root.children, 'll.b3dm');
    const lrTile = findTileByUri(root.children, 'lr.b3dm');
    const urTile = findTileByUri(root.children, 'ur.b3dm');
    const ulTile = findTileByUri(root.children, 'ul.b3dm');

    const selectedTiles = tileset._selectedTiles;
    expect(selectedTiles[0]).toBe(root);
    expect(selectedTiles[1]).toBe(llTile);
    expect(selectedTiles[2]).toBe(ulTile);
    expect(selectedTiles[3]).toBe(lrTile);
    expect(selectedTiles[4]).toBe(urTile);
  });
});

function testDynamicScreenSpaceError(t, url, distance) {
  const tileset = await loadTileset(scene, url);
    const statistics = tileset._statistics;

    // Horizon view, only root is visible
    const center = Cartesian3.fromRadians(centerLongitude, centerLatitude);
    scene.camera.lookAt(center, new HeadingPitchRange(0.0, 0.0, distance));

    // Set dynamic SSE to false (default)
    tileset.dynamicScreenSpaceError = false;
    scene.renderForSpecs();
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);

    // Set dynamic SSE to true, now the root is not rendered
    tileset.dynamicScreenSpaceError = true;
    tileset.dynamicScreenSpaceErrorDensity = 1.0;
    tileset.dynamicScreenSpaceErrorFactor = 10.0;
    scene.renderForSpecs();
    t.equals(statistics.visited, 0);
    t.equals(statistics.numberOfCommands, 0);
  });
}

function numberOfChildrenWithoutContent(tile) {
  const children = tile.children;
  const length = children.length;
  const count = 0;
  for (const i = 0; i < length; ++i) {
    const child = children[i];
    if (!child.contentReady) {
      ++count;
    }
  }
  return count;
}

t.end();
// Adjust distances for each test because the dynamic SSE takes the
// bounding volume height into account, which differs for each bounding volume.
test('Tileset3D#uses dynamic screen space error for tileset with region', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_REGION_URL, 103.0);
  t.end();
});

test('Tileset3D#uses dynamic screen space error for tileset with bounding sphere', t => {
  testDynamicScreenSpaceError(t, WITH_BOUNDING_SPHERE_URL, 137.0);
  t.end();
});

test('Tileset3D#uses dynamic screen space error for local tileset with box', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_BOX_URL, 103.0);
  t.end();
});

test('Tileset3D#uses dynamic screen space error for local tileset with sphere', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_SPHERE_URL, 144.0);
  t.end();
});

test('Tileset3D#additive refinement - selects root when sse is met', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_URL);
    // Meets screen space error, only root tile is rendered
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('Tileset3D#additive refinement - selects all tiles when sse is not met', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    // Does not meet screen space error, all tiles are visible
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);
  });
  t.end();
});

test("additive refinement - use parent's geometric error on child's box for early refinement", t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);

    // Both right tiles don't meet the SSE anymore
    scene.camera.moveLeft(50.0);
    scene.renderForSpecs();
    t.equals(statistics.visited, 3);
    t.equals(statistics.numberOfCommands, 3);
  });
  t.end();
});

test('Tileset3D#additive refinement - selects tile when inside viewer request volume', t => {
  const E_URL).t= await loadTileset(scene, TILESET_WITH_VIEWER_REQUEST;
    tileset => {
      const statistics = tileset._statistics;
      // Force root tile to always not meet SSE since this is just checking the request volume
      tileset.maximumScreenSpaceError = 0.0;

      // Renders all 5 tiles
      setZoom(20.0);
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 5);

      // No longer renders the tile with a request volume
      setZoom(1500.0);
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 4);
    }
  );
  t.end();
});

test('Tileset3D#replacement refinement - selects root when sse is met', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.root.refine = Cesium3DTileRefine.REPLACE;

    // Meets screen space error, only root tile is rendered
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects children when sse is not met', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.root.refine = Cesium3DTileRefine.REPLACE;

    // Does not meet screen space error, child tiles replace root tile
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.visited, 5); // Visits root, but does not render it
    t.equals(statistics.numberOfCommands, 4);
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects root when sse is not met and children are not ready', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_URL);
    const root = tileset.root;
    root.refine = Cesium3DTileRefine.REPLACE;

    // Set zoom to start loading child tiles
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    // LOD skipping visits all visible
    t.equals(statistics.visited, 5);
    // no stencil clear command because only the root tile
    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfPendingRequests, 4);
    t.equals(numberOfChildrenWithoutContent(root), 4);
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects tile when inside viewer request volume', t => {
  const options = {
    skipLevelOfDetail: false
  };
  const loadTile= await scene,
    TILESET_WITH_VIEWER_REQUEST_VOLUME_URL,
    options
  ).then(tileset => {
    const statistics = tileset._statistics;

    const root = tileset.root;
    root.refine = Cesium3DTileRefine.REPLACE;
    root.hasEmptyContent = false; // mock content
    tileset.maximumScreenSpaceError = 0.0; // Force root tile to always not meet SSE since this is just checking the request volume

    // Renders all 5 tiles
    setZoom(20.0);
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 5);
    expect(isSelected(tileset, root)).toBe(false);

    // No longer renders the tile with a request volume
    setZoom(1500.0);
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 4);
    expect(isSelected(tileset, root)).toBe(true); // one child is no longer selected. root is chosen instead
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects upwards when traversal stops at empty tile', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_1_URL);
    tileset.root.geometricError = 90;
    setZoom(80);
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.selected, 1);
    t.equals(statistics.visited, 3);
    expect(isSelected(tileset, tileset.root)).toBe(true);
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects root when sse is not met and subtree is not refinable (1)', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_1_URL);
    tileset.skipLevelOfDetail = false;
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    const root = tileset.root;

    // Even though root's children are loaded, the grandchildren need to be loaded before it becomes refinable
    t.equals(numberOfChildrenWithoutContent(root), 0); // Children are loaded
    t.equals(statistics.numberOfCommands, 1); // No stencil or backface commands; no mixed content
    t.equals(statistics.numberOfPendingRequests, 4); // Loading grandchildren

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 4); // Render children
    });
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects root when sse is not met and subtree is not refinable (2)', t => {
  // Check that the root is refinable once its child is loaded
  //
  //          C
  //          E
  //        C   E
  //            C (smaller geometric error)
  //

  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_2_URL);
    tileset.skipLevelOfDetail = false;
    const statistics = tileset._statistics;
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 1);

      setZoom(5.0); // Zoom into the last tile, when it is ready the root is refinable
      scene.renderForSpecs();

      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
        t.equals(statistics.numberOfCommands, 2); // Renders two content tiles
      });
    });
  });
  t.end();
});

test('Tileset3D#replacement refinement - selects root when sse is not met and subtree is not refinable (3)', t => {
  // Check that the root is refinable once its child is loaded
  //
  //          C
  //          T (external tileset ref)
  //          E (root of external tileset)
  //     C  C  C  C
  //

  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    tileset.skipLevelOfDetail = false;
    const statistics = tileset._statistics;
    const root = tileset.root;
    t.equals(statistics.numberOfCommands, 1);

    viewAllTiles();
    scene.renderForSpecs();
    return root.children[0].contentReadyPromise.then(function() {
      // The external tileset json is loaded, but the external tileset isn't.
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 1); // root
      t.equals(statistics.numberOfPendingRequests, 4); // Loading child content tiles

      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
        t.equals(isSelected(tileset, root), false);
        t.equals(statistics.numberOfCommands, 4); // Render child content tiles
      });
    });
  });
  t.end();
});

test('Tileset3D#replacement and additive refinement', t => {
  //          A
  //      A       R (not rendered)
  //    R   A   R   A
  //
  const tileset = await loadTileset(scene, TILESET_REFINEMENT_MIX);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 7);
    t.equals(statistics.numberOfCommands, 6);
  });
  t.end();
});

test('Tileset3D#children bound union optimization', tt => {
  test('Tileset3D#does not select visible tiles with invisible children', t => {
    const loadTile= await   scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      const center = Cartesian3.fromRadians(centerLongitude, centerLatitude, 22.0);
      scene.camera.lookAt(center, new HeadingPitchRange(0.0, 1.57, 1.0));

      const root = tileset.root;
      const childRoot = root.children[0];

      scene.renderForSpecs();

      expect(childRoot.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)).not.toEqual(
        CullingVolume.MASK_OUTSIDE
      );

      t.equals(
        childRoot.children[0].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE),
        CullingVolume.MASK_OUTSIDE
      );
      t.equals(
        childRoot.children[1].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE),
        CullingVolume.MASK_OUTSIDE
      );
      t.equals(
        childRoot.children[2].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE),
        CullingVolume.MASK_OUTSIDE
      );
      t.equals(
        childRoot.children[3].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE),
        CullingVolume.MASK_OUTSIDE
      );

      t.equals(tileset._selectedTiles.length, 0);
      expect(isSelected(tileset, childRoot)).toBe(false);
    });
    t.end();
  });

  test('Tileset3D#does not select external tileset whose root has invisible children', t => {
    const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
      const center = Cartesian3.fromRadians(centerLongitude, centerLatitude, 50.0);
      scene.camera.lookAt(center, new HeadingPitchRange(0.0, 1.57, 1.0));
      const root = tileset.root;
      const externalRoot = root.children[0];
      externalRoot.refine = Cesium3DTileRefine.REPLACE;
      scene.renderForSpecs();

      expect(isSelected(tileset, root)).toBe(false);
      expect(isSelected(tileset, externalRoot)).toBe(false);
      expect(root._visible).toBe(false);
      expect(externalRoot._visible).toBe(false);
      expect(tileset.statistics.numberOfTilesCulledWithChildrenUnion).toBe(1);
    });
    t.end();
  });

  test('Tileset3D#does not select visible tiles not meeting SSE with visible children', t => {
    const loadTile= await   scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      const root = tileset.root;
      const childRoot = root.children[0];
      childRoot.geometricError = 240;

      scene.renderForSpecs();

      expect(childRoot.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)).not.toEqual(
        CullingVolume.MASK_OUTSIDE
      );

      expect(
        childRoot.children[0].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[1].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[2].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[3].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);

      expect(isSelected(tileset, childRoot)).toBe(false);
    });
    t.end();
  });

  test('Tileset3D#does select visible tiles meeting SSE with visible children', t => {
    const loadTile= await   scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      const root = tileset.root;
      const childRoot = root.children[0];

      childRoot.geometricError = 0; // child root should meet SSE and children should not be drawn
      scene.renderForSpecs();
      // wait for load because geometric error has changed
      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
        expect(
          childRoot.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);

        expect(
          childRoot.children[0].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[1].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[2].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[3].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);

        expect(isSelected(tileset, childRoot)).toBe(true);
      });
    });
    t.end();
  });

  test('Tileset3D#does select visible tiles with visible children failing request volumes', t => {
    const options = {
      cullWithChildrenBounds: false
    };
    viewRootOnly();
    const loadTile= await   scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL,
      options
    ).then(tileset => {
      const root = tileset.root;
      const childRoot = root.children[0];

      expect(childRoot.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)).not.toEqual(
        CullingVolume.MASK_OUTSIDE
      );

      expect(
        childRoot.children[0].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[1].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[2].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);
      expect(
        childRoot.children[3].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
      ).not.toEqual(CullingVolume.MASK_OUTSIDE);

      t.equals(tileset._selectedTiles.length, 1);
      expect(isSelected(tileset, childRoot)).toBe(true);
    });
    t.end();
  });

  test('Tileset3D#does select visible tiles with visible children passing request volumes', t => {
    const loadTile= await   scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      const root = tileset.root;
      const childRoot = root.children[0];
      childRoot.geometricError = 0;

      // wait for load because geometric error has changed
      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
        expect(
          childRoot.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);

        expect(
          childRoot.children[0].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[1].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[2].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);
        expect(
          childRoot.children[3].visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)
        ).not.toEqual(CullingVolume.MASK_OUTSIDE);

        t.equals(tileset._selectedTiles.length, 1);
        expect(isSelected(tileset, childRoot)).toBe(true);

        childRoot.geometricError = 200;
        scene.renderForSpecs();
        t.equals(tileset._selectedTiles.length, 4);
        expect(isSelected(tileset, childRoot)).toBe(false);
      });
    });
  });
  t.end();
});

test('Tileset3D#loads tileset with external tileset JSON file', t => {
  // Set view so that no tiles are loaded initially
  viewNothing();

  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    // Root points to an external tileset JSON file and has no children until it is requested
    const root = tileset.root;
    t.equals(root.children.length, 0);

    // Set view so that root's content is requested
    viewRootOnly();
    scene.renderForSpecs();
    return root.contentReadyPromise.then(function() {
      t.equals(root.hasTilesetContent, true);

      // Root has one child now, the root of the external tileset
      t.equals(root.children.length, 1);

      // Check that headers are equal
      const subtreeRoot = root.children[0];
      t.equals(root.refine, subtreeRoot.refine);
      t.equals(
        root.contentBoundingVolume.boundingVolume,
        subtreeRoot.contentBoundingVolume.boundingVolume
      );

      // Check that subtree root has 4 children
      t.equals(subtreeRoot.hasTilesetContent, false);
      t.equals(subtreeRoot.children.length, 4);
    });
  });
  t.end();
});

test('Tileset3D#preserves query string with external tileset JSON file', t => {
  // Set view so that no tiles are loaded initially
  viewNothing();

  //Spy on loadWithXhr so we can verify requested urls
  spyOn(Resource._Implementations, 'loadWithXhr').and.callThrough();

  const queryParams = 'a=1&b=boy';
  const expectedUrl =
    '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json?' + queryParams;
  const queryPar= await loadTileset(scene, TILESET_OF_TILESETS_URL + ;
    .then(tileset => {
      //Make sure tileset JSON file was requested with query parameters
      t.equals(Resource._Implementations.loadWithXhr.calls.argsFor(0)[0], expectedUrl);

      Resource._Implementations.loadWithXhr.calls.reset();

      // Set view so that root's content is requested
      viewRootOnly();
      scene.renderForSpecs();

      return tileset.root.contentReadyPromise;
    })
    .then(function() {
      //Make sure tileset2.json was requested with query parameters and does not use parent tilesetVersion
      expectedUrl = getAbsoluteUri(
        '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset2.json?v=1.2.3&' +
          queryParams
      );
      t.equals(Resource._Implementations.loadWithXhr.calls.argsFor(0)[0], expectedUrl);
    });
  t.end();
});

test('Tileset3D#renders tileset with external tileset JSON file', t => {
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 7); // Visits two tiles with tileset content, five tiles with b3dm content
    t.equals(statistics.numberOfCommands, 5); // Render the five tiles with b3dm content
  });
  t.end();
});

test('Tileset3D#always visits external tileset root', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 2); // Visits external tileset tile, and external tileset root
    t.equals(statistics.numberOfCommands, 1); // Renders external tileset root
  });
  t.end();
});

test('Tileset3D#set tile color', t => {
  const tileset = await loadTileset(scene, NO_BATCH_IDS_URL);
    // Get initial color
    const color;
    Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
      color = rgba;
    });

    // Check for color
    tileset.root.color = Color.RED;
    Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
      expect(rgba).not.toEqual(color);
    });
  });
  t.end();
});

test('Tileset3D#debugFreezeFrame', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    scene.renderForSpecs();
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);

    tileset.debugFreezeFrame = true;
    viewAllTiles();
    scene.renderForSpecs();
    t.equals(statistics.visited, 0); // selectTiles returns early, so no tiles are visited
    t.equals(statistics.numberOfCommands, 1); // root tile is still in selectedTiles list
  });
});

function checkDebugColorizeTiles(url) {
  CesiumMath.setRandomNumberSeed(0);
  const tileset = await loadTileset(scene, url);
    // Get initial color
    const color;
    Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
      color = rgba;
    });

    // Check for debug color
    tileset.debugColorizeTiles = true;
    Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
      expect(rgba).not.toEqual(color);
    });

    // Check for original color
    tileset.debugColorizeTiles = false;
    Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
      t.equals(rgba, color);
    });
  });
  t.end();
}

test('Tileset3D#debugColorizeTiles for b3dm with batch table', t => {
  checkDebugColorizeTiles(WITH_BATCH_TABLE_URL);
  t.end();
});

test('Tileset3D#debugColorizeTiles for b3dm without batch table', t => {
  checkDebugColorizeTiles(NO_BATCH_IDS_URL);
  t.end();
});

test('Tileset3D#debugColorizeTiles for i3dm', t => {
  viewInstances();
  checkDebugColorizeTiles(INSTANCED_URL);
  t.end();
});

test('Tileset3D#debugColorizeTiles for cmpt', t => {
  return checkDebugColorizeTiles(COMPOSITE_URL);
  t.end();
});

test('Tileset3D#debugColorizeTiles for pnts with batch table', t => {
  viewPointCloud();
  return checkDebugColorizeTiles(POINT_CLOUD_BATCHED_URL);
  t.end();
});

test('Tileset3D#debugColorizeTiles for pnts without batch table', t => {
  viewPointCloud();
  return checkDebugColorize;
  t.end();
  Tiles(POINT_CLOUD_URL);
});

test('Tileset3D#debugWireframe', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    tileset.debugWireframe = true;
    scene.renderForSpecs();
    const commands = scene.frameState.commandList;
    const length = commands.length;
    const i;
    for (i = 0; i < length; ++i) {
      t.equals(commands[i].primitiveType, PrimitiveType.LINES);
    }

    tileset.debugWireframe = false;
    scene.renderForSpecs();
    commands = scene.frameState.commandList;
    for (i = 0; i < length; ++i) {
      t.equals(commands[i].primitiveType, PrimitiveType.TRIANGLES);
    }
  });
  t.end();
});

test('Tileset3D#debugShowBoundingVolume', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    tileset.debugShowBoundingVolume = true;
    scene.renderForSpecs();
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 2); // Tile command + bounding volume command

    tileset.debugShowBoundingVolume = false;
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('Tileset3D#debugShowContentBoundingVolume', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    tileset.debugShowContentBoundingVolume = true;
    scene.renderForSpecs();
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 2); // Tile command + bounding volume command

    tileset.debugShowContentBoundingVolume = false;
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('Tileset3D#debugShowViewerRequestVolume', t => {
  const E_URL).t= await loadTileset(scene, TILESET_WITH_VIEWER_REQUEST;
    tileset => {
      tileset.debugShowViewerRequestVolume = true;
      scene.renderForSpecs();
      const statistics = tileset._statistics;
      t.equals(statistics.visited, 6); // 1 empty root tile + 4 b3dm tiles + 1 pnts tile
      t.equals(statistics.numberOfCommands, 6); // 5 tile commands + viewer request volume command

      tileset.debugShowViewerRequestVolume = false;
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 5);
    }
  );
  t.end();
});

test('Tileset3D#show tile debug labels with regions', t => {
  // TILESET_URL has bounding regions
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.debugShowGeometricError = true;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 5);

    const root = tileset.root;
    t.equals(tileset._tileDebugLabels._labels[0].text, 'Geometric error: ' + root.geometricError);
    t.equals(
      tileset._tileDebugLabels._labels[1].text,
      'Geometric error: ' + root.children[0].geometricError
    );
    t.equals(
      tileset._tileDebugLabels._labels[2].text,
      'Geometric error: ' + root.children[1].geometricError
    );
    t.equals(
      tileset._tileDebugLabels._labels[3].text,
      'Geometric error: ' + root.children[2].geometricError
    );
    t.equals(
      tileset._tileDebugLabels._labels[4].text,
      'Geometric error: ' + root.children[3].geometricError
    );

    tileset.debugShowGeometricError = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('Tileset3D#show tile debug labels with boxes', t => {
  // TILESET_WITH_TRANSFORMS_URL has bounding boxes
  const tileset = await loadTileset(scene, TILESET_WITH_TRANSFORMS_URL);
    tileset.debugShowGeometricError = true;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 2);

    const root = tileset.root;
    t.equals(tileset._tileDebugLabels._labels[0].text, 'Geometric error: ' + root.geometricError);
    t.equals(
      tileset._tileDebugLabels._labels[1].text,
      'Geometric error: ' + root.children[0].geometricError
    );

    tileset.debugShowGeometricError = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('Tileset3D#show tile debug labels with bounding spheres', t => {
  // TILESET_WITH_VIEWER_REQUEST_VOLUME_URL has bounding sphere
  const E_URL).t= await loadTileset(scene, TILESET_WITH_VIEWER_REQUEST;
    tileset => {
      tileset.debugShowGeometricError = true;
      scene.renderForSpecs();

      const length = tileset._selectedTiles.length;
      expect(tileset._tileDebugLabels).toBeDefined();
      t.equals(tileset._tileDebugLabels.length, length);

      for (const i = 0; i < length; ++i) {
        t.equals(
          tileset._tileDebugLabels._labels[i].text,
          'Geometric error: ' + tileset._selectedTiles[i].geometricError
        );
      }

      tileset.debugShowGeometricError = false;
      scene.renderForSpecs();
      expect(tileset._tileDebugLabels).not.toBeDefined();
    }
  );
  t.end();
});

test('Tileset3D#show tile debug labels with rendering statistics', t => {
  // TILESET_URL has bounding regions
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.debugShowRenderingStatistics = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 1);

    const content = tileset.root.content;
    const expected =
      'Commands: ' +
      tileset.root.commandsLength +
      '\n' +
      'Triangles: ' +
      content.trianglesLength +
      '\n' +
      'Features: ' +
      content.featuresLength;

    t.equals(tileset._tileDebugLabels._labels[0].text, expected);

    tileset.debugShowRenderingStatistics = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('Tileset3D#show tile debug labels with memory usage', t => {
  // TILESET_URL has bounding regions
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.debugShowMemoryUsage = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 1);

    const expected = 'Texture Memory: 0\n' + 'Geometry Memory: 0.007';

    t.equals(tileset._tileDebugLabels._labels[0].text, expected);

    tileset.debugShowMemoryUsage = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('Tileset3D#show tile debug labels with all statistics', t => {
  // TILESET_URL has bounding regions
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.debugShowGeometricError = true;
    tileset.debugShowRenderingStatistics = true;
    tileset.debugShowMemoryUsage = true;
    tileset.debugShowUrl = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();

    const expected =
      'Geometric error: 70\n' +
      'Commands: 1\n' +
      'Triangles: 120\n' +
      'Features: 10\n' +
      'Texture Memory: 0\n' +
      'Geometry Memory: 0.007\n' +
      'Url: parent.b3dm';
    t.equals(tileset._tileDebugLabels._labels[0].text, expected);

    tileset.debugShowGeometricError = false;
    tileset.debugShowRenderingStatistics = false;
    tileset.debugShowMemoryUsage = false;
    tileset.debugShowUrl = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('Tileset3D#show only picked tile debug label with all stats', t => {
  // TILESET_URL has bounding regions
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.debugShowGeometricError = true;
    tileset.debugShowRenderingStatistics = true;
    tileset.debugShowMemoryUsage = true;
    tileset.debugShowUrl = true;
    tileset.debugPickedTileLabelOnly = true;

    const scratchPosition = new Cartesian3(1.0, 1.0, 1.0);
    tileset.debugPickedTile = tileset.root;
    tileset.debugPickPosition = scratchPosition;

    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();

    const expected =
      'Geometric error: 70\n' +
      'Commands: 1\n' +
      'Triangles: 120\n' +
      'Features: 10\n' +
      'Texture Memory: 0\n' +
      'Geometry Memory: 0.007\n' +
      'Url: parent.b3dm';
    t.equals(tileset._tileDebugLabels.get(0).text, expected);
    t.equals(tileset._tileDebugLabels.get(0).position, scratchPosition);

    tileset.debugPickedTile = undefined;
    scene.renderForSpecs();
    t.equals(tileset._tileDebugLabels.length, 0);
  });
  t.end();
});

test('Tileset3D#does not request tiles when picking', t => {
  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    scene.pickForSpecs();
    t.equals(tileset._statistics.numberOfPendingRequests, 0);
    scene.renderForSpecs();
    t.equals(tileset._statistics.numberOfPendingRequests, 1);
  });
  t.end();
});

test('Tileset3D#does not process tiles when picking', t => {
  const spy = spyOn(Cesium3DTile.prototype, 'process').and.callThrough();

  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    viewRootOnly();
    scene.renderForSpecs(); // Request root
    t.equals(tileset._statistics.numberOfPendingRequests, 1);
    return tileset.root.contentReadyToProcessPromise.then(function() {
      scene.pickForSpecs();
      expect(spy).not.toHaveBeenCalled();
      scene.renderForSpecs();
      expect(spy).toHaveBeenCalled();
    });
  });
  t.end();
});

test('Tileset3D#does not request tiles when the request scheduler is full', t => {
  viewRootOnly(); // Root tiles are loaded initially
  const options = {
    skipLevelOfDetail: false
  };
  const tileset = await loadTileset(scene, TILESET_URL, options);
    // Try to load 4 children. Only 3 requests will go through, 1 will be attempted.
    const oldMaximumRequestsPerServer = RequestScheduler.maximumRequestsPerServer;
    RequestScheduler.maximumRequestsPerServer = 3;

    viewAllTiles();
    scene.renderForSpecs();

    t.equals(tileset._statistics.numberOfPendingRequests, 3);
    t.equals(tileset._statistics.numberOfAttemptedRequests, 1);

    RequestScheduler.maximumRequestsPerServer = oldMaximumRequestsPerServer;
  });
  t.end();
});

test('Tileset3D#load progress events are raised', t => {
  // [numberOfPendingRequests, numberOfTilesProcessing]
  const results = [[1, 0], [0, 1], [0, 0]];
  const spyUpdate = jasmine.createSpy('listener');

  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.loadProgress.addEventListener(spyUpdate);
    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(spyUpdate.calls.count(), 3);
      t.equals(spyUpdate.calls.allArgs(), results);
    });
  });
  t.end();
});

test('Tileset3D#tilesLoaded', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  expect(tileset.tilesLoaded).toBe(false);
  tileset.readyPromise.then(function() {
    expect(tileset.tilesLoaded).toBe(false);
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      expect(tileset.tilesLoaded).toBe(true);
    });
  });
  t.end();
});

test('Tileset3D#all tiles loaded event is raised', t => {
  // Called first when only the root is visible and it becomes loaded, and then again when
  // the rest of the tileset is visible and all tiles are loaded.
  const spyUpdate1 = jasmine.createSpy('listener');
  const spyUpdate2 = jasmine.createSpy('listener');
  viewRootOnly();
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  tileset.allTilesLoaded.addEventListener(spyUpdate1);
  tileset.initialTilesLoaded.addEventListener(spyUpdate2);
  return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
    viewAllTiles();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(spyUpdate1.calls.count(), 2);
      t.equals(spyUpdate2.calls.count(), 1);
    });
  });
  t.end();
});

test('Tileset3D#tile visible event is raised', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_URL);
    const spyUpdate = jasmine.createSpy('listener');
    tileset.tileVisible.addEventListener(spyUpdate);
    scene.renderForSpecs();
    expect(tileset.root.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)).not.toEqual(
      CullingVolume.MASK_OUTSIDE
    );
    t.equals(spyUpdate.calls.count(), 1);
    expect(spyUpdate.calls.argsFor(0)[0]).toBe(tileset.root);
  });
  t.end();
});

test('Tileset3D#tile load event is raised', t => {
  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    const spyUpdate = jasmine.createSpy('listener');
    tileset.tileLoad.addEventListener(spyUpdate);
    tileset.maximumMemoryUsage = 0;
    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      // Root is loaded
      t.equals(spyUpdate.calls.count(), 1);
      expect(spyUpdate.calls.argsFor(0)[0]).toBe(tileset.root);
      spyUpdate.calls.reset();

      // Unload from cache
      viewNothing();
      scene.renderForSpecs();
      t.equals(tileset.statistics.numberOfTilesWithContentReady, 0);

      // Look at root again
      viewRootOnly();
      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
        t.equals(spyUpdate.calls.count(), 1);
        expect(spyUpdate.calls.argsFor(0)[0]).toBe(tileset.root);
      });
    });
  });
  t.end();
});

test('Tileset3D#tile failed event is raised', t => {
  viewNothing();
  const tileset = await loadTileset(scene, TILESET_URL);
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      deferred.reject('404');
    });
    const spyUpdate = jasmine.createSpy('listener');
    tileset.tileFailed.addEventListener(spyUpdate);
    tileset.maximumMemoryUsage = 0;
    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(spyUpdate.calls.count(), 1);

      const arg = spyUpdate.calls.argsFor(0)[0];
      expect(arg).toBeDefined();
      expect(arg.url).toContain('parent.b3dm');
      expect(arg.message).toBeDefined();
    });
  });
  t.end();
});

test('Tileset3D#destroys', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const root = tileset.root;
    t.equals(tileset.isDestroyed(), false);
    scene.primitives.remove(tileset);
    t.equals(tileset.isDestroyed(), true);

    // Check that all tiles are destroyed
    t.equals(root.isDestroyed(), true);
    t.equals(root.children[0].isDestroyed(), true);
    t.equals(root.children[1].isDestroyed(), true);
    t.equals(root.children[2].isDestroyed(), true);
    t.equals(root.children[3].isDestroyed(), true);
  });
  t.end();
});

test('Tileset3D#destroys before external tileset JSON file finishes loading', t => {
  viewNothing();
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    const root = tileset.root;

    viewRootOnly();
    scene.renderForSpecs(); // Request external tileset JSON file

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfPendingRequests, 1);
    scene.primitives.remove(tileset);

    return root.contentReadyPromise
      .then(function(root) {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        // Expect the root to not have added any children from the external tileset JSON file
        t.equals(root.children.length, 0);
      });
  });
  t.end();
});

test('Tileset3D#destroys before tile finishes loading', t => {
  viewRootOnly();
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  return tileset.readyPromise.then(tileset => {
    const root = tileset.root;
    scene.renderForSpecs(); // Request root
    scene.primitives.remove(tileset);

    return root.contentReadyPromise
      .then(function(content) {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        expect(root._contentState).toBe(Cesium3DTileContentState.FAILED);
      });
  });
  t.end();
});

test('Tileset3D#renders with imageBaseLightingFactor', t => {
  const tileset = await loadTileset(scene, WITHOUT_BATCH_TABLE_URL);
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba).not.toEqual([0, 0, 0, 255]);
      tileset.imageBasedLightingFactor = new Cartesian2(0.0, 0.0);
      expect(scene).notToRender(rgba);
    });
  });
  t.end();
});

test('Tileset3D#renders with lightColor', t => {
  const tileset = await loadTileset(scene, WITHOUT_BATCH_TABLE_URL);
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba).not.toEqual([0, 0, 0, 255]);
      tileset.imageBasedLightingFactor = new Cartesian2(0.0, 0.0);
      expect(scene).toRenderAndCall(function(rgba2) {
        expect(rgba2).not.toEqual(rgba);
        tileset.lightColor = new Cartesian3(5.0, 5.0, 5.0);
        expect(scene).notToRender(rgba2);
      });
    });
  });
  t.end();
});
///////////////////////////////////////////////////////////////////////////
// Cache replacement tests

test('Tileset3D#Unload all cached tiles not required to meet SSE using maximumMemoryUsage', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.maximumMemoryUsage = 0;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles
    t.equals(tileset.gpuMemoryUsageInBytes, 37200); // Specific to this tileset

    // Zoom out so only root tile is needed to meet SSE.  This unloads
    // the four children since the maximum memory usage is zero.
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 1);
    t.equals(tileset.gpuMemoryUsageInBytes, 7440); // Specific to this tileset

    // Zoom back in so all four children are re-requested.
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles
      t.equals(tileset.gpuMemoryUsageInBytes, 37200); // Specific to this tileset
    });
  });
  t.end();
});

test('Tileset3D#Unload some cached tiles not required to meet SSE using maximumMemoryUsage', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.maximumMemoryUsage = 0.025; // Just enough memory to allow 3 tiles to remain
    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles

    // Zoom out so only root tile is needed to meet SSE.  This unloads
    // two of the four children so three tiles are still loaded (the
    // root and two children) since the maximum memory usage is sufficient.
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 3);

    // Zoom back in so the two children are re-requested.
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles
    });
  });
  t.end();
});

test('Tileset3D#Unloads cached tiles outside of the view frustum using maximumMemoryUsage', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.maximumMemoryUsage = 0;

    scene.renderForSpecs();
    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5);

    viewSky();

    // All tiles are unloaded
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 0);
    t.equals(statistics.numberOfTilesWithContentReady, 0);

    // Reset camera so all tiles are reloaded
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfTilesWithContentReady, 5);
    });
  });
  t.end();
});

test('Tileset3D#Unloads cached tiles in a tileset with external tileset JSON file using maximumMemoryUsage', t => {
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    const statistics = tileset._statistics;
    const cacheList = tileset._cache._list;

    tileset.maximumMemoryUsage = 0.02;

    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5);
    t.equals(cacheList.length - 1, 5); // Only tiles with content are on the replacement list. -1 for sentinel.

    // Zoom out so only root tile is needed to meet SSE.  This unloads
    // all tiles except the root and one of the b3dm children
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 2);
    t.equals(cacheList.length - 1, 2);

    // Reset camera so all tiles are reloaded
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfTilesWithContentReady, 5);

      t.equals(cacheList.length - 1, 5);
    });
  });
  t.end();
});

test('Tileset3D#Unloads cached tiles in a tileset with empty tiles using maximumMemoryUsage', t => {
  const tileset = await loadTileset(scene, TILESET_EMPTY_ROOT_URL);
    const statistics = tileset._statistics;

    tileset.maximumMemoryUsage = 0.02;

    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 4);
    t.equals(statistics.numberOfTilesWithContentReady, 4); // 4 children with b3dm content (does not include empty root)

    viewSky();

    // Unload tiles to meet cache size
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 0);
    t.equals(statistics.numberOfTilesWithContentReady, 2); // 2 children with b3dm content (does not include empty root)

    // Reset camera so all tiles are reloaded
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 4);
      t.equals(statistics.numberOfTilesWithContentReady, 4);
    });
  });
  t.end();
});

test('Tileset3D#Unload cached tiles when a tileset uses replacement refinement using maximumMemoryUsage', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_1_URL);
    tileset.maximumMemoryUsage = 0; // Only root needs to be visible

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 4); // 4 grandchildren. Root is replaced.
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Root + four grandchildren (does not include empty children)

    // Zoom out so only root tile is needed to meet SSE.  This unloads
    // all grandchildren since the max number of loaded tiles is one.
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 1);

    // Zoom back in so the four children are re-requested.
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 4);
      t.equals(statistics.numberOfTilesWithContentReady, 5);
    });
  });
  t.end();
});

test('Tileset3D#Explicitly unloads cached tiles with trimLoadedTiles', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.maximumMemoryUsage = 0.05;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles

    // Zoom out so only root tile is needed to meet SSE.  The children
    // are not unloaded since max number of loaded tiles is five.
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 5);

    tileset.trimLoadedTiles();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 1);
  });
  t.end();
});

test('Tileset3D#tileUnload event is raised', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    tileset.maximumMemoryUsage = 0;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles

    // Zoom out so only root tile is needed to meet SSE.  All the
    // children are unloaded since max number of loaded tiles is one.
    viewRootOnly();
    const spyUpdate = jasmine.createSpy('listener');
    tileset.tileUnload.addEventListener(spyUpdate);
    scene.renderForSpecs();

    expect(tileset.root.visibility(scene.frameState, CullingVolume.MASK_INDETERMINATE)).not.toEqual(
      CullingVolume.MASK_OUTSIDE
    );
    t.equals(spyUpdate.calls.count(), 4);
    expect(spyUpdate.calls.argsFor(0)[0]).toBe(tileset.root.children[0]);
    expect(spyUpdate.calls.argsFor(1)[0]).toBe(tileset.root.children[1]);
    expect(spyUpdate.calls.argsFor(2)[0]).toBe(tileset.root.children[2]);
    expect(spyUpdate.calls.argsFor(3)[0]).toBe(tileset.root.children[3]);
  });
  t.end();
});

test('Tileset3D#maximumMemoryUsage throws when negative', t => {
  const tileset = new Tileset3D({
    url: TILESET_URL
  });
  expect(function() {
    tileset.maximumMemoryUsage = -1;
  }).toThrowDeveloperError();
  t.end();
});

test('Tileset3D#maximumScreenSpaceError throws when negative', t => {
  const tileset = new Tileset3D({
    url: TILESET_URL
  });
  expect(function() {
    tileset.maximumScreenSpaceError = -1;
  }).toThrowDeveloperError();
  t.end();
});

test('Tileset3D#propagates tile transform down the tree', t => {
  const b3dmCommands = 1;
  const i3dmCommands = scene.context.instancedArrays ? 1 : 25; // When instancing is not supported there is one command per instance
  const totalCommands = b3dmCommands + i3dmCommands;
  const tileset = await loadTileset(scene, TILESET_WITH_TRANSFORMS_URL);
    const statistics = tileset._statistics;
    const root = tileset.root;
    const rootTransform = Matrix4.unpack(root._header.transform);

    const child = root.children[0];
    const childTransform = Matrix4.unpack(child._header.transform);
    const computedTransform = Matrix4.multiply(rootTransform, childTransform, new Matrix4());

    expect(statistics.numberOfCommands).toBe(totalCommands);
    t.equals(root.computedTransform, rootTransform);
    t.equals(child.computedTransform, computedTransform);

    // Set the tileset's modelMatrix
    const tilesetTransform = Matrix4.fromTranslation(new Cartesian3(0.0, 1.0, 0.0));
    tileset.modelMatrix = tilesetTransform;
    computedTransform = Matrix4.multiply(tilesetTransform, computedTransform, computedTransform);
    scene.renderForSpecs();
    t.equals(child.computedTransform, computedTransform);

    // Set the modelMatrix somewhere off screen
    tileset.modelMatrix = Matrix4.fromTranslation(new Cartesian3(0.0, 100000.0, 0.0));
    scene.renderForSpecs();
    expect(statistics.numberOfCommands).toBe(0);

    // Now bring it back
    tileset.modelMatrix = Matrix4.IDENTITY;
    scene.renderForSpecs();
    expect(statistics.numberOfCommands).toBe(totalCommands);

    // Do the same steps for a tile transform
    child.transform = Matrix4.fromTranslation(new Cartesian3(0.0, 100000.0, 0.0));
    scene.renderForSpecs();
    expect(statistics.numberOfCommands).toBe(1);
    child.transform = Matrix4.IDENTITY;
    scene.renderForSpecs();
    expect(statistics.numberOfCommands).toBe(totalCommands);
  });
  t.end();
});

test('Tileset3D#does not mark tileset as refining when tiles have selection depth 0', t => {
  viewRootOnly();
  const tileset = await loadTileset(scene, TILESET_URL);
    viewAllTiles();
    scene.renderForSpecs();
    const statistics = tileset._statistics;
    t.equals(statistics.numberOfTilesWithContentReady, 1);
    t.equals(tileset._selectedTiles[0]._selectionDepth, 0);
    expect(tileset._hasMixedContent).toBe(false);

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
      t.equals(statistics.numberOfTilesWithContentReady, 5);
      expect(tileset._hasMixedContent).toBe(false);
    });
  });
  t.end();
});

test('Tileset3D#marks tileset as mixed when tiles have nonzero selection depth', t => {
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    const statistics = tileset._statistics;

    tileset.root.children[0].children[0].children[0].unloadContent();
    tileset.root.children[0].children[0].children[1].unloadContent();
    tileset.root.children[0].children[0].children[2].unloadContent();
    statistics.numberOfTilesWithContentReady -= 3;

    scene.renderForSpecs();

    expect(tileset._hasMixedContent).toBe(true);
    t.equals(statistics.numberOfTilesWithContentReady, 2);
    t.equals(tileset.root.children[0].children[0].children[3]._selectionDepth, 1);
    t.equals(tileset.root._selectionDepth, 0);

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
      t.equals(statistics.numberOfTilesWithContentReady, 5);
      expect(tileset._hasMixedContent).toBe(false);
    });
  });
  t.end();
});

test('Tileset3D#loadSiblings', t => {
  viewBottomLeft();
  const ENT_3_UR= await loadTileset(scene, TILESET_RE;
    loadSiblings: false
  }).then(tileset => {
    const statistics = tileset._statistics;
    expect(statistics.numberOfTilesWithContentReady).toBe(2);
    tileset.loadSiblings = true;
    scene.renderForSpecs();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
      expect(statistics.numberOfTilesWithContentReady).toBe(5);
    });
  });
  t.end();
});

test('Tileset3D#immediatelyLoadDesiredLevelOfDetail', t => {
  viewNothing();
  const LESET_UR= await loadTileset(sce;
    immediatelyLoadDesiredLevelOfDetail: true
  }).then(tileset => {
    const root = tileset.root;
    const child = findTileByUri(root.children, 'll.b3dm');
    tileset.root.refine = Cesium3DTileRefine.REPLACE;
    tileset._allTilesAdditive = false;
    viewBottomLeft();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
      expect(isSelected(tileset, child));
      expect(!isSelected(tileset, root));
      expect(root.contentUnloaded).toBe(true);
      // Renders child while parent loads
      viewRootOnly();
      scene.renderForSpecs();
      expect(isSelected(tileset, child));
      expect(!isSelected(tileset, root));
      return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
        expect(!isSelected(tileset, child));
        expect(isSelected(tileset, root));
      });
    });
  });
  t.end();
});

test('Tileset3D#selects children if no ancestors available', t => {
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
    const statistics = tileset._statistics;
    const parent = tileset.root.children[0];
    const child = parent.children[3].children[0];
    parent.refine = Cesium3DTileRefine.REPLACE;
    parent.unloadContent();

    viewBottomLeft();
    scene.renderForSpecs();

    expect(child.contentReady).toBe(true);
    expect(parent.contentReady).toBe(false);
    expect(isSelected(tileset, child)).toBe(true);
    expect(isSelected(tileset, parent)).toBe(false);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('Tileset3D#tile expires', t => {
  const tileset = await loadTileset(scene, BATCHED_EXPIRATION_URL);
    // Intercept the request and load content that produces more draw commands, to simulate fetching new content after the original expires
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      Resource._DefaultImplementations.loadWithXhr(
        BATCHED_COLORS_B3DM_URL,
        responseType,
        method,
        data,
        headers,
        deferred,
        overrideMimeType
      );
    });
    const tile = tileset.root;
    const statistics = tileset._statistics;
    const expiredContent;
    tileset.style = new Cesium3DTileStyle({
      color: 'color("red")'
    });

    // Check that expireDuration and expireDate are correctly set
    const expireDate = JulianDate.addSeconds(JulianDate.now(), 5.0, new JulianDate());
    expect(JulianDate.secondsDifference(tile.expireDate, expireDate)).toEqualEpsilon(
      0.0,
      CesiumMath.EPSILON1
    );
    expect(tile.expireDuration).toBe(5.0);
    expect(tile.contentExpired).toBe(false);
    expect(tile.contentReady).toBe(true);
    expect(tile.contentAvailable).toBe(true);
    expect(tile._expiredContent).toBeUndefined();

    // Check statistics
    expect(statistics.numberOfCommands).toBe(1);
    expect(statistics.numberOfTilesTotal).toBe(1);

    // Trigger expiration to happen next frame
    tile.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // Stays in the expired state until the request goes through
    const originalMaxmimumRequests = RequestScheduler.maximumRequests;
    RequestScheduler.maximumRequests = 0; // Artificially limit Request Scheduler so the request won't go through
    scene.renderForSpecs();
    RequestScheduler.maximumRequests = originalMaxmimumRequests;
    expiredContent = tile._expiredContent;
    expect(tile.contentExpired).toBe(true);
    expect(tile.contentAvailable).toBe(true); // Expired content now exists
    expect(expiredContent).toBeDefined();

    // Expired content renders while new content loads in
    expect(statistics.numberOfCommands).toBe(1);
    expect(statistics.numberOfTilesTotal).toBe(1);

    // Request goes through, now in the LOADING state
    scene.renderForSpecs();
    expect(tile.contentExpired).toBe(false);
    expect(tile.contentReady).toBe(false);
    expect(tile.contentAvailable).toBe(true);
    expect(tile._contentState).toBe(Cesium3DTileContentState.LOADING);
    expect(tile._expiredContent).toBeDefined(); // Still holds onto expired content until the content state is READY

    // Check that url contains a query param with the timestamp
    const url = Resource._Implementations.loadWithXhr.calls.first().args[0];
    expect(url.indexOf('expired=') >= 0).toBe(true);

    // statistics are still the same
    expect(statistics.numberOfCommands).toBe(1);
    expect(statistics.numberOfTilesTotal).toBe(1);

    return pollToPromise(function() {
      expect(statistics.numberOfCommands).toBe(1); // Still renders expired content
      scene.renderForSpecs();
      return tile.contentReady;
    }).then(function() {
      scene.renderForSpecs();

      // Expired content is destroyed
      expect(tile._expiredContent).toBeUndefined();
      expect(expiredContent.isDestroyed()).toBe(true);

      // Expect the style to be reapplied
      t.equals(tile.content.getFeature(0).color, Color.RED);

      // statistics for new content
      expect(statistics.numberOfCommands).toBe(10);
      expect(statistics.numberOfTilesTotal).toBe(1);
    });
  });
});

function modifySubtreeBuffer(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const jsonString = getStringFromTypedArray(uint8Array);
  const json = JSON.load(jsonString);
  json.root.children.splice(0, 1);

  jsonString = JSON.stringify(json);
  const length = jsonString.length;
  uint8Array = new Uint8Array(length);
  for (const i = 0; i < length; i++) {
    uint8Array[i] = jsonString.charCodeAt(i);
  }
  return uint8Array.buffer;
  t.end();
}

test('Tileset3D#tile with tileset content expires', t => {
  const tileset = await loadTileset(scene, TILESET_SUBTREE_EXPIRATION_URL);
    // Intercept the request and load a subtree with one less child. Still want to make an actual request to simulate
    // real use cases instead of immediately returning a pre-created array buffer.
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      const newDeferred = when.defer();
      Resource._DefaultImplementations.loadWithXhr(
        TILESET_SUBTREE_URL,
        responseType,
        method,
        data,
        headers,
        newDeferred,
        overrideMimeType
      );
      newDeferred.promise.then(function(arrayBuffer) {
        deferred.resolve(modifySubtreeBuffer(arrayBuffer));
      });
    });

    const subtreeRoot = tileset.root.children[0];
    const subtreeChildren = subtreeRoot.children[0].children;
    const childrenLength = subtreeChildren.length;
    const statistics = tileset._statistics;

    // Check statistics
    expect(statistics.numberOfCommands).toBe(5);
    expect(statistics.numberOfTilesTotal).toBe(7);
    expect(statistics.numberOfTilesWithContentReady).toBe(5);

    // Trigger expiration to happen next frame
    subtreeRoot.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // Listen to tile unload events
    const spyUpdate = jasmine.createSpy('listener');
    tileset.tileUnload.addEventListener(spyUpdate);

    // Tiles in the subtree are removed from the cache and destroyed.
    scene.renderForSpecs(); // Becomes expired
    scene.renderForSpecs(); // Makes request
    t.equals(subtreeRoot.children, []);
    for (const i = 0; i < childrenLength; ++i) {
      expect(subtreeChildren[0].isDestroyed()).toBe(true);
    }
    t.equals(spyUpdate.calls.count(), 4);

    // Remove the spy so new tiles load in normally
    Resource._Implementations.loadWithXhr = Resource._DefaultImplementations.loadWithXhr;

    // Wait for the new tileset content to come in with one less leaf
    return pollToPromise(function() {
      scene.renderForSpecs();
      return subtreeRoot.contentReady && tileset.tilesLoaded;
    }).then(function() {
      scene.renderForSpecs();
      expect(statistics.numberOfCommands).toBe(4);
      expect(statistics.numberOfTilesTotal).toBe(6);
      expect(statistics.numberOfTilesWithContentReady).toBe(4);
    });
  });
  t.end();
});

test('Tileset3D#tile expires and request fails', t => {
  const tileset = await loadTileset(scene, BATCHED_EXPIRATION_URL);
    spyOn(Resource._Implementations, 'loadWithXhr').and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    ) {
      deferred.reject();
    });
    const tile = tileset.root;
    const statistics = tileset._statistics;

    // Trigger expiration to happen next frame
    tile.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // After update the tile is expired
    scene.renderForSpecs();

    // Make request (it will fail)
    scene.renderForSpecs();

    // Render scene
    scene.renderForSpecs();
    expect(tile._contentState).toBe(Cesium3DTileContentState.FAILED);
    expect(statistics.numberOfCommands).toBe(0);
    expect(statistics.numberOfTilesTotal).toBe(1);
  });
  t.end();
});

test('Tileset3D#tile expiration date', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const tile = tileset.root;

    // Trigger expiration to happen next frame
    tile.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // Stays in the expired state until the request goes through
    const originalMaxmimumRequests = RequestScheduler.maximumRequests;
    RequestScheduler.maximumRequests = 0; // Artificially limit Request Scheduler so the request won't go through
    scene.renderForSpecs();
    RequestScheduler.maximumRequests = originalMaxmimumRequests;

    expect(tile.contentExpired).toBe(true);

    return pollToPromise(function() {
      scene.renderForSpecs();
      return tile.contentReady;
    }).then(function() {
      scene.renderForSpecs();
      expect(tile._expiredContent).toBeUndefined();
      expect(tile.expireDate).toBeUndefined();
    });
  });
  t.end();
});

test('Tileset3D#supports content data URIs', t => {
  const tileset = await loadTileset(scene, TILESET_URL_WITH_CONTENT_URI);
    const statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});
*/
