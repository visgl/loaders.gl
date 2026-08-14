// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeImageManifestSchema,
  ImageTextureManifestSchema
} from '@loaders.gl/textures/texture-manifest-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('CompositeImageManifestSchema', () => {
  it('accepts every supported manifest shape', () => {
    const manifests = [
      {shape: 'image-texture', image: 'image.png'},
      {shape: 'image-texture-array', layers: ['layer.png']},
      {
        shape: 'image-texture-cube',
        faces: {
          '+X': 'right.png',
          '-X': 'left.png',
          '+Y': 'top.png',
          '-Y': 'bottom.png',
          '+Z': 'front.png',
          '-Z': 'back.png'
        }
      },
      {
        shape: 'image-texture-cube-array',
        layers: [
          {
            faces: {
              right: 'right.png',
              left: 'left.png',
              top: 'top.png',
              bottom: 'bottom.png',
              front: 'front.png',
              back: 'back.png'
            }
          }
        ]
      }
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
        layers: [
          {
            faces: {
              '+X': 'right.png',
              '-X': 'left.png',
              '+Y': 'top.png',
              '-Y': 'bottom.png',
              '+Z': 'front.png',
              '-Z': []
            }
          }
        ]
      }).success
    ).toBe(false);
  });

  it('requires exactly one two-dimensional image source', () => {
    expect(ImageTextureManifestSchema.safeParse({shape: 'image-texture'}).success).toBe(false);
    expect(
      ImageTextureManifestSchema.safeParse({
        shape: 'image-texture',
        image: 'image.png',
        mipmaps: ['mipmap.png']
      }).success
    ).toBe(false);
    expect(
      ImageTextureManifestSchema.safeParse({
        shape: 'image-texture',
        mipmaps: ['mipmap.png'],
        template: 'mipmap-{level}.png'
      }).success
    ).toBe(false);
  });

  it('requires all six cube faces using canonical names or aliases', () => {
    expect(
      CompositeImageManifestSchema.safeParse({
        shape: 'image-texture-cube',
        faces: {
          right: 'right.png',
          left: 'left.png',
          top: 'top.png',
          bottom: 'bottom.png',
          front: 'front.png'
        }
      }).success
    ).toBe(false);
    expect(
      CompositeImageManifestSchema.safeParse({
        shape: 'image-texture-cube',
        faces: {
          '+X': 'right.png',
          left: 'left.png',
          '+Y': 'top.png',
          bottom: 'bottom.png',
          '+Z': 'front.png',
          back: 'back.png'
        }
      }).success
    ).toBe(true);
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(CompositeImageManifestSchema, {target: 'draft-7'});
    const serializedJsonSchema = JSON.stringify(jsonSchema);

    expect(serializedJsonSchema).toContain('"required":["shape","image"]');
    expect(serializedJsonSchema).toContain('"required":["shape","mipmaps"]');
    expect(serializedJsonSchema).toContain('"required":["shape","template"]');
    expect(serializedJsonSchema).toContain('"required":["+X"]');
    expect(serializedJsonSchema).toContain('"required":["right"]');
  });
});
