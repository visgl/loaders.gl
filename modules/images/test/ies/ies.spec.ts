// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {IESLoaderWithParser} from '../../src/ies-loader';
const input =
  'IESNA:LM-63-2002\n[TEST] asymmetric fixture\nTILT=NONE\n1 -1 2 3 2 1 2 0.1 0.2 0.3\n1 1 10\n0 90 180\n30 210\n10 20 30\n40 50 60';
test('IES retains absolute photometry, authored angles and raw candela scale', () => {
  const result = IESLoaderWithParser.parseTextSync(input);
  expect(result.lumensPerLamp).toBe(-1);
  expect(result.dimensionUnit).toBe('meters');
  expect(result.candelaMultiplier).toBe(2);
  expect(Array.from(result.horizontalAngles)).toEqual([30, 210]);
  expect(Array.from(result.candelaValues)).toEqual([10, 20, 30, 40, 50, 60]);
  expect(result.dimensions).toEqual([0.1, 0.2, 0.3]);
});
test.each([
  input.replace('TILT=NONE', 'TILT=INCLUDE'),
  input.replace('0 90 180', '0 180 90'),
  input.replace('3 2 1 2', '3 2 2 2'),
  input.replace('40 50 60', '40 50'),
  input.replace('40 50 60', '40 -50 60'),
  input.replace('IESNA:LM-63-2002', 'IESNA:LM-63-2019')
])('IES rejects unsupported or malformed profiles %#', text => {
  expect(() => IESLoaderWithParser.parseTextSync(text)).toThrow(/IES/);
});

test('IES metadata and parser subpath support public async and sync inputs', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {IESLoader} = await import('../../src/ies-loader-types');
  const bytes = new TextEncoder().encode(input).buffer;
  expect((await parse(bytes, IESLoader)).photometricType).toBe(1);
  expect((await IESLoaderWithParser.parse(bytes)).candelaMultiplier).toBe(2);
  expect(IESLoaderWithParser.parseSync(bytes).dimensionUnit).toBe('meters');
  expect((await IESLoaderWithParser.parseText(input)).lampCount).toBe(1);
});

test.each([
  'IESNA91',
  'IESNA:LM-63-1995',
  'IESNA:LM-63-2002'
])('IES supports documented revision %s and feet units', revision => {
  const source = input.replace('IESNA:LM-63-2002', revision).replace('3 2 1 2 0.1', '3 2 1 1 0.1');
  const result = IESLoaderWithParser.parseTextSync(source);
  expect(result.revision).toBe(revision);
  expect(result.dimensionUnit).toBe('feet');
});

test.each([
  input.replace('1 -1 2 3 2', 'one -1 2 3 2'),
  'IESNA:LM-63-2002\nTILT=NONE\n1 100 1',
  input.replace('1 -1 2 3 2', '0 -1 2 3 2'),
  input.replace('3 2 1 2 0.1', '3 2 1 3 0.1'),
  input.replace('40 50 60', '40 50 1e999'),
  input.replace('40 50 60', '40 50 1e308'),
  input.replace('1 -1 2 3 2', '1 -2 2 3 2'),
  input.replace('TILT=NONE', '')
])('IES rejects invalid numeric headers, units or intensity ranges %#', text => {
  expect(() => IESLoaderWithParser.parseTextSync(text)).toThrow(/IES/);
});

test('IES retains a rotationally symmetric single horizontal sample without expansion', () => {
  const source = input
    .replace('3 2 1 2', '3 1 1 2')
    .replace('30 210', '0')
    .replace('\n40 50 60', '');
  const result = IESLoaderWithParser.parseTextSync(source);
  expect(Array.from(result.horizontalAngles)).toEqual([0]);
  expect(Array.from(result.candelaValues)).toEqual([10, 20, 30]);
});
