// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encodeSync, parse} from '@loaders.gl/core';
import {Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {Tiles3DLoaderWithParser} from '../../../src/tiles-3d-loader-with-parser';

test.each([
  {name: 'empty positions', attributes: {positions: []}, error: 'xyz triples'},
  {name: 'incomplete positions', attributes: {positions: [1, 2]}, error: 'xyz triples'},
  {name: 'NaN positions', attributes: {positions: [NaN, 2, 3]}, error: 'finite values'},
  {name: 'infinite positions', attributes: {positions: [Infinity, 2, 3]}, error: 'finite values'},
  {name: 'color size', attributes: {colors: [1, 2]}, error: 'RGB or RGBA'},
  {
    name: 'color count',
    attributes: {colors: {value: [1, 2], size: 3}},
    error: 'color count'
  },
  {name: 'negative color', attributes: {colors: [-1, 2, 3]}, error: 'between 0 and 255'},
  {name: 'overflow color', attributes: {colors: [256, 2, 3]}, error: 'between 0 and 255'},
  {name: 'NaN color', attributes: {colors: [NaN, 2, 3]}, error: 'between 0 and 255'},
  {
    name: 'normalized color overflow',
    attributes: {colors: {value: [1.1, 0, 0], size: 3, normalized: true}},
    error: 'between 0 and 255'
  },
  {name: 'normal count', attributes: {normals: [0, 1]}, error: 'normal count'},
  {name: 'infinite normal', attributes: {normals: [0, 0, Infinity]}, error: 'finite values'},
  {name: 'batch ID count', attributes: {batchIds: [0, 1]}, error: 'batch ID count'},
  {name: 'fractional batch ID', attributes: {batchIds: [0.5]}, error: 'unsigned 16-bit'},
  {name: 'negative batch ID', attributes: {batchIds: [-1]}, error: 'unsigned 16-bit'},
  {name: 'overflow batch ID', attributes: {batchIds: [65536]}, error: 'unsigned 16-bit'}
])('PNTS writer rejects $name', ({attributes, error}) => {
  expect(() =>
    encodeSync(
      {
        type: TILE3D_TYPE.POINT_CLOUD,
        attributes: {positions: [1, 2, 3], ...attributes}
      },
      Tile3DWriter
    )
  ).toThrow(error);
});

test.each([
  {name: 'RGB array', colors: [10, 20, 30], expected: [10, 20, 30]},
  {
    name: 'normalized RGBA',
    colors: {value: new Float32Array([0, 0.5, 1, 1]), size: 4, normalized: true},
    expected: [0, 128, 255, 255]
  }
])('PNTS writer round trips $name and batch metadata', async ({colors, expected}) => {
  const arrayBuffer = encodeSync(
    {
      type: TILE3D_TYPE.POINT_CLOUD,
      attributes: {
        positions: [1, 2, 3],
        colors,
        normals: [0, 0, 1],
        batchIds: [1]
      },
      batchTableJson: {name: ['unused', 'point']}
    },
    Tile3DWriter
  );
  const tile = await parse(arrayBuffer, Tiles3DLoaderWithParser, {worker: false});

  expect(Array.from(tile.attributes.positions!)).toEqual([1, 2, 3]);
  expect(Array.from(tile.attributes.colors!.value)).toEqual(expected);
  expect(tile.attributes.colors!.size).toBe(expected.length);
  expect(Array.from(tile.attributes.normals!.value)).toEqual([0, 0, 1]);
  expect(Array.from(tile.batchIds!)).toEqual([1]);
  expect(tile.featureTableJson.BATCH_LENGTH).toBe(2);
  expect(tile.batchTableJson).toEqual({name: ['unused', 'point']});
});
