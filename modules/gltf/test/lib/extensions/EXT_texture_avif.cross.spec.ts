// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {afterEach, describe, expect, test, vi} from 'vitest';

vi.mock('@loaders.gl/images', async (importOriginal) => ({
  ...(await importOriginal()),
  getSupportedImageFormats: vi.fn()
}));

import {getSupportedImageFormats} from '@loaders.gl/images';
import {preprocessExtensions} from '../../../src/lib/api/gltf-extensions';
import {preprocess} from '../../../src/lib/extensions/EXT_texture_avif';

const getSupportedImageFormatsMock = vi.mocked(getSupportedImageFormats);

afterEach(() => {
  getSupportedImageFormatsMock.mockReset();
});

describe('EXT_texture_avif', () => {
  test('selects the AVIF source through the loader registry and removes the processed extension', async () => {
    getSupportedImageFormatsMock.mockResolvedValue(new Set(['image/avif']));
    const gltfData = makeGLTFData({required: true});

    await preprocessExtensions(gltfData, {});

    expect(gltfData.json.textures?.[0]?.source).toBe(1);
    expect(gltfData.json.textures?.[0]?.extensions).toEqual({});
    expect(gltfData.json.extensionsUsed).toEqual([]);
    expect(gltfData.json.extensionsRequired).toEqual([]);
  });

  test('keeps an optional AVIF extension and fallback source when AVIF is unsupported', async () => {
    getSupportedImageFormatsMock.mockResolvedValue(new Set());
    const gltfData = makeGLTFData({required: false});

    await preprocess(gltfData, {});

    expect(gltfData.json.textures?.[0]?.source).toBe(0);
    expect(gltfData.json.textures?.[0]?.extensions?.EXT_texture_avif).toEqual({source: 1});
    expect(gltfData.json.extensionsUsed).toEqual(['EXT_texture_avif']);
  });

  test('rejects a required AVIF extension when AVIF is unsupported', async () => {
    getSupportedImageFormatsMock.mockResolvedValue(new Set());

    await expect(preprocess(makeGLTFData({required: true}), {})).rejects.toThrow(
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
