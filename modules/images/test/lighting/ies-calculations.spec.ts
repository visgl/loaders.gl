// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createIESSampler, integrateIESProfile, resampleIESProfile} from '../../src/lighting';
import type {IESProfile, IESResampleOptions} from '../../src/lighting';

/** Builds tiny distributions whose intensities and solid-angle integrals are known analytically. */
function createProfile(
  vertical: number[],
  horizontal: number[],
  values: number[],
  multiplier = 1
): IESProfile {
  return {
    revision: 'IESNA:LM-63-2002',
    labels: [],
    lampCount: 2,
    lumensPerLamp: -1,
    candelaMultiplier: multiplier,
    photometricType: 1,
    dimensionUnit: 'meters',
    dimensions: [0, 0, 0],
    ballastFactor: 10,
    auxiliaryFactor: 10,
    inputWatts: 5,
    verticalAngles: Float64Array.from(vertical),
    horizontalAngles: Float64Array.from(horizontal),
    candelaValues: Float64Array.from(values)
  };
}

test('IES sampler interpolates both axes and applies the candela multiplier once', () => {
  const sample = createIESSampler(createProfile([0, 90, 180], [0, 180], [0, 10, 0, 20, 30, 20], 2));
  expect(sample(45, 90)).toBe(30);
  expect(sample(45, 270)).toBe(30);
  expect(sample(90, -180)).toBe(60);
});

test('IES rotational sampler snapshots source data and returns zero outside measured vertical coverage', () => {
  const profile = createProfile([30, 90], [0], [2, 6], 2);
  const sample = createIESSampler(profile);
  profile.candelaValues.fill(100);
  profile.verticalAngles[0] = 0;
  profile.candelaMultiplier = 100;
  expect(sample(60, 1e9)).toBe(8);
  expect(sample(0, 0)).toBe(0);
  expect(sample(180, 0)).toBe(0);
});

test.each([30, 150, 210, 330])('IES expands quarter symmetry at %s degrees', angle => {
  const sample = createIESSampler(createProfile([0, 180], [0, 90], [1, 1, 3, 3]));
  expect(sample(90, angle)).toBeCloseTo(5 / 3, 12);
});

test.each([
  [0, 4],
  [90, 2],
  [270, 6],
  [360, 4],
  [-90, 6]
])('IES preserves the 90–270 degree symmetry origin at %s', (angle, expected) => {
  const sample = createIESSampler(createProfile([0, 180], [90, 270], [2, 2, 6, 6]));
  expect(sample(90, angle)).toBe(expected);
});

test('IES full-circle sampling wraps the seam without changing authored interpolation', () => {
  const sample = createIESSampler(createProfile([0, 180], [0, 180, 360], [1, 1, 3, 3, 1, 1]));
  expect(sample(90, 270)).toBe(2);
  expect(sample(90, 360)).toBe(1);
  expect(sample(90, -90)).toBe(2);
});

test.each(
  [[0], [0, 90], [0, 180], [90, 270], [0, 180, 360]].map(horizontal => ({horizontal}))
)('IES integrates constant candela over the sphere with angles %j', ({horizontal}) => {
  const profile = createProfile(
    [0, 180],
    horizontal,
    horizontal.flatMap(() => [2, 2]),
    3
  );
  expect(integrateIESProfile(profile)).toBeCloseTo(24 * Math.PI, 12);
});

test.each([
  {angles: [0, 90], expected: 4},
  {angles: [90, 180], expected: 2 * Math.PI - 4}
])('IES integrates a linear polar ramp over %j with the solid-angle sine weight', ({
  angles,
  expected
}) => {
  expect(integrateIESProfile(createProfile(angles, [0], [0, 1]))).toBeCloseTo(expected, 12);
});

test('IES integrates nonuniform azimuth intervals with their actual widths', () => {
  expect(
    integrateIESProfile(createProfile([0, 180], [0, 30, 180], [1, 1, 3, 3, 5, 5]))
  ).toBeCloseTo((44 * Math.PI) / 3, 12);
});

