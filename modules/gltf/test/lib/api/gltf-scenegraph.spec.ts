import test from 'tape-promise/tape';

import {GLTFScenegraph} from '@loaders.gl/gltf';

const binaryBufferData = [58, 199, 113, 55, 81, 71];
const binaryBufferDataAlligned = binaryBufferData.concat([0, 0]);

const getGltf = () => ({
  buffers: [
    {
      arrayBuffer: new Uint8Array(0).buffer,
      byteOffset: 0,
      byteLength: 8
    }
  ],
  json: {
    asset: {
      version: '2.0'
    },
    buffers: [
      {
        byteLength: 6
      }
    ]
  }
});

test('gltf#gltf-scenegraph - Should create scenegraph with correct buffers', async (t) => {
  const gltf = getGltf();
  gltf.buffers[0].arrayBuffer = new Uint8Array(binaryBufferDataAlligned).buffer;

  let scenegraph = new GLTFScenegraph(gltf);
  t.equal(scenegraph.sourceBuffers.length, 1);
  t.equal(scenegraph.gltf.buffers.length, 1);

  scenegraph.createBinaryChunk();
  t.equal(scenegraph.sourceBuffers.length, 1);
  t.equal(scenegraph.gltf.buffers.length, 1);

  // Add one more buffer
  gltf.buffers.push({
    arrayBuffer: new Uint8Array(binaryBufferDataAlligned).buffer,
    byteOffset: 0,
    byteLength: 8
  });
  // Re-create the scenegraph
  scenegraph = new GLTFScenegraph(gltf);
  t.equal(scenegraph.gltf.buffers.length, 2);
  t.equal(scenegraph.gltf.buffers[0].byteLength, 8);
  t.equal(scenegraph.gltf.buffers[1].byteLength, 8);

  scenegraph.createBinaryChunk();
  t.equal(scenegraph.sourceBuffers.length, 1);
  t.equal(scenegraph.gltf.buffers.length, 1);

  t.equal(scenegraph.gltf.buffers[0].byteLength, 16);

  // Call createBinaryChunk again for the same scenegraph
  scenegraph.createBinaryChunk();
  t.equal(scenegraph.sourceBuffers.length, 1);
  t.equal(scenegraph.gltf.buffers.length, 1);

  t.equal(scenegraph.gltf.buffers[0].byteLength, 16);

  t.end();
});
