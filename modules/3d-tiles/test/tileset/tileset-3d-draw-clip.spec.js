// DRAW COMMANDS

/*
test('Tileset3d#adds stencil clear command first when unresolved', t => {
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    tileset.root.children[0].children[0].children[0].unloadContent();
    tileset.root.children[0].children[0].children[1].unloadContent();
    tileset.root.children[0].children[0].children[2].unloadContent();

    scene.renderForSpecs();
    const commandList = scene.frameState.commandList;
    expect(commandList[0] instanceof ClearCommand).toBe(true);
    expect(commandList[0].stencil).toBe(0);
  });
  t.end();
});

test('Tileset3d#creates duplicate backface commands', t => {
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    const statistics = tileset._statistics;
    const root = tileset.root;

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

    const commandList = scene.frameState.commandList;
    const rs = commandList[1].renderState;
    expect(rs.cull.enabled).toBe(true);
    expect(rs.cull.face).toBe(CullFace.FRONT);
    expect(rs.polygonOffset.enabled).toBe(true);
  });
  t.end();
});

test('Tileset3d#does not create duplicate backface commands if no selected descendants', t => {
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    const statistics = tileset._statistics;
    const root = tileset.root;

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

test('Tileset3d#does not add commands or stencil clear command with no selected tiles', t => {
  const tileset = scene.primitives.add(
    new Tileset3D({
      url: TILESET_URL
    })
  );
  scene.renderForSpecs();
  const statistics = tileset._statistics;
  t.equals(tileset._selectedTiles.length, 0);
  t.equals(statistics.numberOfCommands, 0);
  t.end();
});

test('Tileset3d#does not add stencil clear command or backface commands when fully resolved', t => {
  viewAllTiles();
  const tileset = await loadTileset(scene, TILESET_REPLACEMENT_3_URL);
    const statistics = tileset._statistics;
    t.equals(statistics.numberOfCommands, tileset._selectedTiles.length);

    const commandList = scene.frameState.commandList;
    const length = commandList.length;
    for (const i = 0; i < length; ++i) {
      const command = commandList[i];
      expect(command instanceof ClearCommand).toBe(false);
      expect(command.renderState.cull.face).not.toBe(CullFace.FRONT);
    }
  });
  t.end();
});
*/

// CLIPPING PLANES

