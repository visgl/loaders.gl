/* eslint-disable */
import test from 'tape-catch';

import {GLBParser, GLBBuilder} from '@loaders.gl/gltf';

test('GLBParser#parse', t => {
  const testJson = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};
  const builder = new GLBBuilder();
  builder.addApplicationData('test', testJson);
  const arrayBuffer = builder.encodeAsGLB();

  const parser = new GLBParser();
  parser.parse(arrayBuffer);
  const json = parser.getApplicationData('test');
  t.ok(json.nested.typedArray instanceof Float32Array, 'Float32Array present');

  t.end();
});
