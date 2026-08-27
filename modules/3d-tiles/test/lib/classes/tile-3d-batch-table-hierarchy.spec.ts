// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import { expect, test } from "vitest";
import Tile3DBatchTableParser from '../../../src/lib/classes/tile-3d-batch-table';
import {loadRootTile} from '../utils/load-utils';
const BATCH_TABLE_HIERARCHY_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchy/tileset.json';
const BATCH_TABLE_HIERARCHY_BINARY_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchyBinary/tileset.json';
const BATCH_TABLE_HIERARCHY_MULTIPLE_PARENTS_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchyMultipleParents/tileset.json';
const BATCH_TABLE_HIERARCHY_NO_PARENTS_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchyNoParents/tileset.json';
const BATCH_TABLE_HIERARCHY_LEGACY_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Hierarchy/BatchTableHierarchyLegacy/tileset.json';
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
function checkHierarchyProperties(tileset, multipleParents) {
    // Check isExactClass, isClass, and getExactClassName in Cesium3DTileFeature
    const content = tileset.root.content;
    const batchTable = content.batchTable;
    const hierarchy = batchTable._batchTableHierarchy;
    const doorFeature = content.getFeature(4);
    const roofFeature = content.getFeature(8);
    expect(doorFeature.isExactClass('door')).toBe(true);
    expect(doorFeature.isExactClass('building')).toBe(false);
    expect(doorFeature.isClass('door')).toBe(true);
    expect(doorFeature.isClass('doorknob')).toBe(false);
    expect(doorFeature.isClass('building')).toBe(true);
    expect(doorFeature.getExactClassName()).toBe('door');
    expect(doorFeature.hasProperty('door_name')).toBe(true);
    expect(doorFeature.hasProperty('height')).toBe(true);
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
    expect(expectedPropertyNames.sort()).toEqual(propertyNames.sort());
    expect(doorFeature.getProperty('height')).toBe(5.0); // Gets generic property
    expect(doorFeature.getProperty('door_name')).toBe('door0'); // Gets class property
    expect(doorFeature.getProperty('building_name')).toBe('building0'); // Gets inherited property
    // Sets generic property
    doorFeature.setProperty('height', 10.0);
    expect(doorFeature.getProperty('height')).toBe(10.0);
    // Sets class property
    doorFeature.setProperty('door_name', 'new_door');
    expect(doorFeature.getProperty('door_name')).toBe('new_door');
    expect(roofFeature.getProperty('door_name')).toBe(undefined);
    // Throws error when setting inherited property
    expect(() => doorFeature.setProperty('building_name', 'new_building')).toThrow();
    // Check properties when there is no hierarchy
    batchTable._batchTableHierarchy = undefined;
    expect(doorFeature.isExactClass('door')).toBe(false);
    expect(doorFeature.isClass('door')).toBe(false);
    expect(doorFeature.getExactClassName()).toBe(undefined);
    expect(doorFeature.hasProperty('door_name')).toBe(false);
    expect(doorFeature.hasProperty('height')).toBe(true);
    expect(doorFeature.getPropertyNames()).toEqual(['height', 'area']);
    expect(doorFeature.getProperty('height')).toBe(10.0);
    expect(doorFeature.getProperty('door_name')).toBe(undefined);
    expect(doorFeature.getProperty('building_name')).toBe(undefined);
    batchTable._batchTableHierarchy = hierarchy;
}
function checkHierarchyPropertiesNoParents(tileset) {
    // Check isExactClass, isClass, and getExactClassName in Cesium3DTileFeature
    const content = tileset.root.content;
    const doorFeature = content.getFeature(4);
    expect(doorFeature.isExactClass('door')).toBe(true);
    expect(doorFeature.isExactClass('doorknob')).toBe(false);
    expect(doorFeature.isClass('door')).toBe(true);
    expect(doorFeature.isClass('doorknob')).toBe(false);
    expect(doorFeature.getExactClassName()).toBe('door');
    expect(doorFeature.hasProperty('door_name')).toBe(true);
    expect(doorFeature.hasProperty('height')).toBe(true);
    // Includes batch table properties and hierarchy properties from all inherited classes
    const expectedPropertyNames = ['height', 'area', 'door_mass', 'door_width', 'door_name'];
    const propertyNames = doorFeature.getPropertyNames();
    expect(expectedPropertyNames.sort()).toEqual(propertyNames.sort());
    expect(doorFeature.getProperty('height')).toBe(5.0); // Gets generic property
    expect(doorFeature.getProperty('door_name')).toBe('door0'); // Gets class property
    // Sets generic property
    doorFeature.setProperty('height', 10.0);
    expect(doorFeature.getProperty('height')).toBe(10.0);
    // Sets class property
    doorFeature.setProperty('door_name', 'new_door');
    expect(doorFeature.getProperty('door_name')).toBe('new_door');
}
function checkBatchTableHierarchy(tileset, multipleParents) {
    checkHierarchyProperties(tileset, multipleParents);
}
function checkBatchTableHierarchyNoParents(tileset) {
    checkHierarchyPropertiesNoParents(tileset);
}
// These fixture cases still require the incomplete renderer-shaped hierarchy port.
test.skip('Tile3DBatchTableParser#loads tileset with batch table hierarchy extension', async () => {
    const tileset = {root: await loadRootTile(BATCH_TABLE_HIERARCHY_URL)};
    checkBatchTableHierarchy(tileset, false);
});
test.skip('Tile3DBatchTableParser#loads hierarchy using binary properties', async () => {
    const tileset = {root: await loadRootTile(BATCH_TABLE_HIERARCHY_BINARY_URL)};
    checkBatchTableHierarchy(tileset, true);
});
test.skip('Tile3DBatchTableParser#loads hierarchy with multiple parent classes', async () => {
    const tileset = {root: await loadRootTile(BATCH_TABLE_HIERARCHY_MULTIPLE_PARENTS_URL)};
    checkBatchTableHierarchy(tileset, true);
});
test.skip('Tile3DBatchTableParser#loads hierarchy with no parents', async () => {
    const tileset = {root: await loadRootTile(BATCH_TABLE_HIERARCHY_NO_PARENTS_URL)};
    checkBatchTableHierarchyNoParents(tileset);
});
test.skip('Tile3DBatchTableParser#loads legacy batch table hierarchy', async () => {
    const tileset = {root: await loadRootTile(BATCH_TABLE_HIERARCHY_LEGACY_URL)};
    checkBatchTableHierarchy(tileset, false);
});
/*
test('Tile3DBatchTableParser#warns about deprecated batch hierarchy (pre-version 1.0)', t => {
  return checkBatchTableHierarchy(BATCH_TABLE_HIERARCHY_LEGACY_URL, false)
    const tileset = await ;
      expect(Tile3DBatchTableParser._deprecationWarning).toHaveBeenCalled();
    });
});
*/
test('Tile3DBatchTableParser#validates hierarchy with multiple parents', () => {
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
    expect(() => new Tile3DBatchTableParser(BATCH_TABLE_JSON, null, 4, {
        '3DTILES_batch_table_hierarchy': true
    })).not.toThrow();
});
test('Tile3DBatchTableParser#validates hierarchy with multiple parents (2)', () => {
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
    expect(() => new Tile3DBatchTableParser(BATCH_TABLE_JSON, null, 5, {
        '3DTILES_batch_table_hierarchy': true
    })).not.toThrow();
});
// >>includeStart('debug', pragmas.debug);
// Circular dependencies are only caught in debug builds.
test('Tile3DBatchTableParser#throws if hierarchy has a circular dependency', () => {
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
    expect(() => new Tile3DBatchTableParser(BATCH_TABLE_JSON, null, 3, {
        '3DTILES_batch_table_hierarchy': true
    }), 'throws if hierarchy has a circular dependency').toThrow();
});
test('Tile3DBatchTableParser#throws if hierarchy has a circular dependency (2)', () => {
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
    expect(() => new Tile3DBatchTableParser(BATCH_TABLE_JSON, null, 4, {
        '3DTILES_batch_table_hierarchy': true
    }), 'throws if hierarchy has a circular dependency').toThrow();
});
test('Tile3DBatchTableParser#throws if an instance\'s parentId exceeds instancesLength', () => {
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
    expect(() => new Tile3DBatchTableParser(BATCH_TABLE_JSON, null, 2, {
        '3DTILES_batch_table_hierarchy': true
    }), "throws if an instance's parentId exceeds instancesLength").toThrow();
});
