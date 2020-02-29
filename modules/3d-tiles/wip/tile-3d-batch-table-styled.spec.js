// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import Tile3DBatchTable from '@loaders.gl/3d-tiles/classes/tile-3d-batch-table';
import {Matrix2, Matrix3, Matrix4} from '@math.gl/core';
import {loadTileset} from '../utils/load-utils';

// HeadingPitchRange,
// ContextLimits,
// Batched3DModel3DTileContent,
// Cesium3DTileStyle,
// Cesium3DTilesTester,
// createScene) {_
const WITH_BATCH_TABLE_URL = '@loaders.gl/3d-tiles/test/data//Batched/BatchedWithBatchTable/tileset.json';
const WITHOUT_BATCH_TABLE_URL = '@loaders.gl/3d-tiles/test/data//Batched/BatchedWithoutBatchTable/tileset.json';
const NO_BATCH_IDS_URL = '@loaders.gl/3d-tiles/test/data//Batched/BatchedNoBatchIds/tileset.json';
const BATCH_TABLE_HIERARCHY_URL = '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchy/tileset.json';
const BATCH_TABLE_HIERARCHY_BINARY_URL = '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyBinary/tileset.json';
const batchTableHierarchyMultipleParentsUrl = '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyMultipleParents/tileset.json';
const BATCH_TABLE_HIERARCHY_NO_PARENTS_URL = '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyNoParents/tileset.json';
const BATCH_TABLE_HIERARCHY_LEGACY_URL = '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyLegacy/tileset.json';

// const result = new Color();

const mockTileset = {
  _statistics : {
    texturesByteLength : 0
  },
  getFeature(batchId) {
    return {
      batchId
    };
  }
};
mockTileset._tileset = mockTileset;

/*
const centerLongitude = -1.31968;
const centerLatitude = 0.698874;
let scene;

beforeAll(function() {
  scene = createScene();

  // One feature is located at the center, point the camera there
  const center = Cartesian3.fromRadians(centerLongitude, centerLatitude);
  scene.camera.lookAt(center, new HeadingPitchRange(0.0, -1.57, 20.0));
});

afterAll(function() {
  scene.destroyForSpecs();
});

afterEach(function() {
  scene.primitives.removeAll();
});
*/

test('Tile3DBatchTable#setShow throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(() => batchTable.setShow());
  t.throws(() => batchTable.setShow(-1));
  t.throws(() => batchTable.setShow(2));
  t.end();
});

test('Tile3DBatchTable#setShow throws with undefined value', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(() => batchTable.setShow(0));
  t.end();
});

test('Tile3DBatchTable#setShow sets show', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);

  // Batch table resources are undefined by default
  t.equals(batchTable._batchValues, undefined);
  t.equals(batchTable._batchTexture, undefined);

  // Check that batch table resources are still undefined because value is true by default
  batchTable.setShow(0, true);
  batchTable.update(mockTileset, scene.frameState);
  t.equals(batchTable._batchValues, undefined);
  t.equals(batchTable._batchTexture, undefined);
  t.deepEquals(batchTable.getShow(0), true);

  // Check that batch values are dirty and resources are created when value changes
  batchTable.setShow(0, false);
  t.deepEquals(batchTable._batchValuesDirty, true);

  batchTable.update(mockTileset, scene.frameState);
  t.notEquals(batchTable._batchValues, undefined);
  t.notEquals(batchTable._batchTexture, undefined);
  t.deepEquals(batchTable._batchValuesDirty, false);
  t.deepEquals(batchTable.getShow(0), false);

  // Check that dirty stays false when value is the same
  batchTable.setShow(0, false);
  t.deepEquals(batchTable._batchValuesDirty, false);
  t.deepEquals(batchTable.getShow(0), false);

  t.end();
});

test('Tile3DBatchTable#getShow throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.getShow());
  t.throws(batchTable.getShow(-1));
  t.throws(batchTable.getShow(2));
  t.end();
});

test('Tile3DBatchTable#getShow', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  // Show is true by default
  t.deepEquals(batchTable.getShow(0), true);
  batchTable.setShow(0, false);
  t.deepEquals(batchTable.getShow(0), false);
  t.end();
});

