import {expect, test} from 'vitest';
import {padToNBytes, copyArrayBuffer, copyToArray} from '@loaders.gl/loader-utils';
test('padToNBytes', () => {
  expect(padToNBytes, 'padToNBytes defined').toBeTruthy();
  expect(padToNBytes(15, 16)).toBe(16);
  expect(padToNBytes(15, 8)).toBe(16);
  expect(padToNBytes(157, 3)).toBe(157);
  expect(() => padToNBytes(15, 0)).toThrow();
  expect(() => padToNBytes(15, -5)).toThrow();
  expect(() => padToNBytes(-10, 8)).toThrow();
  // The approach only works for even paddings
  expect(padToNBytes(32, 3)).not.toBe(33);
});
test('toBuffer', () => {
  expect(copyArrayBuffer, 'copyArrayBuffer defined').toBeTruthy();
});
test('copyToArray', () => {
  expect(copyToArray, 'copyToArray defined').toBeTruthy();
});
