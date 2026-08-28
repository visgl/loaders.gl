// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import {coreApi, load} from '@loaders.gl/core';
import {I3SSource, Tile3D, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {getI3sTileHeader} from '@loaders.gl/i3s/test/test-utils/load-utils';
// import {loadTileset} from '../utils/load-utils';
// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json';
const KTX2_TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/VNext/agi-ktx2/tileset.json';
const TILESET_GLOBAL_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetGlobal/tileset.json';
/*
// Parent tile with no content and four child tiles with content
const TILESET_EMPTY_ROOT_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetEmptyRoot/tileset.json';

// Tileset with 3 levels of uniform subdivision
const TILESET_UNIFORM = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetUniform/tileset.json';

const TILESET_REPLACEMENT_1_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetReplacement1/tileset.json';
const TILESET_REPLACEMENT_2_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetReplacement2/tileset.json';
const TILESET_REPLACEMENT_3_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetReplacement3/tileset.json';

// 3 level tree with mix of additive and replacement refinement
const TILESET_REFINEMENT_MIX =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetRefinementMix/tileset.json';

// tileset.json : root content points to tiles2.json
// tiles2.json: root with b3dm content, three children with b3dm content, one child points to tiles3.json
// tiles3.json: root with b3dm content
const TILESET_OF_TILESETS_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';

const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithoutBatchTable/tileset.json';
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithBatchTable/tileset.json';
const NO_BATCH_IDS_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedNoBatchIds/tileset.json';
*/
const TILESET_WITH_BATCH_TABLE_HIERARCHY_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchy/tileset.json';
/*
const WITH_TRANSFORM_BOX_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformBox/tileset.json';
const WITH_TRANSFORM_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformSphere/tileset.json';
const WITH_TRANSFORM_REGION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformRegion/tileset.json';
const WITH_BOUNDING_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithBoundingSphere/tileset.json';

const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Composite/Composite/tileset.json';
const INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithBatchTable/tileset.json';
const INSTANCED_RED_MATERIAL_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedRedMaterial/tileset.json';

// 1 tile where each feature is a different source color
const COLORS_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/tileset.json';

// 1 tile where each feature has a reddish texture
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTextured/tileset.json';

// 1 tile with translucent features
const TRANSLUCENT_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTranslucent/tileset.json';

// 1 tile with opaque and translucent features
const TRANSLUCENT_OPAQUE_MIX_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTranslucentOpaqueMix/tileset.json';

// Root tile is transformed from local space to wgs84, child tile is rotated, scaled, and translated locally
const TILESET_WITH_TRANSFORMS_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetWithTransforms/tileset.json';

// Root tile with 4 b3dm children and 1 pnts child with a viewer request volume
const TILESET_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetWithViewerRequestVolume/tileset.json';

// Parent tile with content and four child tiles with content with viewer request volume for each child
const TILESET_REPLACEMENT_WITH_VIEWER_REQUEST_VOLUME_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetReplacementWithViewerRequestVolume/tileset.json';

const TILESET_WITH_EXTERNAL_RESOURCES_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetWithExternalResources/tileset.json';
const TILESET_URL_WITH_CONTENT_URI =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithContentDataUri/tileset.json';

const TILESET_SUBTREE_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetSubtreeExpiration/tileset.json';
const TILESET_SUBTREE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetSubtreeExpiration/subtree.json';
const BATCHED_EXPIRATION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedExpiration/tileset.json';
const BATCHED_COLORS_B3DM_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/batchedColors.b3dm';
const BATCHED_VERTEX_COLORS_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithVertexColors/tileset.json';

const STYLE_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Style/style.json';

const POINT_CLOUD_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGB/tileset.json';
const POINT_CLOUD_BATCHED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudBatched/tileset.json';
*/
test('Tileset3D#throws with undefined url', () => {
  // @ts-ignore
  expect(() => new Tileset3D()).toThrow();
});
test('Tileset3D#exports source-backed construction helpers', async () => {
  const source = new Tiles3DSource({url: TILESET_URL, loader: Tiles3DLoader, coreApi});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  const i3sTilesetHeader = await getI3sTileHeader();
  const i3sSource = new I3SSource({...i3sTilesetHeader, coreApi});
  expect(Tiles3DSource).toBeTruthy();
  expect(I3SSource).toBeTruthy();
  expect(source).toBeTruthy();
  expect(i3sSource).toBeTruthy();
  expect(tileset.url.slice(-30)).toBe(TILESET_URL.slice(-30));
  expect(tileset.asset.version).toBe('1.0');
  expect(tileset.options.dynamicScreenSpaceError, 'dynamic SSE defaults to enabled').toBe(true);
  expect(tileset.options.dynamicScreenSpaceErrorDensity, 'uses the tuned default density').toBe(
    2.0e-4
  );
  expect(tileset.options.dynamicScreenSpaceErrorFactor, 'uses the tuned default factor').toBe(24);
  expect(
    tileset.options.dynamicScreenSpaceErrorHeightFalloff,
    'uses the tuned default height falloff'
  ).toBe(0.25);
});
test('Tileset3D#url set up correctly given tileset JSON filepath', async () => {
  const path = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';
  const tileset = new Tileset3D(new Tiles3DSource({url: path, loader: Tiles3DLoader, coreApi}));
  await tileset.tilesetInitializationPromise;
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  expect(tileset.url.slice(-30)).toBe(path.slice(-30));
});
test('Tileset3D#url set up correctly given path with query string', async () => {
  const path = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';
  const param = '?param1=1&param2=2';
  // TODO - params do not work with fetchFile...
  const tilesetJson = await load(path + param, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  expect(tileset.url.replace(/.*3d-tiles/, ''), 'url search parameters preserved').toBe(
    (path + param).replace(/.*3d-tiles/, '')
  );
  const tile = tileset.root;
  if (tile) {
    expect(
      tile.contentUrl.replace(/.*3d-tiles/, ''),
      'raw child url correct, in this case no params'
    ).toBe('/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset2.json');
    expect(
      tileset.getTileUrl(tile.contentUrl).replace(/.*3d-tiles/, ''),
      'child url content parameters and version parameter preserved'
    ).toBe(
      '/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset2.json?param1=1&param2=2&v=1.2.3'
    );
    tile.contentUrl += '?param3=3';
    expect(
      tileset.getTileUrl(tile.contentUrl).replace(/.*3d-tiles/, ''),
      'child url content parameters preserved'
    ).toBe(
      '/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset2.json?param3=3&param1=1&param2=2&v=1.2.3'
    );
    tile.contentUrl += '&session=sesh';
    expect(
      tileset.getTileUrl(tile.contentUrl).replace(/.*3d-tiles/, ''),
      'child url content parameters preserved'
    ).toBe(
      '/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset2.json?param3=3&session=sesh&param1=1&param2=2&v=1.2.3'
    );
    const urlEnds = tileset.getTileUrl(tile.contentUrl).slice(-1);
    expect('?&'.includes(urlEnds)).toBe(false);
  } else {
    (() => {
      throw new Error('no tile');
    })();
  }
});
test('Tileset3D#getTileUrl should not ends with sign ? or &', async () => {
  const path = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset2.json';
  const tilesetJson = await load(path, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  const urlEnds = tileset.getTileUrl(tileset.url).slice(-1);
  expect('?&'.includes(urlEnds)).toBe(false);
});
test('Tileset3D#loads and initializes with tileset JSON file', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  expect('asset' in tileset).toBeTruthy();
  expect(tileset.asset.version).toBe('1.0');
  expect(tileset.asset.tilesetVersion).toBe('1.2.3');
  expect('properties' in tileset).toBeTruthy();
  expect('id' in tileset.properties).toBeTruthy();
  expect(tileset.properties.id.minimum).toBe(0);
  expect(tileset.properties.id.maximum).toBe(9);
  expect(tileset.geometricError).toBe(240.0);
  expect(tileset.root).toBeTruthy();
  // NOTE: The url has been resolved (@loaders.gl/3d-tiles => localhost) so initial part is now different
  expect(tileset.url.slice(-30)).toBe(TILESET_URL.slice(-30));
});
test('Tileset3D#loads tileset with extras', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  const extras = tileset.root?.extras;
  expect(tileset.extras).toEqual({name: 'Sample Tileset'});
  expect(extras).toBe(undefined);
  let taggedChildren = 0;
  const children = tileset.root?.children || [];
  for (const child of children) {
    if (child.extras) {
      expect(child.extras).toEqual({id: 'Special Tile'});
      ++taggedChildren;
    }
  }
  expect(taggedChildren).toBe(1);
});
test('Tileset3D#gets root tile', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  expect(tileset.root).toBeTruthy();
});
test('Tileset3D#handles global tilesets without error', async () => {
  const tilesetJson = await load(TILESET_GLOBAL_URL, Tiles3DLoader);
  try {
    const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
    await tileset.tilesetInitializationPromise;
    expect(tileset.cartographicCenter ? tileset.cartographicCenter.toArray() : null).toEqual([
      0, 0, -6378137
    ]);
  } catch (_e) {
    (() => {
      throw new Error('exception thrown when loading tileset with bbox-center at [0,0,0]');
    })();
  }
});
test('Tileset3D#hasExtension returns true if the tileset JSON file uses the specified extension', async () => {
  const tilesetJson = await load(TILESET_WITH_BATCH_TABLE_HIERARCHY_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  expect(tileset.hasExtension('3DTILES_batch_table_hierarchy')).toBe(true);
  expect(tileset.hasExtension('3DTILES_nonexistant_extension')).toBe(false);
});
test('Tileset3D#passes query parameters onto child requests', async () => {
  const queryString = '?a=123&b=abc';
  const tilesetJson = await load(TILESET_URL + queryString, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  expect(tileset.queryParams).toBe('a=123&b=abc&v=1.2.3');
});
/*
test('Tileset3D#passes version in query string to tiles', async t => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}), TILESET_URL);

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
test('Tileset3D#loads tiles in tileset', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  // @ts-ignore
  tileset.root._visible = true;
  await tileset.root?.loadContent();
  const content = tileset.root?.content;
  expect(content).toBeTruthy();
  expect(tileset.contentFormats).toEqual({draco: false, meshopt: false, dds: false, ktx2: false});
});
test('Tileset3D#should detect ktx2 texture', async () => {
  const tilesetJson = await load(KTX2_TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}, {worker: false}));
  const tile = tileset.root?.children?.[0] as Tile3D;
  await tileset._loadTile(tile);
  expect(tileset.contentFormats).toEqual({draco: false, meshopt: false, dds: false, ktx2: true});
});
test('Tileset3D#transition hold keeps tiles visible until replacements draw', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  let onUpdateCount = 0;
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}), {
    onUpdate: () => {
      onUpdateCount++;
    }
  });
  await tileset.tilesetInitializationPromise;
  const root = tileset.root as Tile3D;
  expect(root, 'root tile exists').toBeTruthy();
  expect(root.children.length > 0, 'root has children').toBeTruthy();
  // Load root content so contentAvailable becomes true
  // @ts-ignore
  root._visible = true;
  await root.loadContent();
  expect(root.contentAvailable, 'root content is available after loading').toBeTruthy();
  const childA = root.children[0];
  const childB = root.children[1];
  // --- Frame 1: root is selected, all tiles drawn ---
  tileset._frameNumber = 1;
  // @ts-ignore - frameStateData is private
  tileset.frameStateData = {
    viewport0: {selectedTiles: [root], _requestedTiles: [], _emptyTiles: []}
  };
  tileset.traverseCounter = 0;
  onUpdateCount = 0;
  tileset._updateTiles();
  expect(tileset.selectedTiles.length, 'frame 1: only root selected').toBe(1);
  expect(tileset.selectedTiles[0].id, 'frame 1: selected tile is root').toBe(root.id);
  expect(onUpdateCount > 0, 'frame 1: onUpdate called').toBeTruthy();
  // --- Frame 2: children selected instead of root (REPLACE transition) ---
  // Simulate renderer opt-in: children haven't drawn yet
  childA.tileDrawn = false;
  childB.tileDrawn = false;
  tileset._frameNumber = 2;
  // @ts-ignore
  tileset.frameStateData = {
    viewport0: {selectedTiles: [childA, childB], _requestedTiles: [], _emptyTiles: []}
  };
  tileset.traverseCounter = 0;
  tileset._updateTiles();
  // Root should be held back because children haven't drawn
  const selectedIdsF2 = tileset.selectedTiles.map(tile => tile.id);
  expect(selectedIdsF2.includes(root.id), 'frame 2: root is held back').toBeTruthy();
  expect(selectedIdsF2.includes(childA.id), 'frame 2: childA is selected').toBeTruthy();
  expect(selectedIdsF2.includes(childB.id), 'frame 2: childB is selected').toBeTruthy();
  expect(tileset.selectedTiles.length, 'frame 2: 3 tiles (2 children + held root)').toBe(3);
  // --- Frame 3: children have drawn, root should be released ---
  childA.tileDrawn = true;
  childB.tileDrawn = true;
  tileset._frameNumber = 3;
  // @ts-ignore
  tileset.frameStateData = {
    viewport0: {selectedTiles: [childA, childB], _requestedTiles: [], _emptyTiles: []}
  };
  tileset.traverseCounter = 0;
  tileset._updateTiles();
  const selectedIdsF3 = tileset.selectedTiles.map(tile => tile.id);
  expect(tileset.selectedTiles.length, 'frame 3: only children selected, root released').toBe(2);
  expect(!selectedIdsF3.includes(root.id), 'frame 3: root no longer held').toBeTruthy();
});
test('Tileset3D#transition hold is a no-op when tileDrawn defaults to true', async () => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
  await tileset.tilesetInitializationPromise;
  const root = tileset.root as Tile3D;
  // @ts-ignore
  root._visible = true;
  await root.loadContent();
  const childA = root.children[0];
  const childB = root.children[1];
  // All tiles have tileDrawn=true (the default), so transition hold should never activate
  expect(childA.tileDrawn, 'childA tileDrawn defaults to true').toBe(true);
  expect(childB.tileDrawn, 'childB tileDrawn defaults to true').toBe(true);
  // Frame 1: root selected
  tileset._frameNumber = 1;
  // @ts-ignore
  tileset.frameStateData = {
    viewport0: {selectedTiles: [root], _requestedTiles: [], _emptyTiles: []}
  };
  tileset.traverseCounter = 0;
  tileset._updateTiles();
  // Frame 2: children selected instead — but since tileDrawn is true, no hold needed
  tileset._frameNumber = 2;
  // @ts-ignore
  tileset.frameStateData = {
    viewport0: {selectedTiles: [childA, childB], _requestedTiles: [], _emptyTiles: []}
  };
  tileset.traverseCounter = 0;
  tileset._updateTiles();
  expect(tileset.selectedTiles.length, 'no tiles held back when tileDrawn defaults to true').toBe(
    2
  );
  const selectedIds = tileset.selectedTiles.map(tile => tile.id);
  expect(!selectedIds.includes(root.id), 'root not held when all tiles already drawn').toBeTruthy();
});
