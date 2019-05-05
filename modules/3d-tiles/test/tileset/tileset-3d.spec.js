import test from 'tape-promise/tape';
import Tileset3D from '@loaders.gl/tileset/tileset-3d';

// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json';

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

const WITH_BATCH_TABLE_HIERARCHY_URL =
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

/*
var scene;
var centerLongitude = -1.31968;
var centerLatitude = 0.698874;

beforeAll(function() {
  scene = createScene();
});

afterAll(function() {
  scene.destroyForSpecs();
});

beforeEach(function() {
  RequestScheduler.clearForSpecs();
  scene.morphTo3D(0.0);

  var camera = scene.camera;
  camera.frustum = new PerspectiveFrustum();
  camera.frustum.aspectRatio = scene.drawingBufferWidth / scene.drawingBufferHeight;
  camera.frustum.fov = CesiumMath.toRadians(60.0);

  viewAllTiles();
});

afterEach(function() {
  scene.primitives.removeAll();
});

function setZoom(distance) {
  // Bird's eye view
  var center = Cartesian3.fromRadians(centerLongitude, centerLatitude);
  scene.camera.lookAt(center, new HeadingPitchRange(0.0, -1.57, distance));
}

function viewAllTiles() {
  setZoom(15.0);
}

function viewRootOnly() {
  setZoom(100.0);
}

function viewNothing() {
  setZoom(200.0);
}

function viewSky() {
  var center = Cartesian3.fromRadians(centerLongitude, centerLatitude, 100);
  scene.camera.lookAt(center, new HeadingPitchRange(0.0, 1.57, 10.0));
}

function viewBottomLeft() {
  viewAllTiles();
  scene.camera.moveLeft(200.0);
  scene.camera.moveDown(200.0);
}

function viewInstances() {
  setZoom(30.0);
}

function viewPointCloud() {
  setZoom(5.0);
}
*/

function isSelected(tileset, tile) {
  return tileset._selectedTiles.indexO;
  t.end();
  f(tile) > -1;
}

test('throws with undefined url', t => {
  t.throws(() => new Tileset3D());
  t.end();
});

test('rejects readyPromise with invalid tileset JSON fiile', t => {
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

  var tileset = scene.primitives.add(
    new Tileset3D({
      url: 'invalid.json'
    })
  );
  return tileset.readyPromise
    .then(function() {
      fail('should not resolve');
    })
    .otherwise(function(error) {
      t.equals(tileset.ready, false);
    });
  t.end();
});

test('loads json with static loadJson method', t => {
  var tilesetJson = {
    asset: {
      version: 2.0
    }
  };

  var uri = 'data:text/plain;base64,' + btoa(JSON.stringify(tilesetJson));

  Tileset3D.loadJson(uri)
    .then(function(result) {
      t.equals(result, tilesetJson);
    })
    .otherwise(function(error) {
      fail('should not fail');
    });
  t.end();
});

test('static method loadJson is used in Tileset3D constructor', t => {
  var path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';

  var originalLoadJson = Tileset3D.loadJson;

  // override loadJson and replace incorrect url with correct url
  Tileset3D.loadJson = function(TILESET_URL) {
    return originalLoadJson(path);
  };

  // setup tileset with invalid url (overridden loadJson should replace invalid url with correct url)
  var tileset = new Tileset3D({
    url: 'invalid.json'
  });

  // restore original version
  Tileset3D.loadJson = originalLoadJson;

  return tileset.readyPromise
    .then(function() {
      t.equals(tileset.ready, true);
    })
    .otherwise(function(error) {
      fail('should not fail');
    });
  t.end();
});

test('Constructor works with promise to resource', t => {
  var resource = new Resource({
    url: '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json'
  });

  // setup tileset with invalid url (overridden loadJson should replace invalid url with correct url)
  var tileset = new Tileset3D({
    url: when.resolve(resource)
  });

  return tileset.readyPromise
    .then(function() {
      t.equals(tileset.ready, true);
    })
    .otherwise(function(error) {
      fail('should not fail');
    });
  t.end();
});

test('Constructor works with file resource', t => {
  var resource = new Resource({
    url: '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json'
  });

  // setup tileset with invalid url (overridden loadJson should replace invalid url with correct url)
  var tileset = new Tileset3D({
    url: resource
  });

  return tileset.readyPromise
    .then(function() {
      t.equals(tileset.ready, true);
    })
    .otherwise(function(error) {
      fail('should not fail');
    });
  t.end();
});

test('rejects readyPromise with invalid tileset version', t => {
  var tilesetJson = {
    asset: {
      version: 2.0
    }
  };

  var uri = 'data:text/plain;base64,' + btoa(JSON.stringify(tilesetJson));

  var tileset = scene.primitives.add(
    new Tileset3D({
      url: uri
    })
  );
  return tileset.readyPromise
    .then(function() {
      fail('should not resolve');
    })
    .otherwise(function(error) {
      t.equals(tileset.ready, false);
    });
  t.end();
});

test('url and TILESET_URL set up correctly given tileset JSON filepath', t => {
  var path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';
  var tileset = new Tileset3D({
    url: path
  });
  t.equals(tileset.url, path);
  t.end();
});

test('url and TILESET_URL set up correctly given path with query string', t => {
  var path = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json';
  var param = '?param1=1&param2=2';
  var tileset = new Tileset3D({
    url: path + param
  });
  t.equals(tileset.url, path + param);
  t.end();
});

test('resolves readyPromise', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    return tileset.readyPromise.then(tileset => {
      t.equals(tileset.ready, true);
    });
  });
  t.end();
});

test('loads tileset JSON file', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var asset = tileset.asset;
    expect(asset).toBeDefined();
    t.equals(asset.version, '1.0');
    t.equals(asset.tilesetVersion, '1.2.3');

    var properties = tileset.properties;
    expect(properties).toBeDefined();
    expect(properties.id).toBeDefined();
    t.equals(properties.id.minimum, 0);
    t.equals(properties.id.maximum, 9);

    t.equals(tileset._geometricError, 240.0);
    expect(tileset.root).toBeDefined();
    t.equals(tileset.url, TILESET_URL);
  });
  t.end();
});

test('loads tileset with extras', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    t.equals(tileset.extras, {name: 'Sample Tileset'});
    expect(tileset.root.extras).toBeUndefined();

    var length = tileset.root.children.length;
    var taggedChildren = 0;
    for (var i = 0; i < length; ++i) {
      if (defined(tileset.root.children[i].extras)) {
        t.equals(tileset.root.children[i].extras, {id: 'Special Tile'});
        ++taggedChildren;
      }
    }

    t.equals(taggedChildren, 1);
  });
  t.end();
});

test('gets root tile', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  t.throws(() => tileset.root);
  return tileset.readyPromise.then(function() {
    expect(tileset.root).toBeDefined();
  });
  t.end();
});

test('hasExtension returns true if the tileset JSON file uses the specified extension', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_HIERARCHY_URL).then(tileset => {
    expect(tileset.hasExtension('3DTILES_batch_table_hierarchy')).toBe(true);
    expect(tileset.hasExtension('3DTILES_nonexistant_extension')).toBe(false);
  });
  t.end();
});

test('passes version in query string to tiles', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    t.equals(
      tileset.root.content._resource.url,
      getAbsoluteUri(TILESET_URL.replace('tileset.json', 'parent.b3dm?v=1.2.3'))
    );
  });
  t.end();
});

