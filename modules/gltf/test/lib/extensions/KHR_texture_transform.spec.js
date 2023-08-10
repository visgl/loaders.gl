/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {parse, fetchFile} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/meshopt/BoxTextured_meshopt.glb';

test('GLTFLoader#KHR_texture_transform', async (t) => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const gltfWithBuffers = await parse(data, GLTFLoader);
  const gltf = postProcessGLTF(gltfWithBuffers);

  t.equals(gltf.bufferViews[3].byteLength, 192, 'Has correct bufferView byte length');
  t.equals(
    gltf.accessors[2].componentType,
    5126,
    'UV0 component type has been changed from 5123 (int16) to 5126 (float)'
  );
  t.equals(
    gltf.accessors[2].value.constructor,
    Float32Array,
    'UV0 data has been transformed from Uint16Array to Float32Array'
  );
  t.end();
});

test('GLTFLoader#KHR_texture_transform with no buffers loaded', async (t) => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  /**
   * @type {import("@loaders.gl/gltf").ParseGLTFOptions}
   */
  const loaderOptions = {loadBuffers: false};
  const gltfWithBuffers = await parse(data, GLTFLoader, {gltf: loaderOptions});
  const gltf = postProcessGLTF(gltfWithBuffers, loaderOptions);

  t.equals(gltf.bufferViews[3].byteLength, 96, 'Has UNPROCESSED bufferView byte length');
  t.equals(
    gltf.accessors[2].componentType,
    5123,
    "UV0 component type has NOT been changed from 5123 (int16) to 5126 (float), because it's UNPROCESSED"
  );
  t.end();
});
