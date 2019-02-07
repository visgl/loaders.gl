import test from 'tape-catch';
import {getGLTFIndices, getGLTFAccessors, getGLTFAttributeMap} from '@loaders.gl/core';

/*
const PATTERNS = [
  pos/i, POSITION,
  vertex/i, POSITION,
  vertices/i, POSITION,
  pickingColor/i, 'COLOR_1',
  color/i, 'COLOR_0',
  normal/i, 'NORMAL',
  tangent/i, 'TANGENT',
  [(/texCoord1/i: TEXCOORD_0)],
  [(/texCoord2/i: TEXCOORD_1)],
  [(/texCoord3/i: TEXCOORD_2)],
  [(/texCoord/i: TEXCOORD_0)],
  [(/uv1/i: TEXCOORD_0)],
  [(/uv2/i: TEXCOORD_1)],
  [(/uv3/i: TEXCOORD_2)],
  [(/uv/i: TEXCOORD_0)],
  [(/joints/i: 'JOINTS_0')],
  [(/weights/i: 'WEIGHTS_0')]
];
*/

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

test('getGLTFAttributeMap', t => {
  t.ok(getGLTFAttributeMap);
  t.end();
});

