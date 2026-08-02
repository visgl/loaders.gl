// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeImageManifestSchema, ImageTextureManifestSchema} from '@loaders.gl/textures';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('CompositeImageManifestSchema', () => {
  it('accepts every supported manifest shape', () => {
    const manifests = [
      {shape: 'image-texture', image: 'image.png'},
      {shape: 'image-texture-array', layers: ['layer.png']},
      {shape: 'image-texture-cube', faces: {'+X': 'right.png'}},
      {shape: 'image-texture-cube-array', layers: [{faces: {right: 'right.png'}}]}
    ];

    for (const manifest of manifests) {
      expect(CompositeImageManifestSchema.safeParse(manifest).success).toBe(true);
    }
  });

  it('rejects malformed sources and empty collections', () => {
    expect(ImageTextureManifestSchema.safeParse({shape: 'image-texture', image: 1}).success).toBe(
      false
    );
    expect(
      CompositeImageManifestSchema.safeParse({shape: 'image-texture-array', layers: []}).success
    ).toBe(false);
    expect(
      CompositeImageManifestSchema.safeParse({
        shape: 'image-texture-cube-array',
        layers: [{faces: {'+X': []}}]
      }).success
    ).toBe(false);
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(CompositeImageManifestSchema, {target: 'draft-7'});
    expect(jsonSchema.oneOf).toHaveLength(4);
  });
});