test('Tile3DBatchTable#setColor throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.setColor());
  t.throws(batchTable.setColor(-1));
  t.throws(batchTable.setColor(2));
  t.end();
});

test('Tile3DBatchTable#setColor throws with undefined value', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.setColor(0));
  t.end();
});

test('Tile3DBatchTable#setColor', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);

  // Batch table resources are undefined by default
  t.equals(batchTable._batchValues, undefined);
  t.equals(batchTable._batchTexture, undefined);

  // Check that batch table resources are still undefined because value is true by default
  batchTable.setColor(0, Color.WHITE);
  batchTable.update(mockTileset, scene.frameState);
  t.equals(batchTable._batchValues, undefined);
  t.equals(batchTable._batchTexture, undefined);
  t.deepEquals(batchTable.getColor(0, result), Color.WHITE);

  // Check that batch values are dirty and resources are created when value changes
  batchTable.setColor(0, Color.YELLOW);
  t.deepEquals(batchTable._batchValuesDirty, true);
  batchTable.update(mockTileset, scene.frameState);
  t.notEquals(batchTable._batchValues, undefined);
  t.notEquals(batchTable._batchTexture, undefined);
  t.deepEquals(batchTable._batchValuesDirty, false);
  t.deepEquals(batchTable.getColor(0, result), Color.YELLOW);

  // Check that dirty stays false when value is the same
  batchTable.setColor(0, Color.YELLOW);
  t.deepEquals(batchTable._batchValuesDirty, false);
  t.deepEquals(batchTable.getColor(0, result), Color.YELLOW);
  t.end();
});

test('Tile3DBatchTable#setAllColor throws with undefined value', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.setAllColor());
  t.end();
});

test('Tile3DBatchTable#setAllColor', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 2);
  batchTable.setAllColor(Color.YELLOW);
  t.deepEquals(batchTable.getColor(0, result), Color.YELLOW);
  t.deepEquals(batchTable.getColor(1, result), Color.YELLOW);
  t.end();
});

test('Tile3DBatchTable#setAllShow throws with undefined value', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.setAllShow());
  t.end();
});

test('Tile3DBatchTable#setAllShow', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 2);
  batchTable.setAllShow(false);
  t.equals(batchTable.getShow(0), false);
  t.equals(batchTable.getShow(1), false);
  t.end();
});

test('Tile3DBatchTable#getColor throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.getColor());
  t.throws(batchTable.getColor(-1));
  t.throws(batchTable.getColor(2));
  t.end();
});

test('Tile3DBatchTable#getColor throws with undefined result', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.getColor(0));
  t.end();
});

test('Tile3DBatchTable#getColor', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  // Color is true by default
  t.deepEquals(batchTable.getColor(0, result), Color.WHITE);
  batchTable.setColor(0, Color.YELLOW);
  t.deepEquals(batchTable.getColor(0, result), Color.YELLOW);
  t.end();
});

test('Tile3DBatchTable#renders tileset with batch table', async t => {
  const tileset = await loadTileset(t, WITH_BATCH_TABLE_URL);
  const content = tileset.root.content;

  // Each feature in the b3dm file has an id property from 0 to 9,
  // check that the 2nd resource has an id of 2
  t.deepEquals(content.getFeature(2).getProperty('id'), 2);

  // Check that a property can be an array
  t.deepEquals(content.getFeature(2).getProperty('rooms'), ['room2_a', 'room2_b', 'room2_c']);

  // Check that a property can be an object
  t.deepEquals(content.getFeature(2).getProperty('info'), {name : 'building2', year : 2});

  Cesium3DTilesTester.expectRenderTileset(scene, tileset);
});

test('Tile3DBatchTable#renders tileset without batch table', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  const content = tileset.root.content;

  t.equals(content.getFeature(2).getProperty('id'), undefined);

  Cesium3DTilesTester.expectRenderTileset(scene, tileset);
});

test('Tile3DBatchTable#renders when vertex texture fetch is not supported', async t => {
  // Disable VTF
  const maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  ContextLimits._maximumVertexTextureImageUnits = 0;

  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  Cesium3DTilesTester.expectRenderTileset(scene, tileset);

  // Re-enable VTF
  ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;
});

