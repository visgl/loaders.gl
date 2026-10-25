// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createScientificVectorField} from '../../src/vector-field';
import type {ScientificArraySource} from '../../src/scientific-array';

test('vector-field adapter converts units and preserves missing mask', async () => {
  const source = {
    scientificCapabilities: {
      selection: 'residual',
      remoteRanges: false,
      streaming: false,
      cancellation: false
    },
    async getScientificMetadata() {
      return {dimensions: [], variables: []};
    },
    async readScientificVariable(name: string) {
      return {
        data: new Float32Array(name === 'u' ? [100, -9999] : [200, 300]),
        dimensions: ['y', 'x'],
        shape: [1, 2]
      };
    }
  } as ScientificArraySource;
  const field = await createScientificVectorField(source, {
    eastward: 'u',
    northward: 'v',
    units: 'cm/s',
    missingValues: [-9999]
  });
  expect(field.shape).toEqual([1, 2]);
  expect(Array.from(field.valid)).toEqual([1, 0]);
  expect(field.eastward[0]).toBe(1);
  expect(field.northward[0]).toBe(2);
  expect(Number.isNaN(field.eastward[1])).toBe(true);
});

test('vector-field adapter rejects mismatched component dimensions', async () => {
  const source = {
    async readScientificVariable(name: string) {
      return {
        data: new Float32Array([1, 2]),
        dimensions: name === 'east' ? ['latitude', 'longitude'] : ['row', 'column'],
        shape: [1, 2]
      };
    }
  } as ScientificArraySource;
  await expect(
    createScientificVectorField(source, {eastward: 'east', northward: 'north'})
  ).rejects.toThrow('component dimensions must match');
});

test('vector-field adapter rejects component arrays shorter than their shape', async () => {
  const source = {
    async readScientificVariable() {
      return {data: new Float32Array([1]), dimensions: ['y', 'x'], shape: [1, 2]};
    }
  } as ScientificArraySource;
  await expect(
    createScientificVectorField(source, {eastward: 'east', northward: 'north'})
  ).rejects.toThrow('invalid component arrays');
});
