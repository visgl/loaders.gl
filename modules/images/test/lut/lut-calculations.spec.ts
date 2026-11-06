// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {applyColorLUT, createColorLUTSampler} from '../../src/lut';
import type {ColorLUT} from '../../src/lut';

/** Builds an asymmetric affine 3D transform to expose axis-order and interpolation errors. */
function createAffineLUT(size = 2): ColorLUT {
  const values: number[] = [];
  for (let blue = 0; blue < size; blue++)
    for (let green = 0; green < size; green++)
      for (let red = 0; red < size; red++)
        values.push(
          (red + 2 * green + 4 * blue) / (size - 1),
          (3 * red + green) / (size - 1),
          (blue - green) / (size - 1)
        );
  return {
    dimension: 3,
    size,
    data: Float32Array.from(values),
    domainMinimum: [0, 0, 0],
    domainMaximum: [1, 1, 1]
  };
}

/** Builds independent per-channel curves with different authored domains. */
function createCurves(): ColorLUT {
  return {
    dimension: 1,
    size: 2,
    data: Float32Array.of(-2, 4, 8, 2, 8, 16),
    domainMinimum: [-1, 0, 10],
    domainMaximum: [1, 2, 20]
  };
}

test('1D LUT sampling uses independent channels, authored domains and finite input clamping', () => {
  const sample = createColorLUTSampler(createCurves());
  expect(sample(0, 0.5, 12.5)).toEqual([0, 5, 10]);
  expect(sample(-10, 100, 30)).toEqual([-2, 8, 16]);
});

test('3D LUT sampling is trilinear with red-fastest storage and signed/HDR output', () => {
  const sample = createColorLUTSampler(createAffineLUT());
  expect(sample(0.25, 0.5, 0.75)).toEqual([4.25, 1.25, 0.25]);
  expect(sample(1, 1, 0)).toEqual([3, 4, -1]);
  expect(sample(-1, 2, 0)).toEqual([2, 1, -1]);
});

test('LUT sampling uses nonuniform 3dl knots rather than assuming equal intervals', () => {
  const lut = createAffineLUT(3);
  lut.inputGrid = Float64Array.of(0, 0.25, 1);
  const sample = createColorLUTSampler(lut);
  expect(sample(0.25, 0.25, 0.25)).toEqual([3.5, 2, 0]);
  expect(sample(0.625, 0.625, 0.625)).toEqual([5.25, 3, 0]);
  expect(sample(1, 1, 1)).toEqual([7, 4, 0]);
});

test('LUT samplers snapshot data, domains and nonuniform knots', () => {
  const lut = createAffineLUT(3);
  lut.inputGrid = Float64Array.of(0, 0.25, 1);
  const sample = createColorLUTSampler(lut);
  lut.data.fill(0);
  lut.inputGrid[1] = 0.75;
  lut.domainMaximum.fill(2);
  expect(sample(0.25, 0.25, 0.25)).toEqual([3.5, 2, 0]);
});

test('LUT application preserves the input and RGBA alpha at float32 precision', () => {
  const identity: ColorLUT = {
    dimension: 1,
    size: 2,
    data: Float32Array.of(0, 0, 0, 1, 1, 1),
    domainMinimum: [0, 0, 0],
    domainMaximum: [1, 1, 1]
  };
  const input = Float64Array.of(0.2, 0.4, 0.6, 0.5, 1.2, -0.5, 0.5, 0.25);
  const copy = input.slice();
  expect(applyColorLUT(identity, input, {components: 4})).toEqual(
    Float32Array.of(0.2, 0.4, 0.6, 0.5, 1, 0, 0.5, 0.25)
  );
  expect(input).toEqual(copy);
  expect(applyColorLUT(identity, new Float32Array())).toEqual(new Float32Array());
  expect(applyColorLUT(identity, Float32Array.of(0, 0.5, 1))).toEqual(Float32Array.of(0, 0.5, 1));
});

test.each([
  {size: 1},
  {data: Float32Array.of(0, 0, 0)},
  {domainMinimum: [0]},
  {domainMaximum: [0, 1, 1]},
  {domainMinimum: [-1e308, 0, 0], domainMaximum: [1e308, 1, 1]},
  {data: new Float32Array(24).fill(NaN)},
  {inputGrid: Float64Array.of(0, 0.5)},
  {inputGrid: Float64Array.of(0.1, 1)},
  {inputGrid: Float64Array.of(0, NaN)}
])('LUT sampling rejects invalid data or domains %#', override => {
  expect(() => createColorLUTSampler({...createAffineLUT(), ...override})).toThrow(/LUT/);
});

test.each([NaN, Infinity, -Infinity])('LUT rejects nonfinite input %s', value => {
  expect(() => createColorLUTSampler(createAffineLUT())(value, 0, 0)).toThrow(/finite/);
});

test.each([NaN, Infinity, 1e308])('LUT rejects unrepresentable alpha %s', alpha => {
  expect(() =>
    applyColorLUT(createAffineLUT(), Float64Array.of(0, 0, 0, alpha), {components: 4})
  ).toThrow(/alpha/);
});

test('LUT application rejects incomplete pixels', () => {
  expect(() => applyColorLUT(createAffineLUT(), Float32Array.of(0, 1))).toThrow(/component/);
});