test('Tile3DBatchTable#renders with featuresLength greater than maximumTextureSize', async t => {
  // Set maximum texture size to 4 temporarily. Batch length of b3dm file is 10.
  const maximumTextureSize = ContextLimits.maximumTextureSize;
  ContextLimits._maximumTextureSize = 4;

  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  const content = tileset.root.content;
  expect(content.featuresLength).toBeGreaterThan(ContextLimits._maximumTextureSize);
  Cesium3DTilesTester.expectRenderTileset(scene, tileset);

  // Reset maximum texture size
  ContextLimits._maximumTextureSize = maximumTextureSize;
});

test('Tile3DBatchTable#renders with featuresLength of zero', async t => {
  const tileset = await loadTileset(t, NO_BATCH_IDS_URL);
  Cesium3DTilesTester.expectRender(scene, tileset);

  expect(scene).toPickAndCall(function(result) {
    t.notEquals(result, undefined);
    t.equals(result.primitive, tileset);
  });
});

function expectRenderTranslucent(tileset) {
  const batchTable = tileset.root.content.batchTable;

  // Get initial color
  let opaqueColor;
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    opaqueColor = rgba;
  });

  // Render translucent
  batchTable.setAllColor(new Color(1.0, 1.0, 1.0, 0.5));
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    expect(rgba).not.toEqual(opaqueColor);
  });

  // Render restored to opaque
  batchTable.setAllColor(Color.WHITE);
  Cesium3DTilesTester.expectRender(scene, tileset, rgba => {
    t.deepEquals(rgba, opaqueColor);
  });

  // Generate both translucent and opaque commands
  batchTable.setColor(0, new Color(1.0, 1.0, 1.0, 0.5));
  Cesium3DTilesTester.expectRender(scene, tileset);

  // Fully transparent
  batchTable.setAllColor(new Color(1.0, 1.0, 1.0, 0.0));
  Cesium3DTilesTester.expectRenderBlank(scene, tileset);
}

test('Tile3DBatchTable#renders translucent style', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  expectRenderTranslucent(tileset);
});

test('Tile3DBatchTable#renders translucent style when vertex texture fetch is not supported', async t => {
  // Disable VTF
  const maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  ContextLimits._maximumVertexTextureImageUnits = 0;
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);
  expectRenderTranslucent(tileset);
  // Re-enable VTF
  ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;
});

test('Tile3DBatchTable#isExactClass throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.isExactClass());
  t.throws(batchTable.isExactClass(2, 'door'));
  t.throws(batchTable.isExactClass(-1, 'door'));
});

test('Tile3DBatchTable#isExactClass throws with undefined className', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.isExactClass(0));
});

test('Tile3DBatchTable#isClass throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.isClass());
  t.throws(batchTable.isClass(2, 'door'));
  t.throws(batchTable.isClass(-1, 'door'));
});

test('Tile3DBatchTable#isClass throws with undefined className', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.isClass(0));
});

test('Tile3DBatchTable#getExactClassName throws with invalid batchId', t => {
  const batchTable = new Tile3DBatchTable(mockTileset, 1);
  t.throws(batchTable.getExactClassName());
  t.throws(batchTable.getExactClassName(1000));
  t.throws(batchTable.getExactClassName(-1));
});

