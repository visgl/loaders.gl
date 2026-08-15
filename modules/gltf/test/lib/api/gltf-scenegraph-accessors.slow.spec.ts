// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';

const DAMAGED_HELMET_URL = '@loaders.gl/gltf/test/data/glb/DamagedHelmet.glb';

test('GLTFScenegraph#resolves accessors from the full DamagedHelmet fixture', async () => {
  const testDataSet = [
    {
      accessorIndex: 0,
      accessorCountExpected: 46356,
      arrayExpected: [0, 1, 2, 2, 3, 0, 3, 2]
    },
    {
      accessorIndex: 1,
      accessorCountExpected: 14556,
      arrayExpected: [
        -0.6119945645332336, -0.03094087541103363, 0.48309004306793213, -0.5795046091079712,
        0.05627411603927612, 0.5217580199241638, -0.5735836029052734, 0.06353411078453064
      ]
    }
  ];
  const gltfScenegraph = new GLTFScenegraph(await load(DAMAGED_HELMET_URL, GLTFLoader));

  for (const testData of testDataSet) {
    let typedArray = gltfScenegraph.getTypedArrayForAccessor(testData.accessorIndex);
    expect(Array.from(typedArray.slice(0, 8))).toEqual(testData.arrayExpected);

    const accessor = gltfScenegraph.getAccessor(testData.accessorIndex);
    expect(accessor.count).toBe(testData.accessorCountExpected);

    typedArray = gltfScenegraph.getTypedArrayForAccessor(accessor);
    expect(Array.from(typedArray.slice(0, 8))).toEqual(testData.arrayExpected);

    if (accessor.bufferView === 0) {
      accessor.bufferView = undefined;
      typedArray = gltfScenegraph.getTypedArrayForAccessor(accessor);
      expect(Array.from(typedArray.slice(0, 8))).toEqual(testData.arrayExpected);
    }
  }
});
