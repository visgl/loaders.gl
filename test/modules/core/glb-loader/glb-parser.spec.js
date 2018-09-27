/* eslint-disable */
import test from 'tape-catch';

import {GLBParser, GLBBuilder} from 'loaders.gl';

test('GLBParser#parse', t => {
  const testJson = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};
  const builder = new GLBBuilder();
  const packedJSON = builder.packJSON(testJson);
  builder.addExtras(packedJSON);
  const arrayBuffer = builder.encode();

  const parser = new GLBParser(arrayBuffer);
  const gltfData = parser.parse();
  const json = parser.unpackJSON(gltfData.json.extras);
  t.ok(json.nested.typedArray instanceof Float32Array, 'Float32Array present');

  t.end();
});
