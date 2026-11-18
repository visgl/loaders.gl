import {expect, test} from 'vitest';
import {
  flattenPropertyTableByFeatureIds,
  getAttributeTypesMapFromSchema,
  getAttributeTypesMapFromPropertyTable,
  getAttributeType
} from '../../../src/v4/i3s-converter/helpers/feature-attributes';
import type {GLTF} from '@loaders.gl/scene/gltf';
test('tile-converter(i3s)#flattenPropertyTableByFeatureIds preserves geometry order and missing rows', () => {
  const propertyTable = {
    component: ['Wall', '', 'Clock', 'Frames'],
    count: [0, 1, null, 3]
  };
  expect(flattenPropertyTableByFeatureIds([3, 0, 1, 2, 5, 3], propertyTable)).toEqual({
    component: ['Frames', 'Wall', '', 'Clock', null, 'Frames'],
    count: [3, 0, 1, null, null, 3]
  });
});
test('tile-converter(i3s)#getAttributeType - Should return the type of attribute', async () => {
  const attributes = ['', 'myName', 0, 1, 2n, 3.5];
  const typesExpected = ['string', 'string', 'Int32', 'Int32', 'string', 'double'];
  const types: string[] = [];
  for (const attribute of attributes) {
    types.push(getAttributeType(attribute));
  }
  expect(types, 'popupInfo').toEqual(typesExpected);
});
test('tile-converter(i3s)#getAttributeTypesFromSchema - Should return attributes type taken from the extension schema', async () => {
  /* eslint-disable camelcase */
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
  /* eslint-enable camelcase */
  const attributePropertySet = getAttributeTypesMapFromSchema(
    gltfJson as unknown as GLTF,
    'owt_lulc'
  );
  expect(attributePropertySet, 'attribute type taken from the schema').toEqual(schema_expected);
});
test('tile-converter(i3s)#getAttributeTypesFromPropertyTable - Should return attributes type taken from the extension schema', async () => {
  /* eslint-disable camelcase */
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
  /* eslint-enable camelcase */
  const attributeTypes = getAttributeTypesMapFromPropertyTable(propertyTable);
  expect(attributeTypes, 'attribute type taken from the property table').toEqual(typesExpected);
});
