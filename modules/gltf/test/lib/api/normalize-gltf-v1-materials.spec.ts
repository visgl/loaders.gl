// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import type {GLTFMaterial} from '../../../src/lib/types/gltf-json-schema';

describe('glTF 1 material conversion', () => {
  test('preserves the solid diffuse color reported in #3224 without claiming shader support', () => {
    const source = makeMaterialAsset({diffuse: [0.5, 0.5, 0.5, 1], transparency: 1});
    const originalJson = JSON.stringify(source.json);
    const converted = convertGLTFV1ToGLTF2(source);
    const material = converted.json.materials![0];

    expect(material.pbrMetallicRoughness).toEqual({
      baseColorFactor: [0.5, 0.5, 0.5, 1],
      metallicFactor: 0,
      roughnessFactor: 1
    });
    expect(material.alphaMode).toBeUndefined();
    expect(material.extras?.gltf1.values).toEqual({diffuse: [0.5, 0.5, 0.5, 1], transparency: 1});
    expect(converted.normalizationReport.unsupported).toContain('material technique technique0');
    expect(converted.normalizationReport.warnings.join(' ')).toContain('Approximated');
    expect(JSON.stringify(source.json)).toBe(originalJson);
  });

  test.each([
    {alpha: 0.5, transparency: 0.4, expectedAlpha: 0.2},
    {alpha: 1, transparency: 0, expectedAlpha: 0},
    {alpha: 0, transparency: 1, expectedAlpha: 0},
    {alpha: 0.5, transparency: undefined, expectedAlpha: 0.5}
  ])('preserves opacity for $alpha alpha and $transparency transparency', values => {
    const converted = convertGLTFV1ToGLTF2(
      makeMaterialAsset({diffuse: [0.2, 0.4, 0.6, values.alpha], transparency: values.transparency})
    );
    const material = converted.json.materials![0];

    expect(material.pbrMetallicRoughness?.baseColorFactor).toEqual([
      0.2,
      0.4,
      0.6,
      values.expectedAlpha
    ]);
    expect(material.alphaMode).toBe('BLEND');
  });

  test.each([
    'tex',
    'texture2d_0',
    'diffuseTex',
    'diffuse'
  ])('retains the %s texture convention and uses a non-metallic material', textureKey => {
    const converted = convertGLTFV1ToGLTF2(
      makeMaterialAsset({[textureKey]: 'texture0', transparency: 0.5})
    );
    const material = converted.json.materials![0];

    expect(material.pbrMetallicRoughness).toEqual({
      baseColorFactor: [1, 1, 1, 0.5],
      baseColorTexture: {index: 0},
      metallicFactor: 0,
      roughnessFactor: 1
    });
    expect(material.alphaMode).toBe('BLEND');
    expect(converted.normalizationReport.unsupported).toContain('material technique technique0');
  });

  test('combines a diffuse factor and texture without overwriting explicit PBR or alpha settings', () => {
    const source = makeMaterialAsset({diffuse: [0.5, 0.5, 0.5, 0.5], tex: 'texture0'});
    const converted = convertGLTFV1ToGLTF2(source);
    expect(converted.json.materials![0].pbrMetallicRoughness?.baseColorFactor).toEqual([
      0.5, 0.5, 0.5, 0.5
    ]);
    const legacyMaterial = (source.json.materials as unknown as Record<string, GLTFMaterial>)
      .material0;
    legacyMaterial.pbrMetallicRoughness = {
      baseColorFactor: [1, 0, 0, 0.25],
      baseColorTexture: {index: 0, texCoord: 1},
      metallicFactor: 0.7,
      roughnessFactor: 0.3
    };
    legacyMaterial.alphaMode = 'MASK';
    const material = convertGLTFV1ToGLTF2(source).json.materials![0];

    expect(material.pbrMetallicRoughness).toEqual({
      baseColorFactor: [1, 0, 0, 0.25],
      metallicFactor: 0.7,
      roughnessFactor: 0.3,
      baseColorTexture: {index: 0, texCoord: 1}
    });
    expect(material.alphaMode).toBe('MASK');
  });

  test.each([
    {diffuse: [1, 1, 1]},
    {diffuse: [1, 1, 1, 2]},
    {diffuse: [-1, 0, 0, 1]},
    {diffuse: ['1', 1, 1, 1]},
    {diffuse: 'missing-texture'}
  ])('does not emit invalid PBR factors from legacy diffuse value %j', values => {
    const converted = convertGLTFV1ToGLTF2(makeMaterialAsset(values));
    expect(converted.json.materials![0].pbrMetallicRoughness).toBeUndefined();
    expect(converted.normalizationReport.unsupported).toContain('material technique technique0');
  });

  test.each([
    {diffuse: [0.5, 0.5, 0.5, 1]},
    {diffuse: 'texture0'}
  ])('strict mode rejects arbitrary shaders even when diffuse values are recognized', values => {
    expect(() => convertGLTFV1ToGLTF2(makeMaterialAsset(values), {normalize: 'strict'})).toThrow(
      'material technique technique0'
    );
  });

  test('does not copy invalid opacity into a valid diffuse factor', () => {
    const converted = convertGLTFV1ToGLTF2(
      makeMaterialAsset({diffuse: [0.5, 0.5, 0.5, 1], transparency: -1})
    );
    expect(converted.json.materials![0].pbrMetallicRoughness?.baseColorFactor).toEqual([
      0.5, 0.5, 0.5, 1
    ]);
    expect(converted.json.materials![0].alphaMode).toBeUndefined();
  });
});

/** Create a small material-only glTF 1 document without external resources. */
function makeMaterialAsset(values: Record<string, unknown>): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '1.0'},
      materials: {material0: {technique: 'technique0', values}},
      textures: {texture0: {source: 'image0'}},
      images: {image0: {uri: 'data:image/png;base64,'}}
    },
    buffers: []
  } as unknown as GLTFWithBuffers;
}
