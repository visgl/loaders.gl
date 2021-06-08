/* eslint-disable camelcase */
// @ts-nocheck
import test from 'tape-promise/tape';
import Tile3DBatchTableParser from '@loaders.gl/3d-tiles/classes/tile-3d-batch-table-parser';
import {loadTileset} from '../utils/load-utils';

const BATCH_TABLE_HIERARCHY_URL =
  '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchy/tileset.json';
const BATCH_TABLE_HIERARCHY_BINARY_URL =
  '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyBinary/tileset.json';
const BATCH_TABLE_HIERARCHY_MULTIPLE_PARENTS_URL =
  '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyMultipleParents/tileset.json';
const BATCH_TABLE_HIERARCHY_NO_PARENTS_URL =
  '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyNoParents/tileset.json';
const BATCH_TABLE_HIERARCHY_LEGACY_URL =
  '@loaders.gl/3d-tiles/test/data//Hierarchy/BatchTableHierarchyLegacy/tileset.json';

// const result = new Color();

const mockTileset = {
  _statistics: {
    texturesByteLength: 0
  },
  getFeature(batchId) {
    return {
      batchId
    };
  }
};
mockTileset._tileset = mockTileset;

/*
  spyOn(Tile3DBatchTableParser, '_deprecationWarning');
  spyOn(Batched3DModel3DTileContent, '_deprecationWarning');
*/

// eslint-disable-next-line max-statements
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
  const expectedPropertyNames = [
    'height',
    'area',
    'door_mass',
    'door_width',
    'door_name',
    'building_area',
    'building_name',
    'zone_buildings',
    'zone_name'
  ];

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
  // TBD - checkHierarchyStyling(t, tileset);
  checkHierarchyProperties(t, tileset, multipleParents);
}

function checkBatchTableHierarchyNoParents(t, tileset) {
  // TBD - checkHierarchyStylingNoParents(t, tileset);
  checkHierarchyPropertiesNoParents(t, tileset);
}

test('Tile3DBatchTableParser#renders tileset with batch table hierarchy extension', async (t) => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_URL);

  checkBatchTableHierarchy(t, tileset, false);
  t.end();
});

test('Tile3DBatchTableParser#renders tileset with batch table hierarchy using binary properties', async (t) => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_BINARY_URL);

  checkBatchTableHierarchy(t, tileset, true);
  t.end();
});

test('Tile3DBatchTableParser#renders tileset with batch table hierarchy with multiple parent classes', async (t) => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_MULTIPLE_PARENTS_URL);

  checkBatchTableHierarchy(t, tileset, true);
  t.end();
});

test('Tile3DBatchTableParser#renders tileset with batch table hierarchy with no parents', async (t) => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_NO_PARENTS_URL);

  checkBatchTableHierarchyNoParents(tileset);
  t.end();
});

test('Tile3DBatchTableParser#renders tileset with legacy batch table hierarchy (pre-version 1.0)', async (t) => {
  const tileset = await loadTileset(t, BATCH_TABLE_HIERARCHY_LEGACY_URL);

  checkBatchTableHierarchy(t, tileset, false);
  t.end();
});

/*
test('Tile3DBatchTableParser#warns about deprecated batch hierarchy (pre-version 1.0)', t => {
  return checkBatchTableHierarchy(BATCH_TABLE_HIERARCHY_LEGACY_URL, false)
    const tileset = await ;
      expect(Tile3DBatchTableParser._deprecationWarning).toHaveBeenCalled();
    });
});
*/

test('Tile3DBatchTableParser#validates hierarchy with multiple parents', (t) => {
  //     building0
  //     /      \
  //  door0    door1
  //     \      /
  //      window0
  const BATCH_TABLE_JSON = {
    HIERARCHY: {
      instancesLength: 4,
      classIds: [0, 1, 1, 2],
      parentCounts: [2, 1, 1, 0],
      parentIds: [1, 2, 3, 3],
      classes: [
        {
          name: 'window',
          length: 1,
          instances: {
            window_name: ['window0']
          }
        },
        {
          name: 'door',
          length: 2,
          instances: {
            door_name: ['door0', 'door1']
          }
        },
        {
          name: 'building',
          length: 1,
          instances: {
            building_name: ['building0']
          }
        }
      ]
    }
  };
  const batchTable = new Tile3DBatchTableParser(mockTileset, 4, BATCH_TABLE_JSON);
  t.deepEquals(batchTable.getPropertyNames(0).sort(), [
    'building_name',
    'door_name',
    'window_name'
  ]);
});

