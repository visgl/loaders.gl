import test from 'tape-promise/tape';
import {ConvertedAttributes, GeometryAttributes} from '../../../src/i3s-converter/types';
import {generateAttributes} from '../../../src/i3s-converter/helpers/geometry-attributes';
import {areNumberArraysEqual} from '../../utils/compareArrays';

test('tile-converter(i3s)#generateAttributes - Should re-arrange attributes by featureIds', async t => {
  const attributes: ConvertedAttributes = {
    // biome-ignore format: preserve intentional fixture layout
    positions: new Float32Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8, -0.9
    ]),
    // biome-ignore format: preserve intentional fixture layout
    normals: new Float32Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8, -0.9
    ]),
    // biome-ignore format: preserve intentional fixture layout
    texCoords: new Float32Array([
      0, 1, 2, 3, 4, 5,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6,
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6
    ]),
    // biome-ignore format: preserve intentional fixture layout
    colors: new Uint8Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
      201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212
    ]),
    // biome-ignore format: preserve intentional fixture layout
    uvRegions: new Uint16Array(),
    featureIndices: [1, 1, 1, 120, 120, 120, 1, 1, 1],
    boundingVolumes: null,
    mergedMaterials: []
  };

  const expectedResult: GeometryAttributes = {
    // biome-ignore format: preserve intentional fixture layout
    positions: new Float32Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8, -0.9,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
    ]),
    // biome-ignore format: preserve intentional fixture layout
    normals: new Float32Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8, -0.9,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
    ]),
    // biome-ignore format: preserve intentional fixture layout
    texCoords: new Float32Array([
      0, 1, 2, 3, 4, 5,
      -0.1, -0.2, -0.3, -0.4, -0.5, -0.6,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6
    ]),
    // biome-ignore format: preserve intentional fixture layout
    colors: new Uint8Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
      100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111
    ]),
    uvRegions: new Uint16Array(),
    faceRange: new Uint32Array([0, 1, 2, 2]),
    featureIds: [1, 120],
    featureCount: 2
  };

  const result = generateAttributes(attributes);
  t.ok(areNumberArraysEqual(result.positions, expectedResult.positions));
  t.ok(areNumberArraysEqual(result.normals, expectedResult.normals));
  t.ok(areNumberArraysEqual(result.texCoords, expectedResult.texCoords));
  t.deepEqual(result.colors, expectedResult.colors);
  t.deepEqual(result.uvRegions, expectedResult.uvRegions);
  t.deepEqual(result.faceRange, expectedResult.faceRange);
  t.deepEqual(result.featureIds, expectedResult.featureIds);
  t.equal(result.featureCount, 2);
  t.end();
});
