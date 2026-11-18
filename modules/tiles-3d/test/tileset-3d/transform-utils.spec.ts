// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {calculateTransformProps} from '../../src/tileset-3d/helpers/transform-utils';

/** Numeric node index zero must resolve before absorbing an Earth-scale placement. */
test('tile transforms absorb the indexed glTF root placement once', () => {
  const matrix = Array.from(new Matrix4().translate([6378137, 0, 0]));
  const tile: any = {
    gltfUpAxis: 'Z',
    gltf: {
      json: {asset: {version: '2.0'}, scene: 0, scenes: [{nodes: [0]}], nodes: [{matrix}]},
      buffers: []
    }
  };
  const header: any = {computedTransform: new Matrix4(), boundingVolume: {center: [6378137, 0, 0]}};
  calculateTransformProps(header, tile);
  expect(tile.cartesianModelMatrix[12]).toBe(6378137);
  expect(Array.from(tile.gltf.json.nodes[0].matrix)).toEqual(Array.from(Matrix4.IDENTITY));
});
