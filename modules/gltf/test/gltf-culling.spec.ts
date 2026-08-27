// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {BoxShape, CapsuleShape, SphereShape} from '@math.gl/culling';
import {getGLTFCullingShape, getGLTFNodeCullingShape} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../src/lib/types/gltf-types';

describe('glTF 2.1 culling shapes', () => {
  test('resolves top-level shapes without mutating JSON', () => {
    const gltf: GLTFWithBuffers = {
      json: {
        asset: {version: '2.1'},
        shapes: [{type: 'sphere', sphere: {radius: 2}}]
      },
      buffers: []
    };
    const source = JSON.stringify(gltf.json);

    const shape = getGLTFCullingShape(gltf, 0);
    expect(shape).toBeInstanceOf(SphereShape);
    expect((shape as SphereShape).radius).toBe(2);
    expect(JSON.stringify(gltf.json)).toBe(source);
  });

  test('resolves node bounding volumes and applies the volume matrix', () => {
    const gltf: GLTFWithBuffers = {
      json: {
        asset: {version: '2.1'},
        shapes: [{type: 'box', box: {size: [2, 4, 6]}}],
        nodes: [
          {boundingVolume: {shape: 0, matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1]}}
        ]
      },
      buffers: []
    };

    const shape = getGLTFNodeCullingShape(gltf, 0);
    expect(shape).toBeInstanceOf(BoxShape);
    expect(shape?.containsPoint([3, 0, 0])).toBe(true);
    expect(shape?.containsPoint([5, 0, 0])).toBe(false);
  });

  test('supports capsule defaults and reports invalid references', () => {
    const gltf: GLTFWithBuffers = {
      json: {asset: {version: '2.1'}, shapes: [{type: 'capsule', capsule: {height: 2}}]},
      buffers: []
    };
    const shape = getGLTFCullingShape(gltf, 0);
    expect(shape).toBeInstanceOf(CapsuleShape);
    expect((shape as CapsuleShape).radiusBottom).toBe(0.5);
    expect(() => getGLTFCullingShape(gltf, 1)).toThrow('/shapes/1');
  });
});
