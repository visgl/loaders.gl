// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {expect, test} from 'vitest';
import {getDracoSchema} from '../../../src/lib/utils/get-draco-schema';

const ATTRIBUTES_STUB = {
  POSITIONS: {
    value: new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    size: 2
  }
};

const LOADER_DATA_STUB = {
  geometry_type: 1,
  num_attributes: 1,
  num_points: 3,
  num_faces: 1,
  metadata: {
    property1: {
      int: 111,
      string: 'qwe',
      double: 111.0222,
      intArray: new Int32Array()
    },
    property2: {
      int: 222,
      string: 'abc',
      double: 222.111,
      intArray: new Int32Array()
    }
  },
  attributes: {
    0: {
      unique_id: 0,
      name: 'POSITIONS',
      attribute_type: 0,
      data_type: 9,
      num_components: 3,
      byte_offset: 0,
      byte_stride: 12,
      normalized: false,
      metadata: {
        property1: {
          int: 333,
          string: 'abc abc',
          double: -333.333,
          intArray: new Int32Array()
        },
        property111: {
          int: 444,
          string: 'qwe qwe',
          double: 444.4,
          intArray: new Int32Array()
        }
      },
      attribute_index: 0
    }
  }
};

const INDICES_STUB = {
  value: new Uint8Array([0, 1, 2]),
  size: 1
};

test('DracoLoader#getDracoSchema', () => {
  const schema = getDracoSchema(ATTRIBUTES_STUB, LOADER_DATA_STUB, INDICES_STUB);
  expect(schema).toBeDefined();
  expect(Object.keys(schema.metadata)).toHaveLength(2);
  expect(schema.fields).toHaveLength(2);
  expect(Object.keys(schema.fields[0]?.metadata || {})).toHaveLength(2);
});

test('DracoLoader#getDracoSchema handles unnamed attributes and missing indices', () => {
  const schema = getDracoSchema(
    {POSITION: {value: new Float32Array([0, 1, 2]), size: 3}},
    {
      ...LOADER_DATA_STUB,
      metadata: {},
      attributes: {0: {...LOADER_DATA_STUB.attributes[0], name: undefined}}
    }
  );

  expect(schema.fields).toHaveLength(1);
  expect(schema.fields[0].name).toBe('POSITION');
  expect(schema.metadata).toEqual({});
});
