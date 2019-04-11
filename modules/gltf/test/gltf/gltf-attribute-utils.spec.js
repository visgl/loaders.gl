import test from 'tape-promise/tape';
import {getGLTFAccessors, getGLTFAccessor} from '@loaders.gl/gltf/gltf/gltf-attribute-utils';

// Check if an attribute contains indices

test('getGLTFAccessors', t => {
  t.ok(getGLTFAccessors);
  t.ok(getGLTFAccessor);
  t.end();
});
