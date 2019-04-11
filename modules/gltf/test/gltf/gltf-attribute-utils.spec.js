import test from 'tape-promise/tape';
import {getGLTFIndices, getGLTFAccessors} from '@loaders.gl/draco/gltf-attribute-utils';

// Check if an attribute contains indices

const INDICES_TESTS = [
  {attributes: {NOT: [1, 2, 1]}, containsIndices: false},
  {attributes: {INDICES: [1, 2, 1]}, containsIndices: true},
  {attributes: {INDEX: [1, 2, 1]}, containsIndices: true},
  {attributes: {INDICES: [1, 2, 1]}, containsIndices: true},
  {attributes: {ELEMENTS: [1, 2, 1]}, containsIndices: true},
  {attributes: {ELEMENT_INDEX: [1, 2, 1]}, containsIndices: true}
];

test('getGLTFIndices', t => {
  for (const tc of INDICES_TESTS) {
    const indices = getGLTFIndices(tc.attributes);
    if (tc.containsIndices) {
      t.ok(indices, JSON.stringify(tc.attributes));
    } else {
      t.notOk(indices, JSON.stringify(tc.attributes));
    }
  }
  t.end();
});

test('getGLTFAccessors', t => {
  t.ok(getGLTFAccessors);
  t.end();
});
