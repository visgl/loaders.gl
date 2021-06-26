/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {makeSchemaFromAttributes} from '../../../src/lib/utils/schema-attribute-utils';

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
      }
    }
  }
};

const INDICES_STUB = {
  value: new Uint8Array([0, 1, 2]),
  size: 1
};

test('DracoLoader#makeSchemaFromAttributes', (t) => {
  const schema = makeSchemaFromAttributes(ATTRIBUTES_STUB, LOADER_DATA_STUB, INDICES_STUB);
  t.ok(schema, 'Makes schema from attributes');
  t.equals(schema.metadata.size, 2, 'Metadata size');
  t.equals(schema.fields.length, 2, 'Number of fields');
  t.equals(schema.fields[0].metadata.size, 2, 'Attribute metadata size');
  t.end();
});