test.each([
  false,
  true
])('IES integration retains precision for a narrow cone at either pole: %s', reflected => {
  const angle = 1e-6;
  const angles = reflected ? [180 - angle, 180] : [0, angle];
  const width = angles[1] - angles[0];
  const expected = 4 * Math.PI * Math.sin((width * Math.PI) / 360) ** 2;
  expect(integrateIESProfile(createProfile(angles, [0], [1, 1])) / expected).toBeCloseTo(1, 12);
});

test('IES grids declare layout, angular coordinates and physical or peak-relative units', () => {
  const profile = createProfile([0, 90, 180], [0], [0, 2, 0], 3);
  const grid = resampleIESProfile(profile, {verticalCount: 3, horizontalCount: 4});
  expect([grid.width, grid.height, grid.unit, grid.peakCandela]).toEqual([3, 4, 'candela', 6]);
  expect(Array.from(grid.verticalAngles)).toEqual([0, 90, 180]);
  expect(Array.from(grid.horizontalAngles)).toEqual([0, 90, 180, 270]);
  expect(Array.from(grid.data)).toEqual([0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 6, 0]);
  const normalized = resampleIESProfile(profile, {
    verticalCount: 3,
    horizontalCount: 1,
    normalization: 'peak'
  });
  expect(normalized.unit).toBe('relative');
  expect(Array.from(normalized.data)).toEqual([0, 1, 0]);
  expect(Array.from(profile.candelaValues)).toEqual([0, 2, 0]);
});

test('IES normalization handles zero and subnormal peaks without infinities', () => {
  for (const intensity of [0, 1e-320]) {
    const grid = resampleIESProfile(createProfile([0, 180], [0], [intensity, intensity]), {
      verticalCount: 2,
      horizontalCount: 1,
      normalization: 'peak'
    });
    expect(Array.from(grid.data)).toEqual(intensity === 0 ? [0, 0] : [1, 1]);
  }
  expect(integrateIESProfile(createProfile([0, 180], [0], [2, 2], 0))).toBe(0);
});

test.each([
  {verticalAngles: Float64Array.of(0, 0)},
  {horizontalAngles: Float64Array.of(30, 210), candelaValues: Float64Array.of(1, 1, 1, 1)},
  {horizontalAngles: Float64Array.of(0, 270), candelaValues: Float64Array.of(1, 1, 1, 1)},
  {candelaValues: Float64Array.of(-1, 1)},
  {candelaValues: Float64Array.of(Infinity, 1)},
  {candelaValues: Float64Array.of(1)},
  {candelaMultiplier: Infinity},
  {candelaMultiplier: -1}
])('IES calculations reject invalid or ambiguous profiles %#', override => {
  const profile = {...createProfile([0, 180], [0], [1, 1]), ...override};
  expect(() => createIESSampler(profile)).toThrow(/IES/);
});

test.each([
  [-1, 0],
  [181, 0],
  [NaN, 0],
  [90, Infinity]
])('IES rejects invalid sample angles %j', (vertical, horizontal) => {
  expect(() =>
    createIESSampler(createProfile([0, 180], [0], [1, 1]))(vertical, horizontal)
  ).toThrow(/IES/);
});

test.each([
  {verticalCount: 1},
  {horizontalCount: 0},
  {verticalCount: 2.5},
  {verticalCount: 4_194_305},
  {normalization: 'other'}
])('IES rejects invalid grid requests %#', options => {
  expect(() =>
    resampleIESProfile(createProfile([0, 180], [0], [1, 1]), options as IESResampleOptions)
  ).toThrow(/IES/);
});

test('IES rejects a flux that exceeds finite numeric representation', () => {
  expect(() => integrateIESProfile(createProfile([0, 180], [0], [1e308, 1e308]))).toThrow(
    /overflow/
  );
});
