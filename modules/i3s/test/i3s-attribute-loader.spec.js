import test from 'tape-promise/tape';
// @ts-expect-error
import {I3SAttributeLoader, loadFeatureAttributes} from '@loaders.gl/i3s/i3s-attribute-loader';
import {load} from '@loaders.gl/core';

const objectIdsUrl = '@loaders.gl/i3s/test/data/attributes/f_0/0/index.bin';
const namesUrl = '@loaders.gl/i3s/test/data/attributes/f_1/0/index.bin';
const heightRoofUrl = '@loaders.gl/i3s/test/data/attributes/f_2/0/index.bin';
const wrongNamesUrl = '@loaders.gl/i3s/test/data/attributes/f_1/0/wrong.bin';
const wrongBufferNamesUrl = '@loaders.gl/i3s/test/data/attributes/f_1/0/wrong-buffer.bin';

const objectIdsWithCodeValuesUrl =
  '@loaders.gl/i3s/test/data/BuildingSceneLayer/attributes/f_0/0/index.bin';
const attributesWithCodeValuesUrl =
  '@loaders.gl/i3s/test/data/BuildingSceneLayer/attributes/f_27/0/index.bin';
const shortInt16AttributesUrl =
  '@loaders.gl/i3s/test/data/BuildingSceneLayer/attributes/f_7/0/index.bin';

const name602 = 'West End Building\0';
const objecId0 = 979297;
const heightRoof0 = 32.18;
const codeValuesFeatureId = 5;

const TILE_WITHOUT_URLS = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID', objectIds: []},
        {key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}
      ]
    }
  }
};

const TILE = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID', objectIds: []},
        {key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}
      ]
    }
  },
  header: {
    attributeUrls: [objectIdsUrl, namesUrl, heightRoofUrl]
  }
};

const TILE_WITH_WRONG_NAME_ATTRIBUTE_URL = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID', objectIds: []},
        {key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}
      ]
    }
  },
  header: {
    attributeUrls: [objectIdsUrl, wrongNamesUrl, heightRoofUrl]
  }
};

const TILE_WITH_WRONG_BUFFER_NAME_ATTRIBUTE = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID', objectIds: []},
        {key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}
      ]
    }
  },
  header: {
    attributeUrls: [objectIdsUrl, wrongBufferNamesUrl, heightRoofUrl]
  }
};

const TILE_WITH_CODE_VALUES_ATTRIBUTE = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID_1', objectIds: []},
        {key: 'f_27', name: 'BaseLevel', attributeValues: {valueType: 'Int32'}}
      ],
      fields: [
        {
          name: 'BaseLevel',
          type: 'esriFieldTypeInteger',
          alias: 'BaseLevel',
          domain: {
            type: 'codedValue',
            name: 'Levels_Admin_BLDG_DA_vr13_2018_rvt',
            description: 'Levels_Admin_BLDG_DA_vr13_2018_rvt',
            codedValues: [
              {
                name: 'SUBBASEMENT',
                code: 0
              },
              {
                name: 'BASEMENT',
                code: 1
              },
              {
                name: '1ST FLOOR',
                code: 2
              },
              {
                name: '2ND FLOOR',
                code: 3
              },
              {
                name: '3RD FLOOR',
                code: 4
              },
              {
                name: '4TH FLOOR',
                code: 5
              },
              {
                name: 'ROOF',
                code: 6
              }
            ]
          }
        }
      ]
    }
  },
  header: {
    attributeUrls: [objectIdsWithCodeValuesUrl, attributesWithCodeValuesUrl]
  }
};

const TILE_WITH_INT_16_ATTRIBUTES = {
  tileset: {
    tileset: {
      attributeStorageInfo: [
        {key: 'f_0', name: 'OBJECTID_1', objectIds: []},
        {key: 'f_7', name: 'BldgLevel_IsBuildingStory', attributeValues: {valueType: 'Int16'}}
      ]
    }
  },
  header: {
    attributeUrls: [objectIdsWithCodeValuesUrl, shortInt16AttributesUrl]
  }
};

test('I3SAttributeLoader# should return empty object if no attributeName provided', async (t) => {
  const options = {
    attributeType: 'Oid32'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {});
  t.end();
});