test('Tile3DBatchTableParser#validates hierarchy with multiple parents (2)', (t) => {
  //             zone
  //             / |  \
  //   building0   |   \
  //     /      \  |    \
  //    door0  door1    /
  //        \    |     /
  //           window0
  const BATCH_TABLE_JSON = {
    HIERARCHY: {
      instancesLength: 4,
      classIds: [0, 1, 1, 2, 3],
      parentCounts: [3, 1, 2, 1, 0],
      parentIds: [1, 2, 4, 3, 3, 4, 4],
      classes: [
        {
          name: 'window',
          length: 1,
          instances: {
            window_name: ['window0']
          }
        },
        {
          name: 'door',
          length: 2,
          instances: {
            door_name: ['door0', 'door1']
          }
        },
        {
          name: 'building',
          length: 1,
          instances: {
            building_name: ['building0']
          }
        },
        {
          name: 'zone',
          length: 1,
          instances: {
            zone_name: ['zone0']
          }
        }
      ]
    }
  };
  const batchTable = new Tile3DBatchTableParser(mockTileset, 5, BATCH_TABLE_JSON);
  t.deepEquals(batchTable.getPropertyNames(0).sort(), [
    'building_name',
    'door_name',
    'window_name',
    'zone_name'
  ]); // check window
  t.deepEqualsls(batchTable.hasProperty(1, 'zone_name'), true); // check door0
  t.deepEqualsls(batchTable.hasProperty(2, 'zone_name'), true); // check door1
  t.end();
});

// >>includeStart('debug', pragmas.debug);
// Circular dependencies are only caught in debug builds.
test('Tile3DBatchTableParser#throws if hierarchy has a circular dependency', (t) => {
  // window0 -> door0 -> building0 -> window0
  const BATCH_TABLE_JSON = {
    HIERARCHY: {
      instancesLength: 3,
      classIds: [0, 1, 2],
      parentIds: [1, 2, 0],
      classes: [
        {
          name: 'window',
          length: 1,
          instances: {
            window_name: ['window0']
          }
        },
        {
          name: 'door',
          length: 1,
          instances: {
            door_name: ['door0']
          }
        },
        {
          name: 'building',
          length: 1,
          instances: {
            building_name: ['building0']
          }
        }
      ]
    }
  };
  t.throws(
    () => new Tile3DBatchTableParser(mockTileset, 3, BATCH_TABLE_JSON),
    'throws if hierarchy has a circular dependency'
  );
  t.end();
});

test('Tile3DBatchTableParser#throws if hierarchy has a circular dependency (2)', (t) => {
  // window0 -> door0 -> building0 -> window1 -> door0
  const BATCH_TABLE_JSON = {
    HIERARCHY: {
      instancesLength: 4,
      classIds: [0, 1, 2, 0],
      parentIds: [1, 2, 3, 1],
      classes: [
        {
          name: 'window',
          length: 2,
          instances: {
            window_name: ['window0', 'window1']
          }
        },
        {
          name: 'door',
          length: 1,
          instances: {
            door_name: ['door0']
          }
        },
        {
          name: 'building',
          length: 1,
          instances: {
            building_name: ['building0']
          }
        }
      ]
    }
  };
  t.throws(
    () => new Tile3DBatchTableParser(mockTileset, 4, BATCH_TABLE_JSON),
    'throws if hierarchy has a circular dependency'
  );
  t.end();
});

test("Tile3DBatchTableParser#throws if an instance's parentId exceeds instancesLength", (t) => {
  const BATCH_TABLE_JSON = {
    HIERARCHY: {
      instancesLength: 2,
      classIds: [0, 1],
      parentIds: [1, 2],
      classes: [
        {
          name: 'window',
          length: 1,
          instances: {
            window_name: ['window0']
          }
        },
        {
          name: 'door',
          length: 1,
          instances: {
            door_name: ['door0']
          }
        }
      ]
    }
  };
  t.throws(
    () =>
      new Tile3DBatchTableParser(
        mockTileset,
        2,
        BATCH_TABLE_JSON,
        "throws if an instance's parentId exceeds instancesLength"
      )
  );
  t.end();
});
