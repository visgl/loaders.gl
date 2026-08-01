// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFSchema} from '@loaders.gl/gltf';
import {describe, expect, it} from 'vitest';

describe('GLTFSchema', () => {
  it('accepts a glTF document and preserves extension properties', () => {
    const document = {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_meshopt_compression'],
      extensions: {EXT_example: {enabled: true}},
      customProperty: 'preserved'
    };

    expect(GLTFSchema.parse(document)).toEqual(document);
  });

  it('rejects malformed core properties', () => {
    expect(GLTFSchema.safeParse({asset: {version: 2}}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset: {version: '2.0'}, scene: -1}).success).toBe(false);
  });
});
