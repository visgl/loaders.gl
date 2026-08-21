// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {afterEach, describe, expect, test, vi} from 'vitest';

vi.mock('@loaders.gl/images', () => ({isImageFormatSupported: vi.fn()}));

import {isImageFormatSupported} from '@loaders.gl/images';
import {preprocessExtensions} from '../../../src/lib/api/gltf-extensions';
import {preprocess} from '../../../src/lib/extensions/EXT_texture_avif';

const isImageFormatSupportedMock = vi.mocked(isImageFormatSupported);

afterEach(() => {
  isImageFormatSupportedMock.mockReset();
});

describe('EXT_texture_avif', () => {
  test('selects the AVIF source through the loader registry and removes the processed extension', () => {
    isImageFormatSupportedMock.mockReturnValue(true);
    const gltfData = makeGLTFData({required: true});

    preprocessExtensions(gltfData, {});

    expect(gltfData.json.textures?.[0]?.source).toBe(1);
    expect(gltfData.json.textures?.[0]?.extensions).toEqual({});
    expect(gltfData.json.extensionsUsed).toEqual([]);
    expect(gltfData.json.extensionsRequired).toEqual([]);
  });

  test('keeps an optional AVIF extension and fallback source when AVIF is unsupported', () => {
    isImageFormatSupportedMock.mockReturnValue(false);
    const gltfData = makeGLTFData({required: false});

    preprocess(gltfData, {});

    expect(gltfData.json.textures?.[0]?.source).toBe(0);
    expect(gltfData.json.textures?.[0]?.extensions?.EXT_texture_avif).toEqual({source: 1});
    expect(gltfData.json.extensionsUsed).toEqual(['EXT_texture_avif']);
  });

  test('rejects a required AVIF extension when AVIF is unsupported', () => {
    isImageFormatSupportedMock.mockReturnValue(false);

    expect(() => preprocess(makeGLTFData({required: true}), {})).toThrow(
      'Required extension EXT_texture_avif not supported by browser'
    );
  });
});

function makeGLTFData({required}: {required: boolean}) {
  return {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_texture_avif'],
      extensionsRequired: required ? ['EXT_texture_avif'] : [],
      textures: [
        {
          source: 0,
          extensions: {EXT_texture_avif: {source: 1}}
        }
      ]
    }
  };
}
