import {expect, test} from 'vitest';
import {parseAvroSchema} from '../src/lib/parsers/parse-avro-schema';

test.each([
  ['{', 'Invalid Avro schema JSON'],
  ['null', 'expected a string, object, or union'],
  ['[]', 'empty union'],
  ['"missing"', 'unknown type'],
  ['{}', 'missing type'],
  ['{"type":"record","name":"1Invalid","fields":[]}', 'invalid or missing name'],
  ['{"type":"record"}', 'invalid or missing name'],
  ['{"type":"record","name":"Root"}', 'expected an array'],
  ['{"type":"record","name":"Root","fields":[null]}', 'invalid field'],
  ['{"type":"record","name":"Root","fields":[{"name":1,"type":"int"}]}', 'invalid field'],
  ['{"type":"array"}', 'expected a string, object, or union'],
  ['{"type":"map","values":"missing"}', 'unknown type'],
  ['{"type":"unknown"}', 'unknown type'],
  ['{"type":"fixed","name":"Value","size":-1}', 'non-negative integer'],
  ['{"type":"fixed","name":"Value","size":1.5}', 'non-negative integer'],
  ['{"type":"fixed","name":"Value","size":"1"}', 'non-negative integer'],
  ['{"type":"enum","name":"Kind","symbols":null}', 'array of strings'],
  ['{"type":"enum","name":"Kind","symbols":["A",1]}', 'array of strings']
])('rejects invalid standalone schema: %s', (schema, message) => {
  expect(() => parseAvroSchema(schema)).toThrow(message);
});

test('validates nested named schemas, unions, collections, and defaults', () => {
  const schema = {
    type: 'record',
    name: 'Root',
    fields: [
      {name: 'enabled', type: 'boolean', default: false},
      {name: 'count', type: 'long', default: 3},
      {name: 'payload', type: 'bytes', default: 'abc'},
      {name: 'items', type: {type: 'array', items: 'int'}, default: [1, 2]},
      {name: 'labels', type: {type: 'map', values: 'string'}, default: {first: 'one'}},
      {
        name: 'kind',
        type: {type: 'enum', name: 'Kind', symbols: ['A', 'B']},
        default: 'A'
      },
      {
        name: 'value',
        type: {type: 'fixed', name: 'Value', size: 2},
        default: 'ab'
      },
      {
        name: 'nested',
        type: {
          type: 'record',
          name: 'Nested',
          fields: [{name: 'id', type: 'int'}]
        },
        default: {id: 7}
      },
      {name: 'nestedReference', type: {type: 'Nested'}, default: {}},
      {name: 'wrapped', type: {type: {type: 'string'}}, default: 'value'},
      {name: 'primitiveObject', type: {type: 'string'}, default: 'value'},
      {name: 'optional', type: ['null', 'string'], default: null}
    ]
  };

  expect(parseAvroSchema(JSON.stringify(schema))).toEqual(schema);
});

test.each([
  '"string"',
  '{"type":"string"}',
  '{"type":{"type":"string"}}',
  '["null","string"]',
  '{"type":"record","name":"Node","fields":[{"name":"next","type":["null","Node"],"default":null}]}'
])('accepts standalone primitive, wrapped, union, and recursive schemas: %s', schema => {
  expect(parseAvroSchema(schema)).toBeDefined();
});

test.each([
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":"int","default":1.5}]}',
    'expected integer'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":"boolean","default":1}]}',
    'expected boolean'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":"null","default":false}]}',
    'expected null'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":["string","null"],"default":null}]}',
    'expected string'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"array","items":"int"},"default":{}}]}',
    'expected array'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"map","values":"int"},"default":[]}]}',
    'expected object map'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"enum","name":"Kind","symbols":["A"]},"default":"B"}]}',
    'unknown enum symbol'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"fixed","name":"Value","size":2},"default":1}]}',
    'expected string'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":"double","default":1e400}]}',
    'expected number'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":"string","default":1}]}',
    'expected string'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"record","name":"Nested","fields":[]},"default":[]}]}',
    'expected record object'
  ],
  [
    '{"type":"record","name":"Root","fields":[{"name":"value","type":{"type":"enum","name":"Kind","symbols":["A"]},"default":1}]}',
    'unknown enum symbol'
  ]
])('rejects incompatible Avro defaults: %s', (schema, message) => {
  expect(() => parseAvroSchema(schema)).toThrow(message);
});
