/* eslint-disable */
import test from 'tape-promise/tape';

import {GLBParser, GLBBuilder} from '@loaders.gl/gltf';

test('GLBParser#parse', t => {
  const testJson = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};
  const builder = new GLBBuilder();
  builder.addApplicationData('test', testJson, {packTypedArrays: true});
  const arrayBuffer = builder.encodeAsGLB();

  const parser = new GLBParser();
  parser.parseSync(arrayBuffer);
  const json = parser.getApplicationData('test');
  t.ok(json.nested.typedArray instanceof Float32Array, 'Float32Array present');

  t.end();
});
