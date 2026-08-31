// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getBytesFromComponentType,
  getGLEnumFromSamplerParameter,
  getSizeFromAccessorType
} from '../src/lib/gltf-utils/gltf-constants';

test('glTF constant helpers map component, accessor, and sampler values', () => {
  expect(getBytesFromComponentType(5126)).toBe(4);
  expect(getBytesFromComponentType(5130)).toBe(8);
  expect(getSizeFromAccessorType('VEC3')).toBe(3);
  expect(getSizeFromAccessorType('MAT4')).toBe(16);
  expect(getGLEnumFromSamplerParameter('magFilter')).toBe(0x2800);
  expect(getGLEnumFromSamplerParameter('minFilter')).toBe(0x2801);
  expect(getGLEnumFromSamplerParameter('wrapS')).toBe(0x2802);
  expect(getGLEnumFromSamplerParameter('wrapT')).toBe(0x2803);
  expect(getGLEnumFromSamplerParameter('unknown')).toBeUndefined();
});