/*

test('Tileset3d#destroys attached ClippingPlaneCollections and ClippingPlaneCollections that have been detached', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
    const clippingPlaneCollection1 = new ClippingPlaneCollection({
      planes: [new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0)]
    });
    expect(clippingPlaneCollection1.owner).not.toBeDefined();

    tileset.clippingPlanes = clippingPlaneCollection1;
    const clippingPlaneCollection2 = new ClippingPlaneCollection({
      planes: [new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0)]
    });

    tileset.clippingPlanes = clippingPlaneCollection2;
    expect(clippingPlaneCollection1.isDestroyed()).toBe(true);

    scene.primitives.remove(tileset);
    expect(clippingPlaneCollection2.isDestroyed()).toBe(true);
  });
  t.end();
});

test('Tileset3d#throws a DeveloperError when given a ClippingPlaneCollection attached to another Tileset', t => {
  const clippingPlanes;
  const tileset1 = await loadTileset(TILESET_);
    clippingPlanes = new ClippingPlaneCollection({
      planes: [new ClippingPlane(Cartesian3.UNIT_X, 0.0)]
    });
    tileset1.clippingPlanes = clippingPlanes;

  const tileset2 = await loadTileset(ILESET_U);
  expect(function() {
    tileset2.clippingPlanes = clippingPlanes;
  }).toThrowDeveloperError();
  t.end();
});

test('Tileset3d#clipping planes cull hidden tiles', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
  const visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

  expect(visibility).not.toBe(CullingVolume.MASK_OUTSIDE);

  const plane = new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0);
  tileset.clippingPlanes = new ClippingPlaneCollection({
    planes: [plane]
  });

  visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

  expect(visibility).toBe(CullingVolume.MASK_OUTSIDE);

  plane.distance = 0.0;
  visibility = tileset.root.visibility(scene.frameState, CullingVolume.MASK_INSIDE);

  expect(visibility).not.toBe(CullingVolume.MASK_OUTSIDE);
  t.end();
});

test('Tileset3d#clipping planes cull hidden content', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
  const visibility = tileset.root.contentVisibility(scene.frameState);

  expect(visibility).not.toBe(Intersect.OUTSIDE);

  const plane = new ClippingPlane(Cartesian3.UNIT_Z, -100000000.0);
  tileset.clippingPlanes = new ClippingPlaneCollection({
    planes: [plane]
  });

  visibility = tileset.root.contentVisibility(scene.frameState);

  expect(visibility).toBe(Intersect.OUTSIDE);

  plane.distance = 0.0;
  visibility = tileset.root.contentVisibility(scene.frameState);

  expect(visibility).not.toBe(Intersect.OUTSIDE);
  t.end();
});

test('Tileset3d#clipping planes cull tiles completely inside clipping region', t => {
  const tileset = await loadTileset(scene, TILESET_URL);
  const statistics = tileset._statistics;
  const root = tileset.root;

  scene.renderForSpecs();

  t.equals(statistics.numberOfCommands, 5);

  tileset.update(scene.frameState);

  const radius = 287.0736139905632;

  const plane = new ClippingPlane(Cartesian3.UNIT_X, radius);
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
  t.end();
});

test('Tileset3d#clipping planes cull tiles completely inside clipping region for i3dm', t => {
  const tileset = await loadTileset(scene, TILESET_WITH_EXTERNAL_RES_URL);
    const statistics = tileset._statistics;
    const root = tileset.root;

    scene.renderForSpecs();

    t.equals(statistics.numberOfCommands, 6);

    tileset.update(scene.frameState);

    const radius = 142.19001637409772;

    const plane = new ClippingPlane(Cartesian3.UNIT_Z, radius);
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
  t.end();
});

test('Tileset3d#clippingPlanesOriginMatrix has correct orientation', t => {
  const tileset = await loadTileset(scene, WITH_TRANSFORM_BOX_URL);
  // The bounding volume of this tileset puts it under the surface, so no
  // east-north-up should be applied. Check that it matches the orientation
  // of the original transform.
  const offsetMatrix = tileset.clippingPlanesOriginMatrix;

  expect(Matrix4.equals(offsetMatrix, tileset.root.computedTransform)).toBe(true);

  const tileset = await loadTileset(scene, TILESET_URL);
    // The bounding volume of this tileset puts it on the surface,
    //  so we want to apply east-north-up as our best guess.
    offsetMatrix = tileset.clippingPlanesOriginMatrix;
    // The clipping plane matrix is not the same as the original because we applied east-north-up.
    expect(Matrix4.equals(offsetMatrix, tileset.root.computedTransform)).toBe(false);

    // But they have the same translation.
    const clippingPlanesOrigin = Matrix4.getTranslation(offsetMatrix, new Cartesian3());
    expect(Cartesian3.equals(tileset.root.boundingSphere.center, clippingPlanesOrigin)).toBe(
      true
    );
  });
  t.end();
});

test('Tileset3d#clippingPlanesOriginMatrix matches root tile bounding sphere', t => {
  const tileset = await loadTileset(scene, TILESET_OF_TILESETS_URL);
  const offsetMatrix = Matrix4.clone(tileset.clippingPlanesOriginMatrix, new Matrix4());
  const boundingSphereEastNorthUp = Transforms.eastNorthUpToFixedFrame(
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
  const result;
  const completed = false;
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
  const result;
  const completed = false;
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

test('Tileset3d#most detailed height queries', tt => {
  test('Tileset3d#tileset is offscreen', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    // Tileset uses replacement refinement so only one tile should be loaded and selected during most detailed picking
    const centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    const cartographics = [centerCartographic];

    const tileset = await loadTileset(scene, TILESET_UNIFORM);
      return sampleHeightMostDetailed(cartographics).then(function() {
        expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
        const statisticsAsync = tileset._statisticsLastAsync;
        const statisticsRender = tileset._statisticsLastRender;
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

  test('Tileset3d#tileset is onscreen', t => {
    if (webglStub) {
      return;
    }

    viewAllTiles();

    // Tileset uses replacement refinement so only one tile should be loaded and selected during most detailed picking
    const centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    const cartographics = [centerCartographic];

    const tileset = await loadTileset(scene, TILESET_UNIFORM);
    return sampleHeightMostDetailed(cartographics).then(function() {
      expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
      const statisticsAsync = tileset._statisticsLastAsync;
      const statisticsRender = tileset._statisticsLastRender;
      expect(statisticsAsync.numberOfCommands).toBe(1);
      expect(statisticsAsync.numberOfTilesWithContentReady).toBeGreaterThan(1);
      expect(statisticsAsync.selected).toBe(1);
      expect(statisticsAsync.visited).toBeGreaterThan(1);
      expect(statisticsAsync.numberOfTilesTotal).toBe(21);
      expect(statisticsRender.selected).toBeGreaterThan(0);
    });
    t.end();
  });

  test('Tileset3d#tileset uses additive refinement', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    const originalLoadJson = Tileset3D.loadJson;
    spyOn(Tileset3D, 'loadJson').and.callFake(function(TILESET_URL) {
      return originalLoadJson(TILESET_URL).then(function(tilesetJson) {
        tilesetJson.root.refine = 'ADD';
        return tilesetJson;
      });
    });

    const offcenterCartographic = new Cartographic(
      -1.3196754112739246,
      0.6988705057695633,
      2.467395745774971
    );
    const cartographics = [offcenterCartographic];

    const tileset = await loadTileset(scene, TILESET_UNIFORM);
    return sampleHeightMostDetailed(cartographics).then(function() {
      const statistics = tileset._statisticsLastAsync;
      expect(offcenterCartographic.height).toEqualEpsilon(7.407, CesiumMath.EPSILON1);
      expect(statistics.numberOfCommands).toBe(3); // One for each level of the tree
      expect(statistics.numberOfTilesWithContentReady).toBeGreaterThanOrEqualTo(3);
      expect(statistics.selected).toBe(3);
      expect(statistics.visited).toBeGreaterThan(3);
      expect(statistics.numberOfTilesTotal).toBe(21);
    });
    t.end();
  });

  test('Tileset3d#drill picks multiple features when tileset uses additive refinement', t => {
    if (webglStub) {
      return;
    }

    viewNothing();
    const ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);

    const originalLoadJson = Tileset3D.loadJson;
    spyOn(Tileset3D, 'loadJson').and.callFake(function(TILESET_URL) {
      return originalLoadJson(TILESET_URL).then(function(tilesetJson) {
        tilesetJson.root.refine = 'ADD';
        return tilesetJson;
      });
    });

    const tileset = await loadTileset(scene, TILESET_UNIFORM);
    return drillPickFromRayMostDetailed(ray).then(function(results) {
      expect(results.length).toBe(3);
      expect(results[0].object.content.url.indexOf('0_0_0.b3dm') > -1).toBe(true);
      expect(results[1].object.content.url.indexOf('1_1_1.b3dm') > -1).toBe(true);
      expect(results[2].object.content.url.indexOf('2_4_4.b3dm') > -1).toBe(true);
      console.log(results);
    });
    t.end();
  });

  test('Tileset3d#works when tileset cache is disabled', t => {
    if (webglStub) {
      return;
    }
    viewNothing();
    const centerCartographic = new Cartographic(
      -1.3196799798348215,
      0.6988740001506679,
      2.4683731133709323
    );
    const cartographics = [centerCartographic];
    const tileset = await loadTileset(scene, TILESET_UNIFORM);
    tileset.maximumMemoryUsage = 0;
    return sampleHeightMostDetailed(cartographics).then(function() {
      expect(centerCartographic.height).toEqualEpsilon(2.47, CesiumMath.EPSILON1);
    });
    t.end();
  });

  test('Tileset3d#multiple samples', t => {
    if (webglStub) {
      return;
    }

    viewNothing();

    const centerCartographic = new Cartographic(-1.3196799798348215, 0.6988740001506679);
    const offcenterCartographic = new Cartographic(-1.3196754112739246, 0.6988705057695633);
    const missCartographic = new Cartographic(-1.3196096042084076, 0.6988703290845706);
    const cartographics = [centerCartographic, offcenterCartographic, missCartographic];

    const tileset = await loadTileset(scene, TILESET_UNIFORM);
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

*/
