import test from 'tape-promise/tape';
import {
  flattenPropertyTableByFeatureIds,
  checkPropertiesLength,
  createStorageAttributes,
  getAttributePropertiesFromSchema
} from '../../../src/i3s-converter/helpers/feature-attributes';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import type {AttributeStorageInfo, Field} from '@loaders.gl/i3s';

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

test('tile-converter(i3s)#getSchemaClassProperties - Should return attributes type taken from the extension schema', async (t) => {
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
    color: {
      attributeType: 'string',
      attributeName: 'Color',
      attributeDescription: 'This is ARRAY of UINT8'
    },
    name: {attributeType: 'string', attributeName: 'Name', attributeDescription: 'This is a NAME'},
    opt_uint8: {attributeType: 'Int32', attributeName: undefined, attributeDescription: undefined},
    opt_uint64: {
      attributeType: 'string',
      attributeName: undefined,
      attributeDescription: undefined
    },
    opt_float32: {
      attributeType: 'double',
      attributeName: undefined,
      attributeDescription: undefined
    },
    opt_enum: {attributeType: 'string', attributeName: undefined, attributeDescription: undefined}
  };

  let attributePropertySet = getAttributePropertiesFromSchema(
    gltfJson as unknown as GLTFPostprocessed,
    'owt_lulc'
  );
  t.deepEqual(attributePropertySet, schema_expected, 'attribute type taken from the schema');

  attributePropertySet = getAttributePropertiesFromSchema(
    gltfJson as unknown as GLTFPostprocessed,
    ''
  );
});

test('tile-converter(i3s)#createStorageAttributes - Should create Attribute storage info', async (t) => {
  const attributePropertySet = {
    color: {
      attributeType: 'string',
      attributeName: 'Color',
      attributeDescription: 'This is ARRAY of UINT8'
    },
    name: {attributeType: 'string', attributeName: 'Name', attributeDescription: 'This is a NAME'},
    opt_uint8: {attributeType: 'Int32'},
    opt_uint64: {attributeType: 'string'},
    opt_float32: {attributeType: 'double'},
    opt_enum: {attributeType: 'string'}
  };

  const attributeStorageInfo_expected = [
    {
      key: 'f_0',
      name: 'OBJECTID',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Oid32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_1',
      name: 'color',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_2',
      name: 'name',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_3',
      name: 'opt_uint8',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Int32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_4',
      name: 'opt_uint64',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_5',
      name: 'opt_float32',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Float64',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_6',
      name: 'opt_enum',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    }
  ];

  const fields_expected = [
    {
      name: 'OBJECTID',
      type: 'esriFieldTypeOID',
      alias: 'OBJECTID'
    },
    {
      name: 'color',
      type: 'esriFieldTypeString',
      alias: 'color'
    },
    {
      name: 'name',
      type: 'esriFieldTypeString',
      alias: 'name'
    },
    {
      name: 'opt_uint8',
      type: 'esriFieldTypeInteger',
      alias: 'opt_uint8'
    },
    {
      name: 'opt_uint64',
      type: 'esriFieldTypeString',
      alias: 'opt_uint64'
    },
    {
      name: 'opt_float32',
      type: 'esriFieldTypeDouble',
      alias: 'opt_float32'
    },
    {
      name: 'opt_enum',
      type: 'esriFieldTypeString',
      alias: 'opt_enum'
    }
  ];

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
          },
          {
            fieldName: 'opt_uint64',
            visible: true,
            isEditable: false,
            label: 'opt_uint64'
          },
          {
            fieldName: 'opt_float32',
            visible: true,
            isEditable: false,
            label: 'opt_float32'
          },
          {
            fieldName: 'opt_enum',
            visible: true,
            isEditable: false,
            label: 'opt_enum'
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
      },
      {
        fieldName: 'opt_uint64',
        visible: true,
        isEditable: false,
        label: 'opt_uint64'
      },
      {
        fieldName: 'opt_float32',
        visible: true,
        isEditable: false,
        label: 'opt_float32'
      },
      {
        fieldName: 'opt_enum',
        visible: true,
        isEditable: false,
        label: 'opt_enum'
      }
    ],
    expressionInfos: []
  };

  const attributeStorageInfo: AttributeStorageInfo[] = [];
  const fields: Field[] = [];

  const popupInfo = createStorageAttributes(attributePropertySet, attributeStorageInfo, fields);
  t.deepEqual(attributeStorageInfo, attributeStorageInfo_expected, 'attributeStorageInfo');
  t.deepEqual(fields, fields_expected, 'fields');
  t.deepEqual(popupInfo, popupInfo_expected, 'popupInfo');
});