test('I3SAttributeLoader# should return empty object if no attributeType provided', async (t) => {
  const options = {
    attributeName: 'OBJECTID'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {OBJECTID: null});
  t.end();
});

test('I3SAttributeLoader# should return empty object if no attributeName and attributeType provided', async (t) => {
  const options = {};
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {});
  t.end();
});

test('I3SAttributeLoader# should load OBJECTID attribute', async (t) => {
  const options = {
    attributeName: 'OBJECTID',
    attributeType: 'Oid32'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.OBJECTID);
  t.equal(attributes.OBJECTID[0], objecId0);
  t.end();
});

test('I3SAttributeLoader# should load string attribute', async (t) => {
  const options = {
    attributeName: 'NAME',
    attributeType: 'String'
  };
  const attributes = await load(namesUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.NAME);
  t.equal(attributes.NAME[602], name602);
  t.end();
});

test('I3SAttributeLoader# should load float attribute', async (t) => {
  const options = {
    attributeName: 'HEIGHTROOF',
    attributeType: 'Float64'
  };
  const attributes = await load(heightRoofUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.HEIGHTROOF);
  t.equal(attributes.HEIGHTROOF[0], heightRoof0);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return null if no tile', async (t) => {
  const tile = {};
  const featureId = 1;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.equal(attributes, null);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return null if no attributeUrls', async (t) => {
  const tile = TILE_WITHOUT_URLS;
  const featureId = 1;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.equal(attributes, null);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return null if no featureId', async (t) => {
  const tile = TILE;
  const featureId = null;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.equal(attributes, null);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return null if no objectIds in attributes', async (t) => {
  const tile = {
    ...TILE,
    tileset: {
      tileset: {
        attributeStorageInfo: [{key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}]
      }
    },
    header: {
      attributeUrls: [namesUrl, heightRoofUrl]
    }
  };
  const featureId = objecId0;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.equal(attributes, null);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return null if no such objectId in objectIds array', async (t) => {
  const tile = TILE;
  const featureId = 12345;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.equal(attributes, null);
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should return attributes object', async (t) => {
  const tile = TILE;
  const featureId = objecId0;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.deepEqual(attributes, {OBJECTID: '979297', NAME: ''});
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes if one of them are failed to fetch', async (t) => {
  const tile = TILE_WITH_WRONG_NAME_ATTRIBUTE_URL;
  const featureId = objecId0;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.deepEqual(attributes, {OBJECTID: '979297', NAME: ''});
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes string attribute should be empty if string attribute has multiple of 4 error from arrayBuffer', async (t) => {
  const tile = TILE_WITH_WRONG_BUFFER_NAME_ATTRIBUTE;
  const featureId = objecId0;
  const options = {};

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.deepEqual(attributes, {OBJECTID: '979297', NAME: ''});
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should work with fetch options', async (t) => {
  const tile = TILE_WITH_WRONG_BUFFER_NAME_ATTRIBUTE;
  const featureId = objecId0;
  const options = {
    attributeName: 'HEIGHTROOF',
    attributeType: 'Float64',
    fetch: {headers: {Authorization: '123456'}}
  };

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.deepEqual(attributes, {OBJECTID: '979297', NAME: ''});
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should work with code values if tilesetFields is provided', async (t) => {
  const tile = TILE_WITH_CODE_VALUES_ATTRIBUTE;
  const featureId = codeValuesFeatureId;
  const options = {
    attributeName: 'BaseLevel',
    attributeType: 'Int32'
  };

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  t.deepEqual(attributes, {OBJECTID_1: '5', BaseLevel: '1ST FLOOR'});
  t.end();
});

test('I3SAttributeLoader#loadFeatureAttributes should work with Int16 attribute type', async (t) => {
  const tile = TILE_WITH_INT_16_ATTRIBUTES;
  const featureId = codeValuesFeatureId;
  const options = {
    attributeName: 'BldgLevel_IsBuildingStory',
    attributeType: 'Int16'
  };

  const attributes = await loadFeatureAttributes(tile, featureId, options);
  // eslint-disable-next-line camelcase
  t.deepEqual(attributes, {OBJECTID_1: '5', BldgLevel_IsBuildingStory: '-1'});
  t.end();
});
