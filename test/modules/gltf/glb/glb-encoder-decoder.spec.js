/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder, GLBParser} from '@loaders.gl/gltf';

import TEST_JSON from 'test-data/glb/test-data.json';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('GLB#encode-and-decode', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addBuffer(buffer, {size: 1});
  }

  glbBuilder.addApplicationData('extras', TEST_JSON);

  const glbFileBuffer = glbBuilder.encodeAsGLB();

  t.equal(glbFileBuffer.byteLength, 1620, 'should be equal');

  const {json, binaryByteOffset, unpackedBuffers} = new GLBParser(glbFileBuffer).parse();

  t.equal(binaryByteOffset, 1592);
  t.deepEqual(json.extras, TEST_JSON, 'JSON is equal');

  for (const key in unpackedBuffers.accessors) {
    delete unpackedBuffers.accessors[key].accessor;
  }

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(unpackedBuffers.accessors));
  t.deepEqual(unpackedBuffers.accessors, BUFFERS, 'buffers should be deep equal');
  t.end();
});
