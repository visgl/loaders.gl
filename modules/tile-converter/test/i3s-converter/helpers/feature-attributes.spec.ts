import test from 'tape-promise/tape';
import {
  flattenPropertyTableByFeatureIds,
  checkPropertiesLength,
  createPopupInfo,
  getAttributeTypesFromSchema,
  getAttributeTypesFromPropertyTable,
  getAttributeType
} from '../../../src/i3s-converter/helpers/feature-attributes';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

test('tile-converter(i3s)#flattenPropertyTableByFeatureIds - Should return flatten property table', async (t) => {
  const featureIdsMap = {0: 0, 1: 1, 3: 3};
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock', 'Frames'],
    color: ['red', 'green', 'blue', 'white']
  };
  const expectedResult = {
    component: ['Wall', 'Roof', 'Frames'],
    color: ['red', 'green', 'white']
  };
  const result = flattenPropertyTableByFeatureIds(featureIdsMap, propertyTable);
  t.deepEqual(result, expectedResult);
});

test('tile-converter(i3s)#checkPropertiesLength - Should return false if properies count is the same as featureIds count', async (t) => {
  const featureIds = [0, 1, 3];
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock'],
    color: ['red', 'green', 'blue']
  };
  const result = checkPropertiesLength(featureIds, propertyTable);
  t.deepEqual(result, false);
});

test('tile-converter(i3s)#checkPropertiesLength - Should return true if properies count is not the same as featureIds count', async (t) => {
  const featureIds = [0, 1, 3];
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock', 'Frames'],
    color: ['red', 'green', 'blue', 'white']
  };
  const result = checkPropertiesLength(featureIds, propertyTable);
  t.deepEqual(result, true);
});

test('tile-converter(i3s)#getAttributeTypesFromSchema - Should return attributes type taken from the extension schema', async (t) => {
  const gltfJson = {
    extensions: {
      EXT_structural_metadata: {
        schema: {
          id: 'schema',
          classes: {
            owt_lulc: {
              properties: {
                color: {
                  name: 'Color',
                  description: 'This is ARRAY of UINT8',
                  type: 'SCALAR',
                  componentType: 'UINT8',
                  array: true,
                  count: 3,
                  required: true
                },
                name: {
                  name: 'Name',
                  description: 'This is a NAME',
                  type: 'STRING',
                  required: true
                },
                opt_uint8: {
                  componentType: 'UINT8'
                },
                opt_uint64: {
                  componentType: 'UINT64'
                },
                opt_float32: {
                  componentType: 'FLOAT32'
                },
                opt_enum: {
                  type: 'ENUM'
                }
              }
            }
          }
        }
      }
    }
  };

  const schema_expected = {
    color: 'string',
    name: 'string',
    opt_uint8: 'Int32',
    opt_uint64: 'string',
    opt_float32: 'double',
    opt_enum: 'string'
  };

  let attributePropertySet = getAttributeTypesFromSchema(
    gltfJson as unknown as GLTFPostprocessed,
    'owt_lulc'
  );
  t.deepEqual(attributePropertySet, schema_expected, 'attribute type taken from the schema');
});

test('tile-converter(i3s)#getAttributeTypesFromPropertyTable - Should return attributes type taken from the extension schema', async (t) => {
  const propertyTable = {
    color: ['red', 'green'],
    name: ['myRed', 'myGreen'],
    opt_uint8: [255, 255],
    opt_uint64: [2n, 3n],
    opt_float32: [3.5, 4.0]
  };

  const typesExpected = {
    color: 'string',
    name: 'string',
    opt_uint8: 'Int32',
    opt_uint64: 'string',
    opt_float32: 'double'
  };

  let attributeTypes = getAttributeTypesFromPropertyTable(propertyTable);
  t.deepEqual(attributeTypes, typesExpected, 'attribute type taken from the property table');
});

test('tile-converter(i3s)#createPopupInfo - Should create popup info', async (t) => {
  const attributeNames = ['OBJECTID', 'color', 'name', 'opt_uint8'];

  const popupInfo_expected = {
    title: '{OBJECTID}',
    mediaInfos: [],
    popupElements: [
      {
        fieldInfos: [
          {
            fieldName: 'OBJECTID',
            visible: true,
            isEditable: false,
            label: 'OBJECTID'
          },
          {
            fieldName: 'color',
            visible: true,
            isEditable: false,
            label: 'color'
          },
          {
            fieldName: 'name',
            visible: true,
            isEditable: false,
            label: 'name'
          },
          {
            fieldName: 'opt_uint8',
            visible: true,
            isEditable: false,
            label: 'opt_uint8'
          }
        ],
        type: 'fields'
      }
    ],
    fieldInfos: [
      {
        fieldName: 'OBJECTID',
        visible: true,
        isEditable: false,
        label: 'OBJECTID'
      },
      {
        fieldName: 'color',
        visible: true,
        isEditable: false,
        label: 'color'
      },
      {
        fieldName: 'name',
        visible: true,
        isEditable: false,
        label: 'name'
      },
      {
        fieldName: 'opt_uint8',
        visible: true,
        isEditable: false,
        label: 'opt_uint8'
      }
    ],
    expressionInfos: []
  };

  const popupInfo = createPopupInfo(attributeNames);
  t.deepEqual(popupInfo, popupInfo_expected, 'popupInfo');
});

test('tile-converter(i3s)#getAttributeType - Should return the type of attribute', async (t) => {
  const attributes = ['', 'myName', 0, 1, 2n, 3.5];
  const typesExpected = ['string', 'string', 'Int32', 'Int32', 'string', 'double'];
  const types: string[] = [];
  for (let attribute of attributes) {
    types.push(getAttributeType(attribute));
  }
  t.deepEqual(types, typesExpected, 'popupInfo');
});
