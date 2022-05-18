/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {parse, fetchFile} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/meshopt/BoxTextured_meshopt.glb';

test('GLTFLoader#KHR_texture_transform', async (t) => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const gltf = await parse(data, GLTFLoader);
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
