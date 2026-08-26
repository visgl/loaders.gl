// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {afterEach, describe, expect, test, vi} from 'vitest';

vi.mock('@loaders.gl/images', async importOriginal => ({
  ...(await importOriginal()),
  isImageFormatSupported: vi.fn()
}));

import {isImageFormatSupported} from '@loaders.gl/images';
import {preprocess} from '../../../src/lib/extensions/EXT_texture_webp';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

const isImageFormatSupportedMock = vi.mocked(isImageFormatSupported);

afterEach(() => {
  isImageFormatSupportedMock.mockReset();
});

describe('EXT_texture_webp', () => {
  test('selects the WebP image and removes the consumed extension', () => {
    isImageFormatSupportedMock.mockReturnValue(true);
    const gltf = makeGLTF({required: true});

    preprocess(gltf, {});

    expect(gltf.json.textures?.[0].source).toBe(1);
    expect(gltf.json.textures?.[0].extensions).toEqual({});
    expect(gltf.json.extensionsUsed).toEqual([]);
    expect(gltf.json.extensionsRequired).toEqual([]);
    expect((gltf.json as {extensionsRemoved?: string[]}).extensionsRemoved).toEqual([
      'EXT_texture_webp'
    ]);
  });

  test('preserves an optional fallback when WebP is unsupported', () => {
    isImageFormatSupportedMock.mockReturnValue(false);
    const gltf = makeGLTF({required: false});

    preprocess(gltf, {});

    expect(gltf.json.textures?.[0].source).toBe(0);
    expect(gltf.json.textures?.[0].extensions?.EXT_texture_webp).toEqual({source: 1});
    expect(gltf.json.extensionsUsed).toEqual(['EXT_texture_webp']);
  });

  test('rejects a required WebP extension when unsupported', () => {
    isImageFormatSupportedMock.mockReturnValue(false);

    expect(() => preprocess(makeGLTF({required: true}), {})).toThrow(
      'Required extension EXT_texture_webp not supported by browser'
    );
  });
});

/** Create a glTF texture with ordinary and WebP image sources. */
function makeGLTF({required}: {required: boolean}): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_texture_webp'],
      extensionsRequired: required ? ['EXT_texture_webp'] : [],
      images: [{uri: 'fallback.png'}, {uri: 'preferred.webp'}],
      textures: [
        {
          source: 0,
          extensions: {EXT_texture_webp: {source: 1}}
        }
      ]
    },
    buffers: []
  };
}
