import {expect, test} from 'vitest';

import type {GLTFMaterialPostprocessed} from '@loaders.gl/gltf';
import {convertMaterial} from '../apps/tile-converter/src/i3s-converter/helpers/geometry-converter';

function createMaterial(
  pbrMetallicRoughness: GLTFMaterialPostprocessed['pbrMetallicRoughness']
): GLTFMaterialPostprocessed {
  return {
    id: 'material',
    alphaMode: 'OPAQUE',
    pbrMetallicRoughness
  };
}

test('tile-converter(i3s) preserves zero metallic and roughness factors', () => {
  const convertedMaterial = convertMaterial(
    createMaterial({metallicFactor: 0, roughnessFactor: 0, baseColorFactor: [0, 0, 0, 1]})
  );

  expect(convertedMaterial.material.pbrMetallicRoughness).toMatchObject({
    metallicFactor: 0,
    roughnessFactor: 0,
    baseColorFactor: [0, 0, 0, 255]
  });
});

test('tile-converter(i3s) writes base color factors in the I3S byte range', () => {
  const convertedMaterial = convertMaterial(
    createMaterial({
      metallicFactor: 1,
      roughnessFactor: 1,
      baseColorFactor: [0.25, 0.5, 0.75, 1]
    })
  );

  expect(convertedMaterial.material.pbrMetallicRoughness.baseColorFactor).toEqual([
    64, 128, 191, 255
  ]);
});
