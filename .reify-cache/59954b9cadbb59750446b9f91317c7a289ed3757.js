"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var GLBBuilder,GLBParser;module.link('@loaders.gl/gltf',{GLBBuilder(v){GLBBuilder=v},GLBParser(v){GLBParser=v}},1);var TEST_JSON;module.link('../data/glb/test-data.json',{default(v){TEST_JSON=v}},2);/* eslint-disable max-len */






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

  const {json, binaryByteOffset, unpackedBuffers} = new GLBParser().parseSync(glbFileBuffer);

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
