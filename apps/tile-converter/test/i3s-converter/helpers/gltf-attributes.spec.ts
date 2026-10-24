// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BoundingSphere} from '@math.gl/geometry/culling';
import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';
import {
  calculateTransformProps,
  prepareDataForAttributesConversion
} from '../../../src/v4/i3s-converter/helpers/gltf-attributes';
import {areNumberArraysEqual} from '../../utils/compareArrays';
const FRANKFURT_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/data/Frankfurt/L5/OF/474_5548_-1_lv5_group_0.osgb_3.b3dm';

test.each([
  false,
  true
])('legacy conversion selects raw accessor values and images without mutating glTF; images=%s', includeImages => {
  const scenegraph = new GLTFScenegraph();
  const positions = new Float32Array([7, 8, 9]);
  const meshIndex = scenegraph.addMesh({attributes: {POSITION: {value: positions, size: 3}}});
  const nodeIndex = scenegraph.addNode({meshIndex});
  scenegraph.gltf.json.nodes![nodeIndex].translation = [1, 2, 3];
  scenegraph.setDefaultScene(scenegraph.addScene({nodeIndices: [nodeIndex]}));
  scenegraph.createBinaryChunk();
  if (includeImages) {
    scenegraph.gltf.json.images = [{mimeType: 'image/png'}, {mimeType: 'image/ktx2'}];
    scenegraph.gltf.images = [
      {data: new Uint8Array([1, 2, 3, 255]), width: 1, height: 1} as any,
      {compressed: true, data: new Uint8Array(4), mipmaps: false, width: 1, height: 1}
    ];
  }
  const before = structuredClone(scenegraph.gltf);
  const result = prepareDataForAttributesConversion(
    {gltf: scenegraph.gltf} as any,
    new Matrix4(),
    new BoundingSphere([1, 2, 3], 4)
  );
  expect(result.nodes[0].mesh!.primitives[0].attributes.POSITION.value).toEqual(positions);
  expect(result.nodes[0].translation).toEqual([1, 2, 3]);
  expect(result.nodes[0].mesh!.primitives[0].attributes.POSITION).not.toHaveProperty('bufferView');
  expect(result.nodes[0].mesh!.primitives[0].attributes.POSITION.value.buffer).not.toBe(
    positions.buffer
  );
  expect(scenegraph.gltf).toEqual(before);
  expect(result.images).toHaveLength(includeImages ? 2 : 0);
  if (includeImages) {
    expect(result.images[0]!.data).toEqual(new Uint8Array([1, 2, 3, 255]));
    expect(result.images[1]).toBeNull();
  }
});
test.skip('tile-converter(i3s)#calculateTransformProps', async () => {
  const tileContent = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader);
  const tileTransform = new Matrix4([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4055182.44018, 615965.038498, 4867494.346586, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([4051833.805439, 618316.801881, 4870677.172590001]);
  const transformProps = calculateTransformProps(tileContent, tileTransform, tileBoundingVolume);
  expect(
    areNumberArraysEqual(
      transformProps.modelMatrix,
      [
        1, 0, 0, 0, 0, 6.123233995736766e-17, 1, 0, 0, -1, 6.123233995736766e-17, 0, 4055182.44018,
        615965.038498, 4867494.346586, 1
      ]
    )
  ).toBeTruthy();
  expect(
    areNumberArraysEqual(
      transformProps.cartographicOrigin,
      [8.676496951388435, 50.108416671362576, 189.47502169783516]
    )
  ).toBeTruthy();
});