test('passes version in query string to all external resources', t => {
  // Spy on loadWithXhr so we can verify requested urls
  spyOn(Resource._Implementations, 'loadWithXhr').and.callThrough();

  var queryParams = '?a=1&b=boy';
  var queryParamsWithVersion = '?a=1&b=boy&v=1.2.3';
  return Cesium3DTilesTester.loadTileset(
    scene,
    TILESET_WITH_EXTERNAL_RESOURCES_URL + queryParams
  ).then(tileset => {
    var calls = Resource._Implementations.loadWithXhr.calls.all();
    var callsLength = calls.length;
    for (var i = 0; i < callsLength; ++i) {
      var url = calls[0].args[0];
      if (url.indexOf(TILESET_WITH_EXTERNAL_RESOURCES_URL) >= 0) {
        var query = url.slice(url.indexOf('?'));
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

test('throws when getting asset and tileset is not ready', t => {
  var tileset = new Tileset3D({
    url: TILESET_URL
  });
  t.throws(() => tileset.asset);
  t.end();
});

test('throws when getting properties and tileset is not ready', t => {
  var tileset = new Tileset3D({
    url: TILESET_URL
  });
  t.throws(() => tileset.properties);
  t.end();
});

test('throws when getting extras and tileset is not ready', t => {
  var tileset = new Tileset3D({
    url: TILESET_URL
  });
  t.throws(() => tileset.extras);
  t.end();
});

test('requests tile with invalid magic', t => {
  var invalidMagicBuffer = Cesium3DTilesTester.generateBatchedTileBuffer({
    magic: [120, 120, 120, 120]
  });
  var tileset = scene.primitives.add(
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
    var root = tileset.root;
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

test('handles failed tile requests', t => {
  viewRootOnly();
  var tileset = scene.primitives.add(
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
    var root = tileset.root;
    return root.contentReadyPromise
      .then(function() {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        t.equals(root._contentState, Cesium3DTileContentState.FAILED);
        var statistics = tileset.statistics;
        expect(statistics.numberOfAttemptedRequests).toBe(0);
        expect(statistics.numberOfPendingRequests).toBe(0);
        expect(statistics.numberOfTilesProcessing).toBe(0);
        expect(statistics.numberOfTilesWithContentReady).toBe(0);
      });
  });
  t.end();
});

test('handles failed tile processing', t => {
  viewRootOnly();
  var tileset = scene.primitives.add(
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
    var root = tileset.root;
    return root.contentReadyPromise
      .then(function() {
        fail('should not resolve');
      })
      .otherwise(function(error) {
        t.equals(root._contentState, Cesium3DTileContentState.FAILED);
        var statistics = tileset.statistics;
        expect(statistics.numberOfAttemptedRequests).toBe(0);
        expect(statistics.numberOfPendingRequests).toBe(0);
        expect(statistics.numberOfTilesProcessing).toBe(0);
        expect(statistics.numberOfTilesWithContentReady).toBe(0);
      });
  });
  t.end();
});

test('renders tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);
  });
  t.end();
});

test('renders tileset in CV', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    scene.morphToColumbusView(0.0);
    scene.renderForSpecs();
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);
  });
  t.end();
});

test('renders tileset in 2D', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    scene.morphTo2D(0.0);
    tileset.maximumScreenSpaceError = 3;
    scene.renderForSpecs();
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 10);
  });
  t.end();
});

test('does not render during morph', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var commandList = scene.frameState.commandList;
    scene.renderForSpecs();
    expect(commandList.length).toBeGreaterThan(0);
    scene.morphToColumbusView(1.0);
    scene.renderForSpecs();
    expect(commandList.length).toBe(0);
  });
  t.end();
});

test('renders tileset with empty root tile', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_EMPTY_ROOT_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 4); // Empty tile doesn't issue a command
  });
  t.end();
});

test('verify statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );

  // Verify initial values
  var statistics = tileset._statistics;
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
  var statistics = tileset._statistics;

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

test('verify batched features statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: WITH_BATCH_TABLE_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 10, 0, 120);
  t.end();
});

test('verify no batch table features statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: NO_BATCH_IDS_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 0, 0, 120);
  t.end();
});

test('verify instanced features statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: INSTANCED_RED_MATERIAL_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 25, 0, 12);
  t.end();
});

test('verify composite features statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: COMPOSITE_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 35, 0, 132);
  t.end();
});

test('verify tileset of tilesets features statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_OF_TILESETS_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 50, 0, 600);
  t.end();
});

test('verify points statistics', t => {
  viewPointCloud();

  var tileset = scene.primitives.add(
    new Tileset3D({
      url: POINT_CLOUD_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 0, 1000, 0);
  t.end();
});

test('verify triangle statistics', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_EMPTY_ROOT_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 40, 0, 480);
  t.end();
});

test('verify batched points statistics', t => {
  viewPointCloud();

  var tileset = scene.primitives.add(
    new Tileset3D({
      url: POINT_CLOUD_BATCHED_URL
    })
  );

  checkPointAndFeatureCounts(tileset, 8, 1000, 0);
  t.end();
});

test('verify memory usage statistics', t => {
  // Calculations in Batched3DModel3DTileContentSpec, minus uvs
  var singleTileGeometryMemory = 7440;
  var singleTileTextureMemory = 0;
  var singleTileBatchTextureMemory = 40;
  var singleTilePickTextureMemory = 40;
  var tilesLength = 5;

  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;

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

test('verify memory usage statistics for shared resources', t => {
  // Six tiles total:
  // * Two b3dm tiles - no shared resources
  // * Two i3dm tiles with embedded glTF - no shared resources
  // * Two i3dm tiles with external glTF - shared resources
  // Expect to see some saving with memory usage since two of the tiles share resources
  // All tiles reference the same external texture but texture caching is not supported yet
  // TODO : tweak test when #5051 is in

  var b3dmGeometryMemory = 840; // Only one box in the tile, unlike most other test tiles
  var i3dmGeometryMemory = 840;

  // Texture is 128x128 RGBA bytes, not mipmapped
  var texturesByteLength = 65536;

  var expectedGeometryMemory = b3dmGeometryMemory * 2 + i3dmGeometryMemory * 3;
  var expectedTextureMemory = texturesByteLength * 5;

  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_EXTERNAL_RESOURCES_URL).then(
    tileset => {
      var statistics = tileset._statistics;
      expect(statistics.geometryByteLength).toBe(expectedGeometryMemory);
      expect(statistics.texturesByteLength).toBe(expectedTextureMemory);
    }
  );
  t.end();
});

test('does not process tileset when screen space error is not met', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
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

test('does not select tiles when outside of view frustum', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
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

test('does not load additive tiles that are out of view', t => {
  viewBottomLeft();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.numberOfTilesWithContentReady, 2);
  });
  t.end();
});

test('culls with content box', t => {
  // Root tile has a content box that is half the extents of its box
  // Expect to cull root tile and three child tiles
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
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
  var length = tiles.length;
  for (var i = 0; i < length; ++i) {
    var tile = tiles[i];
    var contentHeader = tile._header.content;
    if (defined(contentHeader)) {
      if (contentHeader.uri.indexOf(uri) >= 0) {
        return tile;
      }
    }
  }
  return undefined;
  t.end();
}

test('selects children in front to back order', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    // After moving the camera left by 1.0 and down by 0.5, the distance from the camera should be in the order:
    // 1. lower left
    // 2. upper left
    // 3. lower right
    // 4. upper right

    scene.camera.moveLeft(1.0);
    scene.camera.moveDown(0.5);
    scene.renderForSpecs();

    var root = tileset.root;
    var llTile = findTileByUri(root.children, 'll.b3dm');
    var lrTile = findTileByUri(root.children, 'lr.b3dm');
    var urTile = findTileByUri(root.children, 'ur.b3dm');
    var ulTile = findTileByUri(root.children, 'ul.b3dm');

    var selectedTiles = tileset._selectedTiles;
    expect(selectedTiles[0]).toBe(root);
    expect(selectedTiles[1]).toBe(llTile);
    expect(selectedTiles[2]).toBe(ulTile);
    expect(selectedTiles[3]).toBe(lrTile);
    expect(selectedTiles[4]).toBe(urTile);
  });
});

function testDynamicScreenSpaceError(t, url, distance) {
  return Cesium3DTilesTester.loadTileset(scene, url).then(tileset => {
    var statistics = tileset._statistics;

    // Horizon view, only root is visible
    var center = Cartesian3.fromRadians(centerLongitude, centerLatitude);
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
  var children = tile.children;
  var length = children.length;
  var count = 0;
  for (var i = 0; i < length; ++i) {
    var child = children[i];
    if (!child.contentReady) {
      ++count;
    }
  }
  return count;
}

t.end();
// Adjust distances for each test because the dynamic SSE takes the
// bounding volume height into account, which differs for each bounding volume.
test('uses dynamic screen space error for tileset with region', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_REGION_URL, 103.0);
  t.end();
});

test('uses dynamic screen space error for tileset with bounding sphere', t => {
  testDynamicScreenSpaceError(t, WITH_BOUNDING_SPHERE_URL, 137.0);
  t.end();
});

test('uses dynamic screen space error for local tileset with box', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_BOX_URL, 103.0);
  t.end();
});