function checkHierarchyStyling(t, tileset) {
  // Check that a feature is colored from a generic batch table property.
  tileset.style = new Cesium3DTileStyle({color : "${height} === 6.0 ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check that a feature is colored from a class property.
  tileset.style = new Cesium3DTileStyle({color : "${roof_name} === 'roof2' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check that a feature is colored from an inherited property.
  tileset.style = new Cesium3DTileStyle({color : "${building_name} === 'building2' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check isExactClass
  tileset.style = new Cesium3DTileStyle({color : "isExactClass('roof') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });
  tileset.style = new Cesium3DTileStyle({color : "isExactClass('door') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[1]).toBeGreaterThan(1); // Expect green
  });

  // Check isClass
  tileset.style = new Cesium3DTileStyle({color : "isClass('roof') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });
  tileset.style = new Cesium3DTileStyle({color : "isClass('zone') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check getExactClassName
  tileset.style = new Cesium3DTileStyle({color : "getExactClassName() === 'roof' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });
  tileset.style = new Cesium3DTileStyle({color : "getExactClassName() === 'zone' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[1]).toBeGreaterThan(0); // Expect green
  });
}

function checkHierarchyStylingNoParents(t, tileset) {
  // Check that a feature is colored from a generic batch table property.
  tileset.style = new Cesium3DTileStyle({color : "${height} === 6.0 ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check that a feature is colored from a class property.
  tileset.style = new Cesium3DTileStyle({color : "${roof_name} === 'roof2' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check isExactClass
  tileset.style = new Cesium3DTileStyle({color : "isExactClass('roof') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check isClass
  tileset.style = new Cesium3DTileStyle({color : "isClass('roof') ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });

  // Check getExactClassName
  tileset.style = new Cesium3DTileStyle({color : "getExactClassName() === 'roof' ? color('red') : color('green')"});
  expect(scene).toRenderAndCall(function(rgba) {
    expect(rgba[0]).toBeGreaterThan(0); // Expect red
  });
}

function checkHierarchyProperties(t, tileset, multipleParents) {
  // Check isExactClass, isClass, and getExactClassName in Cesium3DTileFeature
  const content = tileset.root.content;
  const batchTable = content.batchTable;
  const hierarchy = batchTable._batchTableHierarchy;

  const doorFeature = content.getFeature(4);
  const roofFeature = content.getFeature(8);
  t.equals(doorFeature.isExactClass('door'), true);
  t.equals(doorFeature.isExactClass('building'), false);
  t.equals(doorFeature.isClass('door'), true);
  t.equals(doorFeature.isClass('doorknob'), false);
  t.equals(doorFeature.isClass('building'), true);
  t.equals(doorFeature.getExactClassName(), 'door');
  t.equals(doorFeature.hasProperty('door_name'), true);
  t.equals(doorFeature.hasProperty('height'), true);

  // Includes batch table properties and hierarchy properties from all inherited classes
  const expectedPropertyNames = ['height', 'area', 'door_mass', 'door_width', 'door_name', 'building_area', 'building_name', 'zone_buildings', 'zone_name'];

  // door0 has two parents - building0 and classifier_old
  // building0 has two parents - zone0 and classifier_new
  if (multipleParents) {
    expectedPropertyNames.push('year', 'color', 'name', 'architect'); // classier_new
    expectedPropertyNames.push('description', 'inspection'); // classifier_old
  }

  const propertyNames = doorFeature.getPropertyNames();
  t.deepEquals(expectedPropertyNames.sort(), propertyNames.sort());

  t.equals(doorFeature.getProperty('height'), 5.0); // Gets generic property
  t.equals(doorFeature.getProperty('door_name'), 'door0'); // Gets class property
  t.equals(doorFeature.getProperty('building_name'), 'building0'); // Gets inherited property

  // Sets generic property
  doorFeature.setProperty('height', 10.0);
  t.equals(doorFeature.getProperty('height'), 10.0);

  // Sets class property
  doorFeature.setProperty('door_name', 'new_door');
  t.equals(doorFeature.getProperty('door_name'), 'new_door');
  t.equals(roofFeature.getProperty('door_name'), undefined);

  // Throws error when setting inherited property
  t.throws(doorFeature.setProperty('building_name', 'new_building'));

  // Check properties when there is no hierarchy
  batchTable._batchTableHierarchy = undefined;
  t.equals(doorFeature.isExactClass('door'), false);
  t.equals(doorFeature.isClass('door'), false);
  t.equals(doorFeature.getExactClassName(), undefined);
  t.equals(doorFeature.hasProperty('door_name'), false);
  t.equals(doorFeature.hasProperty('height'), true);
  t.deepEquals(doorFeature.getPropertyNames(), ['height', 'area']);
  t.equals(doorFeature.getProperty('height'), 10.0);
  t.equals(doorFeature.getProperty('door_name'), undefined);
  t.equals(doorFeature.getProperty('building_name'), undefined);
  batchTable._batchTableHierarchy = hierarchy;
}

function checkHierarchyPropertiesNoParents(t, tileset) {
  // Check isExactClass, isClass, and getExactClassName in Cesium3DTileFeature
  const content = tileset.root.content;
  const doorFeature = content.getFeature(4);
  t.equals(doorFeature.isExactClass('door'), true);
  t.equals(doorFeature.isExactClass('doorknob'), false);
  t.equals(doorFeature.isClass('door'), true);
  t.equals(doorFeature.isClass('doorknob'), false);
  t.equals(doorFeature.getExactClassName(), 'door');
  t.equals(doorFeature.hasProperty('door_name'), true);
  t.equals(doorFeature.hasProperty('height'), true);

  // Includes batch table properties and hierarchy properties from all inherited classes
  const expectedPropertyNames = ['height', 'area', 'door_mass', 'door_width', 'door_name'];

  const propertyNames = doorFeature.getPropertyNames();
  t.deepEquals(expectedPropertyNames.sort(), propertyNames.sort());

  t.equals(doorFeature.getProperty('height'), 5.0); // Gets generic property
  t.equals(doorFeature.getProperty('door_name'), 'door0'); // Gets class property

  // Sets generic property
  doorFeature.setProperty('height', 10.0);
  t.equals(doorFeature.getProperty('height'), 10.0);

  // Sets class property
  doorFeature.setProperty('door_name', 'new_door');
  t.equals(doorFeature.getProperty('door_name'), 'new_door');
}

function checkBatchTableHierarchy(t, tileset, multipleParents) {
  checkHierarchyStyling(t, tileset);
  checkHierarchyProperties(t, tileset, multipleParents);
}

function checkBatchTableHierarchyNoParents(t, tileset) {
  checkHierarchyStylingNoParents(t, tileset);
  checkHierarchyPropertiesNoParents(t, tileset);
}

test('Tile3DBatchTable#renders tileset with batch table hierarchy extension', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  checkBatchTableHierarchy(t, BATCH_TABLE_HIERARCHY_URL, false);
  t.end();
});

test('Tile3DBatchTable#renders tileset with batch table hierarchy using binary properties', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  checkBatchTableHierarchy(t, BATCH_TABLE_HIERARCHY_BINARY_URL, true);
  t.end();
});

test('Tile3DBatchTable#renders tileset with batch table hierarchy with multiple parent classes', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  checkBatchTableHierarchy(t, batchTableHierarchyMultipleParentsUrl, true);
  t.end();
});

test('Tile3DBatchTable#renders tileset with batch table hierarchy with no parents', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  checkBatchTableHierarchyNoParents(BATCH_TABLE_HIERARCHY_NO_PARENTS_URL);
  t.end();
});

test('Tile3DBatchTable#renders tileset with legacy batch table hierarchy (pre-version 1.0)', async t => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_LEGACY_URL);

  checkBatchTableHierarchy(t, tileset, false);
  t.end();
});

/*
test('Tile3DBatchTable#warns about deprecated batch hierarchy (pre-version 1.0)', t => {
  return checkBatchTableHierarchy(BATCH_TABLE_HIERARCHY_LEGACY_URL, false)
    const tileset = await ;
      expect(Tile3DBatchTable._deprecationWarning).toHaveBeenCalled();
    });
});
*/

test('Tile3DBatchTable#validates hierarchy with multiple parents', t => {
  //     building0
  //     /      \
  //  door0    door1
  //     \      /
  //      window0
  const BATCH_TABLE_JSON = {
    HIERARCHY : {
      instancesLength : 4,
      classIds : [0, 1, 1, 2],
      parentCounts : [2, 1, 1, 0],
      parentIds : [1, 2, 3, 3],
      classes : [{
        name : 'window',
        length : 1,
        instances : {
          window_name : ['window0']
        }
      }, {
        name : 'door',
        length : 2,
        instances : {
          door_name : ['door0', 'door1']
        }
      }, {
        name : 'building',
        length : 1,
        instances : {
          building_name : ['building0']
        }
      }]
    }
  };
  const batchTable = new Tile3DBatchTable(mockTileset, 4, BATCH_TABLE_JSON);
  t.deepEquals(batchTable.getPropertyNames(0).sort(), ['building_name', 'door_name', 'window_name']);
});

test('Tile3DBatchTable#validates hierarchy with multiple parents (2)', t => {
  //             zone
  //             / |  \
  //   building0   |   \
  //     /      \  |    \
  //    door0  door1    /
  //        \    |     /
  //           window0
  const BATCH_TABLE_JSON = {
    HIERARCHY : {
      instancesLength : 4,
      classIds : [0, 1, 1, 2, 3],
      parentCounts : [3, 1, 2, 1, 0],
      parentIds : [1, 2, 4, 3, 3, 4, 4],
      classes : [{
        name : 'window',
        length : 1,
        instances : {
          window_name : ['window0']
        }
      }, {
        name : 'door',
        length : 2,
        instances : {
          door_name : ['door0', 'door1']
        }
      }, {
        name : 'building',
        length : 1,
        instances : {
          building_name : ['building0']
        }
      }, {
        name : 'zone',
        length : 1,
        instances : {
          zone_name : ['zone0']
        }
      }]
    }
  };
  const batchTable = new Tile3DBatchTable(mockTileset, 5, BATCH_TABLE_JSON);
  t.deepEquals(batchTable.getPropertyNames(0).sort(), ['building_name', 'door_name', 'window_name', 'zone_name']); // check window
  t.deepEqualsls(batchTable.hasProperty(1, 'zone_name'), true); // check door0
  t.deepEqualsls(batchTable.hasProperty(2, 'zone_name'), true); // check door1
  t.end();
});

//>>includeStart('debug', pragmas.debug);
// Circular dependencies are only caught in debug builds.
test('Tile3DBatchTable#throws if hierarchy has a circular dependency', t => {
  // window0 -> door0 -> building0 -> window0
  const BATCH_TABLE_JSON = {
    HIERARCHY : {
      instancesLength : 3,
      classIds : [0, 1, 2],
      parentIds : [1, 2, 0],
      classes : [{
        name : 'window',
        length : 1,
        instances : {
          window_name : ['window0']
        }
      }, {
        name : 'door',
        length : 1,
        instances : {
          door_name : ['door0']
        }
      }, {
        name : 'building',
        length : 1,
        instances : {
          building_name : ['building0']
        }
      }]
    }
  };
  t.throws(() => new Tile3DBatchTable(mockTileset, 3, BATCH_TABLE_JSON), 'throws if hierarchy has a circular dependency');
  t.end();
});

test('Tile3DBatchTable#throws if hierarchy has a circular dependency (2)', t => {
  // window0 -> door0 -> building0 -> window1 -> door0
  const BATCH_TABLE_JSON = {
    HIERARCHY : {
      instancesLength : 4,
      classIds : [0, 1, 2, 0],
      parentIds : [1, 2, 3, 1],
      classes : [{
        name : 'window',
        length : 2,
        instances : {
          window_name : ['window0', 'window1']
        }
      }, {
        name : 'door',
        length : 1,
        instances : {
          door_name : ['door0']
        }
      }, {
        name : 'building',
        length : 1,
        instances : {
          building_name : ['building0']
        }
      }]
    }
  };
  t.throws(() => new Tile3DBatchTable(mockTileset, 4, BATCH_TABLE_JSON), 'throws if hierarchy has a circular dependency');
  t.end();
});
//>>includeEnd('debug');

test('Tile3DBatchTable#throws if an instance\'s parentId exceeds instancesLength', t => {
  const BATCH_TABLE_JSON = {
    HIERARCHY : {
      instancesLength : 2,
      classIds : [0, 1],
      parentIds : [1, 2],
      classes : [{
        name : 'window',
        length : 1,
        instances : {
          window_name : ['window0']
        }
      }, {
        name : 'door',
        length : 1,
        instances : {
          door_name : ['door0']
        }
      }]
    }
  };
  t.throws(() => new Tile3DBatchTable(mockTileset, 2, BATCH_TABLE_JSON, 'throws if an instance\'s parentId exceeds instancesLength'));
  t.end();
});

test('Tile3DBatchTable#destroys', async t => {
  const tileset = await loadTileset(t, WITHOUT_BATCH_TABLE_URL);

  const content = tileset.root.content;
  const batchTable = content.batchTable;
  t.deepEquals(batchTable.isDestroyed(), false);
  scene.primitives.remove(tileset);
  t.deepEquals(batchTable.isDestroyed(), true);
  t.end();
});
