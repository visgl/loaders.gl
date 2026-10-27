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

test('vector-field adapter forwards selection, converts knots, and masks nonfinite components', async () => {
  const selections: unknown[] = [];
  const source = {
    async readScientificVariable(name: string, selection: unknown) {
      selections.push(selection);
      return {
        data: new Float32Array(name === 'east' ? [1, Number.NaN, 2] : [2, 3, -9999]),
        dimensions: ['latitude', 'longitude'],
        shape: [1, 3]
      };
    }
  } as ScientificArraySource;
  const selection = {longitude: [0, 3]} as const;
  const geographic = {
    longitudeStart: -120,
    latitudeStart: 40,
    longitudeStep: 0.5,
    latitudeStep: -0.5
  };
  const field = await createScientificVectorField(source, {
    eastward: 'east',
    northward: 'north',
    units: 'knots',
    missingValues: [-9999],
    selection,
    geographic
  });
  expect(selections).toEqual([selection, selection]);
  expect(field.geographic).toEqual(geographic);
  expect(Array.from(field.valid)).toEqual([1, 0, 0]);
  expect(field.eastward[0]).toBeCloseTo(0.5144444444444445);
  expect(field.northward[0]).toBeCloseTo(1.028888888888889);
  expect(Number.isNaN(field.eastward[1])).toBe(true);
  expect(Number.isNaN(field.northward[2])).toBe(true);
});

test.each([
  [[2], [2], /component dimensions must match/],
  [[1, 2], [2, 1], /component dimensions must match/],
  [[0, 2], [0, 2], /invalid component arrays/]
])('vector-field adapter validates component shapes', async (eastShape, northShape, error) => {
  const source = {
    async readScientificVariable(name: string) {
      return {
        data: new Float32Array(2),
        dimensions: ['y', 'x'],
        shape: name === 'east' ? eastShape : northShape
      };
    }
  } as ScientificArraySource;
  await expect(
    createScientificVectorField(source, {eastward: 'east', northward: 'north'})
  ).rejects.toThrow(error);
});
