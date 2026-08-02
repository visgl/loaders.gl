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

  it('validates draft glTF 2.1 thumbnail references', () => {
    expect(
      GLTFSchema.safeParse({
        asset: {version: '2.1', thumbnail: 0},
        images: [{uri: 'thumbnail.png'}]
      }).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset: {version: '2.1', thumbnail: -1}}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset: {version: '2.1', thumbnail: 0.5}}).success).toBe(false);
  });

  it('accepts extension-defined animation target paths', () => {
    const document = {
      asset: {version: '2.0'},
      animations: [
        {
          channels: [{sampler: 0, target: {path: 'pointer'}}],
          samplers: [{input: 0, output: 1}]
        }
      ]
    };

    expect(GLTFSchema.safeParse(document).success).toBe(true);
  });

  it('requires the camera projection matching its type', () => {
    const asset = {version: '2.0'};
    const perspective = {yfov: 1, znear: 0.1};
    const orthographic = {xmag: 1, ymag: 1, zfar: 100, znear: 0};

    expect(
      GLTFSchema.safeParse({asset, cameras: [{type: 'perspective', perspective}]}).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset, cameras: [{type: 'perspective'}]}).success).toBe(false);
    expect(
      GLTFSchema.safeParse({
        asset,
        cameras: [{type: 'perspective', perspective, orthographic}]
      }).success
    ).toBe(false);
  });

  it('requires exactly one valid image source', () => {
    const asset = {version: '2.0'};

    expect(GLTFSchema.safeParse({asset, images: [{uri: 'image.png'}]}).success).toBe(true);
    expect(
      GLTFSchema.safeParse({asset, images: [{bufferView: 0, mimeType: 'image/png'}]}).success
    ).toBe(true);
    expect(GLTFSchema.safeParse({asset, images: [{}]}).success).toBe(false);
    expect(GLTFSchema.safeParse({asset, images: [{bufferView: 0}]}).success).toBe(false);
    expect(
      GLTFSchema.safeParse({
        asset,
        images: [{uri: 'image.png', bufferView: 0, mimeType: 'image/png'}]
      }).success
    ).toBe(false);
  });
});
