/* eslint-disable */
import test from 'tape-catch';

import {GLBParser, GLTFBuilder} from '@loaders.gl/gltf';

test('GLBParser#parse', t => {
  const testJson = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};
  const builder = new GLTFBuilder();
  builder.addApplicationData('test', testJson);
  const arrayBuffer = builder.encodeAsGLB();

  const parser = new GLBParser(arrayBuffer);
  const gltfData = parser.parse();
  const json = parser.unpackJSON(gltfData.json.test);
  t.ok(json.nested.typedArray instanceof Float32Array, 'Float32Array present');

  t.end();
});