test('uses dynamic screen space error for local tileset with sphere', t => {
  testDynamicScreenSpaceError(t, WITH_TRANSFORM_SPHERE_URL, 144.0);
  t.end();
});

test('additive refinement - selects root when sse is met', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    // Meets screen space error, only root tile is rendered
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('additive refinement - selects all tiles when sse is not met', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    // Does not meet screen space error, all tiles are visible
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5);
    t.equals(statistics.numberOfCommands, 5);
  });
  t.end();
});

test("additive refinement - use parent's geometric error on child's box for early refinement", t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
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

test('additive refinement - selects tile when inside viewer request volume', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_VIEWER_REQUEST_VOLUME_URL).then(
    tileset => {
      var statistics = tileset._statistics;
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

test('replacement refinement - selects root when sse is met', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.root.refine = Cesium3DTileRefine.REPLACE;

    // Meets screen space error, only root tile is rendered
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('replacement refinement - selects children when sse is not met', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.root.refine = Cesium3DTileRefine.REPLACE;

    // Does not meet screen space error, child tiles replace root tile
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    t.equals(statistics.visited, 5); // Visits root, but does not render it
    t.equals(statistics.numberOfCommands, 4);
  });
  t.end();
});

test('replacement refinement - selects root when sse is not met and children are not ready', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var root = tileset.root;
    root.refine = Cesium3DTileRefine.REPLACE;

    // Set zoom to start loading child tiles
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    // LOD skipping visits all visible
    t.equals(statistics.visited, 5);
    // no stencil clear command because only the root tile
    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfPendingRequests, 4);
    t.equals(numberOfChildrenWithoutContent(root), 4);
  });
  t.end();
});

