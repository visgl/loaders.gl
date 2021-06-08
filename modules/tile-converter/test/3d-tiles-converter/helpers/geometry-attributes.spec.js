import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {generateAttributes} from '../../../src/i3s-converter/helpers/geometry-attributes';

test('tile-converter - geometry-attributes#should return the same attributes with faceRange from 0 to triangleCount - 1 and 0 feature id', async (t) => {
  if (!isBrowser) {
    const oldAttributes = {
      positions: new Float32Array([0]),
      normals: new Float32Array([0]),
      texCoords: new Float32Array([0]),
      colors: new Float32Array([0]),
      featureIndices: [],
      triangleCount: 1000
    };

    const resultAttributes = {
      featureIds: [0],
      faceRange: new Uint32Array([0, 999]),
      featureCount: 1,
      positions: new Float32Array([0]),
      normals: new Float32Array([0]),
      texCoords: new Float32Array([0]),
      colors: new Float32Array([0])
    };

    const attributes = generateAttributes(oldAttributes);
    t.ok(attributes);
    t.deepEqual(attributes, resultAttributes);
    t.end();
  }
});

test('tile-converter - geometry-attributes#should return the same attributes if we have only one triangle and featureIndices with the same indices', async (t) => {
  if (!isBrowser) {
    const oldAttributes = {
      positions: new Float32Array([-1, -2, -3, -4, -5, -6, -7, -8, -9]),
      normals: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      texCoords: new Float32Array([1, 2, 3, 4, 5, 6]),
      colors: new Float32Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]),
      featureIndices: [0, 0, 0],
      triangleCount: 1
    };

    const resultAttributes = {
      featureIds: [0],
      faceRange: new Uint32Array([0, 0]),
      featureCount: 1,
      positions: new Float32Array([-1, -2, -3, -4, -5, -6, -7, -8, -9]),
      normals: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      texCoords: new Float32Array([1, 2, 3, 4, 5, 6]),
      colors: new Float32Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255])
    };

    const attributes = generateAttributes(oldAttributes);
    t.ok(attributes);
    t.deepEqual(attributes, resultAttributes);
    t.end();
  }
});

test('tile-converter - geometry-attributes#should return reordered attributes', async (t) => {
  if (!isBrowser) {
    const oldAttributes = {
      // prettier-ignore
      positions: new Float32Array([-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19,-20,-21,-22,-23,-34,-25,-26,-27]),
      // prettier-ignore
      normals: new Float32Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,34,25,26,27]),
      // prettier-ignore
      texCoords: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
      // prettier-ignore
      colors: new Float32Array([255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255
      ]),
      featureIndices: [0, 0, 0, 1, 1, 1, 0, 0, 0],
      triangleCount: 3
    };

    const resultAttributes = {
      featureIds: [0, 1],
      faceRange: new Uint32Array([0, 1, 2, 2]),
      featureCount: 2,
      // prettier-ignore
      positions: new Float32Array([-1,-2,-3,-4,-5,-6,-7,-8,-9,-19,-20,-21,-22,-23,-34,-25,-26,-27,-10,-11,-12,-13,-14,-15,-16,-17,-18]),
      // prettier-ignore
      normals: new Float32Array([1,2,3,4,5,6,7,8,9,19,20,21,22,23,34,25,26,27,10,11,12,13,14,15,16,17,18]),
      texCoords: new Float32Array([1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18, 7, 8, 9, 10, 11, 12]),
      // prettier-ignore
      colors: new Float32Array([255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255
      ])
    };

    const attributes = generateAttributes(oldAttributes);
    t.ok(attributes);
    t.deepEqual(attributes, resultAttributes);
    t.end();
  }
});