test('replacement refinement - selects tile when inside viewer request volume', t => {
  var options = {
    skipLevelOfDetail: false
  };
  return Cesium3DTilesTester.loadTileset(
    scene,
    TILESET_WITH_VIEWER_REQUEST_VOLUME_URL,
    options
  ).then(tileset => {
    var statistics = tileset._statistics;

    var root = tileset.root;
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

test('replacement refinement - selects upwards when traversal stops at empty tile', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_1_URL).then(tileset => {
    tileset.root.geometricError = 90;
    setZoom(80);
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    t.equals(statistics.selected, 1);
    t.equals(statistics.visited, 3);
    expect(isSelected(tileset, tileset.root)).toBe(true);
  });
  t.end();
});

test('replacement refinement - selects root when sse is not met and subtree is not refinable (1)', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_1_URL).then(tileset => {
    tileset.skipLevelOfDetail = false;
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    var root = tileset.root;

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

test('replacement refinement - selects root when sse is not met and subtree is not refinable (2)', t => {
  // Check that the root is refinable once its child is loaded
  //
  //          C
  //          E
  //        C   E
  //            C (smaller geometric error)
  //

  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_2_URL).then(tileset => {
    tileset.skipLevelOfDetail = false;
    var statistics = tileset._statistics;
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

test('replacement refinement - selects root when sse is not met and subtree is not refinable (3)', t => {
  // Check that the root is refinable once its child is loaded
  //
  //          C
  //          T (external tileset ref)
  //          E (root of external tileset)
  //     C  C  C  C
  //

  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    tileset.skipLevelOfDetail = false;
    var statistics = tileset._statistics;
    var root = tileset.root;
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

test('replacement and additive refinement', t => {
  //          A
  //      A       R (not rendered)
  //    R   A   R   A
  //
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REFINEMENT_MIX).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 7);
    t.equals(statistics.numberOfCommands, 6);
  });
  t.end();
});

test('children bound union optimization', tt => {
  test('does not select visible tiles with invisible children', t => {
    return Cesium3DTilesTester.loadTileset(
      scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      var center = Cartesian3.fromRadians(centerLongitude, centerLatitude, 22.0);
      scene.camera.lookAt(center, new HeadingPitchRange(0.0, 1.57, 1.0));

      var root = tileset.root;
      var childRoot = root.children[0];

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

  test('does not select external tileset whose root has invisible children', t => {
    return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
      var center = Cartesian3.fromRadians(centerLongitude, centerLatitude, 50.0);
      scene.camera.lookAt(center, new HeadingPitchRange(0.0, 1.57, 1.0));
      var root = tileset.root;
      var externalRoot = root.children[0];
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

  test('does not select visible tiles not meeting SSE with visible children', t => {
    return Cesium3DTilesTester.loadTileset(
      scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      var root = tileset.root;
      var childRoot = root.children[0];
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

  test('does select visible tiles meeting SSE with visible children', t => {
    return Cesium3DTilesTester.loadTileset(
      scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      var root = tileset.root;
      var childRoot = root.children[0];

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

  test('does select visible tiles with visible children failing request volumes', t => {
    var options = {
      cullWithChildrenBounds: false
    };
    viewRootOnly();
    return Cesium3DTilesTester.loadTileset(
      scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL,
      options
    ).then(tileset => {
      var root = tileset.root;
      var childRoot = root.children[0];

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

  test('does select visible tiles with visible children passing request volumes', t => {
    return Cesium3DTilesTester.loadTileset(
      scene,
      TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL
    ).then(tileset => {
      var root = tileset.root;
      var childRoot = root.children[0];
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

test('loads tileset with external tileset JSON file', t => {
  // Set view so that no tiles are loaded initially
  viewNothing();

  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    // Root points to an external tileset JSON file and has no children until it is requested
    var root = tileset.root;
    t.equals(root.children.length, 0);

    // Set view so that root's content is requested
    viewRootOnly();
    scene.renderForSpecs();
    return root.contentReadyPromise.then(function() {
      t.equals(root.hasTilesetContent, true);

      // Root has one child now, the root of the external tileset
      t.equals(root.children.length, 1);

      // Check that headers are equal
      var subtreeRoot = root.children[0];
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

test('preserves query string with external tileset JSON file', t => {
  // Set view so that no tiles are loaded initially
  viewNothing();

  //Spy on loadWithXhr so we can verify requested urls
  spyOn(Resource._Implementations, 'loadWithXhr').and.callThrough();

  var queryParams = 'a=1&b=boy';
  var expectedUrl =
    '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetOfTilesets/tileset.json?' + queryParams;
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL + '?' + queryParams)
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

test('renders tileset with external tileset JSON file', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 7); // Visits two tiles with tileset content, five tiles with b3dm content
    t.equals(statistics.numberOfCommands, 5); // Render the five tiles with b3dm content
  });
  t.end();
});

test('always visits external tileset root', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 2); // Visits external tileset tile, and external tileset root
    t.equals(statistics.numberOfCommands, 1); // Renders external tileset root
  });
  t.end();
});

test('set tile color', t => {
  return Cesium3DTilesTester.loadTileset(scene, NO_BATCH_IDS_URL).then(tileset => {
    // Get initial color
    var color;
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

test('debugFreezeFrame', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewRootOnly();
    scene.renderForSpecs();
    var statistics = tileset._statistics;
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
  return Cesium3DTilesTester.loadTileset(scene, url).then(tileset => {
    // Get initial color
    var color;
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

test('debugColorizeTiles for b3dm with batch table', t => {
  checkDebugColorizeTiles(WITH_BATCH_TABLE_URL);
  t.end();
});

test('debugColorizeTiles for b3dm without batch table', t => {
  checkDebugColorizeTiles(NO_BATCH_IDS_URL);
  t.end();
});

test('debugColorizeTiles for i3dm', t => {
  viewInstances();
  checkDebugColorizeTiles(INSTANCED_URL);
  t.end();
});

test('debugColorizeTiles for cmpt', t => {
  return checkDebugColorizeTiles(COMPOSITE_URL);
  t.end();
});

test('debugColorizeTiles for pnts with batch table', t => {
  viewPointCloud();
  return checkDebugColorizeTiles(POINT_CLOUD_BATCHED_URL);
  t.end();
});

test('debugColorizeTiles for pnts without batch table', t => {
  viewPointCloud();
  return checkDebugColorize;
  t.end();
  Tiles(POINT_CLOUD_URL);
});

test('debugWireframe', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewRootOnly();
    tileset.debugWireframe = true;
    scene.renderForSpecs();
    var commands = scene.frameState.commandList;
    var length = commands.length;
    var i;
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

test('debugShowBoundingVolume', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewRootOnly();
    tileset.debugShowBoundingVolume = true;
    scene.renderForSpecs();
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 2); // Tile command + bounding volume command

    tileset.debugShowBoundingVolume = false;
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('debugShowContentBoundingVolume', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewRootOnly();
    tileset.debugShowContentBoundingVolume = true;
    scene.renderForSpecs();
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 2); // Tile command + bounding volume command

    tileset.debugShowContentBoundingVolume = false;
    scene.renderForSpecs();
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('debugShowViewerRequestVolume', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_VIEWER_REQUEST_VOLUME_URL).then(
    tileset => {
      tileset.debugShowViewerRequestVolume = true;
      scene.renderForSpecs();
      var statistics = tileset._statistics;
      t.equals(statistics.visited, 6); // 1 empty root tile + 4 b3dm tiles + 1 pnts tile
      t.equals(statistics.numberOfCommands, 6); // 5 tile commands + viewer request volume command

      tileset.debugShowViewerRequestVolume = false;
      scene.renderForSpecs();
      t.equals(statistics.numberOfCommands, 5);
    }
  );
  t.end();
});

test('show tile debug labels with regions', t => {
  // TILESET_URL has bounding regions
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.debugShowGeometricError = true;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 5);

    var root = tileset.root;
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

test('show tile debug labels with boxes', t => {
  // TILESET_WITH_TRANSFORMS_URL has bounding boxes
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_TRANSFORMS_URL).then(tileset => {
    tileset.debugShowGeometricError = true;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 2);

    var root = tileset.root;
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

test('show tile debug labels with bounding spheres', t => {
  // TILESET_WITH_VIEWER_REQUEST_VOLUME_URL has bounding sphere
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_VIEWER_REQUEST_VOLUME_URL).then(
    tileset => {
      tileset.debugShowGeometricError = true;
      scene.renderForSpecs();

      var length = tileset._selectedTiles.length;
      expect(tileset._tileDebugLabels).toBeDefined();
      t.equals(tileset._tileDebugLabels.length, length);

      for (var i = 0; i < length; ++i) {
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

test('show tile debug labels with rendering statistics', t => {
  // TILESET_URL has bounding regions
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.debugShowRenderingStatistics = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 1);

    var content = tileset.root.content;
    var expected =
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

test('show tile debug labels with memory usage', t => {
  // TILESET_URL has bounding regions
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.debugShowMemoryUsage = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();
    t.equals(tileset._tileDebugLabels.length, 1);

    var expected = 'Texture Memory: 0\n' + 'Geometry Memory: 0.007';

    t.equals(tileset._tileDebugLabels._labels[0].text, expected);

    tileset.debugShowMemoryUsage = false;
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).not.toBeDefined();
  });
  t.end();
});

test('show tile debug labels with all statistics', t => {
  // TILESET_URL has bounding regions
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.debugShowGeometricError = true;
    tileset.debugShowRenderingStatistics = true;
    tileset.debugShowMemoryUsage = true;
    tileset.debugShowUrl = true;
    viewRootOnly();
    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();

    var expected =
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

test('show only picked tile debug label with all stats', t => {
  // TILESET_URL has bounding regions
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.debugShowGeometricError = true;
    tileset.debugShowRenderingStatistics = true;
    tileset.debugShowMemoryUsage = true;
    tileset.debugShowUrl = true;
    tileset.debugPickedTileLabelOnly = true;

    var scratchPosition = new Cartesian3(1.0, 1.0, 1.0);
    tileset.debugPickedTile = tileset.root;
    tileset.debugPickPosition = scratchPosition;

    scene.renderForSpecs();
    expect(tileset._tileDebugLabels).toBeDefined();

    var expected =
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

test('does not request tiles when picking', t => {
  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewRootOnly();
    scene.pickForSpecs();
    t.equals(tileset._statistics.numberOfPendingRequests, 0);
    scene.renderForSpecs();
    t.equals(tileset._statistics.numberOfPendingRequests, 1);
  });
  t.end();
});

test('does not process tiles when picking', t => {
  var spy = spyOn(Cesium3DTile.prototype, 'process').and.callThrough();

  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
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

test('does not request tiles when the request scheduler is full', t => {
  viewRootOnly(); // Root tiles are loaded initially
  var options = {
    skipLevelOfDetail: false
  };
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL, options).then(tileset => {
    // Try to load 4 children. Only 3 requests will go through, 1 will be attempted.
    var oldMaximumRequestsPerServer = RequestScheduler.maximumRequestsPerServer;
    RequestScheduler.maximumRequestsPerServer = 3;

    viewAllTiles();
    scene.renderForSpecs();

    t.equals(tileset._statistics.numberOfPendingRequests, 3);
    t.equals(tileset._statistics.numberOfAttemptedRequests, 1);

    RequestScheduler.maximumRequestsPerServer = oldMaximumRequestsPerServer;
  });
  t.end();
});

test('load progress events are raised', t => {
  // [numberOfPendingRequests, numberOfTilesProcessing]
  var results = [[1, 0], [0, 1], [0, 0]];
  var spyUpdate = jasmine.createSpy('listener');

  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.loadProgress.addEventListener(spyUpdate);
    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(spyUpdate.calls.count(), 3);
      t.equals(spyUpdate.calls.allArgs(), results);
    });
  });
  t.end();
});

test('tilesLoaded', t => {
  var tileset = scene.primitives.add(
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

test('all tiles loaded event is raised', t => {
  // Called first when only the root is visible and it becomes loaded, and then again when
  // the rest of the tileset is visible and all tiles are loaded.
  var spyUpdate1 = jasmine.createSpy('listener');
  var spyUpdate2 = jasmine.createSpy('listener');
  viewRootOnly();
  var tileset = scene.primitives.add(
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

test('tile visible event is raised', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var spyUpdate = jasmine.createSpy('listener');
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

test('tile load event is raised', t => {
  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var spyUpdate = jasmine.createSpy('listener');
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

test('tile failed event is raised', t => {
  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
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
    var spyUpdate = jasmine.createSpy('listener');
    tileset.tileFailed.addEventListener(spyUpdate);
    tileset.maximumMemoryUsage = 0;
    viewRootOnly();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(spyUpdate.calls.count(), 1);

      var arg = spyUpdate.calls.argsFor(0)[0];
      expect(arg).toBeDefined();
      expect(arg.url).toContain('parent.b3dm');
      expect(arg.message).toBeDefined();
    });
  });
  t.end();
});

test('destroys', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var root = tileset.root;
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

test('destroys before external tileset JSON file finishes loading', t => {
  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var root = tileset.root;

    viewRootOnly();
    scene.renderForSpecs(); // Request external tileset JSON file

    var statistics = tileset._statistics;
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

test('destroys before tile finishes loading', t => {
  viewRootOnly();
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  return tileset.readyPromise.then(tileset => {
    var root = tileset.root;
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

test('renders with imageBaseLightingFactor', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(tileset => {
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba).not.toEqual([0, 0, 0, 255]);
      tileset.imageBasedLightingFactor = new Cartesian2(0.0, 0.0);
      expect(scene).notToRender(rgba);
    });
  });
  t.end();
});

test('renders with lightColor', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(tileset => {
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
});

////////////////////////////////////////////
t.end(); ///////////////////////////////
// Styling tests

test('applies show style to a tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(tileset => {
    var hideStyle = new Cesium3DTileStyle({show: 'false'});
    tileset.style = hideStyle;
    expect(tileset.style).toBe(hideStyle);
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('applies show style to a tileset without features', t => {
  return Cesium3DTilesTester.loadTileset(scene, NO_BATCH_IDS_URL).then(tileset => {
    var hideStyle = new Cesium3DTileStyle({show: 'false'});
    tileset.style = hideStyle;
    expect(tileset.style).toBe(hideStyle);
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('applies style with complex show expression to a tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    // Each feature in the b3dm file has an id property from 0 to 9
    // ${id} >= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({show: '${id} >= 50 * 2'});
    expect(scene).toRender([0, 0, 0, 255]);

    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({show: '${id} < 200 / 2'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('applies show style to a tileset with a composite tile', t => {
  return Cesium3DTilesTester.loadTileset(scene, COMPOSITE_URL).then(tileset => {
    tileset.style = new Cesium3DTileStyle({show: 'false'});
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

function expectColorStyle(tileset) {
  var color;
  expect(scene).toRenderAndCall(rgba => {
    color = rgba;
  });

  tileset.style = new Cesium3DTileStyle({color: 'color("blue")'});
  expect(scene).toRenderAndCall(rgba => {
    t.equals(rgba[0], 0);
    t.equals(rgba[1], 0);
    expect(rgba[2]).toBeGreaterThan(0);
    t.equals(rgba[3], 255);
  });

  // set color to transparent
  tileset.style = new Cesium3DTileStyle({color: 'color("blue", 0.0)'});
  expect(scene).toRender([0, 0, 0, 255]);

  tileset.style = new Cesium3DTileStyle({color: 'color("cyan")'});
  expect(scene).toRenderAndCall(rgba => {
    t.equals(rgba[0], 0);
    expect(rgba[1]).toBeGreaterThan(0);
    expect(rgba[2]).toBeGreaterThan(0);
    t.equals(rgba[3], 255);
  });

  // Remove style
  tileset.style = undefined;
  expect(scene).toRender(color);
  t.end();
}

test('applies color style to a tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(tileset => {
    expectColorStyle(tileset);
  });
  t.end();
});

test('applies color style to a tileset with translucent tiles', t => {
  return Cesium3DTilesTester.loadTileset(scene, TRANSLUCENT_URL).then(tileset => {
    expectColorStyle(tileset);
  });
  t.end();
});

test('applies color style to a tileset with translucent and opaque tiles', t => {
  return Cesium3DTilesTester.loadTileset(scene, TRANSLUCENT_OPAQUE_MIX_URL).then(tileset => {
    expectColorStyle(tileset);
  });
  t.end();
});

test('applies color style to tileset without features', t => {
  return Cesium3DTilesTester.loadTileset(scene, NO_BATCH_IDS_URL).then(tileset => {
    expectColorStyle(tileset);
  });
  t.end();
});

test('applies style when feature properties change', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    // Initially, all feature ids are less than 10
    tileset.style = new Cesium3DTileStyle({show: '${id} < 10'});
    expect(scene).notToRender([0, 0, 0, 255]);

    // Change feature ids so the show expression will evaluate to false
    var content = tileset.root.content;
    var length = content.featuresLength;
    var i;
    var feature;
    for (i = 0; i < length; ++i) {
      feature = content.getFeature(i);
      feature.setProperty('id', feature.getProperty('id') + 10);
    }
    expect(scene).toRender([0, 0, 0, 255]);

    // Change ids back
    for (i = 0; i < length; ++i) {
      feature = content.getFeature(i);
      feature.setProperty('id', feature.getProperty('id') - 10);
    }
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('applies style when tile is selected after new style is applied', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    var feature = tileset.root.content.getFeature(0);
    tileset.style = new Cesium3DTileStyle({color: 'color("red")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.RED);

    tileset.style = new Cesium3DTileStyle({color: 'color("blue")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.BLUE);

    viewNothing();
    tileset.style = new Cesium3DTileStyle({color: 'color("lime")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.BLUE); // Hasn't been selected yet

    viewAllTiles();
    scene.renderForSpecs();
    t.equals(feature.color, Color.LIME);

    // Feature's show property is preserved if the style hasn't changed and the feature is newly selected
    feature.show = false;
    scene.renderForSpecs();
    expect(feature.show).toBe(false);
    viewNothing();
    scene.renderForSpecs();
    expect(feature.show).toBe(false);
    viewAllTiles();
    expect(feature.show).toBe(false);
  });
  t.end();
});

test('does not reapply style during pick pass', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    tileset.style = new Cesium3DTileStyle({color: 'color("red")'});
    scene.renderForSpecs();
    expect(tileset._statisticsLastRender.numberOfTilesStyled).toBe(1);
    scene.pickForSpecs();
    expect(tileset._statisticsLastPick.numberOfTilesStyled).toBe(0);
  });
  t.end();
});

test('applies style with complex color expression to a tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    // Each feature in the b3dm file has an id property from 0 to 9
    // ${id} >= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({
      color: '(${id} >= 50 * 2) ? color("red") : color("blue")'
    });
    expect(scene).toRenderAndCall(rgba => {
      t.equals(rgba[0], 0);
      t.equals(rgba[1], 0);
      expect(rgba[2]).toBeGreaterThan(0);
      t.equals(rgba[3], 255);
    });

    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({
      color: '(${id} < 50 * 2) ? color("red") : color("blue")'
    });
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      t.equals(rgba[1], 0);
      t.equals(rgba[2], 0);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
});

test('applies conditional color style to a tileset', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({
      color: {
        conditions: [['${id} < 10', 'color("red")'], ['true', 'color("blue")']]
      }
    });
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      t.equals(rgba[1], 0);
      t.equals(rgba[2], 0);
      t.equals(rgba[3], 255);
    });

    // ${id}>= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({
      color: {
        conditions: [['${id} >= 10', 'color("red")'], ['true', 'color("blue")']]
      }
    });
    expect(scene).toRenderAndCall(rgba => {
      t.equals(rgba[0], 0);
      t.equals(rgba[1], 0);
      expect(rgba[2]).toBeGreaterThan(0);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
});

test('loads style from uri', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(tileset => {
    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle(STYLE_URL);
    return tileset.style.readyPromise
      .then(function(style) {
        expect(scene).toRenderAndCall(rgba => {
          expect(rgba[0]).toBeGreaterThan(0);
          t.equals(rgba[1], 0);
          t.equals(rgba[2], 0);
          t.equals(rgba[3], 255);
        });
      })
      .otherwise(function(error) {
        expect(error).not.toBeDefined();
      });
  });
  t.end();
});

test('applies custom style to a tileset', t => {
  var style = new Cesium3DTileStyle();
  style.show = {
    evaluate: function(feature) {
      return this._value;
    },
    _value: false
  };
  style.color = {
    evaluateColor: function(feature, result) {
      return Color.clone(Color.WHITE, result);
    }
  };

  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(tileset => {
    tileset.style = style;
    expect(tileset.style).toBe(style);
    expect(scene).toRender([0, 0, 0, 255]);

    style.show._value = true;
    tileset.makeStyleDirty();
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

function testColorBlendMode(url) {
  return Cesium3DTilesTester.loadTileset(scene, url).then(tileset => {
    tileset.luminanceAtZenith = undefined;

    // Check that the feature is red
    var sourceRed;
    var renderOptions = {
      scene: scene,
      time: new JulianDate(2457522.154792)
    };
    expect(renderOptions).toRenderAndCall(rgba => {
      sourceRed = rgba[0];
    });

    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(200);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use HIGHLIGHT blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

    // Style with dark yellow. Expect the red channel to be darker than before.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect the red channel to be darker than before.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use REPLACE blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.REPLACE;

    // Style with dark yellow. Expect the red and green channels to be roughly dark yellow.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    var replaceRed;
    var replaceGreen;
    expect(renderOptions).toRenderAndCall(rgba => {
      replaceRed = rgba[0];
      replaceGreen = rgba[1];
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(255);
      expect(rgba[1]).toBeGreaterThan(100);
      expect(rgba[1]).toBeLessThan(255);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect the red and green channels to be a shade of yellow.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(255);
      expect(rgba[1]).toBeGreaterThan(100);
      expect(rgba[1]).toBeLessThan(255);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use MIX blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.MIX;
    tileset.colorBlendAmount = 0.5;

    // Style with dark yellow. Expect color to be a mix of the source and style colors.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    var mixRed;
    var mixGreen;
    expect(renderOptions).toRenderAndCall(rgba => {
      mixRed = rgba[0];
      mixGreen = rgba[1];
      expect(rgba[0]).toBeGreaterThan(replaceRed);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeGreaterThan(50);
      expect(rgba[1]).toBeLessThan(replaceGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 0.25. Expect color to be closer to the source color.
    tileset.colorBlendAmount = 0.25;
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(mixRed);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeGreaterThan(0);
      expect(rgba[1]).toBeLessThan(mixGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 0.0. Expect color to equal the source color
    tileset.colorBlendAmount = 0.0;
    expect(renderOptions).toRenderAndCall(rgba => {
      t.equals(rgba[0], sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 1.0. Expect color to equal the style color
    tileset.colorBlendAmount = 1.0;
    expect(renderOptions).toRenderAndCall(rgba => {
      t.equals(rgba[0], replaceRed);
      t.equals(rgba[1], replaceGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect color to be a mix of the source and style colors.
    tileset.colorBlendAmount = 0.5;
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      expect(rgba[1]).toBeGreaterThan(0);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
}

test('sets colorBlendMode', t => {
  return testColorBlendMode(COLORS_URL);
  t.end();
});

test('sets colorBlendMode when vertex texture fetch is not supported', t => {
  // Disable VTF
  var maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  ContextLimits._maximumVertexTextureImageUnits = 0;
  return testColorBlendMode(COLORS_URL).then(function() {
    // Re-enable VTF
    ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;
  });
  t.end();
});

test('sets colorBlendMode for textured tileset', t => {
  return testColorBlendMode(TEXTURED_URL);
  t.end();
});

test('sets colorBlendMode for instanced tileset', t => {
  viewInstances();
  return testColorBlendMode(INSTANCED_RED_MATERIAL_URL);
  t.end();
});

test('sets colorBlendMode for vertex color tileset', t => {
  return testColorBlendMode(BATCHED_VERTEX_COLORS_URL);
});

///////////////////////////////////////////////////////////////////////////
t.end();
// Cache replacement tests

test('Unload all cached tiles not required to meet SSE using maximumMemoryUsage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles
    t.equals(tileset.totalMemoryUsageInBytes, 37200); // Specific to this tileset

    // Zoom out so only root tile is needed to meet SSE.  This unloads
    // the four children since the maximum memory usage is zero.
    viewRootOnly();
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 1);
    t.equals(statistics.numberOfTilesWithContentReady, 1);
    t.equals(tileset.totalMemoryUsageInBytes, 7440); // Specific to this tileset

    // Zoom back in so all four children are re-requested.
    viewAllTiles();

    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(function() {
      t.equals(statistics.numberOfCommands, 5);
      t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles
      t.equals(tileset.totalMemoryUsageInBytes, 37200); // Specific to this tileset
    });
  });
  t.end();
});

test('Unload some cached tiles not required to meet SSE using maximumMemoryUsage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0.025; // Just enough memory to allow 3 tiles to remain
    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
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

test('Unloads cached tiles outside of the view frustum using maximumMemoryUsage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0;

    scene.renderForSpecs();
    var statistics = tileset._statistics;
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

test('Unloads cached tiles in a tileset with external tileset JSON file using maximumMemoryUsage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var statistics = tileset._statistics;
    var cacheList = tileset._cache._list;

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

test('Unloads cached tiles in a tileset with empty tiles using maximumMemoryUsage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_EMPTY_ROOT_URL).then(tileset => {
    var statistics = tileset._statistics;

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

test('Unload cached tiles when a tileset uses replacement refinement using maximumMemoryUsage', t => {
  // No children have content, but all grandchildren have content
  //
  //          C
  //      E       E
  //    C   C   C   C
  //
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_1_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0; // Only root needs to be visible

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
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

test('Explicitly unloads cached tiles with trimLoadedTiles', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0.05;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
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

test('tileUnload event is raised', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    tileset.maximumMemoryUsage = 0;

    // Render parent and four children (using additive refinement)
    viewAllTiles();
    scene.renderForSpecs();

    var statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, 5);
    t.equals(statistics.numberOfTilesWithContentReady, 5); // Five loaded tiles

    // Zoom out so only root tile is needed to meet SSE.  All the
    // children are unloaded since max number of loaded tiles is one.
    viewRootOnly();
    var spyUpdate = jasmine.createSpy('listener');
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

test('maximumMemoryUsage throws when negative', t => {
  var tileset = new Tileset3D({
    url: TILESET_URL
  });
  expect(function() {
    tileset.maximumMemoryUsage = -1;
  }).toThrowDeveloperError();
  t.end();
});

test('maximumScreenSpaceError throws when negative', t => {
  var tileset = new Tileset3D({
    url: TILESET_URL
  });
  expect(function() {
    tileset.maximumScreenSpaceError = -1;
  }).toThrowDeveloperError();
  t.end();
});

test('propagates tile transform down the tree', t => {
  var b3dmCommands = 1;
  var i3dmCommands = scene.context.instancedArrays ? 1 : 25; // When instancing is not supported there is one command per instance
  var totalCommands = b3dmCommands + i3dmCommands;
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_TRANSFORMS_URL).then(tileset => {
    var statistics = tileset._statistics;
    var root = tileset.root;
    var rootTransform = Matrix4.unpack(root._header.transform);

    var child = root.children[0];
    var childTransform = Matrix4.unpack(child._header.transform);
    var computedTransform = Matrix4.multiply(rootTransform, childTransform, new Matrix4());

    expect(statistics.numberOfCommands).toBe(totalCommands);
    t.equals(root.computedTransform, rootTransform);
    t.equals(child.computedTransform, computedTransform);

    // Set the tileset's modelMatrix
    var tilesetTransform = Matrix4.fromTranslation(new Cartesian3(0.0, 1.0, 0.0));
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

test('does not mark tileset as refining when tiles have selection depth 0', t => {
  viewRootOnly();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    viewAllTiles();
    scene.renderForSpecs();
    var statistics = tileset._statistics;
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

test('marks tileset as mixed when tiles have nonzero selection depth', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    var statistics = tileset._statistics;

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

test('adds stencil clear command first when unresolved', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    tileset.root.children[0].children[0].children[0].unloadContent();
    tileset.root.children[0].children[0].children[1].unloadContent();
    tileset.root.children[0].children[0].children[2].unloadContent();

    scene.renderForSpecs();
    var commandList = scene.frameState.commandList;
    expect(commandList[0] instanceof ClearCommand).toBe(true);
    expect(commandList[0].stencil).toBe(0);
  });
  t.end();
});

test('creates duplicate backface commands', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    var statistics = tileset._statistics;
    var root = tileset.root;

    tileset.root.children[0].children[0].children[0].unloadContent();
    tileset.root.children[0].children[0].children[1].unloadContent();
    tileset.root.children[0].children[0].children[2].unloadContent();

    scene.renderForSpecs();

    // 2 for root tile, 1 for child, 1 for stencil clear
    // Tiles that are marked as finalResolution, including leaves, do not create back face commands
    t.equals(statistics.numberOfCommands, 4);
    expect(isSelected(tileset, root)).toBe(true);
    expect(root._finalResolution).toBe(false);
    expect(isSelected(tileset, root.children[0].children[0].children[3])).toBe(true);
    expect(root.children[0].children[0].children[3]._finalResolution).toBe(true);
    expect(tileset._hasMixedContent).toBe(true);

    var commandList = scene.frameState.commandList;
    var rs = commandList[1].renderState;
    expect(rs.cull.enabled).toBe(true);
    expect(rs.cull.face).toBe(CullFace.FRONT);
    expect(rs.polygonOffset.enabled).toBe(true);
  });
  t.end();
});

test('does not create duplicate backface commands if no selected descendants', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    var statistics = tileset._statistics;
    var root = tileset.root;

    tileset.root.children[0].children[0].children[0].unloadContent();
    tileset.root.children[0].children[0].children[1].unloadContent();
    tileset.root.children[0].children[0].children[2].unloadContent();
    tileset.root.children[0].children[0].children[3].unloadContent();

    scene.renderForSpecs();

    // 2 for root tile, 1 for child, 1 for stencil clear
    t.equals(statistics.numberOfCommands, 1);
    expect(isSelected(tileset, root)).toBe(true);
    expect(root._finalResolution).toBe(true);
    expect(isSelected(tileset, root.children[0].children[0].children[0])).toBe(false);
    expect(isSelected(tileset, root.children[0].children[0].children[1])).toBe(false);
    expect(isSelected(tileset, root.children[0].children[0].children[2])).toBe(false);
    expect(isSelected(tileset, root.children[0].children[0].children[3])).toBe(false);
    expect(tileset._hasMixedContent).toBe(false);
  });
  t.end();
});

test('does not add commands or stencil clear command with no selected tiles', t => {
  var tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  scene.renderForSpecs();
  var statistics = tileset._statistics;
  t.equals(tileset._selectedTiles.length, 0);
  t.equals(statistics.numberOfCommands, 0);
  t.end();
});

test('does not add stencil clear command or backface commands when fully resolved', t => {
  viewAllTiles();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, tileset._selectedTiles.length);

    var commandList = scene.frameState.commandList;
    var length = commandList.length;
    for (var i = 0; i < length; ++i) {
      var command = commandList[i];
      expect(command instanceof ClearCommand).toBe(false);
      expect(command.renderState.cull.face).not.toBe(CullFace.FRONT);
    }
  });
  t.end();
});

test('loadSiblings', t => {
  viewBottomLeft();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_REPLACEMENT_3_URL, {
    loadSiblings: false
  }).then(tileset => {
    var statistics = tileset._statistics;
    expect(statistics.numberOfTilesWithContentReady).toBe(2);
    tileset.loadSiblings = true;
    scene.renderForSpecs();
    return Cesium3DTilesTester.waitForTilesLoaded(scene, tileset).then(tileset => {
      expect(statistics.numberOfTilesWithContentReady).toBe(5);
    });
  });
  t.end();
});

test('immediatelyLoadDesiredLevelOfDetail', t => {
  viewNothing();
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL, {
    immediatelyLoadDesiredLevelOfDetail: true
  }).then(tileset => {
    var root = tileset.root;
    var child = findTileByUri(root.children, 'll.b3dm');
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

test('selects children if no ancestors available', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var statistics = tileset._statistics;
    var parent = tileset.root.children[0];
    var child = parent.children[3].children[0];
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

test('tile expires', t => {
  return Cesium3DTilesTester.loadTileset(scene, BATCHED_EXPIRATION_URL).then(tileset => {
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
    var tile = tileset.root;
    var statistics = tileset._statistics;
    var expiredContent;
    tileset.style = new Cesium3DTileStyle({
      color: 'color("red")'
    });

    // Check that expireDuration and expireDate are correctly set
    var expireDate = JulianDate.addSeconds(JulianDate.now(), 5.0, new JulianDate());
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
    var originalMaxmimumRequests = RequestScheduler.maximumRequests;
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
    var url = Resource._Implementations.loadWithXhr.calls.first().args[0];
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
  var uint8Array = new Uint8Array(arrayBuffer);
  var jsonString = getStringFromTypedArray(uint8Array);
  var json = JSON.parse(jsonString);
  json.root.children.splice(0, 1);

  jsonString = JSON.stringify(json);
  var length = jsonString.length;
  uint8Array = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    uint8Array[i] = jsonString.charCodeAt(i);
  }
  return uint8Array.buffer;
  t.end();
}

test('tile with tileset content expires', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_SUBTREE_EXPIRATION_URL).then(tileset => {
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
      var newDeferred = when.defer();
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

    var subtreeRoot = tileset.root.children[0];
    var subtreeChildren = subtreeRoot.children[0].children;
    var childrenLength = subtreeChildren.length;
    var statistics = tileset._statistics;

    // Check statistics
    expect(statistics.numberOfCommands).toBe(5);
    expect(statistics.numberOfTilesTotal).toBe(7);
    expect(statistics.numberOfTilesWithContentReady).toBe(5);

    // Trigger expiration to happen next frame
    subtreeRoot.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // Listen to tile unload events
    var spyUpdate = jasmine.createSpy('listener');
    tileset.tileUnload.addEventListener(spyUpdate);

    // Tiles in the subtree are removed from the cache and destroyed.
    scene.renderForSpecs(); // Becomes expired
    scene.renderForSpecs(); // Makes request
    t.equals(subtreeRoot.children, []);
    for (var i = 0; i < childrenLength; ++i) {
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

test('tile expires and request fails', t => {
  return Cesium3DTilesTester.loadTileset(scene, BATCHED_EXPIRATION_URL).then(tileset => {
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
    var tile = tileset.root;
    var statistics = tileset._statistics;

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

test('tile expiration date', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var tile = tileset.root;

    // Trigger expiration to happen next frame
    tile.expireDate = JulianDate.addSeconds(JulianDate.now(), -1.0, new JulianDate());

    // Stays in the expired state until the request goes through
    var originalMaxmimumRequests = RequestScheduler.maximumRequests;
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

test('supports content data URIs', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL_WITH_CONTENT_URI).then(tileset => {
    var statistics = tileset._statistics;
    t.equals(statistics.visited, 1);
    t.equals(statistics.numberOfCommands, 1);
  });
  t.end();
});

test('destroys attached ClippingPlaneCollections and ClippingPlaneCollections that have been detached', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var clippingPlaneCollection1 = new ClippingPlaneCollection({
      planes: [new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0)]
    });
    expect(clippingPlaneCollection1.owner).not.toBeDefined();

    tileset.clippingPlanes = clippingPlaneCollection1;
    var clippingPlaneCollection2 = new ClippingPlaneCollection({
      planes: [new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0)]
    });

    tileset.clippingPlanes = clippingPlaneCollection2;
    expect(clippingPlaneCollection1.isDestroyed()).toBe(true);

    scene.primitives.remove(tileset);
    expect(clippingPlaneCollection2.isDestroyed()).toBe(true);
  });
  t.end();
});

test('throws a DeveloperError when given a ClippingPlaneCollection attached to another Tileset', t => {
  var clippingPlanes;
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL)
    .then(function(tileset1) {
      clippingPlanes = new ClippingPlaneCollection({
        planes: [new ClippingPlane(Cartesian3.UNIT_X, 0.0)]
      });
      tileset1.clippingPlanes = clippingPlanes;

      return Cesium3DTilesTester.loadTileset(scene, TILESET_URL);
    })
    .then(function(tileset2) {
      expect(function() {
        tileset2.clippingPlanes = clippingPlanes;
      }).toThrowDeveloperError();
    });
  t.end();
});

test('clipping planes cull hidden tiles', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

    expect(visibility).not.toBe(CullingVolume.MASK_OUTSIDE);

    var plane = new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0);
    tileset.clippingPlanes = new ClippingPlaneCollection({
      planes: [plane]
    });

    visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

    expect(visibility).toBe(CullingVolume.MASK_OUTSIDE);

    plane.distance = 0.0;
    visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

    expect(visibility).not.toBe(CullingVolume.MASK_OUTSIDE);
  });
  t.end();
});

test('clipping planes cull hidden content', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var visibility = tileset.root.contentVisibility(scene.frameState);

    expect(visibility).not.toBe(Intersect.OUTSIDE);

    var plane = new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0);
    tileset.clippingPlanes = new ClippingPlaneCollection({
      planes: [plane]
    });

    visibility = tileset.root.contentVisibility(scene.frameState);

    expect(visibility).toBe(Intersect.OUTSIDE);

    plane.distance = 0.0;
    visibility = tileset.root.contentVisibility(scene.frameState);

    expect(visibility).not.toBe(Intersect.OUTSIDE);
  });
  t.end();
});

test('clipping planes cull tiles completely inside clipping region', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
    var statistics = tileset._statistics;
    var root = tileset.root;

    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 5);

    tileset.update(scene.frameState);

    var radius = 287.0736139905632;

    var plane = new ClippingPlane(Cartesian3.UNIT_X, radius);
    tileset.clippingPlanes = new ClippingPlaneCollection({
      planes: [plane]
    });

    tileset.update(scene.frameState);
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 5);
    expect(root._isClipped).toBe(false);

    plane.distance = -1;

    tileset.update(scene.frameState);
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 3);
    expect(root._isClipped).toBe(true);

    plane.distance = -radius;

    tileset.update(scene.frameState);
    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 0);
    expect(root._isClipped).toBe(true);
  });
  t.end();
});

test('clipping planes cull tiles completely inside clipping region for i3dm', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_WITH_EXTERNAL_RESOURCES_URL).then(
    tileset => {
      var statistics = tileset._statistics;
      var root = tileset.root;

      scene.renderForSpecs();

      t.equals(statistics.numberOfCommands, 6);

      tileset.update(scene.frameState);

      var radius = 142.19001637409772;

      var plane = new ClippingPlane(Cartesian3.UNIT_Z, radius);
      tileset.clippingPlanes = new ClippingPlaneCollection({
        planes: [plane]
      });

      tileset.update(scene.frameState);
      scene.renderForSpecs();

      t.equals(statistics.numberOfCommands, 6);
      expect(root._isClipped).toBe(false);

      plane.distance = 0;

      tileset.update(scene.frameState);
      scene.renderForSpecs();

      t.equals(statistics.numberOfCommands, 6);
      expect(root._isClipped).toBe(true);

      plane.distance = -radius;

      tileset.update(scene.frameState);
      scene.renderForSpecs();

      t.equals(statistics.numberOfCommands, 0);
      expect(root._isClipped).toBe(true);
    }
  );
  t.end();
});

test('clippingPlanesOriginMatrix has correct orientation', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_TRANSFORM_BOX_URL).then(tileset => {
    // The bounding volume of this tileset puts it under the surface, so no
    // east-north-up should be applied. Check that it matches the orientation
    // of the original transform.
    var offsetMatrix = tileset.clippingPlanesOriginMatrix;

    expect(Matrix4.equals(offsetMatrix, tileset.root.computedTransform)).toBe(true);

    return Cesium3DTilesTester.loadTileset(scene, TILESET_URL).then(tileset => {
      // The bounding volume of this tileset puts it on the surface,
      //  so we want to apply east-north-up as our best guess.
      offsetMatrix = tileset.clippingPlanesOriginMatrix;
      // The clipping plane matrix is not the same as the original because we applied east-north-up.
      expect(Matrix4.equals(offsetMatrix, tileset.root.computedTransform)).toBe(false);

      // But they have the same translation.
      var clippingPlanesOrigin = Matrix4.getTranslation(offsetMatrix, new Cartesian3());
      expect(Cartesian3.equals(tileset.root.boundingSphere.center, clippingPlanesOrigin)).toBe(
        true
      );
    });
  });
  t.end();
});

test('clippingPlanesOriginMatrix matches root tile bounding sphere', t => {
  return Cesium3DTilesTester.loadTileset(scene, TILESET_OF_TILESETS_URL).then(tileset => {
    var offsetMatrix = Matrix4.clone(tileset.clippingPlanesOriginMatrix, new Matrix4());
    var boundingSphereEastNorthUp = Transforms.eastNorthUpToFixedFrame(
      tileset.root.boundingSphere.center
    );
    expect(Matrix4.equals(offsetMatrix, boundingSphereEastNorthUp)).toBe(true);

    // Changing the model matrix should change the clipping planes matrix
    tileset.modelMatrix = Matrix4.fromTranslation(new Cartesian3(100, 0, 0));
    scene.renderForSpecs();
    expect(Matrix4.equals(offsetMatrix, tileset.clippingPlanesOriginMatrix)).toBe(false);

    boundingSphereEastNorthUp = Transforms.eastNorthUpToFixedFrame(
      tileset.root.boundingSphere.center
    );
    offsetMatrix = tileset.clippingPlanesOriginMatrix;
    expect(offsetMatrix).toEqualEpsilon(boundingSphereEastNorthUp, CesiumMath.EPSILON3);
  });
});

function sampleHeightMostDetailed(cartographics, objectsToExclude) {
  var result;
  var completed = false;
  scene.sampleHeightMostDetailed(cartographics, objectsToExclude).then(function(pickResult) {
    result = pickResult;
    completed = true;
  });
  return pollToPromise(function() {
    // Scene requires manual updates in the tests to move along the promise
    scene.render();
    return completed;
  }).then(function() {
    return result;
  });
}

function drillPickFromRayMostDetailed(ray, limit, objectsToExclude) {
  var result;
  var completed = false;
  scene.drillPickFromRayMostDetailed(ray, limit, objectsToExclude).then(function(pickResult) {
    result = pickResult;
    completed = true;
  });
  return pollToPromise(function() {
    // Scene requires manual updates in the tests to move along the promise
    scene.render();
    return completed;
  }).then(function() {
    return result;
  });
}

test('most detailed height queries', tt => {
  test('tileset is offscreen', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    // Tileset uses replacement refinement so only one tile should be loaded and selected during most detailed picking
    var centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    var cartographics = [centerCartographic];

    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      return sampleHeightMostDetailed(cartographics).then(function() {
        expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
        var statisticsAsync = tileset._statisticsLastAsync;
        var statisticsRender = tileset._statisticsLastRender;
        expect(statisticsAsync.numberOfCommands).toBe(1);
        expect(statisticsAsync.numberOfTilesWithContentReady).toBe(1);
        expect(statisticsAsync.selected).toBe(1);
        expect(statisticsAsync.visited).toBeGreaterThan(1);
        expect(statisticsAsync.numberOfTilesTotal).toBe(21);
        expect(statisticsRender.selected).toBe(0);
      });
    });
    t.end();
  });

  test('tileset is onscreen', t => {
    if (webglStub) {
      return;
    }

    viewAllTiles();

    // Tileset uses replacement refinement so only one tile should be loaded and selected during most detailed picking
    var centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    var cartographics = [centerCartographic];

    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      return sampleHeightMostDetailed(cartographics).then(function() {
        expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
        var statisticsAsync = tileset._statisticsLastAsync;
        var statisticsRender = tileset._statisticsLastRender;
        expect(statisticsAsync.numberOfCommands).toBe(1);
        expect(statisticsAsync.numberOfTilesWithContentReady).toBeGreaterThan(1);
        expect(statisticsAsync.selected).toBe(1);
        expect(statisticsAsync.visited).toBeGreaterThan(1);
        expect(statisticsAsync.numberOfTilesTotal).toBe(21);
        expect(statisticsRender.selected).toBeGreaterThan(0);
      });
    });
    t.end();
  });

  test('tileset uses additive refinement', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    var originalLoadJson = Tileset3D.loadJson;
    spyOn(Tileset3D, 'loadJson').and.callFake(function(TILESET_URL) {
      return originalLoadJson(TILESET_URL).then(function(tilesetJson) {
        tilesetJson.root.refine = 'ADD';
        return tilesetJson;
      });
    });

    var offcenterCartographic = new Cartographic(
      -1.3196754112739246,
      0.6988705057695633,
      2.467395745774971
    );
    var cartographics = [offcenterCartographic];

    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      return sampleHeightMostDetailed(cartographics).then(function() {
        var statistics = tileset._statisticsLastAsync;
        expect(offcenterCartographic.height).toEqualEpsilon(7.407, CesiumMath.EPSILON1);
        expect(statistics.numberOfCommands).toBe(3); // One for each level of the tree
        expect(statistics.numberOfTilesWithContentReady).toBeGreaterThanOrEqualTo(3);
        expect(statistics.selected).toBe(3);
        expect(statistics.visited).toBeGreaterThan(3);
        expect(statistics.numberOfTilesTotal).toBe(21);
      });
    });
    t.end();
  });

  test('drill picks multiple features when tileset uses additive refinement', t => {
    if (webglStub) {
      return;
    }

    viewNothing();
    var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);

    var originalLoadJson = Tileset3D.loadJson;
    spyOn(Tileset3D, 'loadJson').and.callFake(function(TILESET_URL) {
      return originalLoadJson(TILESET_URL).then(function(tilesetJson) {
        tilesetJson.root.refine = 'ADD';
        return tilesetJson;
      });
    });

    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      return drillPickFromRayMostDetailed(ray).then(function(results) {
        expect(results.length).toBe(3);
        expect(results[0].object.content.url.indexOf('0_0_0.b3dm') > -1).toBe(true);
        expect(results[1].object.content.url.indexOf('1_1_1.b3dm') > -1).toBe(true);
        expect(results[2].object.content.url.indexOf('2_4_4.b3dm') > -1).toBe(true);
        console.log(results);
      });
    });
    t.end();
  });

  test('works when tileset cache is disabled', t => {
    if (webglStub) {
      return;
    }
    viewNothing();
    var centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    var cartographics = [centerCartographic];
    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      tileset.maximumMemoryUsage = 0;
      return sampleHeightMostDetailed(cartographics).then(function() {
        expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
      });
    });
    t.end();
  });

  test('multiple samples', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    var centerCartographic = new Cartographic(-1.3196799798348215, 0.6988740001506679);
    var offcenterCartographic = new Cartographic(-1.3196754112739246, 0.6988705057695633);
    var missCartographic = new Cartographic(-1.3196096042084076, 0.6988703290845706);
    var cartographics = [centerCartographic, offcenterCartographic, missCartographic];

    return Cesium3DTilesTester.loadTileset(scene, TILESET_UNIFORM).then(tileset => {
      return sampleHeightMostDetailed(cartographics).then(function() {
        expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
        expect(offcenterCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
        expect(missCartographic.height).toBeUndefined();
        expect(tileset._statisticsLastAsync.numberOfTilesWithContentReady).toBe(2);
      });
    });
    t.end();
  });

  tt.end();
});
